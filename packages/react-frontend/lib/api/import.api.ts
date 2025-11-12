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

export const importAPI = {
  previewCSV: async (csvContent: string): Promise<{
    success: boolean;
    summary: {
      totalRows: number;
      matched: number;
      willCreate: number;
    };
    matchedStudents: any[];
    studentsToCreate: any[];
  }> => {
    return fetchAPI('/import/preview', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    });
  },

  importSchedules: async (csvContent: string, termId: string): Promise<{
    success: boolean;
    message: string;
    summary: {
      totalProcessed: number;
      saved: number;
      matched: number;
      created: number;
      errors: number;
    };
    savedSchedules: any[];
    createdStudents: any[];
    errors: any[];
  }> => {
    return fetchAPI('/import/schedules', {
      method: 'POST',
      body: JSON.stringify({ csvContent, termId }),
    });
  },
};

