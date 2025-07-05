// packages/react-frontend/src/app/admin/students/page.tsx
"use client"

import { useState } from "react"
import { StudentManager } from "@/components/student-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"

// TODO: This should come from your backend or shared state
const initialStaffData = [
  // Add your staff data here
]

export default function StudentsPage() {
  const [staffData, setStaffData] = useState(initialStaffData)
  const [showStudentManager, setShowStudentManager] = useState(false)

  const handleAddStudent = (studentData) => {
    const newStudent = {
      ...studentData,
      id: Math.max(...staffData.map((s) => s.id)) + 1,
      currentStatus: "expected",
      todayActual: null,
      clockEntries: [],
    }
    setStaffData((prev) => [...prev, newStudent])
  }

  const handleEditStudent = (id: number, studentData) => {
    setStaffData((prev) => prev.map((staff) => (staff.id === id ? { ...staff, ...studentData } : staff)))
  }

  const handleDeleteStudent = (id: number) => {
    setStaffData((prev) => prev.filter((staff) => staff.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-slate-600" />
          <h2 className="text-2xl font-semibold text-slate-900">Student Management</h2>
        </div>
        <Button onClick={() => setShowStudentManager(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-600">
            {staffData.length === 0 ? (
              <p>No students found. Add your first student to get started.</p>
            ) : (
              <p>{staffData.length} students registered</p>
            )}
          </div>
        </CardContent>
      </Card>

      {showStudentManager && (
        <StudentManager
          staffData={staffData}
          onAddStudent={handleAddStudent}
          onEditStudent={handleEditStudent}
          onDeleteStudent={handleDeleteStudent}
          onClose={() => setShowStudentManager(false)}
        />
      )}
    </div>
  )
}