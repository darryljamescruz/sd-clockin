import { useState, useCallback } from "react"

export interface Staff {
  id: number
  name: string
  iso: string
  role: string
  currentStatus: string
  todayActual: string | null
  todayExpected: string
  weeklySchedule: {
    monday?: string[]
    tuesday?: string[]
    wednesday?: string[]
    thursday?: string[]
    friday?: string[]
  }
  clockEntries: Array<{
    timestamp: string
    type: "in" | "out"
    isManual?: boolean
  }>
}

// TODO: Replace with actual data from your backend
const initialStaffData: Staff[] = [
  {
    id: 1,
    name: "Alex Chen",
    iso: "CARD001",
    role: "Student Lead",
    currentStatus: "present",
    weeklySchedule: {
      monday: ["8:30-12:00", "1:00-5:00"],
      tuesday: ["9:00-1:00"],
      wednesday: ["8:30-12:00", "1:00-5:00"],
      thursday: ["9:00-1:00"],
      friday: ["8:30-12:00"],
    },
    todayActual: "08:25 AM",
    todayExpected: "08:30 AM",
    clockEntries: [
      { timestamp: "2025-01-20T08:25:00", type: "in" },
      { timestamp: "2025-01-20T12:30:00", type: "out" },
      { timestamp: "2025-01-20T13:15:00", type: "in" },
      { timestamp: "2025-01-20T17:05:00", type: "out" },
    ],
  },
  {
    id: 2,
    name: "Sarah Johnson",
    iso: "CARD002",
    role: "Assistant",
    currentStatus: "present",
    weeklySchedule: {
      monday: ["9:15-5:00"],
      tuesday: ["9:15-5:00"],
      wednesday: ["9:15-5:00"],
      thursday: ["9:15-5:00"],
      friday: ["9:15-1:00"],
    },
    todayActual: "09:10 AM",
    todayExpected: "09:15 AM",
    clockEntries: [{ timestamp: "2025-01-20T09:10:00", type: "in" }],
  },
  {
    id: 3,
    name: "Mike Rodriguez",
    iso: "CARD003",
    role: "Student Lead",
    currentStatus: "present",
    weeklySchedule: {
      monday: ["8:45-12:00", "1:00-4:00"],
      tuesday: ["10:00-2:00"],
      wednesday: ["8:45-12:00", "1:00-4:00"],
      thursday: ["10:00-2:00"],
      friday: ["8:45-12:00"],
    },
    todayActual: "08:45 AM",
    todayExpected: "08:45 AM",
    clockEntries: [
      { timestamp: "2025-01-20T08:45:00", type: "in" },
      { timestamp: "2025-01-20T12:15:00", type: "out" },
      { timestamp: "2025-01-20T13:10:00", type: "in" },
    ],
  },
  {
    id: 4,
    name: "Emma Wilson",
    iso: "CARD004",
    role: "Assistant",
    currentStatus: "expected",
    weeklySchedule: {
      monday: ["9:00-5:00"],
      tuesday: ["9:00-5:00"],
      wednesday: ["9:00-1:00"],
      thursday: ["9:00-5:00"],
      friday: ["9:00-5:00"],
    },
    todayActual: null,
    todayExpected: "09:00 AM",
    clockEntries: [],
  },
  {
    id: 5,
    name: "David Park",
    iso: "CARD005",
    role: "Assistant",
    currentStatus: "expected",
    weeklySchedule: {
      monday: [],
      tuesday: ["10:30-2:30"],
      wednesday: ["10:30-2:30"],
      thursday: ["10:30-2:30"],
      friday: [],
    },
    todayActual: null,
    todayExpected: "10:30 AM",
    clockEntries: [],
  },
  {
    id: 6,
    name: "Lisa Zhang",
    iso: "CARD006",
    role: "Student Lead",
    currentStatus: "present",
    weeklySchedule: {
      monday: ["8:00-12:00", "1:00-5:00"],
      tuesday: ["8:00-12:00", "1:00-5:00"],
      wednesday: ["8:00-12:00", "1:00-5:00"],
      thursday: ["8:00-12:00", "1:00-5:00"],
      friday: ["8:00-12:00"],
    },
    todayActual: "07:58 AM",
    todayExpected: "08:00 AM",
    clockEntries: [
      { timestamp: "2025-01-20T07:58:00", type: "in" },
      { timestamp: "2025-01-20T12:05:00", type: "out" },
    ],
  },
]

export function useStaffData() {
  const [staffData, setStaffData] = useState<Staff[]>(initialStaffData)

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }, [])

  const addClockEntry = useCallback((staffId: number, type: "in" | "out", isManual = false) => {
    setStaffData((prev) =>
      prev.map((staff) => {
        if (staff.id === staffId) {
          const newEntry = {
            timestamp: new Date().toISOString(),
            type,
            isManual,
          }
          return {
            ...staff,
            clockEntries: [...staff.clockEntries, newEntry],
            currentStatus: type === "in" ? "present" : "absent",
            todayActual: type === "in" ? formatTime(new Date()) : staff.todayActual,
          }
        }
        return staff
      })
    )
  }, [formatTime])

  const handleCardSwipe = useCallback((cardData: string) => {
    const staff = staffData.find((s) => s.iso === cardData.toUpperCase())
    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"
      addClockEntry(staff.id, action)
      return {
        success: true,
        message: `${staff.name} clocked ${action} at ${formatTime(new Date())}`,
        staff,
        action,
      }
    }
    return {
      success: false,
      message: "Card not recognized. Please try again or contact admin.",
    }
  }, [staffData, addClockEntry, formatTime])

  const handleManualClockIn = useCallback((staffId: number, isManual: boolean) => {
    const staff = staffData.find((s) => s.id === staffId)
    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"
      addClockEntry(staff.id, action, isManual)
      
      const manualFlag = isManual ? " (Manual Entry)" : ""
      return {
        success: true,
        message: `${staff.name} clocked ${action} at ${formatTime(new Date())}${manualFlag}`,
        staff,
        action,
      }
    }
    return {
      success: false,
      message: "Staff member not found.",
    }
  }, [staffData, addClockEntry, formatTime])

  const addStudent = useCallback((studentData: Omit<Staff, "id" | "currentStatus" | "todayActual" | "clockEntries" | "todayExpected">) => {
    const newStudent: Staff = {
      ...studentData,
      id: Math.max(...staffData.map((s) => s.id)) + 1,
      currentStatus: "expected",
      todayActual: null,
      todayExpected: "09:00 AM",
      clockEntries: [],
    }
    setStaffData((prev) => [...prev, newStudent])
  }, [staffData])

  const editStudent = useCallback((id: number, studentData: Partial<Staff>) => {
    setStaffData((prev) => prev.map((staff) => (staff.id === id ? { ...staff, ...studentData } : staff)))
  }, [])

  const deleteStudent = useCallback((id: number) => {
    setStaffData((prev) => prev.filter((staff) => staff.id !== id))
  }, [])

  const getWeeklyStats = useCallback(() => {
    const totalStaff = staffData.length
    const presentStaff = staffData.filter((s) => s.currentStatus === "present").length
    const lateToday = staffData.filter((s) => {
      if (!s.todayActual) return false
      // Add your late detection logic here
      return false
    }).length
    const studentLeads = staffData.filter((s) => s.role === "Student Lead").length

    return { totalStaff, presentStaff, lateToday, studentLeads }
  }, [staffData])

  return {
    staffData,
    handleCardSwipe,
    handleManualClockIn,
    addStudent,
    editStudent,
    deleteStudent,
    getWeeklyStats,
  }
} 