'use client';

import { createContext, useContext, useState } from 'react';
import { initialTerms, initialStaffData } from '../../data/initialData';

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface ClockEntry {
  timestamp: string;
  type: 'in' | 'out';
  isManual?: boolean;
}

interface Staff {
  id: number;
  name: string;
  iso: string;
  role: string;
  currentStatus: string;
  weeklySchedule: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  clockEntries: ClockEntry[];
  todayActual?: string | null;
  assignedLocation?: string;
}

interface AdminContextType {
  terms: Term[];
  addTerm: (term: Omit<Term, 'id'>) => void;
  editTerm: (id: string, term: Omit<Term, 'id'>) => void;
  deleteTerm: (id: string) => void;
  staffData: Staff[];
  addStudent: (
    student: Omit<Staff, 'id' | 'clockEntries' | 'currentStatus'>
  ) => void;
  editStudent: (
    id: number,
    student: Omit<Staff, 'id' | 'clockEntries' | 'currentStatus'>
  ) => void;
  deleteStudent: (id: number) => void;
}

const AdminDataContext = createContext<AdminContextType | undefined>(undefined);

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
}

export function AdminDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [terms, setTerms] = useState<Term[]>(initialTerms);
  const [staffData, setStaffData] = useState<Staff[]>(initialStaffData);

  const addTerm = (term: Omit<Term, 'id'>) => {
    const newTerm = { ...term, id: Date.now().toString() };
    setTerms((prev) => [...prev, newTerm]);
  };

  const editTerm = (id: string, term: Omit<Term, 'id'>) => {
    setTerms((prev) => prev.map((t) => (t.id === id ? { ...term, id } : t)));
  };

  const deleteTerm = (id: string) => {
    setTerms((prev) => prev.filter((t) => t.id !== id));
  };

  const addStudent = (
    student: Omit<Staff, 'id' | 'clockEntries' | 'currentStatus'>
  ) => {
    const newStudent: Staff = {
      ...student,
      id: Math.max(0, ...staffData.map((s) => s.id)) + 1,
      currentStatus: 'expected',
      todayActual: null,
      clockEntries: [],
    };
    setStaffData((prev) => [...prev, newStudent]);
  };

  const editStudent = (
    id: number,
    student: Omit<Staff, 'id' | 'clockEntries' | 'currentStatus'>
  ) => {
    setStaffData((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...student } : s))
    );
  };

  const deleteStudent = (id: number) => {
    setStaffData((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <AdminDataContext.Provider
      value={{
        terms,
        addTerm,
        editTerm,
        deleteTerm,
        staffData,
        addStudent,
        editStudent,
        deleteStudent,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

