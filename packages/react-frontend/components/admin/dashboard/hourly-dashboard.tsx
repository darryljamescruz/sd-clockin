"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, AlertCircle, CheckCircle2, XCircle, UserCheck, Shield } from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { type Student } from "@/lib/api"
import {
  timeToMinutes,
  getTodayScheduleForDate,
  getExpectedStartTimeFromSchedule,
  getExpectedEndTimeFromSchedule,
  formatTimeForDisplay,
  matchClockEntriesToShifts,
} from "@/lib/shift-utils"

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

  // All time/schedule functions are now imported from shared utilities

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
  // Uses shared logic to match clock entries to shifts (handles multiple shifts and 1 hour early window)
  const getShiftsByHour = () => {
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

    staffData.forEach((staff) => {
      // Use shared logic to match clock entries to shifts
      const matchedShifts = matchClockEntriesToShifts(staff, selectedDate)

      matchedShifts.forEach((matchedShift) => {
        const expectedStart = matchedShift.shift.start
        const expectedEnd = matchedShift.shift.end
        const shift = matchedShift.shift.original

        if (!expectedStart) return

        const startHour = timeToMinutes(expectedStart) / 60
        const hourIndex = Math.floor(startHour)

        const actualStart = matchedShift.clockIn
        const actualEnd = matchedShift.clockOut
        const status = matchedShift.status
        const isOnTime = matchedShift.isOnTime

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full min-w-0">
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
                <div key={hour} className={`border-b last:border-b-0 pb-4 sm:pb-6 last:pb-0 ${isActive ? 'border-primary/30' : ''}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-4 sm:px-0">
                    <div className={`flex items-center gap-2 text-base sm:text-lg font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {formatHour(hour)}
                      {isActive && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs font-medium">
                          <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400 animate-pulse" />
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
                    <div className="px-4 sm:px-0 min-w-[700px]">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow className="border-b-0">
                            <TableHead className="w-[22%] text-foreground font-semibold">Name</TableHead>
                            <TableHead className="w-[14%] text-foreground font-semibold">Role</TableHead>
                            <TableHead className="w-[22%] text-center text-foreground font-semibold">Expected</TableHead>
                            <TableHead className="w-[22%] text-center text-foreground font-semibold">Actual</TableHead>
                            <TableHead className="w-[20%] text-center text-foreground font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shifts.map((shiftData, index) => (
                            <TableRow key={`${shiftData.staff.id}-${index}`} className="border-b border-border/50">
                              <TableCell className="py-3">
                                <div className="font-medium text-sm">{shiftData.staff.name}</div>
                              </TableCell>
                              <TableCell className="py-3">
                                {getRoleBadge(shiftData.staff.role)}
                              </TableCell>
                              <TableCell className="py-3 text-center">
                                <div className="font-mono text-sm text-muted-foreground">
                                  {formatTimeForDisplay(shiftData.expectedStart)} – {formatTimeForDisplay(shiftData.expectedEnd)}
                                </div>
                                <div className="text-xs text-muted-foreground/70">{shiftData.expectedHours}</div>
                              </TableCell>
                              <TableCell className="py-3 text-center">
                                {shiftData.actualStart ? (
                                  <>
                                    <div className="font-mono text-sm font-medium text-foreground">
                                      {formatTimeForDisplay(shiftData.actualStart)}{shiftData.actualEnd ? ` – ${formatTimeForDisplay(shiftData.actualEnd)}` : ''}
                                    </div>
                                    <div className="text-xs text-muted-foreground/70">{shiftData.actualHours}</div>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="py-3 text-center">
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

