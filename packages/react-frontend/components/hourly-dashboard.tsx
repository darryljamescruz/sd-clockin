"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Users, TrendingUp, AlertCircle, CheckCircle2, XCircle, UserCheck, Shield } from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { type Student } from "@/lib/api"

interface HourlyDashboardProps {
  staffData: Student[]
  selectedDate: Date
}

export function HourlyDashboard({ staffData, selectedDate }: HourlyDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute for active indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Generate hours from 6 AM to 11 PM
  const hours = useMemo(() => {
    const hoursList = []
    for (let hour = 6; hour <= 23; hour++) {
      hoursList.push(hour)
    }
    return hoursList
  }, [])

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0
    
    // Handle times with AM/PM (e.g., "12:30 PM", "12:30pm", "5 PM")
    const upperTime = timeStr.toUpperCase().trim()
    const hasAM = upperTime.includes("AM")
    const hasPM = upperTime.includes("PM")
    
    // Remove AM/PM for parsing
    const timeWithoutPeriod = timeStr.replace(/\s*(AM|PM)\s*/gi, "").trim()
    
    // Parse hours and minutes
    let hours: number
    let minutes: number
    
    if (timeWithoutPeriod.includes(":")) {
      const parts = timeWithoutPeriod.split(":")
      hours = parseInt(parts[0], 10)
      minutes = parseInt(parts[1] || "0", 10)
    } else {
      // Just a number (e.g., "5" or "12" or "17")
      hours = parseInt(timeWithoutPeriod, 10)
      minutes = 0
    }
    
    if (isNaN(hours) || isNaN(minutes)) return 0
    
    // Convert to 24-hour format
    if (hasAM || hasPM) {
      // 12-hour format with AM/PM
      if (hours === 12 && hasAM) {
        hours = 0 // 12 AM is midnight
      } else if (hours !== 12 && hasPM) {
        hours += 12 // PM adds 12 hours (except 12 PM)
      }
      // If hours === 12 && hasPM, it stays 12 (noon)
    } else {
      // No AM/PM specified - assume 24-hour format
      // Times like "12:30" or "17" are already in 24-hour format
    }
    
    return hours * 60 + minutes
  }

  const getTodayScheduleForDate = (staff: Student, date: Date): string[] => {
    const dayNames: Array<keyof NonNullable<Student['weeklySchedule']> | null> = [null, "monday", "tuesday", "wednesday", "thursday", "friday", null]
    const dayName = dayNames[date.getDay()]
    if (!dayName) return []
    return staff.weeklySchedule?.[dayName] || []
  }

  // Extract times directly from schedule block without transformation
  const getExpectedStartTimeFromSchedule = (scheduleBlock: string): string | null => {
    if (!scheduleBlock) return null
    const startTime = scheduleBlock.split("-")[0].trim()
    return startTime || null
  }

  const getExpectedEndTimeFromSchedule = (scheduleBlock: string): string | null => {
    if (!scheduleBlock) return null
    const endTime = scheduleBlock.split("-")[1]?.trim()
    return endTime || null
  }

  // Convert 24-hour format to 12-hour am/pm format for display (lowercase)
  // If time already has AM/PM, convert to lowercase
  const formatTimeForDisplay = (timeStr: string | null): string => {
    if (!timeStr) return "—"
    
    const upperTime = timeStr.toUpperCase().trim()
    const hasAM = upperTime.includes("AM")
    const hasPM = upperTime.includes("PM")
    
    // If already has AM/PM, convert to lowercase
    if (hasAM || hasPM) {
      return timeStr.replace(/\s*(AM|PM)\s*/gi, (match, period) => ` ${period.toLowerCase()}`).trim()
    }
    
    // Parse 24-hour format and convert to 12-hour am/pm
    let hours: number
    let minutes: number
    
    if (timeStr.includes(":")) {
      const parts = timeStr.split(":")
      hours = parseInt(parts[0], 10)
      minutes = parseInt(parts[1] || "0", 10)
    } else {
      // Just a number (e.g., "5" or "17")
      hours = parseInt(timeStr, 10)
      minutes = 0
    }
    
    if (isNaN(hours) || isNaN(minutes)) return timeStr
    
    // Convert to 12-hour format
    let period = "am"
    let displayHours = hours
    
    if (hours === 0) {
      displayHours = 12 // Midnight
      period = "am"
    } else if (hours === 12) {
      displayHours = 12 // Noon
      period = "pm"
    } else if (hours > 12) {
      displayHours = hours - 12
      period = "pm"
    } else {
      displayHours = hours
      period = "am"
    }
    
    // Always format with minutes (pad to 2 digits)
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  const formatShiftLength = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return "—"
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const diffMinutes = endMinutes - startMinutes
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  const calculateActualHours = (actualStart: string | null, actualEnd: string | null): string => {
    if (!actualStart) return "—"
    if (!actualEnd) return "In progress"
    
    // Parse actual times
    const startMinutes = timeToMinutes(actualStart)
    const endMinutes = timeToMinutes(actualEnd)
    const diffMinutes = endMinutes - startMinutes
    
    if (diffMinutes < 0) return "—" // Invalid
    
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  // Check if current time is within 8 AM - 5 PM
  const isActiveTime = (hour: number): boolean => {
    const now = currentTime
    const isToday = selectedDate.toDateString() === now.toDateString()
    if (!isToday) return false
    
    const currentHour = now.getHours()
    return currentHour >= 8 && currentHour < 17 && currentHour === hour
  }

  // Get all shifts for the selected date, organized by hour
  const getShiftsByHour = () => {
    const dateStr = selectedDate.toDateString()
    const shiftsByHour: Record<number, Array<{
      staff: Student
      shift: string
      expectedStart: string | null
      expectedEnd: string | null
      actualStart: string | null
      actualEnd: string | null
      expectedHours: string
      actualHours: string
      status: string
      isOnTime: boolean
      shiftLength: string
    }>> = {}

    // Initialize all hours
    hours.forEach(hour => {
      shiftsByHour[hour] = []
    })

    // Track used clock entries to avoid matching them to multiple shifts
    const usedClockIns = new Set<string>()
    const usedClockOuts = new Set<string>()

    staffData.forEach((staff) => {
      const expectedSchedule = getTodayScheduleForDate(staff, selectedDate)

      expectedSchedule.forEach((shift: string) => {
        const expectedStart = getExpectedStartTimeFromSchedule(shift)
        const expectedEnd = getExpectedEndTimeFromSchedule(shift)

        if (!expectedStart) return

        const startHour = timeToMinutes(expectedStart) / 60
        const hourIndex = Math.floor(startHour)

        const shiftStartMinutes = timeToMinutes(expectedStart)
        const shiftEndMinutes = expectedEnd ? timeToMinutes(expectedEnd) : shiftStartMinutes + 240

        // Find clock-in for this specific shift - match within 30 minutes before shift start to shift end
        const clockInEntry = staff.clockEntries?.find((entry) => {
          const entryId = entry.id || entry.timestamp
          if (usedClockIns.has(entryId)) return false // Already used for another shift
          
          const entryDate = new Date(entry.timestamp)
          if (entryDate.toDateString() !== dateStr || entry.type !== "in") return false
          
          const entryMinutes = entryDate.getHours() * 60 + entryDate.getMinutes()
          
          // Match clock-in if it's within 30 minutes before shift start to shift end
          return entryMinutes >= shiftStartMinutes - 30 && entryMinutes <= shiftEndMinutes
        })

        let actualStart: string | null = null
        let actualEnd: string | null = null
        let status = "incoming"
        let isOnTime = false

        if (clockInEntry) {
          const clockInId = clockInEntry.id || clockInEntry.timestamp
          usedClockIns.add(clockInId) // Mark as used
          
          const clockInDate = new Date(clockInEntry.timestamp)
          // Format as HH:MM am/pm (lowercase)
          const hours = clockInDate.getHours()
          const minutes = clockInDate.getMinutes()
          const period = hours >= 12 ? "pm" : "am"
          const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
          actualStart = `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`

          // Find matching clock-out for this specific shift
          // Clock-out should be after clock-in and before the next shift starts (or end of day)
          const clockOutEntry = staff.clockEntries?.find((entry) => {
            const entryId = entry.id || entry.timestamp
            if (usedClockOuts.has(entryId)) return false // Already used for another shift
            
            const entryDate = new Date(entry.timestamp)
            if (entryDate.toDateString() !== dateStr || entry.type !== "out") return false
            if (entryDate <= clockInDate) return false // Must be after clock-in
            
            const entryMinutes = entryDate.getHours() * 60 + entryDate.getMinutes()
            
            // Clock-out should be after clock-in and ideally before next shift or within reasonable time
            // For now, accept any clock-out after clock-in that's before the next day
            // We'll refine this by checking if it's before the next shift in the schedule
            const nextShift = expectedSchedule.find((s: string) => {
              const nextStart = getExpectedStartTimeFromSchedule(s)
              if (!nextStart) return false
              const nextStartMinutes = timeToMinutes(nextStart)
              return nextStartMinutes > shiftStartMinutes
            })
            
            if (nextShift) {
              const nextStart = getExpectedStartTimeFromSchedule(nextShift)
              if (nextStart) {
                const nextStartMinutes = timeToMinutes(nextStart)
                // Clock-out should be before next shift starts
                return entryMinutes < nextStartMinutes
              }
            }
            
            // If no next shift, accept clock-out up to end of shift + 1 hour buffer
            return entryMinutes <= shiftEndMinutes + 60
          })

          if (clockOutEntry) {
            const clockOutId = clockOutEntry.id || clockOutEntry.timestamp
            usedClockOuts.add(clockOutId) // Mark as used
            
            const clockOutDate = new Date(clockOutEntry.timestamp)
            // Format as HH:MM am/pm (lowercase)
            const outHours = clockOutDate.getHours()
            const outMinutes = clockOutDate.getMinutes()
            const outPeriod = outHours >= 12 ? "pm" : "am"
            const outDisplayHours = outHours === 0 ? 12 : outHours > 12 ? outHours - 12 : outHours
            actualEnd = `${outDisplayHours}:${outMinutes.toString().padStart(2, "0")} ${outPeriod}`
          }

          const expectedMinutes = timeToMinutes(expectedStart)
          const actualMinutes = clockInDate.getHours() * 60 + clockInDate.getMinutes()
          const diffMinutes = actualMinutes - expectedMinutes

          if (diffMinutes < -10) {
            status = "early"
            isOnTime = true // Early counts as on-time
          } else if (diffMinutes <= 10) {
            status = "on-time"
            isOnTime = true
          } else {
            status = "late"
            isOnTime = false
          }
        } else {
          // Check if shift has started
          const now = currentTime
          const isToday = selectedDate.toDateString() === now.toDateString()
          
          if (isToday) {
            const startMinutes = timeToMinutes(expectedStart)
            const nowMinutes = now.getHours() * 60 + now.getMinutes()
            const minutesLate = nowMinutes - startMinutes
            
            if (minutesLate < 0) {
              // Shift hasn't started yet
              status = "incoming"
            } else if (minutesLate <= 10) {
              // Within 10 minute grace period
              status = "incoming"
            } else {
              // More than 10 minutes late - absent (unless they clock in)
              status = "absent"
            }
          } else {
            // Compare dates without time
            const selectedDateOnly = new Date(selectedDate)
            selectedDateOnly.setHours(0, 0, 0, 0)
            const nowDateOnly = new Date(now)
            nowDateOnly.setHours(0, 0, 0, 0)
            
            if (selectedDateOnly < nowDateOnly) {
              // Past date - they didn't clock in, so absent
              status = "absent"
            } else {
              // Future date
              status = "incoming"
            }
          }
        }

        const shiftLength = formatShiftLength(expectedStart, expectedEnd)
        const expectedHours = formatShiftLength(expectedStart, expectedEnd)
        const actualHours = calculateActualHours(actualStart, actualEnd)

        if (hourIndex >= 6 && hourIndex <= 23) {
          shiftsByHour[hourIndex].push({
            staff,
            shift,
            expectedStart,
            expectedEnd,
            actualStart,
            actualEnd,
            expectedHours,
            actualHours,
            status,
            isOnTime,
            shiftLength,
          })
        }
      })
    })

    // Sort each hour's shifts by expected start time, then by name
    Object.keys(shiftsByHour).forEach(hourKey => {
      const hour = parseInt(hourKey)
      shiftsByHour[hour].sort((a, b) => {
        if (a.expectedStart && b.expectedStart) {
          const aMinutes = timeToMinutes(a.expectedStart)
          const bMinutes = timeToMinutes(b.expectedStart)
          if (aMinutes !== bMinutes) return aMinutes - bMinutes
        }
        return a.staff.name.localeCompare(b.staff.name)
      })
    })

    return shiftsByHour
  }

  const shiftsByHour = getShiftsByHour()

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM"
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return "12 PM"
    return `${hour - 12} PM`
  }

  const getStatusBadge = (status: string, isOnTime: boolean) => {
    if (status === "incoming") {
      return <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">Incoming</Badge>
    }
    if (status === "early") {
      return <Badge className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400">Early</Badge>
    }
    if (status === "on-time" || (status === "present" && isOnTime)) {
      return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">On Time</Badge>
    }
    if (status === "late") {
      return <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">Late</Badge>
    }
    if (status === "absent") {
      return <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">Absent</Badge>
    }
    return <Badge className="bg-muted text-muted-foreground">—</Badge>
  }

  const getRoleBadge = (role: string | undefined) => {
    if (!role) {
      return <Badge variant="outline" className="text-muted-foreground">—</Badge>
    }
    if (role === "Student Lead") {
      return (
        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">
          <Shield className="w-3 h-3 mr-1" />
          Lead
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/30">
          <UserCheck className="w-3 h-3 mr-1" />
          Assistant
        </Badge>
      )
    }
  }

  // Calculate stats for the day
  const dayStats = useMemo(() => {
    let totalShifts = 0
    let onTimeShifts = 0
    let lateShifts = 0
    let absentShifts = 0
    let incomingShifts = 0

    Object.values(shiftsByHour).forEach(shifts => {
      shifts.forEach(shift => {
        totalShifts++
        if (shift.status === "on-time" || shift.status === "early") {
          onTimeShifts++
        } else if (shift.status === "late") {
          lateShifts++
        } else if (shift.status === "absent") {
          absentShifts++
        } else if (shift.status === "incoming") {
          incomingShifts++
        }
      })
    })

    return { totalShifts, onTimeShifts, lateShifts, absentShifts, incomingShifts }
  }, [shiftsByHour])

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Day Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 w-full max-w-full min-w-0">
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-bold text-foreground">{dayStats.totalShifts}</div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">Total Shifts</div>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{dayStats.onTimeShifts}</div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">On Time</div>
              </div>
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{dayStats.lateShifts}</div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">Late</div>
              </div>
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{dayStats.absentShifts}</div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">Absent</div>
              </div>
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{dayStats.incomingShifts}</div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">Incoming</div>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hour by Hour View */}
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
          <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-base sm:text-lg">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Hour-by-Hour Schedule</span>
            </div>
            <span className="text-sm sm:text-base text-muted-foreground sm:ml-2 truncate">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 w-full max-w-full overflow-x-hidden min-w-0">
          <div className="space-y-4 sm:space-y-6">
            {hours.map((hour) => {
              const shifts = shiftsByHour[hour]
              if (!shifts || shifts.length === 0) return null

              const isActive = isActiveTime(hour)

              return (
                <div key={hour} className={`border-b last:border-b-0 pb-4 sm:pb-6 last:pb-0 ${isActive ? 'bg-primary/5 dark:bg-primary/10 border-primary/30' : ''}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-4 sm:px-0">
                    <div className={`flex items-center gap-2 text-base sm:text-lg font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {formatHour(hour)}
                      {isActive && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 dark:bg-primary/30 text-primary text-xs font-medium">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          Active
                        </div>
                      )}
                    </div>
                    <div className={`hidden sm:block flex-1 border-t border-dashed ${isActive ? 'border-primary/30' : 'border-muted-foreground/30'}`} />
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {shifts.length} {shifts.length === 1 ? "shift" : "shifts"}
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
                    <div className="px-4 sm:px-0 min-w-[1000px]">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[12%] text-foreground font-semibold">Name</TableHead>
                            <TableHead className="w-[11%] text-foreground font-semibold">Role</TableHead>
                            <TableHead className="w-[11%] text-center text-foreground font-semibold">Expected Start</TableHead>
                            <TableHead className="w-[11%] text-center text-foreground font-semibold">Actual Start</TableHead>
                            <TableHead className="w-[11%] text-center text-foreground font-semibold">Expected End</TableHead>
                            <TableHead className="w-[11%] text-center text-foreground font-semibold">Actual End</TableHead>
                            <TableHead className="w-[11%] text-center text-foreground font-semibold">Expected Hours</TableHead>
                            <TableHead className="w-[11%] text-center text-foreground font-semibold">Actual Hours</TableHead>
                            <TableHead className="w-[11%] text-center text-foreground font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shifts.map((shiftData, index) => (
                            <TableRow key={`${shiftData.staff.id}-${index}`}>
                              <TableCell className="font-medium text-sm">
                                <div className="break-words">{shiftData.staff.name}</div>
                              </TableCell>
                              <TableCell>
                                {getRoleBadge(shiftData.staff.role)}
                              </TableCell>
                              <TableCell className="font-mono text-xs sm:text-sm text-center text-muted-foreground">
                                {formatTimeForDisplay(shiftData.expectedStart)}
                              </TableCell>
                              <TableCell className="font-mono text-xs sm:text-sm text-center font-semibold text-foreground">
                                {shiftData.actualStart ? formatTimeForDisplay(shiftData.actualStart) : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className="font-mono text-xs sm:text-sm text-center text-muted-foreground">
                                {formatTimeForDisplay(shiftData.expectedEnd)}
                              </TableCell>
                              <TableCell className="font-mono text-xs sm:text-sm text-center font-semibold text-foreground">
                                {shiftData.actualEnd ? formatTimeForDisplay(shiftData.actualEnd) : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className="font-mono text-xs sm:text-sm text-center text-muted-foreground">{shiftData.expectedHours}</TableCell>
                              <TableCell className="font-mono text-xs sm:text-sm text-center font-semibold text-foreground">{shiftData.actualHours}</TableCell>
                              <TableCell className="text-center">
                                {getStatusBadge(shiftData.status, shiftData.isOnTime)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {Object.values(shiftsByHour).every(shifts => shifts.length === 0) && (
            <div className="text-center text-muted-foreground py-8 sm:py-12 px-4">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
              <p className="text-base sm:text-lg">No shifts scheduled for this day</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

