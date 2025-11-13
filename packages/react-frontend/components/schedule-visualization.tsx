"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import type { Student, Term, Schedule } from "@/lib/api"
import { api } from "@/lib/api"
import { parseDateString } from "@/lib/utils"

interface ScheduleVisualizationProps {
  students: Student[]
  terms: Term[]
  schedules: Record<string, Schedule>
  onBack: () => void
}

type ViewMode = "day" | "week"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const HOURS = Array.from({ length: 9 }, (_, i) => i + 8) // 8 AM to 5 PM

interface TermInfo {
  term: Term
  isDayOff: boolean
  dayOffNotes?: string[]
}

export function ScheduleVisualization({
  students,
  terms,
  schedules: initialSchedules,
  onBack,
}: ScheduleVisualizationProps) {
  const [schedules, setSchedules] = useState<Record<string, Record<string, Schedule>>>({}) // termId -> studentId -> Schedule
  const [viewMode, setViewMode] = useState<ViewMode>("day")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)

  // Fetch schedules for all terms
  useEffect(() => {
    const fetchAllSchedules = async () => {
      setIsLoading(true)
      const schedulesData: Record<string, Record<string, Schedule>> = {}

      await Promise.all(
        terms.map(async (term) => {
          schedulesData[term.id] = {}
          await Promise.all(
            students.map(async (student) => {
              try {
                const schedule = await api.schedules.get(student.id, term.id)
                if (schedule) {
                  schedulesData[term.id][student.id] = schedule
                }
              } catch (error) {
                // Student might not have a schedule, that's okay
              }
            })
          )
        })
      )

      setSchedules(schedulesData)
      setIsLoading(false)
    }

    if (terms.length > 0) {
      fetchAllSchedules()
    }
  }, [terms, students])

  // Get all terms that apply to a specific date
  const getTermsForDate = (date: Date): TermInfo[] => {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    
    const result: TermInfo[] = []
    
    for (const term of terms) {
      const termStart = parseDateString(term.startDate)
      const termEnd = parseDateString(term.endDate)
      termStart.setHours(0, 0, 0, 0)
      termEnd.setHours(23, 59, 59, 999)
      
      const isInTerm = checkDate >= termStart && checkDate <= termEnd
      
      if (!isInTerm) continue
      
      // Check if this date is a day off for this term and get notes
      let isDayOff = false
      const dayOffNotes: string[] = []
      if (term.daysOff && term.daysOff.length > 0) {
        term.daysOff.forEach((range) => {
          const rangeStart = new Date(range.startDate)
          const rangeEnd = new Date(range.endDate)
          rangeStart.setHours(0, 0, 0, 0)
          rangeEnd.setHours(23, 59, 59, 999)
          if (checkDate >= rangeStart && checkDate <= rangeEnd) {
            isDayOff = true
            if (range.notes) {
              dayOffNotes.push(range.notes)
            }
          }
        })
      }
      
      result.push({ 
        term, 
        isDayOff, 
        dayOffNotes: dayOffNotes.length > 0 ? dayOffNotes : undefined 
      })
    }
    
    // Sort by: breaks/subterms first (shorter duration), then by start date
    return result.sort((a, b) => {
      const aDuration = parseDateString(a.term.endDate).getTime() - parseDateString(a.term.startDate).getTime()
      const bDuration = parseDateString(b.term.endDate).getTime() - parseDateString(b.term.startDate).getTime()
      if (aDuration !== bDuration) {
        return aDuration - bDuration // Shorter terms (breaks) first
      }
      return parseDateString(a.term.startDate).getTime() - parseDateString(b.term.startDate).getTime()
    })
  }

  // Check if a date has any active terms
  const hasActiveTerms = (date: Date): boolean => {
    return getTermsForDate(date).length > 0
  }

  // Get merged schedules for a date (combine schedules from all applicable terms)
  // Prioritizes schedules from terms that are NOT marked as day off
  const getMergedSchedulesForDate = (date: Date): { schedules: Record<string, Schedule>, hasActiveSchedules: boolean } => {
    const applicableTerms = getTermsForDate(date)
    const mergedSchedules: Record<string, Schedule> = {}
    
    // First, merge schedules from terms that are NOT day off (active schedules take priority)
    const activeTerms = applicableTerms.filter(({ isDayOff }) => !isDayOff)
    // Iterate in reverse so breaks/subterms (shorter terms) override main terms
    for (let i = activeTerms.length - 1; i >= 0; i--) {
      const { term } = activeTerms[i]
      const termSchedules = schedules[term.id] || {}
      Object.keys(termSchedules).forEach((studentId) => {
        mergedSchedules[studentId] = termSchedules[studentId]
      })
    }
    
    const hasActiveSchedules = Object.keys(mergedSchedules).length > 0
    
    return { schedules: mergedSchedules, hasActiveSchedules }
  }

  // Parse time string to minutes from midnight
  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0

    const upperTime = timeStr.toUpperCase().trim()
    const hasAM = upperTime.includes("AM")
    const hasPM = upperTime.includes("PM")

    const timeWithoutPeriod = timeStr.replace(/\s*(AM|PM)\s*/gi, "").trim()

    let hours: number
    let minutes: number

    if (timeWithoutPeriod.includes(":")) {
      const parts = timeWithoutPeriod.split(":")
      hours = parseInt(parts[0], 10)
      minutes = parseInt(parts[1] || "0", 10)
    } else {
      hours = parseInt(timeWithoutPeriod, 10)
      minutes = 0
    }

    if (isNaN(hours) || isNaN(minutes)) return 0

    if (hasAM || hasPM) {
      if (hours === 12 && hasAM) {
        hours = 0
      } else if (hours !== 12 && hasPM) {
        hours += 12
      }
    }

    return hours * 60 + minutes
  }

  // Check if a student is available at a specific hour on a specific day
  const isAvailableAtHour = (student: Student, day: typeof DAYS[number], hour: number, dateSchedules: Record<string, Schedule>): boolean => {
    const schedule = dateSchedules[student.id]
    if (!schedule || !schedule.availability) return false

    const daySchedule = schedule.availability[day]
    if (!daySchedule || daySchedule.length === 0) return false

    const hourStartMinutes = hour * 60
    const hourEndMinutes = (hour + 1) * 60

    return daySchedule.some((block) => {
      const [startStr, endStr] = block.split("-").map((s) => s.trim())
      if (!startStr) return false

      const startMinutes = parseTime(startStr)
      const endMinutes = endStr ? parseTime(endStr) : startMinutes + 240 // Default 4 hours

      return startMinutes < hourEndMinutes && endMinutes > hourStartMinutes
    })
  }

  // Get all students available at a specific hour on a specific day
  const getStudentsAtHour = (day: typeof DAYS[number], hour: number, dateSchedules: Record<string, Schedule>): Student[] => {
    return students.filter((student) => isAvailableAtHour(student, day, hour, dateSchedules))
  }

  // Format hour for display (condensed format)
  const formatHour = (hour: number): string => {
    if (hour === 0) return "12a"
    if (hour < 12) return `${hour}a`
    if (hour === 12) return "12p"
    return `${hour - 12}p`
  }

  // Get week dates (Monday-Friday of the week containing currentDate)
  const getWeekDates = (): Date[] => {
    const dates: Date[] = []
    const date = new Date(currentDate)
    const currentDay = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Find Monday of the current week
    // If it's Sunday (0), go back 6 days; if it's Monday (1), go back 0 days; etc.
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay
    const monday = new Date(date)
    monday.setDate(date.getDate() + daysToMonday)
    monday.setHours(0, 0, 0, 0)
    
    // Generate Monday through Friday
    for (let i = 0; i < 5; i++) {
      const dayDate = new Date(monday)
      dayDate.setDate(monday.getDate() + i)
      dates.push(dayDate)
    }
    
    return dates
  }

  // Navigate dates
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  // Get day name from date
  const getDayName = (date: Date): typeof DAYS[number] | null => {
    const day = date.getDay()
    const dayMap: Record<number, typeof DAYS[number] | null> = {
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      0: null,
      6: null,
    }
    return dayMap[day] || null
  }

  // Render Day View
  const renderDayView = () => {
    const dayName = getDayName(currentDate)
    if (!dayName) {
      return (
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No schedule data for weekends</p>
          </CardContent>
        </Card>
      )
    }

    const termsForDate = getTermsForDate(currentDate)
    const { schedules: dateSchedules, hasActiveSchedules } = getMergedSchedulesForDate(currentDate)
    const hasAnyDayOff = termsForDate.some(({ isDayOff }) => isDayOff)
    const hasAnyActiveTerm = termsForDate.length > 0
    const shouldShowDayOff = hasAnyDayOff && !hasActiveSchedules

    return (
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-wrap text-foreground">
            <Clock className="w-5 h-5" />
            {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            {termsForDate.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {termsForDate.map(({ term, isDayOff }) => (
                    <Badge 
                      key={term.id}
                      variant="outline" 
                      className={
                        isDayOff
                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-300 dark:border-orange-700"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                      }
                      title={term.name}
                    >
                      {term.name}{isDayOff ? " - Off" : ""}
                    </Badge>
                  ))}
                </div>
                {termsForDate.some(({ dayOffNotes }) => dayOffNotes && dayOffNotes.length > 0) && (
                  <div className="text-xs text-muted-foreground italic">
                    {termsForDate
                      .filter(({ dayOffNotes }) => dayOffNotes && dayOffNotes.length > 0)
                      .flatMap(({ dayOffNotes }) => dayOffNotes || [])
                      .join(" • ")}
                  </div>
                )}
              </div>
            )}
            {!hasAnyActiveTerm && (
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                No Active Terms
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shouldShowDayOff ? (
            <div className="p-12 text-center">
              <div className="text-orange-600 dark:text-orange-400 mb-2">
                <Calendar className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Day Off</h3>
              <p className="text-muted-foreground mb-4">No time tracking scheduled for this day.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {termsForDate.filter(({ isDayOff }) => isDayOff).map(({ term }) => (
                  <Badge key={term.id} variant="outline" className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">
                    {term.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : hasAnyActiveTerm && hasActiveSchedules ? (
            <div className="space-y-3">
              {HOURS.map((hour) => {
                const availableStudents = getStudentsAtHour(dayName, hour, dateSchedules)
                const studentLeads = availableStudents.filter(s => s.role === "Student Lead")
                const assistants = availableStudents.filter(s => s.role !== "Student Lead")
                const totalCount = availableStudents.length

                return (
                  <div
                    key={hour}
                    className={`border rounded-lg p-4 transition-all hover:shadow-sm ${
                      totalCount > 0
                        ? "bg-card"
                        : "bg-slate-50 dark:bg-slate-950/20"
                    }`}
                  >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="font-semibold text-base text-foreground font-mono">{formatHour(hour)}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {totalCount > 0 && (
                        <>
                          <Badge 
                            variant="outline" 
                            className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                          >
                            {studentLeads.length} {studentLeads.length === 1 ? "Lead" : "Leads"}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400"
                          >
                            {assistants.length} {assistants.length === 1 ? "Assistant" : "Assistants"}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  {totalCount > 0 ? (
                    <div className="space-y-2">
                      {studentLeads.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1.5">Student Leads</div>
                          <div className="flex flex-wrap gap-1.5 md:gap-2">
                            {studentLeads.map((student) => (
                              <Badge
                                key={student.id}
                                variant="outline"
                                className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs"
                              >
                                {student.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {assistants.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1.5">Assistants</div>
                          <div className="flex flex-wrap gap-1.5 md:gap-2">
                            {assistants.map((student) => (
                              <Badge
                                key={student.id}
                                variant="outline"
                                className="bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400 text-xs"
                              >
                                {student.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-muted-foreground/50 italic">No students scheduled</div>
                  )}
                </div>
              )
            })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Active Terms</h3>
              <p className="text-muted-foreground">This date is not within any term's date range.</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Render Week View
  const renderWeekView = () => {
    const weekDates = getWeekDates()

    return (
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="w-5 h-5" />
            Week of {weekDates[0].toLocaleDateString("en-US", { month: "long", day: "numeric" })} -{" "}
            {weekDates[4].toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[600px] md:min-w-full px-4 md:px-0">
              {/* Header */}
              <div className="grid grid-cols-6 gap-2 md:gap-3 mb-3 pb-3 border-b">
                <div className="font-semibold text-xs md:text-sm text-muted-foreground">Time</div>
                {weekDates.map((date, idx) => {
                  const termsForDate = getTermsForDate(date)
                  const hasAnyDayOff = termsForDate.some(({ isDayOff }) => isDayOff)
                  const hasAnyActiveTerm = termsForDate.length > 0
                  // Only show "Off" badge if no term already shows "- Off" in its badge label
                  // If any term has isDayOff=true, it will show "- Off" in its badge, so don't show separate "Off" badge
                  const showOffBadge = hasAnyDayOff && !termsForDate.some(({ isDayOff }) => isDayOff)
                  
                  return (
                    <div key={idx} className="font-semibold text-xs md:text-sm text-center text-foreground">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {DAY_LABELS[idx]}
                          {showOffBadge && (
                            <Badge variant="outline" className="text-[8px] md:text-[10px] px-1 py-0 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-300 dark:border-orange-700">
                              Off
                            </Badge>
                          )}
                          {!hasAnyActiveTerm && (
                            <Badge variant="outline" className="text-[8px] md:text-[10px] px-1 py-0 bg-muted text-muted-foreground">
                              Out
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                        {termsForDate.length > 0 && (
                          <div className="flex flex-col gap-1 items-center mt-1">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {termsForDate.map(({ term, isDayOff }) => (
                                <Badge 
                                  key={term.id}
                                  variant="outline" 
                                  className={`text-[8px] md:text-[10px] px-1 py-0 ${
                                    isDayOff
                                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-300 dark:border-orange-700"
                                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                                  }`}
                                  title={term.name}
                                >
                                  {term.name.length > 12 ? term.name.substring(0, 10) + "..." : term.name}
                                  {isDayOff && " - Off"}
                                </Badge>
                              ))}
                            </div>
                            {termsForDate.some(({ dayOffNotes }) => dayOffNotes && dayOffNotes.length > 0) && (
                              <div className="text-[8px] md:text-[9px] text-muted-foreground italic mt-0.5 max-w-full px-1">
                                {termsForDate
                                  .filter(({ dayOffNotes }) => dayOffNotes && dayOffNotes.length > 0)
                                  .flatMap(({ dayOffNotes }) => dayOffNotes || [])
                                  .join(" • ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Hour rows */}
              <div className="space-y-2">
                {HOURS.map((hour) => (
                  <div key={hour} className="grid grid-cols-6 gap-2 md:gap-3">
                    <div className="text-xs text-muted-foreground font-mono py-2 md:py-3 flex items-center font-medium">
                      {formatHour(hour)}
                    </div>
                    {weekDates.map((date, idx) => {
                      const dayName = DAYS[idx]
                      const termsForDate = getTermsForDate(date)
                      const { schedules: dateSchedules, hasActiveSchedules } = getMergedSchedulesForDate(date)
                      const hasAnyDayOff = termsForDate.some(({ isDayOff }) => isDayOff)
                      const hasAnyActiveTerm = termsForDate.length > 0
                      
                      // Always check for schedules first - prioritize active schedules over day-off status
                      // Only show "Day Off" if there are no active schedules AND at least one term is marked as day off
                      const availableStudents = hasAnyActiveTerm && hasActiveSchedules ? getStudentsAtHour(dayName, hour, dateSchedules) : []
                      const studentLeads = availableStudents.filter(s => s.role === "Student Lead")
                      const assistants = availableStudents.filter(s => s.role !== "Student Lead")
                      const totalCount = availableStudents.length
                      const shouldShowDayOff = hasAnyDayOff && !hasActiveSchedules

                      return (
                        <div
                          key={idx}
                          className={`border rounded-lg p-2 md:p-3 min-h-[60px] md:min-h-[70px] transition-all hover:shadow-sm ${
                            !hasAnyActiveTerm
                              ? "bg-muted/30 border-muted"
                              : shouldShowDayOff
                              ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                              : totalCount > 0
                              ? "bg-card"
                              : "bg-slate-50 dark:bg-slate-950/20"
                          }`}
                        >
                          {!hasAnyActiveTerm ? (
                            <div className="text-[10px] md:text-xs text-muted-foreground italic flex items-center h-full justify-center text-center">
                              Outside Term
                            </div>
                          ) : shouldShowDayOff ? (
                            <div className="space-y-1">
                              <div className="text-[10px] md:text-xs text-orange-700 dark:text-orange-400 italic flex items-center justify-center text-center font-medium">
                                Day Off
                              </div>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {termsForDate.filter(({ isDayOff }) => isDayOff).map(({ term }) => (
                                  <Badge 
                                    key={term.id}
                                    variant="outline" 
                                    className="text-[8px] md:text-[10px] px-1 py-0 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400"
                                  >
                                    {term.name.length > 8 ? term.name.substring(0, 6) + "..." : term.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : totalCount > 0 ? (
                            <div className="space-y-1.5 md:space-y-2">
                              <div className="space-y-1">
                                {studentLeads.length > 0 && (
                                  <div className="flex items-center gap-1 md:gap-1.5">
                                    <Badge variant="outline" className="text-[10px] md:text-xs py-0.5 px-1.5 md:px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-semibold">
                                      {studentLeads.length}
                                    </Badge>
                                    <span className="text-[10px] md:text-xs font-medium text-blue-700 dark:text-blue-400">Lead{studentLeads.length !== 1 ? 's' : ''}</span>
                                  </div>
                                )}
                                {assistants.length > 0 && (
                                  <div className="flex items-center gap-1 md:gap-1.5">
                                    <Badge variant="outline" className="text-[10px] md:text-xs py-0.5 px-1.5 md:px-2 bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400 font-semibold">
                                      {assistants.length}
                                    </Badge>
                                    <span className="text-[10px] md:text-xs font-medium text-slate-700 dark:text-slate-400">Assistant{assistants.length !== 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 md:gap-1.5 pt-0.5 md:pt-1">
                                {availableStudents.slice(0, 2).map((student) => (
                                  <Badge
                                    key={student.id}
                                    variant="outline"
                                    className={`text-[10px] md:text-xs py-0.5 px-1.5 md:px-2 ${
                                      student.role === "Student Lead"
                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                                        : "bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400"
                                    }`}
                                  >
                                    {student.name.split(" ")[0]}
                                  </Badge>
                                ))}
                                {totalCount > 2 && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Badge 
                                        variant="outline" 
                                        className="text-[10px] md:text-xs py-0.5 px-1.5 md:px-2 bg-slate-100 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                      >
                                        +{totalCount - 2}
                                      </Badge>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3" align="start">
                                      <div className="space-y-3">
                                        <div className="text-xs font-semibold text-muted-foreground">
                                          All Students ({totalCount})
                                        </div>
                                        {studentLeads.length > 0 && (
                                          <div>
                                            <div className="text-[10px] font-semibold text-muted-foreground mb-1.5">Student Leads</div>
                                            <div className="flex flex-wrap gap-1.5">
                                              {studentLeads.map((student) => (
                                                <Badge
                                                  key={student.id}
                                                  variant="outline"
                                                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs"
                                                >
                                                  {student.name}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {assistants.length > 0 && (
                                          <div>
                                            <div className="text-[10px] font-semibold text-muted-foreground mb-1.5">Assistants</div>
                                            <div className="flex flex-wrap gap-1.5">
                                              {assistants.map((student) => (
                                                <Badge
                                                  key={student.id}
                                                  variant="outline"
                                                  className="bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400 text-xs"
                                                >
                                                  {student.name}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] md:text-xs text-muted-foreground/50 italic flex items-center h-full">
                              —
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="p-2 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Schedule Visualization</h2>
            <p className="text-sm sm:text-base text-muted-foreground">View who is active at each hour</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
                className="flex-1 md:flex-none md:min-w-[80px]"
              >
                Day
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
                className="flex-1 md:flex-none md:min-w-[80px]"
              >
                Week
              </Button>
            </div>

            <div className="flex items-center gap-2 md:border-l md:pl-6 md:ml-auto">
              <Button variant="outline" size="sm" onClick={() => navigateDate("prev")} className="flex-1 md:flex-none">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="flex-1 md:flex-none">
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate("next")} className="flex-1 md:flex-none">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Content */}
      {isLoading ? (
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading schedules...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "day" && renderDayView()}
          {viewMode === "week" && renderWeekView()}
        </>
      )}
    </div>
  )
}

