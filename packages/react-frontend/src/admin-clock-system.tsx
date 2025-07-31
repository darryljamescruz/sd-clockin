"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navbar } from "./components/navbar"
import { DashboardHeader } from "./components/dashboard-header"
import { TermManager } from "./components/term-manager"
import { StatsCards } from "./components/stats-cards"
import { IndividualRecords } from "./components/individual-records"
import { StudentManager } from "./components/student-manager"
import { TermAnalytics } from "./components/term-analytics"
import { TermOverview } from "./components/term-overview"
import { initialTerms, initialStaffData } from "./data/initialData"
import {
  getCurrentTerm,
  getTermStatus,
  getTermWeekdays,
  getWeeklyStats,
} from "./utils/clockUtils"

export default function AdminClockSystem() {
  const router = useRouter()
  const [showStudentManager, setShowStudentManager] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateError, setDateError] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showTermManager, setShowTermManager] = useState(false)
  const [terms, setTerms] = useState(initialTerms)
  const [staffData, setStaffData] = useState(initialStaffData)
  const [selectedTerm, setSelectedTerm] = useState("Fall 2025")
  const [selectedStaff, setSelectedStaff] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    router.push("/")
  }

  const handleAddTerm = (term) => {
    const newTerm = {
      ...term,
      id: Date.now().toString(),
    }
    setTerms((prev) => [...prev, newTerm])
  }

  const handleEditTerm = (id: string, updatedTerm) => {
    setTerms((prev) => prev.map((term) => (term.id === id ? { ...updatedTerm, id } : term)))
  }

  const handleDeleteTerm = (id: string) => {
    setTerms((prev) => prev.filter((term) => term.id !== id))
  }

  const handleAddStudent = (studentData) => {
    const newStudent = {
      ...studentData,
      id: Math.max(...staffData.map((s) => s.id)) + 1,
      currentStatus: "expected",
      todayActual: null,
      clockEntries: [],
      assignedLocation: undefined,
    }
    setStaffData((prev) => [...prev, newStudent])
  }

  const handleEditStudent = (id: number, studentData) => {
    setStaffData((prev) => prev.map((staff) => (staff.id === id ? { ...staff, ...studentData } : staff)))
  }

  const handleDeleteStudent = (id: number) => {
    setStaffData((prev) => prev.filter((staff) => staff.id !== id))
    if (selectedStaff?.id === id) {
      setSelectedStaff(null)
    }
  }

  const currentTerm = getCurrentTerm(terms, selectedTerm)
  const termWeekdays = getTermWeekdays(currentTerm)
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
    const termStatus = getTermStatus(currentTerm)

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

  const getDefaultDateForTerm = () => {
    const today = new Date()
    const termStatus = getTermStatus(currentTerm)

    if (termStatus.status === "current") {
      const todayInTerm = termWeekdays.find((date) => date.toDateString() === today.toDateString())
      return todayInTerm || termWeekdays[0]
    } else if (termStatus.status === "past") {
      return termWeekdays[termWeekdays.length - 1]
    } else {
      return termWeekdays[0]
    }
  }

  useEffect(() => {
    if (termWeekdays.length > 0) {
      setSelectedDate(getDefaultDateForTerm())
      setDateError("")
    }
  }, [selectedTerm])

  const stats = getWeeklyStats(staffData)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar
        currentTime={currentTime}
        onLogout={handleLogout}
        onManageTerms={() => setShowTermManager(true)}
        onManageStudents={() => setShowStudentManager(true)}
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
          getTermStatus={() => getTermStatus(currentTerm)}
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
              currentTerm={currentTerm}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <TermAnalytics
              staffData={staffData}
              selectedTerm={selectedTerm}
              termStartDate={currentTerm.startDate}
              termEndDate={currentTerm.endDate}
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

        {showTermManager && (
          <TermManager
            terms={terms}
            onAddTerm={handleAddTerm}
            onEditTerm={handleEditTerm}
            onDeleteTerm={handleDeleteTerm}
            onClose={() => setShowTermManager(false)}
          />
        )}

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
    </div>
  )
}

