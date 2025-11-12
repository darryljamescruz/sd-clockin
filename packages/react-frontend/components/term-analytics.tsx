"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Clock, Calendar } from "lucide-react"
import { type Student } from "@/lib/api"
import { parseDateString } from "@/lib/utils"

interface TermAnalyticsProps {
  staffData: Student[]
  selectedTerm: string
  termStartDate: string
  termEndDate: string
}

export function TermAnalytics({ staffData, selectedTerm, termStartDate, termEndDate }: TermAnalyticsProps) {
  // Filter clock entries by term date range
  const getTermClockEntries = (staff: Student) => {
    const startDate = parseDateString(termStartDate)
    const endDate = parseDateString(termEndDate)

    return (staff.clockEntries || []).filter((entry) => {
      const entryDate = new Date(entry.timestamp)
      return entryDate >= startDate && entryDate <= endDate
    })
  }

  const getExpectedStartTimeForDate = (staff: Student, date: Date) => {
    const dayNames: Array<keyof NonNullable<Student['weeklySchedule']> | null> = [null, "monday", "tuesday", "wednesday", "thursday", "friday", null]
    const dayName = dayNames[date.getDay()]
    if (!dayName) return null
    const daySchedule = staff.weeklySchedule?.[dayName] || []

    if (daySchedule.length === 0) return null

    // Get the first time block's start time
    const firstBlock = daySchedule[0]
    const startTime = firstBlock.split("-")[0].trim()

    // Convert to standard format if needed
    if (startTime.includes(":")) {
      return startTime.includes("AM") || startTime.includes("PM") ? startTime : startTime + " AM"
    } else {
      // Convert 24-hour to 12-hour format
      const hour = Number.parseInt(startTime)
      if (hour === 0) return "12:00 AM"
      if (hour < 12) return `${hour}:00 AM`
      if (hour === 12) return "12:00 PM"
      return `${hour - 12}:00 PM`
    }
  }

  // Calculate analytics for each staff member
  const getStaffAnalytics = (staff: Student) => {
    const termEntries = getTermClockEntries(staff)
    const clockInEntries = termEntries.filter((entry) => entry.type === "in")
    const manualEntries = termEntries.filter((entry) => entry.isManual)

    // Calculate attendance days (unique days with clock-in)
    const attendanceDays = new Set(clockInEntries.map((entry) => new Date(entry.timestamp).toDateString())).size

    // Calculate total days in term (weekdays only)
    const totalWeekdays = getWeekdaysInRange(parseDateString(termStartDate), parseDateString(termEndDate))

    // Calculate punctuality based on late arrivals
    let onTimeArrivals = 0
    let lateArrivals = 0
    let earlyArrivals = 0
    
    clockInEntries.forEach((entry) => {
      const entryDate = new Date(entry.timestamp)
      const expectedStartTime = getExpectedStartTimeForDate(staff, entryDate)

      if (expectedStartTime) {
        const expectedMinutes = timeToMinutes(expectedStartTime)
        const actualMinutes = entryDate.getHours() * 60 + entryDate.getMinutes()
        const diffMinutes = actualMinutes - expectedMinutes

        if (diffMinutes < -10) {
          // More than 10 minutes early
          earlyArrivals++
          onTimeArrivals++ // Early counts as on-time for punctuality
        } else if (diffMinutes <= 10) {
          // Within 10 minutes (on-time)
          onTimeArrivals++
        } else {
          // More than 10 minutes late
          lateArrivals++
        }
      } else {
        // If no expected time, consider it on-time
        onTimeArrivals++
      }
    })

    // Punctuality = percentage of on-time arrivals (not late)
    const punctualityRate = clockInEntries.length > 0 
      ? ((onTimeArrivals / clockInEntries.length) * 100) 
      : 0

    return {
      attendanceDays,
      totalWeekdays,
      attendanceRate: totalWeekdays > 0 ? (attendanceDays / totalWeekdays) * 100 : 0,
      totalClockIns: clockInEntries.length,
      manualEntries: manualEntries.length,
      punctualityRate,
      lateArrivals,
      onTimeArrivals,
      earlyArrivals,
    }
  }

  const getWeekdaysInRange = (startDate: Date, endDate: Date) => {
    let count = 0
    const current = new Date(startDate)

    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday (0) or Saturday (6)
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    return count
  }

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr || typeof timeStr !== "string") return 0

    const [time, period] = timeStr.split(" ")
    if (!time) return 0

    const timeParts = time.split(":")
    if (timeParts.length < 2) return 0

    const [hours, minutes] = timeParts.map(Number)
    let totalMinutes = hours * 60 + (minutes || 0)

    if (period === "PM" && hours !== 12) {
      totalMinutes += 12 * 60
    } else if (period === "AM" && hours === 12) {
      totalMinutes -= 12 * 60
    }

    return totalMinutes
  }


  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600"
    if (rate >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const getPunctualityColor = (rate: number) => {
    if (rate >= 85) return "text-green-600"
    if (rate >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  // Calculate term overview stats
  const termStats = {
    totalStaff: staffData.length,
    avgAttendance:
      staffData.length > 0
        ? staffData.reduce((sum, staff) => sum + getStaffAnalytics(staff).attendanceRate, 0) / staffData.length
        : 0,
    totalManualEntries: staffData.reduce((sum, staff) => sum + getStaffAnalytics(staff).manualEntries, 0),
    avgPunctuality:
      staffData.length > 0
        ? staffData.reduce((sum, staff) => sum + getStaffAnalytics(staff).punctualityRate, 0) / staffData.length
        : 0,
  }

  return (
    <div className="space-y-6">
      {/* Term Overview Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{termStats.totalStaff}</div>
                <div className="text-muted-foreground">Total Staff</div>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${getAttendanceColor(termStats.avgAttendance)}`}>
                  {termStats.avgAttendance.toFixed(1)}%
                </div>
                <div className="text-muted-foreground">Avg Attendance</div>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${getPunctualityColor(termStats.avgPunctuality)}`}>
                  {termStats.avgPunctuality.toFixed(1)}%
                </div>
                <div className="text-muted-foreground">Avg Punctuality</div>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{termStats.totalManualEntries}</div>
                <div className="text-muted-foreground">Manual Entries</div>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Analytics */}
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Individual Performance Analytics - {selectedTerm}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Punctuality</TableHead>
                <TableHead>Late Arrivals</TableHead>
                <TableHead>Manual Entries</TableHead>
                <TableHead>Total Clock-ins</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffData.map((staff) => {
                const analytics = getStaffAnalytics(staff)
                return (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          staff.role === "Student Lead" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400" : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {staff.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={`font-medium ${getAttendanceColor(analytics.attendanceRate)}`}>
                          {analytics.attendanceRate.toFixed(1)}%
                        </div>
                        <Progress value={analytics.attendanceRate} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {analytics.attendanceDays}/{analytics.totalWeekdays} days
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={`font-medium ${getPunctualityColor(analytics.punctualityRate)}`}>
                          {analytics.punctualityRate.toFixed(1)}%
                        </div>
                        <Progress value={analytics.punctualityRate} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {analytics.onTimeArrivals} on-time / {analytics.totalClockIns} total
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {analytics.lateArrivals > 0 ? (
                        <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                          {analytics.lateArrivals}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {analytics.manualEntries > 0 ? (
                        <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">{analytics.manualEntries}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{analytics.totalClockIns}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
