import Student from '../models/Student.js';
import Schedule, { ISchedule } from '../models/Schedule.js';
import CheckIn from '../models/CheckIn.js';
import Shift from '../models/Shift.js';
import type { Student as StudentType } from '@sd-clockin/shared';

/**
 * Service for student-related business logic
 */
export class StudentsService {
  /**
   * Get all students with optional term-specific data
   */
  async getAllStudents(termId?: string): Promise<StudentType[]> {
    const students = await Student.find({}).lean();

    if (!termId) {
      // Return basic student info if no termId provided
      return students.map((student) => ({
        id: student._id.toString(),
        name: student.name,
        cardId: student.iso,
        role: student.role,
        currentStatus: student.status,
      }));
    }

    // Get students with term-specific data (schedules, check-ins, status)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const studentsWithData = await Promise.all(
      students.map(async (student) => {
        const schedule = await Schedule.findOne({
          studentId: student._id,
          termId,
        }).lean();

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

        // Check if there's an actual shift record (clocked in)
        if (todayShift) {
          if (todayShift.status === 'started') {
            currentStatus = 'present';
          } else if (todayShift.status === 'completed') {
            currentStatus = 'clocked_out';
          } else if (todayShift.status === 'missed') {
            currentStatus = 'absent';
          }

          if (todayShift.actualStart) {
            todayActual = todayShift.actualStart.toISOString();
          }

          expectedStartShift = todayShift.scheduledStart || null;
          expectedEndShift = todayShift.scheduledEnd || null;
        }

        // If not clocked in yet, check fallback: manual check-ins without shift
        if (currentStatus === 'off') {
          const todayCheckIns = await CheckIn.find({
            studentId: student._id,
            termId,
            timestamp: { $gte: startOfDay, $lte: endOfDay },
          })
            .sort({ timestamp: -1 })
            .lean();

          if (todayCheckIns.length > 0) {
            const lastCheckIn = todayCheckIns[0];
            if (lastCheckIn.type === 'in') {
              currentStatus = 'present';
              todayActual = lastCheckIn.timestamp.toISOString();
            } else if (lastCheckIn.type === 'out') {
              currentStatus = 'clocked_out';
            }
          }
        }

        // Calculate shift end if needed
        if (currentStatus === 'present' && !expectedEndShift && schedule && todayActual) {
          const calculated = this.calculateShiftEnd(now, schedule, todayActual);
          expectedStartShift = calculated.startTime || expectedStartShift;
          expectedEndShift = calculated.endTime || 'No schedule';
        }

        // Check for expected arrivals
        if (currentStatus === 'off' && schedule) {
          const incoming = this.checkExpectedArrivals(now, schedule);
          if (incoming) {
            currentStatus = 'incoming';
            expectedStartShift = incoming.startTime;
            expectedEndShift = incoming.endTime;
          }
        }

        // Get check-ins for historical data
        const checkIns = await CheckIn.find({
          studentId: student._id,
          termId,
        })
          .sort({ timestamp: -1 })
          .limit(50)
          .lean();

        return {
          id: student._id.toString(),
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
            id: entry._id.toString(),
            timestamp: entry.timestamp.toISOString(),
            type: entry.type,
            isManual: entry.isManual,
          })),
        };
      })
    );

    return studentsWithData;
  }

  /**
   * Calculate shift end time based on schedule and clock-in time
   */
  private calculateShiftEnd(
    now: Date,
    schedule: ISchedule,
    clockInTime: string
  ): { startTime: string | null; endTime: string | null } {
    const dayOfWeek = now.getDay();
    const dayNames: Record<number, keyof ISchedule['availability'] | null> = {
      0: null,
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: null,
    };
    const dayName = dayNames[dayOfWeek];
    const todaySchedule = dayName ? schedule.availability[dayName] || [] : [];

    if (todaySchedule.length === 0) {
      return { startTime: null, endTime: null };
    }

    const clockInDate = new Date(clockInTime);
    const pstTime = new Date(
      clockInDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
    );
    const clockInMinutes = pstTime.getHours() * 60 + pstTime.getMinutes();

    let bestMatch: { startTime: string; endTime: string; distance: number } | null = null;

    for (const shiftBlock of todaySchedule) {
      const [startTime, endTime] = shiftBlock.split('-');
      if (!startTime || !endTime) continue;

      const [startHourStr, startMinuteStr] = startTime.trim().split(':');
      const shiftStartHour = parseInt(startHourStr, 10);
      const shiftStartMinute = parseInt(startMinuteStr, 10);
      const shiftStartMinutes = shiftStartHour * 60 + shiftStartMinute;

      const [endHourStr, endMinuteStr] = endTime.trim().split(':');
      const shiftEndHour = parseInt(endHourStr, 10);
      const shiftEndMinute = parseInt(endMinuteStr, 10);
      const shiftEndMinutes = shiftEndHour * 60 + shiftEndMinute;

      if (
        clockInMinutes >= shiftStartMinutes - 240 &&
        clockInMinutes <= shiftEndMinutes
      ) {
        const distance = Math.abs(clockInMinutes - shiftStartMinutes);
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = {
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            distance,
          };
        }
      }
    }

    return {
      startTime: bestMatch?.startTime || null,
      endTime: bestMatch?.endTime || null,
    };
  }

  /**
   * Check if student is expected to arrive within next 3 hours
   */
  private checkExpectedArrivals(
    now: Date,
    schedule: ISchedule
  ): { startTime: string; endTime: string } | null {
    const nowPST = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const dayOfWeek = nowPST.getDay();
    const dayNames: Record<number, keyof ISchedule['availability'] | null> = {
      0: null,
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: null,
    };
    const dayName = dayNames[dayOfWeek];
    const todaySchedule = dayName ? schedule.availability[dayName] || [] : [];

    const currentHour = nowPST.getHours();
    const currentMinute = nowPST.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    for (const shiftBlock of todaySchedule) {
      const [startTime, endTime] = shiftBlock.split('-');
      if (!startTime || !endTime) continue;

      const [startHourStr, startMinuteStr] = startTime.trim().split(':');
      const shiftStartHour = parseInt(startHourStr, 10);
      const shiftStartMinute = parseInt(startMinuteStr, 10);
      const shiftStartTotalMinutes = shiftStartHour * 60 + shiftStartMinute;

      const minutesUntilShift = shiftStartTotalMinutes - currentTotalMinutes;

      if (minutesUntilShift >= 0 && minutesUntilShift <= 180) {
        return {
          startTime: startTime.trim(),
          endTime: endTime.trim(),
        };
      }
    }

    return null;
  }

  /**
   * Get a single student by ID
   */
  async getStudentById(id: string): Promise<StudentType | null> {
    const student = await Student.findById(id).lean();
    if (!student) return null;

    return {
      id: student._id.toString(),
      name: student.name,
      cardId: student.iso,
      role: student.role,
      currentStatus: student.status,
    };
  }

  /**
   * Create a new student
   */
  async createStudent(data: {
    name: string;
    cardId: string;
    role: string;
  }): Promise<StudentType> {
    const existingStudent = await Student.findOne({ iso: data.cardId });
    if (existingStudent) {
      throw new Error('A student with this card ID already exists');
    }

    const newStudent = new Student({
      name: data.name,
      iso: data.cardId,
      role: data.role,
      status: 'active',
    });

    await newStudent.save();

    return {
      id: newStudent._id.toString(),
      name: newStudent.name,
      cardId: newStudent.iso,
      role: newStudent.role,
      currentStatus: newStudent.status,
    };
  }

  /**
   * Update a student
   */
  async updateStudent(
    id: string,
    data: { name?: string; cardId?: string; role?: string }
  ): Promise<StudentType> {
    const student = await Student.findById(id);
    if (!student) {
      throw new Error('Student not found');
    }

    if (data.cardId && data.cardId !== student.iso) {
      const existingStudent = await Student.findOne({ iso: data.cardId });
      if (existingStudent) {
        throw new Error('A student with this card ID already exists');
      }
    }

    if (data.name) student.name = data.name;
    if (data.cardId) student.iso = data.cardId;
    if (data.role) student.role = data.role;

    await student.save();

    return {
      id: student._id.toString(),
      name: student.name,
      cardId: student.iso,
      role: student.role,
      currentStatus: student.status,
    };
  }

  /**
   * Delete a student
   */
  async deleteStudent(id: string): Promise<void> {
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      throw new Error('Student not found');
    }

    // Delete associated schedules and check-ins
    const Schedule = (await import('../models/Schedule.js')).default;
    const CheckIn = (await import('../models/CheckIn.js')).default;

    await Schedule.deleteMany({ studentId: id });
    await CheckIn.deleteMany({ studentId: id });
  }
}

export default new StudentsService();

