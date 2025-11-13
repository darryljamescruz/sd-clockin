"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

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

  // Helper function to check if a date is a day off
  const isDayOff = (date: Date): boolean => {
    const currentTerm = getCurrentTerm()
    if (!currentTerm || !currentTerm.daysOff || currentTerm.daysOff.length === 0) {
      return false
    }

    const dateStr = date.toISOString().split('T')[0]
    
    return currentTerm.daysOff.some((range) => {
      const rangeStart = new Date(range.startDate)
      const rangeEnd = new Date(range.endDate)
      const checkDate = new Date(dateStr)
      
      // Set to midnight for accurate comparison
      rangeStart.setHours(0, 0, 0, 0)
      rangeEnd.setHours(23, 59, 59, 999)
      checkDate.setHours(0, 0, 0, 0)
      
      return checkDate >= rangeStart && checkDate <= rangeEnd
    })
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
      // Only include weekdays (Monday-Friday) and exclude days off
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isDayOff(current)) {
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
    today.setHours(0, 0, 0, 0)
    const termStatus = getTermStatus()

    if (termStatus.status === "future") {
      setDateError("Cannot view today's attendance for a future term. This term hasn't started yet.")
      setTimeout(() => setDateError(""), 5000)
      return
    }

    // Check if today is a day off
    if (isDayOff(today)) {
      // Find the next available weekday after today
      const nextDay = new Date(today)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextAvailableDay = termWeekdays.find((date) => {
        const dateStr = date.toDateString()
        return dateStr >= today.toDateString()
      })
      
      if (nextAvailableDay) {
        setSelectedDate(nextAvailableDay)
        setDateError("Today is a day off. Showing the next available day.")
        setTimeout(() => setDateError(""), 5000)
      } else {
        // If no future days, go to the last available day
        if (termWeekdays.length > 0) {
          setSelectedDate(termWeekdays[termWeekdays.length - 1])
          setDateError("Today is a day off and there are no future days in this term.")
          setTimeout(() => setDateError(""), 5000)
        }
      }
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
    
    // If no term is available, return current to avoid disabling the button
    if (!currentTerm || !currentTerm.startDate || !currentTerm.endDate) {
      return { status: "current" }
    }
    
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
    <div className="w-full max-w-full overflow-x-hidden min-w-0">
      {/* Loading State */}
      {isLoading && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 w-full max-w-full">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
            <span className="text-sm sm:text-base text-blue-800 dark:text-blue-300 font-medium">Loading data...</span>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 w-full max-w-full">
          <CardContent className="p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-sm sm:text-base text-red-800 dark:text-red-300 font-medium break-words">{error}</span>
          </CardContent>
        </Card>
      )}

      {!isLoadingTerms && !error && (
        <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 min-w-0">
          {isLoadingStudents ? (
            <>
              {/* Stats Cards Skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 w-full max-w-full min-w-0">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Skeleton className="h-7 sm:h-8 w-16 mb-2" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Dashboard Header Skeleton */}
              <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-10 w-24 ml-auto" />
                  </div>
                </CardContent>
              </Card>

              {/* Hourly Dashboard Skeleton */}
              <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
                <CardContent className="p-0 sm:p-6 w-full max-w-full overflow-x-hidden min-w-0">
                  <div className="space-y-4 sm:space-y-6">
                    {[1, 2, 3].map((hour) => (
                      <div key={hour} className="border-b last:border-b-0 pb-4 sm:pb-6 last:pb-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-4 sm:px-0">
                          <Skeleton className="h-6 w-20" />
                          <div className="hidden sm:block flex-1 border-t border-dashed border-muted-foreground/30" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
                          <div className="px-4 sm:px-0 min-w-[900px]">
                            <div className="space-y-2">
                              <Skeleton className="h-10 w-full" />
                              {[1, 2, 3].map((row) => (
                                <Skeleton key={row} className="h-12 w-full" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <StatsCards
                totalStaff={stats.totalStaff}
                presentStaff={stats.presentStaff}
                studentLeadsPresent={stats.studentLeadsPresent}
                lateToday={stats.lateToday}
              />

              {dateError && (
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 w-full max-w-full">
                  <CardContent className="p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-3">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="text-sm sm:text-base text-red-800 dark:text-red-300 font-medium break-words">{dateError}</span>
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
        </div>
      )}
    </div>
  )
}
