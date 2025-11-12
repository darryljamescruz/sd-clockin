import type { Schedule, CreateScheduleDto } from '@sd-clockin/shared';

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

export const schedulesAPI = {
  get: async (studentId: string, termId: string): Promise<Schedule> => {
    return fetchAPI<Schedule>(`/schedules?studentId=${studentId}&termId=${termId}`);
  },

  createOrUpdate: async (data: CreateScheduleDto): Promise<Schedule> => {
    return fetchAPI<Schedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (studentId: string, termId: string): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/schedules?studentId=${studentId}&termId=${termId}`, {
      method: 'DELETE',
    });
  },
};

