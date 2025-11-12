/**
 * CheckIn types shared between frontend and backend
 */

export interface CheckIn {
  id?: string;
  studentId: string;
  termId: string;
  type: 'in' | 'out';
  timestamp: string;
  isManual: boolean;
}

export interface CreateCheckInDto {
  studentId: string;
  termId: string;
  type: 'in' | 'out';
  timestamp?: string;
  isManual: boolean;
}

export interface UpdateCheckInDto {
  timestamp?: string;
  type?: 'in' | 'out';
}

export interface CheckInQueryParams {
  studentId?: string;
  termId?: string;
  startDate?: string;
  endDate?: string;
}

