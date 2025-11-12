"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, UserCheck, Clock, TrendingUp, Calendar, BarChart3, Edit, Plus, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowUp } from "lucide-react"
import { type Student, api, type ClockEntry, type Term } from "@/lib/api"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { parseDateString } from "@/lib/utils"

interface IndividualRecordsProps {
  staffData: Student[]
  selectedStaff: Student | null
  onSelectStaff: (staff: Student) => void
  selectedTerm: string
  termStartDate: string
  termEndDate: string
  currentTerm?: Term
  onRefreshStudent?: (studentId: string) => Promise<void>
}

export function IndividualRecords({ staffData, selectedStaff, onSelectStaff, selectedTerm, termStartDate, termEndDate, currentTerm, onRefreshStudent }: IndividualRecordsProps) {
  
  // Helper function to check if a date is a day off
  const isDayOff = (date: Date): boolean => {
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
  const [editingEntry, setEditingEntry] = useState<{ entry: ClockEntry; index: number } | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editTimestamp, setEditTimestamp] = useState("")
  const [editType, setEditType] = useState<"in" | "out">("in")
  const [isSaving, setIsSaving] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  const [isWeeklyBreakdownOpen, setIsWeeklyBreakdownOpen] = useState(true)
  const [isDailyBreakdownOpen, setIsDailyBreakdownOpen] = useState(true)
  const [dailyViewMode, setDailyViewMode] = useState<"week" | "month">("week")
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  
  // Refs for scrolling
  const studentInfoRef = useRef<HTMLDivElement>(null)
  const searchSectionRef = useRef<HTMLDivElement>(null)

  // Reset week/month index when staff changes
  useEffect(() => {
    setCurrentWeekIndex(0)
    setCurrentMonthIndex(0)
  }, [selectedStaff?.id])

  // Scroll to student info when a student is selected
  useEffect(() => {
    if (selectedStaff && studentInfoRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        studentInfoRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 150)
    }
  }, [selectedStaff?.id])

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 400)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  // Helper functions
  const timeToMinutes = (timeStr: string) => {
    const [time, period] = timeStr.split(" ")
    const [hours, minutes] = time.split(":").map(Number)
    let totalMinutes = hours * 60 + minutes
    if (period === "PM" && hours !== 12) totalMinutes += 12 * 60
    else if (period === "AM" && hours === 12) totalMinutes -= 12 * 60
    return totalMinutes
  }

  const formatMinutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`
  }

  const normalizeTime = (timeStr: string) => {
    const upperTime = timeStr.toUpperCase()
    const hasMinutes = timeStr.includes(":")
    const hasAMPM = upperTime.includes("AM") || upperTime.includes("PM")
    
    if (hasAMPM) {
      let normalized = timeStr.replace(/([ap]m)/gi, (match) => ` ${match.toUpperCase()}`)
        .replace(/\s+/g, ' ')
      if (!hasMinutes) {
        normalized = normalized.replace(/\s(AM|PM)/, ':00 $1')
      }
      return normalized
    }
    
    // If no AM/PM, assume it's 24-hour format and convert to 12-hour
    const parts = timeStr.split(":")
    if (parts.length >= 1) {
      const hour = parseInt(parts[0], 10)
      const minute = parts[1] || "00"
      
      if (hour === 0) {
        return `12:${minute} AM`
      } else if (hour < 12) {
        return `${hour}:${minute} AM`
      } else if (hour === 12) {
        return `12:${minute} PM`
      } else {
        return `${hour - 12}:${minute} PM`
      }
    }
    
    return timeStr
  }

  const getWeekNumber = (date: Date) => {
    const startDate = parseDateString(termStartDate)
    const diffTime = date.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / 7) + 1
  }

  const getWeekdaysInRange = (startDate: Date, endDate: Date) => {
    const days = []
    const current = new Date(startDate)
    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days.push(new Date(current))
      }
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  const calculateExpectedHours = (staff: Student, startDate: Date, endDate: Date) => {
    const weekdays = getWeekdaysInRange(startDate, endDate)
    let totalMinutes = 0

    weekdays.forEach(day => {
      // Skip days off
      if (isDayOff(day)) return

      const dayNames: Array<keyof NonNullable<Student['weeklySchedule']> | null> = [null, "monday", "tuesday", "wednesday", "thursday", "friday", null]
      const dayName = dayNames[day.getDay()]
      if (!dayName) return

      const daySchedule = staff.weeklySchedule?.[dayName] || []
      daySchedule.forEach((shiftBlock: string) => {
        const [start, end] = shiftBlock.split("-")
        if (!start || !end) return

        const startTime = normalizeTime(start.trim())
        const endTime = normalizeTime(end.trim())
        const startMinutes = timeToMinutes(startTime)
        const endMinutes = timeToMinutes(endTime)
        totalMinutes += (endMinutes - startMinutes)
      })
    })

    return totalMinutes / 60 // Convert to hours
  }

  const calculateActualHours = (staff: Student, startDate: Date, endDate: Date) => {
    const clockIns = (staff.clockEntries || []).filter(e => e.type === "in")
    const clockOuts = (staff.clockEntries || []).filter(e => e.type === "out")
    
    let totalMinutes = 0
    clockIns.forEach(clockIn => {
      const inDate = new Date(clockIn.timestamp)
      if (inDate < startDate || inDate > endDate) return

      // Find matching clock-out
      const clockOut = clockOuts.find(out => {
        const outDate = new Date(out.timestamp)
        return outDate > inDate && outDate.toDateString() === inDate.toDateString()
      })

      if (clockOut) {
        const outDate = new Date(clockOut.timestamp)
        const diffMs = outDate.getTime() - inDate.getTime()
        totalMinutes += diffMs / (1000 * 60)
      }
    })

    return totalMinutes / 60 // Convert to hours
  }

  const calculatePunctuality = (staff: Student) => {
    const clockInEntries = (staff.clockEntries || []).filter(e => e.type === "in")
    const termStart = parseDateString(termStartDate)
    const termEnd = parseDateString(termEndDate)
    
    const relevantEntries = clockInEntries.filter(entry => {
      const date = new Date(entry.timestamp)
      return date >= termStart && date <= termEnd
    })

    if (relevantEntries.length === 0) return { onTime: 0, early: 0, late: 0, percentage: 0 }

    let onTimeCount = 0
    let earlyCount = 0
    let lateCount = 0

    relevantEntries.forEach(entry => {
      const entryDate = new Date(entry.timestamp)
      const dayNames: Array<keyof NonNullable<Student['weeklySchedule']> | null> = [null, "monday", "tuesday", "wednesday", "thursday", "friday", null]
      const dayName = dayNames[entryDate.getDay()]
      if (!dayName) return

      const daySchedule = staff.weeklySchedule?.[dayName] || []
      if (daySchedule.length === 0) return

      // Get first shift start time
      const firstShift = daySchedule[0]
      const startTime = normalizeTime(firstShift.split("-")[0].trim())
      const expectedMinutes = timeToMinutes(startTime)
      const actualMinutes = entryDate.getHours() * 60 + entryDate.getMinutes()
      const diffMinutes = actualMinutes - expectedMinutes

      if (diffMinutes < -10) earlyCount++
      else if (diffMinutes <= 10) onTimeCount++
      else lateCount++
    })

    return {
      onTime: onTimeCount,
      early: earlyCount,
      late: lateCount,
      percentage: relevantEntries.length > 0 ? Math.round(((onTimeCount + earlyCount) / relevantEntries.length) * 100) : 0
    }
  }

  const getWeeklyBreakdown = (staff: Student) => {
    const termStart = parseDateString(termStartDate)
    const termEnd = parseDateString(termEndDate)
    const weeks: Array<{
      weekNum: number
      startDate: Date
      endDate: Date
      expectedHours: number
      actualHours: number
      shifts: number
    }> = []

    let currentWeekStart = new Date(termStart)
    let weekNum = 1

    while (currentWeekStart <= termEnd) {
      const currentWeekEnd = new Date(currentWeekStart)
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6)
      const weekEndCapped = currentWeekEnd > termEnd ? termEnd : currentWeekEnd

      const expectedHours = calculateExpectedHours(staff, currentWeekStart, weekEndCapped)
      const actualHours = calculateActualHours(staff, currentWeekStart, weekEndCapped)
      
      const weekClockIns = (staff.clockEntries || []).filter(e => {
        const date = new Date(e.timestamp)
        return e.type === "in" && date >= currentWeekStart && date <= weekEndCapped
      })

      weeks.push({
        weekNum,
        startDate: new Date(currentWeekStart),
        endDate: new Date(weekEndCapped),
        expectedHours,
        actualHours,
        shifts: weekClockIns.length
      })

      currentWeekStart.setDate(currentWeekStart.getDate() + 7)
      weekNum++
    }

    return weeks
  }

  const groupDaysByWeek = (days: ReturnType<typeof getDailyBreakdown>) => {
    const weeks: Array<{
      weekNum: number
      days: Array<typeof days[0] | null>
    }> = []

    let currentWeek: typeof weeks[0] | null = null
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

    days.forEach(day => {
      const weekNum = getWeekNumber(day.date)
      
      if (!currentWeek || currentWeek.weekNum !== weekNum) {
        currentWeek = {
          weekNum,
          days: [null, null, null, null, null] // Monday-Friday slots
        }
        weeks.push(currentWeek)
      }

      const dayIndex = dayOrder.indexOf(day.dayName)
      if (dayIndex >= 0) {
        currentWeek.days[dayIndex] = day
      }
    })

    return weeks
  }

  const groupDaysByMonth = (days: ReturnType<typeof getDailyBreakdown>) => {
    const months: Array<{
      monthName: string
      monthYear: string
      days: Array<typeof days[0]>
      totalExpected: number
      totalActual: number
      calendarWeeks: Array<Array<typeof days[0] | null>>
    }> = []

    let currentMonth: typeof months[0] | null = null

    days.forEach(day => {
      const monthKey = day.date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      const monthName = day.date.toLocaleDateString("en-US", { month: "long" })
      const monthYear = day.date.toLocaleDateString("en-US", { year: "numeric" })
      
      if (!currentMonth || currentMonth.monthYear !== monthKey) {
        currentMonth = {
          monthName,
          monthYear: monthKey,
          days: [],
          totalExpected: 0,
          totalActual: 0,
          calendarWeeks: [],
        }
        months.push(currentMonth)
      }

      currentMonth.days.push(day)
      currentMonth.totalExpected += day.expectedHours
      currentMonth.totalActual += day.actualHours
    })

    // Build calendar weeks for each month
    months.forEach(month => {
      const weeks: Array<Array<typeof days[0] | null>> = []
      let currentWeek: Array<typeof days[0] | null> = [null, null, null, null, null] // Monday-Friday slots
      
      month.days.forEach(day => {
        const dayOfWeek = day.date.getDay()
        // Map: Monday=1, Tuesday=2, ..., Friday=5
        const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1 // Sunday becomes -1, but we skip weekends
        
        // If we hit a Monday (dayIndex === 0) and currentWeek has data, start a new week
        if (dayIndex === 0 && currentWeek.some(d => d !== null)) {
          weeks.push(currentWeek)
          currentWeek = [null, null, null, null, null]
        }
        
        // Only add weekdays (Monday-Friday)
        if (dayIndex >= 0 && dayIndex < 5) {
          currentWeek[dayIndex] = day
        }
      })
      
      // Add the last week if it has any data
      if (currentWeek.some(d => d !== null)) {
        weeks.push(currentWeek)
      }
      
      month.calendarWeeks = weeks
    })

    return months
  }

  const getDailyBreakdown = (staff: Student) => {
    const termStart = parseDateString(termStartDate)
    const termEnd = parseDateString(termEndDate)
    const days: Array<{
      date: Date
      dayName: string
      expectedStart: string | null
      expectedEnd: string | null
      actualStart: string | null
      actualEnd: string | null
      expectedHours: number
      actualHours: number
      status: string
      isDayOff: boolean
    }> = []

    const weekdays = getWeekdaysInRange(termStart, termEnd)
    
    weekdays.forEach(day => {
      const isOffDay = isDayOff(day)
      const dayNames: Array<keyof NonNullable<Student['weeklySchedule']> | null> = [null, "monday", "tuesday", "wednesday", "thursday", "friday", null]
      const dayName = dayNames[day.getDay()]
      if (!dayName) return

      const daySchedule = staff.weeklySchedule?.[dayName] || []
      const dayStr = day.toDateString()
      
      // Get expected times (first shift) - skip for days off
      let expectedStart: string | null = null
      let expectedEnd: string | null = null
      let expectedMinutes = 0
      
      if (!isOffDay && daySchedule.length > 0) {
        const firstShift = daySchedule[0]
        const [start, end] = firstShift.split("-")
        if (start && end) {
          expectedStart = normalizeTime(start.trim())
          expectedEnd = normalizeTime(end.trim())
          expectedMinutes = timeToMinutes(expectedEnd) - timeToMinutes(expectedStart)
        }
      }

      // Get actual clock-in/out for this day
      const dayClockIns = (staff.clockEntries || []).filter(e => {
        const date = new Date(e.timestamp)
        return e.type === "in" && date.toDateString() === dayStr
      })
      const dayClockOuts = (staff.clockEntries || []).filter(e => {
        const date = new Date(e.timestamp)
        return e.type === "out" && date.toDateString() === dayStr
      })

      let actualStart: string | null = null
      let actualEnd: string | null = null
      let actualMinutes = 0

      if (dayClockIns.length > 0) {
        const firstClockIn = dayClockIns[0]
        const clockInDate = new Date(firstClockIn.timestamp)
        actualStart = formatMinutesToTime(clockInDate.getHours() * 60 + clockInDate.getMinutes())

        // Find matching clock-out
        const matchingClockOut = dayClockOuts.find(out => {
          const outDate = new Date(out.timestamp)
          return outDate > clockInDate
        })

        if (matchingClockOut) {
          const clockOutDate = new Date(matchingClockOut.timestamp)
          actualEnd = formatMinutesToTime(clockOutDate.getHours() * 60 + clockOutDate.getMinutes())
          actualMinutes = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60)
        }
      }

      // Determine status
      let status = "not-scheduled"
      if (isOffDay) {
        status = "day-off"
      } else if (daySchedule.length > 0) {
        if (dayClockIns.length === 0) {
          status = "absent"
        } else if (!actualEnd) {
          status = "no-clock-out"
        } else {
          status = "completed"
        }
      } else if (dayClockIns.length > 0) {
        status = "unscheduled-work"
      }

      days.push({
        date: new Date(day),
        dayName: day.toLocaleDateString("en-US", { weekday: "long" }),
        expectedStart,
        expectedEnd,
        actualStart,
        actualEnd,
        expectedHours: expectedMinutes / 60,
        actualHours: actualMinutes / 60,
        status,
        isDayOff: isOffDay
      })
    })

    return days
  }

  const getRoleBadge = (role: string) => {
    if (role === "Student Lead") {
      return (
        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-100">
          <Shield className="w-3 h-3 mr-1" />
          Student Lead
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <UserCheck className="w-3 h-3 mr-1" />
          Student Assistant
        </Badge>
      )
    }
  }

  const getEntryTypeBadge = (entry: { type: "in" | "out"; isManual?: boolean }) => {
    const baseClass = entry.type === "in" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    const label = entry.type === "in" ? "Clock In" : "Clock Out"
    const manualFlag = entry.isManual ? " (Manual)" : ""

    return (
      <div className="flex items-center gap-1">
        <Badge className={baseClass}>{label}</Badge>
        {entry.isManual && <Badge className="bg-yellow-100 text-yellow-800 text-xs">Manual</Badge>}
      </div>
    )
  }

  const handleEditClick = (entry: ClockEntry, index: number) => {
    const date = new Date(entry.timestamp)
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setEditTimestamp(localDateTime)
    setEditType(entry.type)
    setEditingEntry({ entry, index })
  }

  const handleAddClick = () => {
    const now = new Date()
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setEditTimestamp(localDateTime)
    setEditType("in")
    setIsAddDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedStaff || !editingEntry) return

    setIsSaving(true)
    try {
      let entryId: string | undefined = editingEntry.entry.id

      // Ensure entryId is a string if it exists
      if (entryId) {
        entryId = String(entryId)
      }

      // If entry doesn't have an ID, try to find it by timestamp and type
      if (!entryId) {
        // Get current term to query check-ins
        const terms = await api.terms.getAll()
        const currentTerm = terms.find(t => t.name === selectedTerm)
        
        if (currentTerm) {
          // Query check-ins for this student and term
          const checkIns = await api.checkins.getAll({
            studentId: selectedStaff.id,
            termId: currentTerm.id,
          })
          
          // Find matching entry by timestamp (within 1 minute tolerance) and type
          const originalTimestamp = new Date(editingEntry.entry.timestamp)
          const matchingEntry = checkIns.find(entry => {
            const entryDate = new Date(entry.timestamp)
            const timeDiff = Math.abs(entryDate.getTime() - originalTimestamp.getTime())
            return timeDiff < 60000 && entry.type === editingEntry.entry.type // Within 1 minute
          })
          
          if (matchingEntry && matchingEntry.id) {
            entryId = String(matchingEntry.id) // Ensure it's a string
          } else {
            alert("Cannot find this entry in the database. It may have been deleted or the timestamp doesn't match. Please refresh the page.")
            setIsSaving(false)
            return
          }
        } else {
          alert("Cannot find current term. Please refresh the page.")
          setIsSaving(false)
          return
        }
      }

      // Validate entryId before making the API call
      if (!entryId || entryId.trim() === '') {
        alert("Invalid entry ID. Please refresh the page and try again.")
        setIsSaving(false)
        return
      }

      // Update the check-in
      await api.checkins.update(entryId, {
        timestamp: new Date(editTimestamp).toISOString(),
        type: editType,
      })
      
      setEditingEntry(null)
      setRefreshTrigger(prev => prev + 1)
      
      // Refresh the affected student's data
      if (onRefreshStudent && selectedStaff.id) {
        await onRefreshStudent(selectedStaff.id)
      }
    } catch (error) {
      console.error("Error updating check-in:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to update check-in: ${errorMessage}. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAdd = async () => {
    if (!selectedStaff) return

    setIsSaving(true)
    try {
      // Get current term ID - we'll need to get this from props or context
      // For now, we'll need to pass it or get it from the selected term
      const terms = await api.terms.getAll()
      const currentTerm = terms.find(t => t.name === selectedTerm)
      
      if (!currentTerm) {
        alert("Could not find current term")
        return
      }

      await api.checkins.create({
        studentId: selectedStaff.id,
        termId: currentTerm.id,
        type: editType,
        timestamp: new Date(editTimestamp).toISOString(),
        isManual: true,
      })

      setIsAddDialogOpen(false)
      setRefreshTrigger(prev => prev + 1)
      
      // Refresh the affected student's data
      if (onRefreshStudent && selectedStaff.id) {
        await onRefreshStudent(selectedStaff.id)
      }
    } catch (error) {
      console.error("Error creating check-in:", error)
      alert("Failed to create check-in. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const findMissingClockOuts = () => {
    if (!selectedStaff) return []
    
    const clockIns = (selectedStaff.clockEntries || []).filter(e => e.type === "in")
    const clockOuts = (selectedStaff.clockEntries || []).filter(e => e.type === "out")
    
    const missing: Array<{ clockIn: ClockEntry; date: Date }> = []
    
    clockIns.forEach(clockIn => {
      const inDate = new Date(clockIn.timestamp)
      const hasMatchingOut = clockOuts.some(out => {
        const outDate = new Date(out.timestamp)
        return outDate > inDate && outDate.toDateString() === inDate.toDateString()
      })
      
      if (!hasMatchingOut) {
        missing.push({ clockIn, date: inDate })
      }
    })
    
    return missing
  }

  // Calculate analytics for selected staff
  const punctuality = selectedStaff ? calculatePunctuality(selectedStaff) : null
  const weeklyBreakdown = selectedStaff ? getWeeklyBreakdown(selectedStaff) : []
  const dailyBreakdown = selectedStaff ? getDailyBreakdown(selectedStaff) : []
  const dailyBreakdownByWeek = selectedStaff ? groupDaysByWeek(dailyBreakdown) : []
  const dailyBreakdownByMonth = selectedStaff ? groupDaysByMonth(dailyBreakdown) : []
  const totalExpected = weeklyBreakdown.reduce((sum, week) => sum + week.expectedHours, 0)
  const totalActual = weeklyBreakdown.reduce((sum, week) => sum + week.actualHours, 0)

  // Filter staff based on search query
  // Always only show Student Lead and Student Assistant roles
  const filteredStaff = (() => {
    // First, filter to only include Student Lead and Student Assistant
    const eligibleStaff = staffData.filter(staff => 
      staff.role === "Student Assistant" || staff.role === "Student Lead"
    )
    
    // If no search query, show all eligible staff
    if (!searchQuery) {
      return eligibleStaff
    }
    
    // Otherwise, apply search filter on eligible staff
    return eligibleStaff.filter(staff => 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.cardId.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })()

  return (
    <div className="space-y-6">
      {/* Staff Selection - Search Bar */}
      <Card ref={searchSectionRef} className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by name or card ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {/* Show all students, filtered students, or search results */}
          {filteredStaff.length > 0 && (
            <div className="mt-4">
              {!searchQuery ? (
                // Grid layout for all students (Student Lead and Student Assistant only)
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredStaff.map((staff) => (
                    <Button
                      key={staff.id}
                      variant={selectedStaff?.id === staff.id ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => onSelectStaff(staff)}
                    >
                      {staff.role === "Student Lead" ? (
                        <Shield className="w-4 h-4 mr-2" />
                      ) : (
                        <UserCheck className="w-4 h-4 mr-2" />
                      )}
                      <span className="truncate">{staff.name}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                // List layout for search results
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredStaff.map((staff) => (
              <Button
                key={staff.id}
                variant={selectedStaff?.id === staff.id ? "default" : "outline"}
                className="w-full justify-start"
                      onClick={() => {
                        onSelectStaff(staff)
                        setSearchQuery("")
                      }}
              >
                {staff.role === "Student Lead" ? (
                  <Shield className="w-4 h-4 mr-2" />
                ) : (
                  <UserCheck className="w-4 h-4 mr-2" />
                )}
                      <span className="truncate">{staff.name}</span>
                      {selectedStaff?.id === staff.id && (
                        <Badge className="ml-auto bg-green-100 text-green-800">Selected</Badge>
                      )}
              </Button>
            ))}
          </div>
              )}
            </div>
          )}
          {searchQuery && filteredStaff.length === 0 && (
            <div className="mt-4 text-center text-muted-foreground text-sm">
              No staff members found matching "{searchQuery}"
            </div>
          )}
          {!searchQuery && selectedStaff && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {selectedStaff.role === "Student Lead" ? (
                  <Shield className="w-4 h-4 text-blue-600" />
                ) : (
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="font-medium">{selectedStaff.name}</span>
                <Badge variant="outline" className="ml-auto">{selectedStaff.role}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStaff && punctuality && (
        <>
          {/* Staff Header */}
          <Card ref={studentInfoRef} className="bg-card/70 backdrop-blur-sm shadow-lg scroll-mt-4">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                  {selectedStaff.role === "Student Lead" ? (
                    <Shield className="w-7 h-7 text-blue-600" />
                  ) : (
                    <UserCheck className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-foreground">{selectedStaff.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">{getRoleBadge(selectedStaff.role)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Card ID: {selectedStaff.cardId} • Term: {selectedTerm}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Overall Statistics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Punctuality</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{punctuality.percentage}%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {punctuality.onTime + punctuality.early} on-time / {punctuality.onTime + punctuality.early + punctuality.late} total
                    </div>
                  </div>
                  <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <Progress value={punctuality.percentage} className="mt-3" />
              </CardContent>
            </Card>

            <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Expected</div>
                    <div className="text-3xl font-bold text-foreground">{totalExpected.toFixed(1)}h</div>
                    <div className="text-xs text-muted-foreground mt-1">Scheduled hours</div>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Actual</div>
                    <div className="text-3xl font-bold text-foreground">{totalActual.toFixed(1)}h</div>
                    <div className="text-xs text-muted-foreground mt-1">Hours worked</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Difference</div>
                    <div className={`text-3xl font-bold ${totalActual >= totalExpected ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {totalActual >= totalExpected ? '+' : ''}{(totalActual - totalExpected).toFixed(1)}h
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {totalActual >= totalExpected ? 'Over' : 'Under'} schedule
                    </div>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Punctuality Breakdown */}
          <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Arrival Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Early Arrivals</div>
                  <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{punctuality.early}</div>
                  <Badge className="mt-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400">
                    &gt;10 min early
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">On-Time Arrivals</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{punctuality.onTime}</div>
                  <Badge className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                    ±10 min window
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Late Arrivals</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{punctuality.late}</div>
                  <Badge className="mt-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">
                    &gt;10 min late
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Breakdown */}
          <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
            <Collapsible open={isWeeklyBreakdownOpen} onOpenChange={setIsWeeklyBreakdownOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Weekly Hours Breakdown
                    </div>
                    {isWeeklyBreakdownOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead className="text-right">Expected Hours</TableHead>
                    <TableHead className="text-right">Actual Hours</TableHead>
                    <TableHead className="text-right">Difference</TableHead>
                    <TableHead className="text-right">Shifts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyBreakdown.map((week) => {
                    const diff = week.actualHours - week.expectedHours
                    return (
                      <TableRow key={week.weekNum}>
                        <TableCell className="font-medium">Week {week.weekNum}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right font-mono">{week.expectedHours.toFixed(1)}h</TableCell>
                        <TableCell className="text-right font-mono">{week.actualHours.toFixed(1)}h</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-mono ${diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}h
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{week.shifts}</TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right font-mono">{totalExpected.toFixed(1)}h</TableCell>
                    <TableCell className="text-right font-mono">{totalActual.toFixed(1)}h</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono ${totalActual >= totalExpected ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {totalActual >= totalExpected ? '+' : ''}{(totalActual - totalExpected).toFixed(1)}h
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{weeklyBreakdown.reduce((sum, w) => sum + w.shifts, 0)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Daily Breakdown - Week/Month View */}
          <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
            <Collapsible open={isDailyBreakdownOpen} onOpenChange={setIsDailyBreakdownOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Daily Hours Breakdown - {dailyViewMode === "week" ? "Week View" : "Month View"}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-muted rounded-md p-1">
                        <Button
                          variant={dailyViewMode === "week" ? "default" : "ghost"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDailyViewMode("week")
                            setCurrentWeekIndex(0)
                          }}
                          className="h-7 text-xs"
                        >
                          Week
                        </Button>
                        <Button
                          variant={dailyViewMode === "month" ? "default" : "ghost"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDailyViewMode("month")
                            setCurrentMonthIndex(0)
                          }}
                          className="h-7 text-xs"
                        >
                          Month
                        </Button>
                      </div>
                      {isDailyBreakdownOpen ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {dailyViewMode === "week" ? (
                    dailyBreakdownByWeek.length > 0 && currentWeekIndex < dailyBreakdownByWeek.length ? (
                      <>
                        {/* Week Navigation */}
                        <div className="flex items-center justify-between mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentWeekIndex === 0}
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous Week
                          </Button>
                          <div className="text-sm font-medium">
                            Week {dailyBreakdownByWeek[currentWeekIndex]?.weekNum || 0} of {dailyBreakdownByWeek.length}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentWeekIndex(prev => Math.min(dailyBreakdownByWeek.length - 1, prev + 1))}
                            disabled={currentWeekIndex >= dailyBreakdownByWeek.length - 1}
                          >
                            Next Week
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      
                      {/* Week Table */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[140px]">Monday</TableHead>
                              <TableHead className="min-w-[140px]">Tuesday</TableHead>
                              <TableHead className="min-w-[140px]">Wednesday</TableHead>
                              <TableHead className="min-w-[140px]">Thursday</TableHead>
                              <TableHead className="min-w-[140px]">Friday</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const week = dailyBreakdownByWeek[currentWeekIndex]
                              if (!week) return null
                              
                              const getStatusBadge = (status: string) => {
                                switch (status) {
                                  case "completed":
                                    return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs">✓</Badge>
                                  case "absent":
                                    return <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs">✗</Badge>
                                  case "no-clock-out":
                                    return <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs">!</Badge>
                                  case "day-off":
                                    return <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs">Day Off</Badge>
                                  case "not-scheduled":
                                    return <Badge className="bg-muted text-muted-foreground text-xs">—</Badge>
                                  case "unscheduled-work":
                                    return <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs">*</Badge>
                                  default:
                                    return <Badge variant="outline" className="text-xs">{status}</Badge>
                                }
                              }

                              const renderDayCell = (day: typeof dailyBreakdown[0] | null, dayIndex: number) => {
                                if (!day) {
                                  return (
                                    <TableCell key={dayIndex} className="text-center text-muted-foreground text-sm py-4">
                                      —
                                    </TableCell>
                                  )
                                }

                                const diff = day.actualHours - day.expectedHours
                                return (
                                  <TableCell 
                                    key={dayIndex} 
                                    className={`p-2 ${
                                      day.isDayOff
                                        ? "bg-orange-50 dark:bg-orange-950/20"
                                        : ""
                                    }`}
                                  >
                                    <div className="space-y-1 text-xs">
                                      <div className="font-medium text-muted-foreground">
                                        {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </div>
                                      {day.isDayOff ? (
                                        <div className="text-orange-700 dark:text-orange-400 italic text-xs">
                                          Day Off
                                        </div>
                                      ) : (
                                        <>
                                          <div className="space-y-0.5">
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="text-muted-foreground">Expected:</span>
                                              <span className="font-mono">{day.expectedStart || "—"}</span>
                                            </div>
                                            {day.expectedEnd && (
                                              <div className="flex items-center justify-between gap-1">
                                                <span className="text-muted-foreground">to</span>
                                                <span className="font-mono">{day.expectedEnd}</span>
                                              </div>
                                            )}
                                            <div className="flex items-center justify-between gap-1 pt-1 border-t">
                                              <span className="text-muted-foreground">Actual:</span>
                                              <span className="font-mono">{day.actualStart || "—"}</span>
                                            </div>
                                            {day.actualEnd && (
                                              <div className="flex items-center justify-between gap-1">
                                                <span className="text-muted-foreground">to</span>
                                                <span className="font-mono">{day.actualEnd}</span>
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between pt-1 border-t">
                                            <span className="text-muted-foreground">Hours:</span>
                                            <span className={`font-mono ${day.actualHours > 0 ? (diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400') : 'text-muted-foreground'}`}>
                                              {day.actualHours > 0 ? day.actualHours.toFixed(1) + "h" : "—"}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                      <div className="pt-1">
                                        {getStatusBadge(day.status)}
                                      </div>
                                    </div>
                                  </TableCell>
                                )
                              }

                              return (
                                <TableRow key={week.weekNum}>
                                  {week.days.map((day, dayIndex) => renderDayCell(day, dayIndex))}
                                </TableRow>
                              )
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No daily breakdown data available
                    </div>
                  )
                  ) : (
                    dailyBreakdownByMonth.length > 0 && currentMonthIndex < dailyBreakdownByMonth.length ? (
                      <>
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentMonthIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentMonthIndex === 0}
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous Month
                          </Button>
                          <div className="text-sm font-medium">
                            {dailyBreakdownByMonth[currentMonthIndex]?.monthYear || ""}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentMonthIndex(prev => Math.min(dailyBreakdownByMonth.length - 1, prev + 1))}
                            disabled={currentMonthIndex >= dailyBreakdownByMonth.length - 1}
                          >
                            Next Month
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>

                        {/* Month Summary */}
                        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-sm text-muted-foreground">Expected Hours</div>
                              <div className="text-lg font-bold">{dailyBreakdownByMonth[currentMonthIndex]?.totalExpected.toFixed(1)}h</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Actual Hours</div>
                              <div className="text-lg font-bold">{dailyBreakdownByMonth[currentMonthIndex]?.totalActual.toFixed(1)}h</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Difference</div>
                              <div className={`text-lg font-bold ${
                                (dailyBreakdownByMonth[currentMonthIndex]?.totalActual || 0) >= (dailyBreakdownByMonth[currentMonthIndex]?.totalExpected || 0)
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-orange-600 dark:text-orange-400'
                              }`}>
                                {((dailyBreakdownByMonth[currentMonthIndex]?.totalActual || 0) - (dailyBreakdownByMonth[currentMonthIndex]?.totalExpected || 0) >= 0 ? '+' : '')}
                                {((dailyBreakdownByMonth[currentMonthIndex]?.totalActual || 0) - (dailyBreakdownByMonth[currentMonthIndex]?.totalExpected || 0)).toFixed(1)}h
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="overflow-x-auto">
                          <div className="min-w-full">
                            {/* Calendar Header */}
                            <div className="grid grid-cols-5 gap-2 mb-2">
                              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((dayName) => (
                                <div key={dayName} className="text-center font-semibold text-sm text-muted-foreground py-2 border-b">
                                  {dayName}
                                </div>
                              ))}
                            </div>
                            
                            {/* Calendar Weeks */}
                            {dailyBreakdownByMonth[currentMonthIndex]?.calendarWeeks.map((week, weekIndex) => (
                              <div key={weekIndex} className="grid grid-cols-5 gap-2 mb-2">
                                {week.map((day, dayIndex) => {
                                  const getStatusBadge = (status: string) => {
                                    switch (status) {
                                      case "completed":
                                        return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs">✓</Badge>
                                      case "absent":
                                        return <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs">✗</Badge>
                                      case "no-clock-out":
                                        return <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs">!</Badge>
                                      case "day-off":
                                        return <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs">Day Off</Badge>
                                      case "not-scheduled":
                                        return <Badge className="bg-muted text-muted-foreground text-xs">—</Badge>
                                      case "unscheduled-work":
                                        return <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs">*</Badge>
                                      default:
                                        return <Badge variant="outline" className="text-xs">{status}</Badge>
                                    }
                                  }

                                  if (!day) {
                                    return (
                                      <div
                                        key={dayIndex}
                                        className="min-h-[120px] border border-dashed border-muted rounded-lg bg-muted/20"
                                      />
                                    )
                                  }

                                  const diff = day.actualHours - day.expectedHours
                                  return (
                                    <div
                                      key={dayIndex}
                                      className={`min-h-[120px] border rounded-lg p-2 transition-colors ${
                                        day.isDayOff
                                          ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                                          : "bg-card hover:bg-muted/50"
                                      }`}
                                    >
                                      <div className="space-y-1">
                                        {/* Date Header */}
                                        <div className="flex items-center justify-between mb-2 pb-2 border-b">
                                          <div className="font-semibold text-sm">
                                            {day.date.getDate()}
                                          </div>
                                          {getStatusBadge(day.status)}
                                        </div>

                                        {/* Expected Time */}
                                        {day.isDayOff ? (
                                          <div className="text-xs text-orange-700 dark:text-orange-400 italic">
                                            Day Off - No Tracking
                                          </div>
                                        ) : day.expectedStart && day.expectedEnd ? (
                                          <div className="text-xs space-y-0.5">
                                            <div className="text-muted-foreground">Expected:</div>
                                            <div className="font-mono">{day.expectedStart}</div>
                                            <div className="font-mono text-muted-foreground">to {day.expectedEnd}</div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-muted-foreground">Not scheduled</div>
                                        )}

                                        {/* Actual Time */}
                                        {day.actualStart && (
                                          <div className="text-xs space-y-0.5 pt-1 border-t">
                                            <div className="text-muted-foreground">Actual:</div>
                                            <div className="font-mono">{day.actualStart}</div>
                                            {day.actualEnd && (
                                              <div className="font-mono text-muted-foreground">to {day.actualEnd}</div>
                                            )}
                                          </div>
                                        )}

                                        {/* Hours */}
                                        {day.actualHours > 0 && (
                                          <div className="pt-1 border-t">
                                            <div className="text-xs text-muted-foreground">Hours:</div>
                                            <div className={`text-sm font-bold font-mono ${
                                              diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                                            }`}>
                                              {day.actualHours.toFixed(1)}h
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No daily breakdown data available
                      </div>
                    )
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Clock History */}
          <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Complete Clock In/Out History
                </CardTitle>
                <Button onClick={handleAddClick} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </div>
              {findMissingClockOuts().length > 0 && (
                <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ {findMissingClockOuts().length} clock-in{findMissingClockOuts().length > 1 ? 's' : ''} missing clock-out
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedStaff.clockEntries || []).length > 0 ? (
                    (selectedStaff.clockEntries || [])
                      .slice()
                      .reverse()
                      .map((entry, index) => {
                        const date = new Date(entry.timestamp)
                        const weekNum = getWeekNumber(date)
                        const originalIndex = (selectedStaff.clockEntries || []).length - 1 - index
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{date.toLocaleString()}</TableCell>
                            <TableCell>{getEntryTypeBadge(entry)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {date.toLocaleDateString("en-US", { weekday: "long" })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Week {weekNum}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(entry, originalIndex)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No clock entries found for this term
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </CardContent>
        </Card>

          {/* Edit Dialog */}
          <Dialog open={!!editingEntry} onOpenChange={(open: boolean) => !open && setEditingEntry(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Clock Entry</DialogTitle>
                <DialogDescription>
                  Update the date, time, or type of this clock entry.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-timestamp">Date & Time</Label>
                  <Input
                    id="edit-timestamp"
                    type="datetime-local"
                    value={editTimestamp}
                    onChange={(e) => setEditTimestamp(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Type</Label>
                  <Select value={editType} onValueChange={(value: "in" | "out") => setEditType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Clock In</SelectItem>
                      <SelectItem value="out">Clock Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingEntry(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Clock Entry</DialogTitle>
                <DialogDescription>
                  Add a new clock-in or clock-out entry for {selectedStaff?.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="add-timestamp">Date & Time</Label>
                  <Input
                    id="add-timestamp"
                    type="datetime-local"
                    value={editTimestamp}
                    onChange={(e) => setEditTimestamp(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="add-type">Type</Label>
                  <Select value={editType} onValueChange={(value: "in" | "out") => setEditType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Clock In</SelectItem>
                      <SelectItem value="out">Clock Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAdd} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Add Entry"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <Button
          onClick={scrollToSearch}
          className="fixed bottom-8 right-8 rounded-full shadow-lg z-50 h-12 w-12 p-0"
          size="icon"
          variant="default"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
}
