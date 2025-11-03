"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Navbar } from "@/components/navbar"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { IndividualRecords } from "@/components/individual-records"
import { TermAnalytics } from "@/components/term-analytics"
import { TermOverview } from "@/components/term-overview"

export default function AdminDashboard() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateError, setDateError] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedStaff, setSelectedStaff] = useState(null)

  const initialTerms = [
    {
      id: "1",
      name: "Fall 2025",
      startDate: "2025-08-25",
      endDate: "2025-12-15",
      isActive: true,
    },
    {
      id: "2",
      name: "Summer 2025",
      startDate: "2025-05-15",
      endDate: "2025-08-15",
      isActive: false,
    },
    {
      id: "3",
      name: "Spring 2025",
      startDate: "2025-01-15",
      endDate: "2025-05-10",
      isActive: false,
    },
  ]

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
        { timestamp: "2025-01-20T13:15:00", type: "in" },
        { timestamp: "2025-01-20T17:05:00", type: "out" },
      ],
    },
  ]

  const [terms, setTerms] = useState(initialTerms)
  const [staffData, setStaffData] = useState(initialStaffData)
  const [selectedTerm, setSelectedTerm] = useState("Fall 2025")

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    router.push("/")
  }

  const handleManageTerms = () => {
    router.push("/admin/terms")
  }

  const handleManageStudents = () => {
    router.push("/admin/students")
  }

  const getWeeklyStats = () => {
    const totalStaff = staffData.length
    const presentStaff = staffData.filter((s) => s.currentStatus === "present").length
    const lateToday = staffData.filter((s) => {
      if (!s.todayActual) return false
      const expected = new Date(`2000-01-01 ${getExpectedStartTime(s)}`)
      const actual = new Date(`2000-01-01 ${s.todayActual}`)
      return actual > expected
    }).length
    const studentLeads = staffData.filter((s) => s.role === "Student Lead").length

    return { totalStaff, presentStaff, lateToday, studentLeads }
  }

  const getCurrentTerm = () => {
    return terms.find((term) => term.name === selectedTerm) || terms[0]
  }

  const getTodaySchedule = (staff, date = new Date()) => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = dayNames[date.getDay()]
    return staff.weeklySchedule?.[dayName] || []
  }

  const getExpectedStartTime = (staff, date = new Date()) => {
    const todaySchedule = getTodaySchedule(staff, date)
    if (todaySchedule.length === 0) return null

    const firstBlock = todaySchedule[0]
    const startTime = firstBlock.split("-")[0].trim()

    if (startTime.includes(":")) {
      return startTime.includes("AM") || startTime.includes("PM") ? startTime : startTime + " AM"
    } else {
      const hour = Number.parseInt(startTime)
      if (hour === 0) return "12:00 AM"
      if (hour < 12) return `${hour}:00 AM`
      if (hour === 12) return "12:00 PM"
      return `${hour - 12}:00 PM`
    }
  }

  const getTermWeekdays = () => {
    const weekdays = []
    const currentTerm = getCurrentTerm()
    const start = new Date(currentTerm.startDate)
    const end = new Date(currentTerm.endDate)
    const current = new Date(start)

    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        weekdays.push(new Date(current))
      }
      current.setDate(current.getDate() + 1)
    }
    return weekdays
  }

  const termWeekdays = getTermWeekdays()
  const currentDateIndex = termWeekdays.findIndex((date) => date.toDateString() === selectedDate.toDateString())

  const goToPreviousDay = () => {
    if (currentDateIndex > 0) {
      setSelectedDate(termWeekdays[currentDateIndex - 1])
    }
  }

  const goToNextDay = () => {
    if (currentDateIndex < termWeekdays.length - 1) {
      setSelectedDate(termWeekdays[currentDateIndex + 1])
    }
  }

  const goToToday = () => {
    const today = new Date()
    const termStatus = getTermStatus()

    if (termStatus.status === "future") {
      setDateError("Cannot view today's attendance for a future term. This term hasn't started yet.")
      setTimeout(() => setDateError(""), 5000)
      return
    }

    const todayInTerm = termWeekdays.find((date) => date.toDateString() === today.toDateString())
    if (todayInTerm) {
      setSelectedDate(todayInTerm)
      setDateError("")
    } else {
      if (termStatus.status === "past") {
        setSelectedDate(termWeekdays[termWeekdays.length - 1])
        setDateError("")
      } else {
        setDateError("Today is not within the selected term period.")
        setTimeout(() => setDateError(""), 5000)
      }
    }
  }

  const getTermStatus = () => {
    const today = new Date()
    const currentTerm = getCurrentTerm()
    const startDate = new Date(currentTerm.startDate)
    const endDate = new Date(currentTerm.endDate)

    if (today < startDate) {
      return { status: "future" }
    } else if (today > endDate) {
      return { status: "past" }
    } else {
      return { status: "current" }
    }
  }

  const stats = getWeeklyStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar
        currentTime={currentTime}
        onLogout={handleLogout}
        onManageTerms={handleManageTerms}
        onManageStudents={handleManageStudents}
      />

      <div className="max-w-7xl mx-auto px-6">
        <StatsCards
          totalStaff={stats.totalStaff}
          presentStaff={stats.presentStaff}
          studentLeads={stats.studentLeads}
          lateToday={stats.lateToday}
        />

        {dateError && (
          <Card className="mb-6 bg-red-50 border-red-200 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{dateError}</span>
            </CardContent>
          </Card>
        )}

        <DashboardHeader
          terms={terms}
          selectedTerm={selectedTerm}
          onTermChange={setSelectedTerm}
          selectedDate={selectedDate}
          currentDateIndex={currentDateIndex}
          termWeekdays={termWeekdays}
          onPreviousDay={goToPreviousDay}
          onNextDay={goToNextDay}
          onToday={goToToday}
          getTermStatus={getTermStatus}
        />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/70 backdrop-blur-sm border-slate-200">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Term Analytics</TabsTrigger>
            <TabsTrigger value="individual">Individual Records</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <TermOverview
              staffData={staffData}
              selectedTerm={selectedTerm}
              currentTerm={getCurrentTerm()}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <TermAnalytics
              staffData={staffData}
              selectedTerm={selectedTerm}
              termStartDate={getCurrentTerm().startDate}
              termEndDate={getCurrentTerm().endDate}
            />
          </TabsContent>

          <TabsContent value="individual">
            <IndividualRecords
              staffData={staffData}
              selectedStaff={selectedStaff}
              onSelectStaff={setSelectedStaff}
              selectedTerm={selectedTerm}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
