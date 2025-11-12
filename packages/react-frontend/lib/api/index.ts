/**
 * Central API exports
 * Re-exports all API modules and provides a unified api object
 */

export * from './students.api.js';
export * from './terms.api.js';
export * from './schedules.api.js';
export * from './checkins.api.js';
export * from './import.api.js';

import { studentsAPI } from './students.api.js';
import { termsAPI } from './terms.api.js';
import { schedulesAPI } from './schedules.api.js';
import { checkinsAPI } from './checkins.api.js';
import { importAPI } from './import.api.js';

// Re-export types from shared package
export type {
  Student,
  Term,
  Schedule,
  CheckIn,
  CreateStudentDto,
  UpdateStudentDto,
  CreateTermDto,
  UpdateTermDto,
  CreateScheduleDto,
  CreateCheckInDto,
  UpdateCheckInDto,
  CheckInQueryParams,
} from '@sd-clockin/shared';

// Health check API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

export const healthAPI = {
  check: async (): Promise<{ status: string; message: string }> => {
    return fetchAPI<{ status: string; message: string }>('/health');
  },
};

// Export all APIs as a single object for convenience
export const api = {
  students: studentsAPI,
  terms: termsAPI,
  schedules: schedulesAPI,
  checkins: checkinsAPI,
  import: importAPI,
  health: healthAPI,
};

export default api;

