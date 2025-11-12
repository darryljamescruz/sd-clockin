/**
 * Student types shared between frontend and backend
 */

export interface Student {
  id: string;
  name: string;
  cardId: string;
  role: string;
  currentStatus: string;
  expectedStartShift?: string | null;
  expectedEndShift?: string | null;
  weeklySchedule?: WeeklySchedule;
  clockEntries?: ClockEntry[];
  todayActual?: string | null;
  todayExpected?: string;
}

export interface WeeklySchedule {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
}

export interface ClockEntry {
  id?: string;
  timestamp: string;
  type: 'in' | 'out';
  isManual?: boolean;
}

export interface CreateStudentDto {
  name: string;
  cardId: string;
  role: string;
}

export interface UpdateStudentDto {
  name?: string;
  cardId?: string;
  role?: string;
}

