"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StudentsPage } from "@/components/students-page"

export default function StudentsManagement() {
  const router = useRouter()

  const initialStaffData = [
    {
      id: 1,
      name: "Alex Chen",
      cardId: "CARD001",
      role: "Student Lead",
      currentStatus: "present",
      weeklySchedule: {
        monday: ["8:30-12:00", "1:00-5:00"],
        tuesday: ["9:00-1:00"],
        wednesday: ["8:30-12:00", "1:00-5:00"],
        thursday: ["9:00-1:00"],
        friday: ["8:30-12:00"],
        saturday: [],
        sunday: [],
      },
      todayActual: "08:25 AM",
      clockEntries: [
        { timestamp: "2025-01-20T08:25:00", type: "in" },
        { timestamp: "2025-01-20T12:30:00", type: "out" },
      ],
    },
    {
      id: 2,
      name: "Sarah Johnson",
      cardId: "CARD002",
      role: "Assistant",
      currentStatus: "present",
      weeklySchedule: {
        monday: ["9:15-5:00"],
        tuesday: ["9:15-5:00"],
        wednesday: ["9:15-5:00"],
        thursday: ["9:15-5:00"],
        friday: ["9:15-1:00"],
        saturday: [],
        sunday: [],
      },
      todayActual: "09:10 AM",
      clockEntries: [{ timestamp: "2025-01-20T09:10:00", type: "in" }],
    },
  ]

  const [staffData, setStaffData] = useState(initialStaffData)

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

  const handleBack = () => {
    router.push("/admin")
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
