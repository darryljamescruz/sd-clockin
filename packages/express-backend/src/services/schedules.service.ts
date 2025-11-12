import Schedule from '../models/Schedule.js';
import Student from '../models/Student.js';
import Term from '../models/Term.js';
import { normalizeSchedule } from '../utils/scheduleParser.js';
import type { Schedule as ScheduleType, CreateScheduleDto } from '@sd-clockin/shared';

/**
 * Service for schedule-related business logic
 */
export class SchedulesService {
  /**
   * Get schedule for a student in a specific term
   */
  async getSchedule(studentId: string, termId: string): Promise<ScheduleType> {
    const schedule = await Schedule.findOne({ studentId, termId }).lean();

    if (!schedule) {
      return {
        studentId,
        termId,
        availability: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        },
      };
    }

    return {
      id: schedule._id.toString(),
      studentId: schedule.studentId.toString(),
      termId: schedule.termId.toString(),
      availability: schedule.availability,
    };
  }

  /**
   * Create or update a schedule
   */
  async createOrUpdateSchedule(data: CreateScheduleDto): Promise<ScheduleType> {
    // Verify student and term exist
    const student = await Student.findById(data.studentId);
    const term = await Term.findById(data.termId);

    if (!student) {
      throw new Error('Student not found');
    }

    if (!term) {
      throw new Error('Term not found');
    }

    // Normalize the schedule
    const normalizedAvailability = normalizeSchedule(data.availability);

    // Check if schedule already exists
    let schedule = await Schedule.findOne({
      studentId: data.studentId,
      termId: data.termId,
    });

    if (schedule) {
      schedule.availability = normalizedAvailability;
      await schedule.save();
    } else {
      schedule = new Schedule({
        studentId: data.studentId,
        termId: data.termId,
        availability: normalizedAvailability,
      });
      await schedule.save();
    }

    return {
      id: schedule._id.toString(),
      studentId: schedule.studentId.toString(),
      termId: schedule.termId.toString(),
      availability: schedule.availability,
    };
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(studentId: string, termId: string): Promise<void> {
    const schedule = await Schedule.findOneAndDelete({ studentId, termId });
    if (!schedule) {
      throw new Error('Schedule not found');
    }
  }
}

export default new SchedulesService();

