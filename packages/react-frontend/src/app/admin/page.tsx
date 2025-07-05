"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"

import { StatsCards } from "@/components/stats-cards"
import { TermSelector } from "@/components/term-selector"
import { TermOverview } from "@/components/term-overview"
import { TermAnalytics } from "@/components/term-analytics"
import { IndividualRecords } from "@/components/individual-records"
import { TermManager } from "@/components/term-manager"
import { StudentManager } from "@/components/student-manager"

// TODO: Move this to a shared data file or fetch from backend
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
  {
    id: "4",
    name: "Thanksgiving Break 2025",
    startDate: "2025-11-25",
    endDate: "2025-11-29",
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
  // Add more staff data here...
]

export default function AdminDashboard() {
  const [showTermManager, setShowTermManager] = useState(false)
  const [showStudentManager, setShowStudentManager] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateError, setDateError] = useState("")
  const [terms, setTerms] = useState(initialTerms)
  const [staffData, setStaffData] = useState(initialStaffData)
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedStaff, setSelectedStaff] = useState(null)

  // Function to determine the default term based on current date
  const getDefaultTerm = () => {
    const today = new Date()
    
    // First, try to find a term that contains today's date
    const currentTerm = terms.find(term => {
      const start = new Date(term.startDate)
      const end = new Date(term.endDate)
      return today >= start && today <= end
    })
    
    if (currentTerm) {
      return currentTerm.name
    }
    
    // If no current term, find the closest future term
    const futureTerms = terms.filter(term => {
      const start = new Date(term.startDate)
      return today < start
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    
    if (futureTerms.length > 0) {
      return futureTerms[0].name
    }
    
    // If no future terms, find the most recent past term
    const pastTerms = terms.filter(term => {
      const end = new Date(term.endDate)
      return today > end
    }).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    
    if (pastTerms.length > 0) {
      return pastTerms[0].name
    }
    
    // Fallback to first term
    return terms.length > 0 ? terms[0].name : ""
  }

  // Set default term when component mounts or terms change
  useEffect(() => {
    if (terms.length > 0 && !selectedTerm) {
      const defaultTerm = getDefaultTerm()
      setSelectedTerm(defaultTerm)
    }
  }, [terms, selectedTerm])

  // Get current term data
  const getCurrentTerm = () => {
    return terms.find((term) => term.name === selectedTerm) || terms[0]
  }

  // Get weekly stats
  const getWeeklyStats = () => {
    const totalStaff = staffData.length
    const presentStaff = staffData.filter((s) => s.currentStatus === "present").length
    const lateToday = staffData.filter((s) => {
      if (!s.todayActual) return false
      // Add your late detection logic here
      return false
    }).length
    const studentLeads = staffData.filter((s) => s.role === "Student Lead").length

    return { totalStaff, presentStaff, lateToday, studentLeads }
  }

  // Get all weekdays in the current term
  const getTermWeekdays = () => {
    const weekdays = []
    const currentTerm = getCurrentTerm()
    if (!currentTerm) return weekdays
    
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

  // Get default date for the selected term
  const getDefaultDateForTerm = () => {
    const today = new Date()
    const currentTerm = getCurrentTerm()
    if (!currentTerm) return today
    
    const termStart = new Date(currentTerm.startDate)
    const termEnd = new Date(currentTerm.endDate)
    
    // If today is within the term, use today
    if (today >= termStart && today <= termEnd) {
      return today
    }
    
    // If term is in the future, use first day of term
    if (today < termStart) {
      return termStart
    }
    
    // If term is in the past, use last day of term
    return termEnd
  }

  // Update selected date when term changes
  useEffect(() => {
    if (selectedTerm) {
      const defaultDate = getDefaultDateForTerm()
      setSelectedDate(defaultDate)
      setDateError("")
    }
  }, [selectedTerm])

  // Term management handlers
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

  // Student management handlers
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
    if (selectedStaff?.id === id) {
      setSelectedStaff(null)
    }
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
    const currentTerm = getCurrentTerm()
    if (!currentTerm) return
    
    const termStart = new Date(currentTerm.startDate)
    const termEnd = new Date(currentTerm.endDate)
    
    if (today >= termStart && today <= termEnd) {
      // Today is within the term
      const todayInTerm = termWeekdays.find((date) => date.toDateString() === today.toDateString())
      if (todayInTerm) {
        setSelectedDate(todayInTerm)
        setDateError("")
      } else {
        setDateError("Today is not a scheduled weekday.")
        setTimeout(() => setDateError(""), 5000)
      }
    } else if (today < termStart) {
      setDateError("Today is before the selected term starts.")
      setTimeout(() => setDateError(""), 5000)
    } else {
      setDateError("Today is after the selected term ends.")
      setTimeout(() => setDateError(""), 5000)
    }
  }

  const stats = getWeeklyStats()

  // Don't render until we have a selected term
  if (!selectedTerm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <StatsCards
        totalStaff={stats.totalStaff}
        presentStaff={stats.presentStaff}
        studentLeads={stats.studentLeads}
        lateToday={stats.lateToday}
      />

      {/* Error Message */}
      {dateError && (
        <Card className="mb-6 bg-red-50 border-red-200 shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{dateError}</span>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Attendance Dashboard</h2>
        <div className="flex items-center gap-4">
          <TermSelector terms={terms} selectedTerm={selectedTerm} onTermChange={setSelectedTerm} />

          {/* Day Navigation */}
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousDay}
              disabled={currentDateIndex <= 0}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-sm font-medium text-slate-900 min-w-[120px] text-center">
              {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextDay}
              disabled={currentDateIndex >= termWeekdays.length - 1}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={goToToday} className="ml-2 h-7 text-xs">
              Today
            </Button>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
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

      {/* Term Manager Modal */}
      {showTermManager && (
        <TermManager
          terms={terms}
          onAddTerm={handleAddTerm}
          onEditTerm={handleEditTerm}
          onDeleteTerm={handleDeleteTerm}
          onClose={() => setShowTermManager(false)}
        />
      )}

      {/* Student Manager Modal */}
      {showStudentManager && (
        <StudentManager
          staffData={staffData}
          onAddStudent={handleAddStudent}
          onEditStudent={handleEditStudent}
          onDeleteStudent={handleDeleteStudent}
          onClose={() => setShowStudentManager(false)}
        />
      )}
    </>
  )
}
