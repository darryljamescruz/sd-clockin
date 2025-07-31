'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/navbar';
import { StudentManager } from '../../../components/student-manager';
import { useAdminData } from '../admin-data-context';

export default function ManageStudentsPage() {
  const router = useRouter();
  const { staffData, addStudent, editStudent, deleteStudent } = useAdminData();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentTime={currentTime} onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-6">
        <StudentManager
          staffData={staffData}
          onAddStudent={addStudent}
          onEditStudent={editStudent}
          onDeleteStudent={deleteStudent}
          mode="page"
        />
      </div>
    </div>
  );
}
