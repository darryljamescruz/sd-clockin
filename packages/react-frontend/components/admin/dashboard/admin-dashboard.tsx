"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

import { DashboardHeader } from "@/components/admin/dashboard/dashboard-header"
import { HourlyDashboard } from "@/components/admin/dashboard/hourly-dashboard"
import { HourlyStaffingChart } from "@/components/admin/analytics/hourly-staffing-chart"
import { api, type Student, type Term } from "@/lib/api"
import { parseDateString } from "@/lib/utils"

interface AdminDashboardProps {
  initialTerms: Term[]
  initialStudents: Student[]
  initialSelectedTerm: string
}

export function AdminDashboard({
  initialTerms,
  initialStudents,
  initialSelectedTerm,
}: AdminDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateError, setDateError] = useState("")

  // Data state - initialized with server-fetched data
  const [terms] = useState<Term[]>(initialTerms)
  const [staffData, setStaffData] = useState<Student[]>(initialStudents)
  const [selectedTerm, setSelectedTerm] = useState(initialSelectedTerm)

  // Loading and error states
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [error, setError] = useState("")

  // Set initial date to today if within term
  useEffect(() => {
    if (terms.length > 0) {
      const currentTerm = terms.find((t) => t.name === selectedTerm) || terms[0]
      if (currentTerm) {
        const termStart = parseDateString(currentTerm.startDate)
        const termEnd = parseDateString(currentTerm.endDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (today >= termStart && today <= termEnd) {
          setSelectedDate(today)
        }
      }
    }
  }, []) // Only on mount

  // Fetch students when selected term changes 
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedTerm) return

      // Skip if this is the initial term (data already fetched server-side)
      if (selectedTerm === initialSelectedTerm && staffData.length > 0) return

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
  }, [selectedTerm, terms, initialSelectedTerm])

  const getCurrentTerm = () => {
    return terms.find((term) => term.name === selectedTerm) || terms[0]
  }

  // Helper function to check if a date is a day off
  const isDayOff = (date: Date): boolean => {
    const currentTerm = getCurrentTerm()
    if (!currentTerm || !currentTerm.daysOff || currentTerm.daysOff.length === 0) {
      return false
    }

    const dateStr = date.toISOString().split("T")[0]

    return currentTerm.daysOff.some((range) => {
      const rangeStart = new Date(range.startDate)
      const rangeEnd = new Date(range.endDate)
      const checkDate = new Date(dateStr)

      rangeStart.setHours(0, 0, 0, 0)
      rangeEnd.setHours(23, 59, 59, 999)
      checkDate.setHours(0, 0, 0, 0)

      return checkDate >= rangeStart && checkDate <= rangeEnd
    })
  }

  const getTermWeekdays = () => {
    const weekdays = []
    const currentTerm = getCurrentTerm()

    if (!currentTerm || !currentTerm.startDate || !currentTerm.endDate) {
      return []
    }

    const start = parseDateString(currentTerm.startDate)
    const end = parseDateString(currentTerm.endDate)
    const current = new Date(start)

    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isDayOff(current)) {
        weekdays.push(new Date(current))
      }
      current.setDate(current.getDate() + 1)
    }
    return weekdays
  }

  const termWeekdays = getTermWeekdays()
  const currentDateIndex = termWeekdays.findIndex(
    (date) => date.toDateString() === selectedDate.toDateString()
  )

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

  const getTermStatus = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentTerm = getCurrentTerm()

    if (!currentTerm || !currentTerm.startDate || !currentTerm.endDate) {
      return { status: "current" }
    }

    const startDate = parseDateString(currentTerm.startDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = parseDateString(currentTerm.endDate)
    endDate.setHours(23, 59, 59, 999)

    if (today < startDate) {
      return { status: "future" }
    } else if (today > endDate) {
      return { status: "past" }
    } else {
      return { status: "current" }
    }
  }

  const goToToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const termStatus = getTermStatus()

    if (termStatus.status === "future") {
      setDateError(
        "Cannot view today's attendance for a future term. This term hasn't started yet."
      )
      setTimeout(() => setDateError(""), 5000)
      return
    }

    if (isDayOff(today)) {
      const nextAvailableDay = termWeekdays.find((date) => {
        return date.toDateString() >= today.toDateString()
      })

      if (nextAvailableDay) {
        setSelectedDate(nextAvailableDay)
        setDateError("Today is a day off. Showing the next available day.")
        setTimeout(() => setDateError(""), 5000)
      } else if (termWeekdays.length > 0) {
        setSelectedDate(termWeekdays[termWeekdays.length - 1])
        setDateError("Today is a day off and there are no future days in this term.")
        setTimeout(() => setDateError(""), 5000)
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

  // Loading skeleton
  const LoadingSkeleton = () => (
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
  )

  if (error) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 w-full max-w-full">
        <CardContent className="p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-3">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-sm sm:text-base text-red-800 dark:text-red-300 font-medium break-words">
            {error}
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden min-w-0 relative">
      <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 min-w-0 relative">
        {isLoadingStudents ? (
          <>
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
            <LoadingSkeleton />
          </>
        ) : (
          <>
            {dateError && (
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 w-full max-w-full">
                <CardContent className="p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <span className="text-sm sm:text-base text-red-800 dark:text-red-300 font-medium break-words">
                    {dateError}
                  </span>
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

            <HourlyStaffingChart staffData={staffData} selectedDate={selectedDate} />

            <HourlyDashboard staffData={staffData} selectedDate={selectedDate} />
          </>
        )}
      </div>
    </div>
  )
}
