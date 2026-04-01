"use client"

import { useEffect, useMemo, useState } from "react"
import type { DateRange } from "react-day-picker"
import { endOfDay, format, max, min, startOfDay } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, CalendarDays, Calendar as CalendarIcon, Clock, LogOut, Timer } from "lucide-react"
import { type Student } from "@/lib/api"
import { timeToMinutes, dateToMinutes } from "@/lib/time-utils"
import { getTodayScheduleForDate, getExpectedStartTimeFromSchedule } from "@/lib/schedule-utils"
import { PunctualityChart } from "@/components/admin/analytics/punctuality-chart"
import { WeeklyHoursChart } from "@/components/admin/analytics/weekly-hours-chart"
import { LateArrivalsByShiftHourChart } from "@/components/admin/analytics/late-arrivals-by-shift-hour-chart"
import { cn, parseDateString } from "@/lib/utils"

type PunctualityPeriod = "day" | "week" | "month" | "term" | "custom_range"

/** Matches late card: no shift that day → score vs 8 AM with same ±10 min window */
const IMPLIED_UNSCHEDULED_START_MINUTES = timeToMinutes("8:00 AM")

function resolveCustomDateRange(
  range: DateRange | undefined,
  termStart: Date,
  termEnd: Date
): { start: Date; end: Date } {
  if (!range?.from) return { start: termStart, end: termEnd }
  const rawStart = startOfDay(range.from)
  const rawEnd = startOfDay(range.to ?? range.from)
  const start = max([rawStart, startOfDay(termStart)])
  const end = min([endOfDay(rawEnd), endOfDay(termEnd)])
  if (start.getTime() > end.getTime()) return { start: termStart, end: termEnd }
  return { start: startOfDay(start), end: endOfDay(end) }
}

function computeActivePeriodRange(
  period: PunctualityPeriod,
  termStart: Date,
  termEnd: Date,
  customDateRange: DateRange | undefined
): { start: Date; end: Date } {
  const today = new Date()
  if (period === "day") {
    const start = new Date(today)
    start.setHours(0, 0, 0, 0)
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
  if (period === "custom_range") {
    return resolveCustomDateRange(customDateRange, termStart, termEnd)
  }
  return { start: termStart, end: termEnd }
}

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
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined)
  const [rangePickerOpen, setRangePickerOpen] = useState(false)

  const termStart = useMemo(() => parseDateString(termStartDate), [termStartDate])
  const termEnd = useMemo(() => parseDateString(termEndDate), [termEndDate])

  useEffect(() => {
    setCustomDateRange({
      from: parseDateString(termStartDate),
      to: parseDateString(termEndDate),
    })
  }, [termStartDate, termEndDate])

  const activePeriodRange = useMemo(
    () => computeActivePeriodRange(punctualityPeriod, termStart, termEnd, customDateRange),
    [punctualityPeriod, termStart, termEnd, customDateRange]
  )

  const termStartDay = useMemo(() => startOfDay(termStart), [termStart])
  const termEndDay = useMemo(() => startOfDay(termEnd), [termEnd])

  // Calculate punctuality stats for a date range (unscheduled days vs 8 AM, same ±10 min as late card)
  const calcPunctuality = (start: Date, end: Date) => {
    let onTime = 0, late = 0, early = 0

    staffData.forEach((staff) => {
      (staff.clockEntries || [])
        .filter((e) => e.type === "in" && new Date(e.timestamp) >= start && new Date(e.timestamp) <= end)
        .forEach((entry) => {
          const entryDate = new Date(entry.timestamp)
          const expected = getExpectedStartTime(staff, entryDate)
          const referenceMinutes = expected ? timeToMinutes(expected) : IMPLIED_UNSCHEDULED_START_MINUTES
          const diff = dateToMinutes(entryDate) - referenceMinutes
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

  const periodPunctuality = useMemo(() => {
    return calcPunctuality(activePeriodRange.start, activePeriodRange.end)
  }, [staffData, activePeriodRange.start, activePeriodRange.end])

  const periodLabel = useMemo(() => {
    const { start, end } = activePeriodRange
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    if (punctualityPeriod === "day") return fmt(start)
    if (punctualityPeriod === "week") return `${fmt(start)} - ${fmt(end)}`
    if (punctualityPeriod === "month") return start.toLocaleDateString("en-US", { month: "long" })
    if (punctualityPeriod === "custom_range") return `${fmt(start)} – ${fmt(end)}`
    return "Full Term"
  }, [activePeriodRange, punctualityPeriod])

  const customRangeButtonLabel = useMemo(() => {
    if (!customDateRange?.from) return "Select dates"
    if (customDateRange.to) {
      return `${format(customDateRange.from, "MMM d, yyyy")} – ${format(customDateRange.to, "MMM d, yyyy")}`
    }
    return format(customDateRange.from, "MMM d, yyyy")
  }, [customDateRange])

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
              <CalendarIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
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
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <Select value={punctualityPeriod} onValueChange={(v: string) => setPunctualityPeriod(v as PunctualityPeriod)}>
              <SelectTrigger className="w-full sm:w-[11rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="term">Full Term</SelectItem>
                <SelectItem value="custom_range">Custom dates</SelectItem>
              </SelectContent>
            </Select>
            {punctualityPeriod === "custom_range" && (
              <Popover open={rangePickerOpen} onOpenChange={setRangePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal sm:w-[min(100%,280px)]",
                      !customDateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{customRangeButtonLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={customDateRange?.from ?? termStart}
                    selected={customDateRange}
                    onSelect={(range) => {
                      setCustomDateRange(range)
                      if (range?.from && range?.to) setRangePickerOpen(false)
                    }}
                    numberOfMonths={2}
                    disabled={(date) => {
                      const d = startOfDay(date).getTime()
                      return d < termStartDay.getTime() || d > termEndDay.getTime()
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
          <PunctualityChart
            onTimeCount={periodPunctuality.onTime}
            lateCount={periodPunctuality.late}
            earlyCount={periodPunctuality.early}
            periodLabel={periodLabel}
          />
        </div>

        <WeeklyHoursChart
          staffData={staffData}
          termStartDate={termStartDate}
          termEndDate={termEndDate}
        />
      </div>

      <LateArrivalsByShiftHourChart
        staffData={staffData}
        rangeStart={activePeriodRange.start}
        rangeEnd={activePeriodRange.end}
        periodLabel={periodLabel}
      />
    </div>
  )
}
