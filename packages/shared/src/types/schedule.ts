/**
 * Schedule types shared between frontend and backend
 */

import { WeeklySchedule } from './student.js';

export interface Schedule {
  id?: string;
  studentId: string;
  termId: string;
  availability: WeeklySchedule;
}

export interface CreateScheduleDto {
  studentId: string;
  termId: string;
  availability: WeeklySchedule;
}

export interface UpdateScheduleDto {
  availability?: WeeklySchedule;
}

