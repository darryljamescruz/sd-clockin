import type { Student, CreateStudentDto, UpdateStudentDto } from '@sd-clockin/shared';

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

export const studentsAPI = {
  getAll: async (termId?: string): Promise<Student[]> => {
    const query = termId ? `?termId=${termId}` : '';
    return fetchAPI<Student[]>(`/students${query}`);
  },

  getById: async (id: string): Promise<Student> => {
    return fetchAPI<Student>(`/students/${id}`);
  },

  create: async (data: CreateStudentDto): Promise<Student> => {
    return fetchAPI<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdateStudentDto): Promise<Student> => {
    return fetchAPI<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/students/${id}`, {
      method: 'DELETE',
    });
  },
};

