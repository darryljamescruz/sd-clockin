export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ClockEntry {
  timestamp: string;
  type: 'in' | 'out';
  isManual?: boolean;
}

export interface WeeklySchedule {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
  saturday: string[];
  sunday: string[];
}

export interface Staff {
  id: number;
  name: string;
  iso: string;
  role: string;
  currentStatus: string;
  assignedLocation?: string;
  weeklySchedule: WeeklySchedule;
  clockEntries: ClockEntry[];
  todayActual?: string | null;
}
