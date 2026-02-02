"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Clock, Calendar, LogOut, Timer } from "lucide-react"
import { type Student } from "@/lib/api"
import { parseDateString } from "@/lib/utils"
import { timeToMinutes, dateToMinutes } from "@/lib/time-utils"
import { getTodayScheduleForDate, getExpectedStartTimeFromSchedule } from "@/lib/schedule-utils"
import { PunctualityChart } from "@/components/admin/analytics/punctuality-chart"
import { WeeklyHoursChart } from "@/components/admin/analytics/weekly-hours-chart"

type PunctualityPeriod = "day" | "week" | "month" | "term"

interface TermAnalyticsProps {
  staffData: Student[]
  termStartDate: string
  termEndDate: string
}

// Helper: Get expected start time for a staff member on a specific date
const getExpectedStartTime = (staff: Student, date: Date): string | null => {
  const schedule = getTodayScheduleForDate(staff, date)
  if (!schedule?.length) return null
  return getExpectedStartTimeFromSchedule(schedule[0])
}

export function TermAnalytics({ staffData, termStartDate, termEndDate }: TermAnalyticsProps) {
  const [punctualityPeriod, setPunctualityPeriod] = useState<PunctualityPeriod>("term")

  const termStart = useMemo(() => parseDateString(termStartDate), [termStartDate])
  const termEnd = useMemo(() => parseDateString(termEndDate), [termEndDate])

  // Get date range for punctuality period
  const getPeriodRange = (period: PunctualityPeriod) => {
    const today = new Date()
    if (period === "day") {
      const start = new Date(today.setHours(0, 0, 0, 0))
      return { start, end: new Date(start.getTime() + 86399999) }
    }
    if (period === "week") {
      const start = new Date(today)
      const dayOfWeek = today.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      start.setDate(today.getDate() - daysToMonday)
      start.setHours(0, 0, 0, 0)
      return { start, end: new Date(start.getTime() + 6 * 86400000 + 86399999) }
    }
    if (period === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
      return { start, end }
    }
    return { start: termStart, end: termEnd }
  }

  // Calculate punctuality stats for a date range
  const calcPunctuality = (start: Date, end: Date) => {
    let onTime = 0, late = 0, early = 0

    staffData.forEach((staff) => {
      (staff.clockEntries || [])
        .filter((e) => e.type === "in" && new Date(e.timestamp) >= start && new Date(e.timestamp) <= end)
        .forEach((entry) => {
          const entryDate = new Date(entry.timestamp)
          const expected = getExpectedStartTime(staff, entryDate)
          if (!expected) { onTime++; return }

          const diff = dateToMinutes(entryDate) - timeToMinutes(expected)
          if (diff < -10) { early++; onTime++ }
          else if (diff <= 10) { onTime++ }
          else { late++ }
        })
    })
    return { onTime, late, early }
  }

  // Calculate all term stats
  const termStats = useMemo(() => {
    let totalManual = 0, autoClockOuts = 0, totalClockOuts = 0, hoursWorked = 0
    const punctuality = calcPunctuality(termStart, termEnd)

    staffData.forEach((staff) => {
      const entries = (staff.clockEntries || []).filter((e) => {
        const d = new Date(e.timestamp)
        return d >= termStart && d <= termEnd
      })

      entries.forEach((e) => {
        if (e.isManual) totalManual++
        if (e.type === "out") {
          totalClockOuts++
          if (e.isAutoClockOut) autoClockOuts++
        }
      })

      // Calculate hours from paired entries
      let clockIn: Date | null = null
      entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .forEach((e) => {
          if (e.type === "in") clockIn = new Date(e.timestamp)
          else if (e.type === "out" && clockIn) {
            const hrs = (new Date(e.timestamp).getTime() - clockIn.getTime()) / 3600000
            if (hrs > 0 && hrs < 12) hoursWorked += hrs
            clockIn = null
          }
        })
    })

    const avgPunctuality = (punctuality.onTime + punctuality.late) > 0
      ? (punctuality.onTime / (punctuality.onTime + punctuality.late)) * 100 : 0

    return {
      totalStaff: staffData.length,
      avgPunctuality,
      totalManual,
      autoClockOuts,
      totalClockOuts,
      autoClockOutRate: totalClockOuts > 0 ? (autoClockOuts / totalClockOuts) * 100 : 0,
      totalHours: Math.round(hoursWorked * 10) / 10,
      avgHoursPerPerson: staffData.length > 0 ? Math.round((hoursWorked / staffData.length) * 10) / 10 : 0,
    }
  }, [staffData, termStart, termEnd])

  // Period-specific punctuality
  const periodPunctuality = useMemo(() => {
    const { start, end } = getPeriodRange(punctualityPeriod)
    return calcPunctuality(start, end)
  }, [staffData, punctualityPeriod, termStart, termEnd])

  const getPeriodLabel = () => {
    const { start, end } = getPeriodRange(punctualityPeriod)
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    if (punctualityPeriod === "day") return fmt(start)
    if (punctualityPeriod === "week") return `${fmt(start)} - ${fmt(end)}`
    if (punctualityPeriod === "month") return start.toLocaleDateString("en-US", { month: "long" })
    return "Full Term"
  }

  const getColor = (rate: number, thresholds: [number, number]) =>
    rate >= thresholds[0] ? "text-green-600 dark:text-green-400" :
    rate >= thresholds[1] ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"

  return (
    <div className="space-y-6">
      {/* Stats Row 1 */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{termStats.totalStaff}</div>
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
                <div className={`text-2xl font-bold ${getColor(termStats.avgPunctuality, [85, 70])}`}>
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
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{termStats.totalManual}</div>
                <div className="text-muted-foreground">Manual Entries</div>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row 2 */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{termStats.totalHours}</div>
                <div className="text-muted-foreground">Total Hours Worked</div>
                <div className="text-xs text-muted-foreground mt-1">~{termStats.avgHoursPerPerson} hrs/person</div>
              </div>
              <Timer className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${getColor(100 - termStats.autoClockOutRate, [90, 80])}`}>
                  {termStats.autoClockOutRate.toFixed(1)}%
                </div>
                <div className="text-muted-foreground">Auto Clock-out Rate</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {termStats.autoClockOuts} of {termStats.totalClockOuts}
                </div>
              </div>
              <LogOut className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-end">
            <Select value={punctualityPeriod} onValueChange={(v: string) => setPunctualityPeriod(v as PunctualityPeriod)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="term">Full Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <PunctualityChart
            onTimeCount={periodPunctuality.onTime}
            lateCount={periodPunctuality.late}
            earlyCount={periodPunctuality.early}
            periodLabel={getPeriodLabel()}
          />
        </div>

        <WeeklyHoursChart
          staffData={staffData}
          termStartDate={termStartDate}
          termEndDate={termEndDate}
        />
      </div>
    </div>
  )
}
