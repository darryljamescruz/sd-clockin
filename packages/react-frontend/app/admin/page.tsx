"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { HourlyDashboard } from "@/components/hourly-dashboard"
import { api, type Student, type Term } from "@/lib/api"
import { parseDateString } from "@/lib/utils"

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateError, setDateError] = useState("")

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
        
        // Set selected date to today if it's within the term
        if (fetchedTerms.length > 0) {
          const termToUse = activeTerm || fetchedTerms[0]
          const termStart = parseDateString(termToUse.startDate)
          const termEnd = parseDateString(termToUse.endDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          if (today >= termStart && today <= termEnd) {
            setSelectedDate(today)
          }
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


  const getWeeklyStats = () => {
    const totalStaff = staffData.length
    const presentStaff = staffData.filter((s) => s.currentStatus === "present").length
    const lateToday = staffData.filter((s) => {
      if (!s.todayActual) return false
      const expected = new Date(`2000-01-01 ${getExpectedStartTime(s)}`)
      const actual = new Date(`2000-01-01 ${s.todayActual}`)
      return actual > expected
    }).length
    // Count student leads who are actively present
    const studentLeadsPresent = staffData.filter((s) => s.role === "Student Lead" && s.currentStatus === "present").length

    return { totalStaff, presentStaff, lateToday, studentLeadsPresent }
  }

  const getCurrentTerm = () => {
    return terms.find((term) => term.name === selectedTerm) || terms[0]
  }

  const getTodaySchedule = (staff: Student, date = new Date()) => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const
    const dayName = dayNames[date.getDay()] as keyof NonNullable<Student["weeklySchedule"]>
    return staff.weeklySchedule?.[dayName] || []
  }

  const getExpectedStartTime = (staff: Student, date = new Date()) => {
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
    
    // Return empty array if no term is available yet
    if (!currentTerm || !currentTerm.startDate || !currentTerm.endDate) {
      return []
    }
    
    const start = parseDateString(currentTerm.startDate)
    const end = parseDateString(currentTerm.endDate)
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
    today.setHours(0, 0, 0, 0) // Set to midnight for date-only comparison
    const currentTerm = getCurrentTerm()
    const startDate = parseDateString(currentTerm.startDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = parseDateString(currentTerm.endDate)
    endDate.setHours(23, 59, 59, 999) // Set to end of day for inclusive comparison

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
    <>
      {/* Loading State */}
      {isLoading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800 font-medium">Loading data...</span>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="bg-red-50 border-red-200">
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
            studentLeadsPresent={stats.studentLeadsPresent}
            lateToday={stats.lateToday}
          />

          {dateError && (
            <Card className="bg-red-50 border-red-200">
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

          <HourlyDashboard
            staffData={staffData}
            selectedDate={selectedDate}
          />
        </>
      )}
    </>
  )
}
