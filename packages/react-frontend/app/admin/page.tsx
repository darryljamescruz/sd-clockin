"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Navbar } from "@/components/navbar"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { IndividualRecords } from "@/components/individual-records"
import { TermAnalytics } from "@/components/term-analytics"
import { TermOverview } from "@/components/term-overview"
import { api, type Student, type Term } from "@/lib/api"

export default function AdminDashboard() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateError, setDateError] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedStaff, setSelectedStaff] = useState(null)

  // Data state
  const [terms, setTerms] = useState<Term[]>([])
  const [staffData, setStaffData] = useState<Student[]>([])
  const [selectedTerm, setSelectedTerm] = useState("")

  // Loading and error states
  const [isLoadingTerms, setIsLoadingTerms] = useState(true)
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [error, setError] = useState("")

  // Fetch terms on component mount
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoadingTerms(true)
        const fetchedTerms = await api.terms.getAll()
        setTerms(fetchedTerms)

        // Set the first active term or the first term as selected
        const activeTerm = fetchedTerms.find((t) => t.isActive)
        if (activeTerm) {
          setSelectedTerm(activeTerm.name)
        } else if (fetchedTerms.length > 0) {
          setSelectedTerm(fetchedTerms[0].name)
        }
      } catch (err) {
        console.error("Error fetching terms:", err)
        setError("Failed to load terms. Please refresh the page.")
      } finally {
        setIsLoadingTerms(false)
      }
    }

    fetchTerms()
  }, [])

  // Fetch students when selected term changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedTerm) return

      try {
        setIsLoadingStudents(true)
        const currentTerm = terms.find((t) => t.name === selectedTerm)
        if (currentTerm) {
          const fetchedStudents = await api.students.getAll(currentTerm.id)
          setStaffData(fetchedStudents)
        }
      } catch (err) {
        console.error("Error fetching students:", err)
        setError("Failed to load student data. Please refresh the page.")
      } finally {
        setIsLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [selectedTerm, terms])

  // Update clock every second
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
  const isLoading = isLoadingTerms || isLoadingStudents

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar
        currentTime={currentTime}
        onLogout={handleLogout}
        onManageTerms={handleManageTerms}
        onManageStudents={handleManageStudents}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Loading State */}
        {isLoading && (
          <Card className="mb-6 bg-blue-50 border-blue-200 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-800 font-medium">Loading data...</span>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="mb-6 bg-red-50 border-red-200 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{error}</span>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
