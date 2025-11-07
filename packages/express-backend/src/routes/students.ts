import express, { Request, Response } from 'express';
import Student from '../models/Student.js';
import Schedule from '../models/Schedule.js';
import CheckIn from '../models/CheckIn.js';

const router = express.Router();

// GET all students with their schedules for a specific term
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { termId } = req.query;
    const students = await Student.find({ status: { $ne: 'inactive' } }).lean();

    // If termId is provided, get schedules and check-ins for that term
    if (termId) {
      const studentsWithData = await Promise.all(
        students.map(async (student) => {
          const schedule = await Schedule.findOne({
            studentId: student._id,
            termId,
          }).lean();

          const checkIns = await CheckIn.find({
            studentId: student._id,
            termId,
          })
            .sort({ timestamp: -1 })
            .lean();

          return {
            id: student._id,
            name: student.name,
            cardId: student.iso,
            role: student.role,
            currentStatus: student.status,
            weeklySchedule: schedule?.availability || {
              monday: [],
              tuesday: [],
              wednesday: [],
              thursday: [],
              friday: [],
              saturday: [],
              sunday: [],
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

