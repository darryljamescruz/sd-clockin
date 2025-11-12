import { useState, useEffect } from 'react';
import { studentsAPI } from '../api/students.api.js';
import type { Student } from '@sd-clockin/shared';

export function useStudents(termId?: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await studentsAPI.getAll(termId);
        setStudents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch students');
        console.error('Error fetching students:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [termId]);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await studentsAPI.getAll(termId);
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { students, isLoading, error, refetch };
}

export function useStudent(id: string) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchStudent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await studentsAPI.getById(id);
        setStudent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch student');
        console.error('Error fetching student:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  return { student, isLoading, error };
}

