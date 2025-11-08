"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { StudentsPage } from "@/components/students-page"
import { api, type Student, type Term } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"

export default function StudentsManagement() {
  const router = useRouter()
  const [staffData, setStaffData] = useState<Student[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch students and terms on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [students, fetchedTerms] = await Promise.all([
          api.students.getAll(),
          api.terms.getAll(),
        ])
        setStaffData(students)
        setTerms(fetchedTerms)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddStudent = async (studentData: any) => {
    try {
      const newStudent = await api.students.create({
        name: studentData.name,
        cardId: studentData.cardId,
        role: studentData.role,
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
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-blue-800 font-medium">Loading students...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">{error}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <StudentsPage
      staffData={staffData}
      onAddStudent={handleAddStudent}
      onEditStudent={handleEditStudent}
      onDeleteStudent={handleDeleteStudent}
      onBack={handleBack}
    />
  )
}
