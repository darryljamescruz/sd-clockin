"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { StudentsPage } from "@/components/students-page"
import { api, type Student } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"

export default function StudentsManagement() {
  const router = useRouter()
  const [staffData, setStaffData] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true)
        const students = await api.students.getAll()
        setStaffData(students)
      } catch (err) {
        console.error("Error fetching students:", err)
        setError("Failed to load students. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const handleAddStudent = async (studentData: any) => {
    try {
      const newStudent = await api.students.create({
        name: studentData.name,
        cardId: studentData.cardId,
        role: studentData.role,
        weeklySchedule: studentData.weeklySchedule,
      })
      setStaffData((prev) => [...prev, newStudent])
    } catch (err) {
      console.error("Error adding student:", err)
      setError("Failed to add student. Please try again.")
      throw err
    }
  }

  const handleEditStudent = async (id: string, studentData: any) => {
    try {
      const updatedStudent = await api.students.update(id, {
        name: studentData.name,
        cardId: studentData.cardId,
        role: studentData.role,
      })
      setStaffData((prev) => prev.map((staff) => (staff.id === id ? { ...staff, ...updatedStudent } : staff)))
    } catch (err) {
      console.error("Error editing student:", err)
      setError("Failed to update student. Please try again.")
      throw err
    }
  }

  const handleDeleteStudent = async (id: string) => {
    try {
      await api.students.delete(id)
      setStaffData((prev) => prev.filter((staff) => staff.id !== id))
    } catch (err) {
      console.error("Error deleting student:", err)
      setError("Failed to delete student. Please try again.")
      throw err
    }
  }

  const handleBack = () => {
    router.push("/admin")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="max-w-7xl mx-auto bg-blue-50 border-blue-200 shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800 font-medium">Loading students...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="max-w-7xl mx-auto bg-red-50 border-red-200 shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <StudentsPage
          staffData={staffData}
          onAddStudent={handleAddStudent}
          onEditStudent={handleEditStudent}
          onDeleteStudent={handleDeleteStudent}
          onBack={handleBack}
        />
      </div>
    </div>
  )
}
