import type { CheckIn, CreateCheckInDto, UpdateCheckInDto, CheckInQueryParams } from '@sd-clockin/shared';

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

export const checkinsAPI = {
  getAll: async (params?: CheckInQueryParams): Promise<CheckIn[]> => {
    const queryParams = new URLSearchParams();
    if (params?.studentId) queryParams.append('studentId', params.studentId);
    if (params?.termId) queryParams.append('termId', params.termId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchAPI<CheckIn[]>(`/checkins${query}`);
  },

  create: async (data: CreateCheckInDto): Promise<CheckIn> => {
    return fetchAPI<CheckIn>('/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdateCheckInDto): Promise<CheckIn> => {
    return fetchAPI<CheckIn>(`/checkins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/checkins/${id}`, {
      method: 'DELETE',
    });
  },
};

