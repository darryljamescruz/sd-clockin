"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Users, TrendingUp, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { useMemo } from "react"
import { type Student } from "@/lib/api"

interface HourlyDashboardProps {
  staffData: Student[]
  selectedDate: Date
}

export function HourlyDashboard({ staffData, selectedDate }: HourlyDashboardProps) {
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

  // Convert 24-hour format to 12-hour AM/PM format for display
  // If time already has AM/PM, return as-is
  const formatTimeForDisplay = (timeStr: string | null): string => {
    if (!timeStr) return "—"
    
    const upperTime = timeStr.toUpperCase().trim()
    const hasAM = upperTime.includes("AM")
    const hasPM = upperTime.includes("PM")
    
    // If already has AM/PM, return as-is (just normalize spacing)
    if (hasAM || hasPM) {
      return timeStr.replace(/\s*(AM|PM)\s*/gi, (match, period) => ` ${period.toUpperCase()}`).trim()
    }
    
    // Parse 24-hour format and convert to 12-hour AM/PM
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
    let period = "AM"
    let displayHours = hours
    
    if (hours === 0) {
      displayHours = 12 // Midnight
      period = "AM"
    } else if (hours === 12) {
      displayHours = 12 // Noon
      period = "PM"
    } else if (hours > 12) {
      displayHours = hours - 12
      period = "PM"
    } else {
      displayHours = hours
      period = "AM"
    }
    
    // Format with minutes if present
    if (minutes > 0) {
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
    } else {
      return `${displayHours} ${period}`
    }
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
      status: string
      isOnTime: boolean
      shiftLength: string
    }>> = {}

    // Initialize all hours
    hours.forEach(hour => {
      shiftsByHour[hour] = []
    })

    staffData.forEach((staff) => {
      const expectedSchedule = getTodayScheduleForDate(staff, selectedDate)

      expectedSchedule.forEach((shift: string) => {
        const expectedStart = getExpectedStartTimeFromSchedule(shift)
        const expectedEnd = getExpectedEndTimeFromSchedule(shift)

        if (!expectedStart) return

        const startHour = timeToMinutes(expectedStart) / 60
        const hourIndex = Math.floor(startHour)

        // Find clock-in for this shift
        const clockInEntry = staff.clockEntries?.find((entry) => {
          const entryDate = new Date(entry.timestamp)
          if (entryDate.toDateString() !== dateStr || entry.type !== "in") return false
          
          const entryMinutes = entryDate.getHours() * 60 + entryDate.getMinutes()
          const shiftStartMinutes = timeToMinutes(expectedStart)
          const shiftEndMinutes = expectedEnd ? timeToMinutes(expectedEnd) : shiftStartMinutes + 240
          
          return entryMinutes >= shiftStartMinutes - 240 && entryMinutes <= shiftEndMinutes
        })

        let actualStart: string | null = null
        let actualEnd: string | null = null
        let status = "incoming"
        let isOnTime = false

        if (clockInEntry) {
          const clockInDate = new Date(clockInEntry.timestamp)
          actualStart = clockInDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })

          // Find matching clock-out for this shift
          const clockOutEntry = staff.clockEntries?.find((entry) => {
            const entryDate = new Date(entry.timestamp)
            return (
              entry.type === "out" &&
              entryDate.toDateString() === dateStr &&
              entryDate > clockInDate
            )
          })

          if (clockOutEntry) {
            const clockOutDate = new Date(clockOutEntry.timestamp)
            actualEnd = clockOutDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
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
          const now = new Date()
          const isToday = selectedDate.toDateString() === now.toDateString()
          
          if (isToday) {
            const startMinutes = timeToMinutes(expectedStart)
            const nowMinutes = now.getHours() * 60 + now.getMinutes()
            const minutesLate = nowMinutes - startMinutes
            
            if (minutesLate < 0) {
              status = "incoming"
            } else if (minutesLate >= 60) {
              status = "absent"
            } else {
              status = "incoming"
            }
          } else if (selectedDate < now) {
            status = "absent"
          }
        }

        const shiftLength = formatShiftLength(expectedStart, expectedEnd)

        if (hourIndex >= 6 && hourIndex <= 23) {
          shiftsByHour[hourIndex].push({
            staff,
            shift,
            expectedStart,
            expectedEnd,
            actualStart,
            actualEnd,
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

  const getRoleBadge = (role: string) => {
    if (role === "Student Lead") {
      return <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">Lead</Badge>
    }
    return <Badge className="bg-secondary text-secondary-foreground">Assistant</Badge>
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

              return (
                <div key={hour} className="border-b last:border-b-0 pb-4 sm:pb-6 last:pb-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-4 sm:px-0">
                    <div className="text-base sm:text-lg font-semibold text-foreground">
                      {formatHour(hour)}
                    </div>
                    <div className="hidden sm:block flex-1 border-t border-dashed border-muted-foreground/30" />
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {shifts.length} {shifts.length === 1 ? "shift" : "shifts"}
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
                    <div className="px-4 sm:px-0 min-w-[600px]">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">Name</TableHead>
                            <TableHead className="w-[100px]">Role</TableHead>
                            <TableHead className="w-[180px]">Expected Time</TableHead>
                            <TableHead className="w-[140px]">Actual Clock-In</TableHead>
                            <TableHead className="w-[140px]">Actual Clock-Out</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                            <TableHead className="w-[120px]">Shift Length</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shifts.map((shiftData, index) => (
                            <TableRow key={`${shiftData.staff.id}-${index}`}>
                              <TableCell className="font-medium text-sm truncate" style={{ width: '150px', maxWidth: '150px' }}>{shiftData.staff.name}</TableCell>
                              <TableCell style={{ width: '100px', maxWidth: '100px' }}>{getRoleBadge(shiftData.staff.role)}</TableCell>
                              <TableCell className="font-mono text-xs sm:text-sm truncate" style={{ width: '180px', maxWidth: '180px' }}>
                                {formatTimeForDisplay(shiftData.expectedStart)}
                                {shiftData.expectedEnd && ` - ${formatTimeForDisplay(shiftData.expectedEnd)}`}
                              </TableCell>
                              <TableCell className="font-mono text-xs sm:text-sm truncate" style={{ width: '140px', maxWidth: '140px' }}>
                                {shiftData.actualStart || "—"}
                              </TableCell>
                              <TableCell className="font-mono text-xs sm:text-sm truncate" style={{ width: '140px', maxWidth: '140px' }}>
                                {shiftData.actualEnd || "—"}
                              </TableCell>
                              <TableCell style={{ width: '120px', maxWidth: '120px' }}>
                                {getStatusBadge(shiftData.status, shiftData.isOnTime)}
                              </TableCell>
                              <TableCell className="font-mono text-xs sm:text-sm truncate" style={{ width: '120px', maxWidth: '120px' }}>{shiftData.shiftLength}</TableCell>
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

