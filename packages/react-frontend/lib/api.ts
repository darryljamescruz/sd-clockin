// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types
export interface Student {
  id: string;
  name: string;
  cardId: string;
  role: string;
  currentStatus: string;
  expectedStartShift?: string | null; // Expected start shift time for today
  expectedEndShift?: string | null; // Expected end shift time for today
  weeklySchedule?: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
  };
  clockEntries?: ClockEntry[];
  todayActual?: string | null; // Computed field for display
  todayExpected?: string; // Computed field for display
}

export interface DayOffRange {
  startDate: string;
  endDate: string;
}

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  daysOff?: DayOffRange[];
}

export interface ClockEntry {
  id?: string;
  timestamp: string;
  type: 'in' | 'out';
  isManual?: boolean;
}

export interface Schedule {
  id?: string;
  studentId: string;
  termId: string;
  availability: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
  };
}

export interface CheckIn {
  id?: string;
  studentId: string;
  termId: string;
  type: 'in' | 'out';
  timestamp: string;
  isManual: boolean;
}

// Helper function for making API requests
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

// ============ STUDENTS API ============

export const studentsAPI = {
  // Get all students, optionally with data for a specific term
  getAll: async (termId?: string): Promise<Student[]> => {
    const query = termId ? `?termId=${termId}` : '';
    return fetchAPI<Student[]>(`/students${query}`);
  },

  // Get a single student by ID
  getById: async (id: string): Promise<Student> => {
    return fetchAPI<Student>(`/students/${id}`);
  },

  // Create a new student
  create: async (data: { name: string; cardId: string; role: string }): Promise<Student> => {
    return fetchAPI<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a student
  update: async (id: string, data: { name?: string; cardId?: string; role?: string }): Promise<Student> => {
    return fetchAPI<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete a student
  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/students/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============ TERMS API ============

export const termsAPI = {
  // Get all terms
  getAll: async (): Promise<Term[]> => {
    return fetchAPI<Term[]>('/terms');
  },

  // Get a single term by ID
  getById: async (id: string): Promise<Term> => {
    return fetchAPI<Term>(`/terms/${id}`);
  },

  // Create a new term
  create: async (data: { name: string; startDate: string; endDate: string; isActive: boolean; daysOff?: DayOffRange[] }): Promise<Term> => {
    return fetchAPI<Term>('/terms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a term
  update: async (id: string, data: { name?: string; startDate?: string; endDate?: string; isActive?: boolean; daysOff?: DayOffRange[] }): Promise<Term> => {
    return fetchAPI<Term>(`/terms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete a term
  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/terms/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============ SCHEDULES API ============

export const schedulesAPI = {
  // Get schedule for a student in a specific term
  get: async (studentId: string, termId: string): Promise<Schedule> => {
    return fetchAPI<Schedule>(`/schedules?studentId=${studentId}&termId=${termId}`);
  },

  // Create or update a schedule
  createOrUpdate: async (data: Schedule): Promise<Schedule> => {
    return fetchAPI<Schedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Delete a schedule
  delete: async (studentId: string, termId: string): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/schedules?studentId=${studentId}&termId=${termId}`, {
      method: 'DELETE',
    });
  },
};

// ============ CHECK-INS API ============

export const checkinsAPI = {
  // Get check-ins with optional filters
  getAll: async (params?: {
    studentId?: string;
    termId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CheckIn[]> => {
    const queryParams = new URLSearchParams();
    if (params?.studentId) queryParams.append('studentId', params.studentId);
    if (params?.termId) queryParams.append('termId', params.termId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchAPI<CheckIn[]>(`/checkins${query}`);
  },

  // Create a new check-in
  create: async (data: { studentId: string; termId: string; type: 'in' | 'out'; timestamp?: string; isManual: boolean }): Promise<CheckIn> => {
    return fetchAPI<CheckIn>('/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a check-in
  update: async (id: string, data: { timestamp?: string; type?: 'in' | 'out' }): Promise<CheckIn> => {
    return fetchAPI<CheckIn>(`/checkins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete a check-in
  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/checkins/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============ IMPORT API ============

export const importAPI = {
  // Preview CSV import without saving
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

  // Import schedules from CSV
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

// ============ HEALTH CHECK ============

export const healthAPI = {
  check: async (): Promise<{ status: string; message: string }> => {
    return fetchAPI<{ status: string; message: string }>('/health');
  },
};

// Export all APIs as a single object
export const api = {
  students: studentsAPI,
  terms: termsAPI,
  schedules: schedulesAPI,
  checkins: checkinsAPI,
  import: importAPI,
  health: healthAPI,
};

export default api;

