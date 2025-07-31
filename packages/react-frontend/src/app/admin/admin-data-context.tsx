'use client';

import React, { createContext, useContext, useState } from 'react';
import { Term, Staff } from '@/types';
import { initialTerms, initialStaffData } from '@/data/initialData';

interface AdminDataContextValue {
  terms: Term[];
  addTerm: (term: Omit<Term, 'id'>) => void;
  editTerm: (id: string, term: Omit<Term, 'id'>) => void;
  deleteTerm: (id: string) => void;
  staffData: Staff[];
  addStudent: (
    student: Omit<Staff, 'id' | 'clockEntries' | 'currentStatus' | 'assignedLocation' | 'todayActual'>
  ) => void;
  editStudent: (
    id: number,
    student: Omit<Staff, 'id' | 'clockEntries' | 'currentStatus' | 'assignedLocation' | 'todayActual'>
  ) => void;
  deleteStudent: (id: number) => void;
}

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error('useAdminData must be used within AdminDataProvider');
  return context;
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [terms, setTerms] = useState<Term[]>(initialTerms);
  const [staffData, setStaffData] = useState<Staff[]>(initialStaffData);

  const addTerm = (term: Omit<Term, 'id'>) => {
    const newTerm = { ...term, id: Date.now().toString() };
    setTerms((prev) => [...prev, newTerm]);
  };

  const editTerm = (id: string, updated: Omit<Term, 'id'>) => {
    setTerms((prev) => prev.map((t) => (t.id === id ? { ...updated, id } : t)));
  };

  const deleteTerm = (id: string) => {
    setTerms((prev) => prev.filter((t) => t.id !== id));
  };

  const addStudent = (
    student: Omit<Staff, 'id' | 'clockEntries' | 'currentStatus' | 'assignedLocation' | 'todayActual'>
  ) => {
    const newStudent: Staff = {
      ...student,
      id: Math.max(...staffData.map((s) => s.id)) + 1,
      currentStatus: 'expected',
      clockEntries: [],
    };
    setStaffData((prev) => [...prev, newStudent]);
  };

  const editStudent = (
    id: number,
    student: Omit<Staff, 'id' | 'clockEntries' | 'currentStatus' | 'assignedLocation' | 'todayActual'>
  ) => {
    setStaffData((prev) => prev.map((s) => (s.id === id ? { ...s, ...student } : s)));
  };

  const deleteStudent = (id: number) => {
    setStaffData((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <AdminDataContext.Provider
      value={{ terms, addTerm, editTerm, deleteTerm, staffData, addStudent, editStudent, deleteStudent }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}
