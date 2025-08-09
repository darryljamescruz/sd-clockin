'use client';

import { StudentManager } from '../../../components/student-manager';
import { useAdminData } from '../admin-data-context';

export default function ManageStudentsPage() {
  const { staffData, addStudent, editStudent, deleteStudent } = useAdminData();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <StudentManager
        staffData={staffData}
        onAddStudent={addStudent}
        onEditStudent={editStudent}
        onDeleteStudent={deleteStudent}
        mode="page"
      />
    </div>
  );
}
