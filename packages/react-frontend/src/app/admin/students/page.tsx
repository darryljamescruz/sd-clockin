'use client';

import { StudentManager } from '../../../components/student-manager';
import { useAdminData } from '../admin-data-context';

export default function StudentsPage() {
  const { staffData, addStudent, editStudent, deleteStudent } = useAdminData();
  return (
    <StudentManager
      staffData={staffData}
      onAddStudent={addStudent}
      onEditStudent={editStudent}
      onDeleteStudent={deleteStudent}
    />
  );
}
