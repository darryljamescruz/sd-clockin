import express, { Request, Response } from 'express';
import Student from '../models/Student.js';
import Schedule from '../models/Schedule.js';
import CheckIn from '../models/CheckIn.js';
import Shift from '../models/Shift.js';

const router = express.Router();

// GET all students with their schedules for a specific term
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { termId } = req.query;
    // Admin panel (no termId): Get ALL students for management
    // Dashboard (with termId): Get all students, compute clock-in status dynamically
    const students = await Student.find({}).lean();

    // If termId is provided, get schedules and check-ins for that term
    if (termId) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const studentsWithData = await Promise.all(
        students.map(async (student) => {
          const schedule = await Schedule.findOne({
            studentId: student._id,
            termId,
          }).lean();

          // Get today's shift for this student (simplest approach using Shift model)
          // Create date at midnight UTC for consistent querying
          const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
          
          const todayShift = await Shift.findOne({
            studentId: student._id,
            termId,
            date: today,
          }).lean();

          // Determine current status from shift and schedule
          let currentStatus = 'off';
          let todayActual: string | null = null;
          let expectedStartShift: string | null = null;
          let expectedEndShift: string | null = null;

          // First check if there's an actual shift record (clocked in)
          if (todayShift) {
            // Map shift status to frontend status
            if (todayShift.status === 'started') {
              currentStatus = 'present'; // Currently clocked in
            } else if (todayShift.status === 'completed') {
              currentStatus = 'clocked_out'; // Finished shift
            } else if (todayShift.status === 'missed') {
              currentStatus = 'absent'; // Didn't show up
            }

            // Get actual clock-in time (return as ISO string, let frontend format)
            if (todayShift.actualStart) {
              todayActual = todayShift.actualStart.toISOString();
            }

            // Get expected start and end times from shift
            expectedStartShift = todayShift.scheduledStart || null;
            expectedEndShift = todayShift.scheduledEnd || null;
          }

          // If not clocked in yet, check fallback: manual check-ins without shift
          if (currentStatus === 'off') {
            const todayCheckIns = await CheckIn.find({
              studentId: student._id,
              termId,
              timestamp: { $gte: startOfDay, $lte: endOfDay }
            }).sort({ timestamp: -1 }).lean();

            if (todayCheckIns.length > 0) {
              const lastCheckIn = todayCheckIns[0];
              if (lastCheckIn.type === 'in') {
                currentStatus = 'present'; // Currently clocked in
                todayActual = lastCheckIn.timestamp.toISOString();
              } else if (lastCheckIn.type === 'out') {
                currentStatus = 'clocked_out'; // Already clocked out
              }
            }
          }

          // If still 'off', check weekly schedule for expected arrivals
          if (currentStatus === 'off' && schedule) {
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
            const dayName = dayNames[now.getDay()] as keyof typeof schedule.availability;
            const todaySchedule = schedule.availability[dayName] || [];

            // Check if any shift starts within the next 3 hours
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTotalMinutes = currentHour * 60 + currentMinute;

            for (const shiftBlock of todaySchedule) {
              // Parse shift block (e.g., "08:00-12:00")
              const [startTime, endTime] = shiftBlock.split('-');
              if (!startTime || !endTime) continue;

              const [startHourStr, startMinuteStr] = startTime.trim().split(':');
              const shiftStartHour = parseInt(startHourStr, 10);
              const shiftStartMinute = parseInt(startMinuteStr, 10);
              const shiftStartTotalMinutes = shiftStartHour * 60 + shiftStartMinute;

              // Check if shift starts within next 3 hours (180 minutes)
              const minutesUntilShift = shiftStartTotalMinutes - currentTotalMinutes;

              if (minutesUntilShift >= 0 && minutesUntilShift <= 180) {
                currentStatus = 'incoming'; // Expected to arrive within 3 hours
                expectedStartShift = startTime.trim();
                expectedEndShift = endTime.trim();
                break; // Use the first matching shift
              }
            }
          }

          // Get all check-ins for historical data (limited for performance)
          const checkIns = await CheckIn.find({
            studentId: student._id,
            termId,
          })
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();

          return {
            id: student._id,
            name: student.name,
            cardId: student.iso,
            role: student.role,
            currentStatus,
            todayActual,
            expectedStartShift,
            expectedEndShift,
            weeklySchedule: schedule?.availability || {
              monday: [],
              tuesday: [],
              wednesday: [],
              thursday: [],
              friday: [],

            },
            clockEntries: checkIns.map((entry) => ({
              timestamp: entry.timestamp,
              type: entry.type,
              isManual: entry.isManual,
            })),
          };
        })
      );

      return res.json(studentsWithData);
    }

    // Return basic student info if no termId provided
    const studentsBasic = students.map((student) => ({
      id: student._id,
      name: student.name,
      cardId: student.iso,
      role: student.role,
      currentStatus: student.status,
    }));

    res.json(studentsBasic);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: (error as Error).message });
  }
});

// GET a single student by ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const student = await Student.findById(req.params.id).lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      id: student._id,
      name: student.name,
      cardId: student.iso,
      role: student.role,
      currentStatus: student.status,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Error fetching student', error: (error as Error).message });
  }
});

// POST - Create a new student
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, cardId, role } = req.body;

    if (!name || !cardId || !role) {
      return res.status(400).json({ message: 'Name, cardId, and role are required' });
    }

    const existingStudent = await Student.findOne({ iso: cardId });
    if (existingStudent) {
      return res.status(409).json({ message: 'A student with this card ID already exists' });
    }

    const newStudent = new Student({
      name,
      iso: cardId,
      role,
      status: 'active',
    });

    await newStudent.save();

    res.status(201).json({
      id: newStudent._id,
      name: newStudent.name,
      cardId: newStudent.iso,
      role: newStudent.role,
      currentStatus: newStudent.status,
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Error creating student', error: (error as Error).message });
  }
});

// PUT - Update a student
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, cardId, role } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if cardId is being changed and if it's already in use
    if (cardId && cardId !== student.iso) {
      const existingStudent = await Student.findOne({ iso: cardId });
      if (existingStudent) {
        return res.status(409).json({ message: 'A student with this card ID already exists' });
      }
    }

    if (name) student.name = name;
    if (cardId) student.iso = cardId;
    if (role) student.role = role;

    await student.save();

    res.json({
      id: student._id,
      name: student.name,
      cardId: student.iso,
      role: student.role,
      currentStatus: student.status,
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Error updating student', error: (error as Error).message });
  }
});

// DELETE - Delete a student
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Also delete associated schedules and check-ins
    await Schedule.deleteMany({ studentId: req.params.id });
    await CheckIn.deleteMany({ studentId: req.params.id });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student', error: (error as Error).message });
  }
});

export default router;

