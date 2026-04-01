"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { AlertCircle } from "lucide-react"
import { type Student } from "@/lib/api"
import { dateToMinutes, timeToMinutes } from "@/lib/time-utils"
import { getTodayScheduleForDate, getExpectedStartTimeFromSchedule } from "@/lib/schedule-utils"

/** Scheduled start hour buckets: 8 AM through 4 PM only (5 PM and later excluded). */
const HOUR_START = 8
const HOUR_END = 16

const chartConfig = {
  late: {
    label: "Late arrivals",
    color: "hsl(0, 84%, 55%)",
  },
  count: {
    label: "Arrivals",
    color: "hsl(25, 95%, 48%)",
  },
} satisfies ChartConfig

/** Minutes after scheduled start; late-only events are all > 10. */
const SEVERITY_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "11–20 min", min: 11, max: 20 },
  { label: "21–30 min", min: 21, max: 30 },
  { label: "31–60 min", min: 31, max: 60 },
  { label: "61+ min", min: 61, max: Infinity },
]

function medianSorted(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

function getExpectedStartTime(staff: Student, date: Date): string | null {
  const schedule = getTodayScheduleForDate(staff, date)
  if (!schedule?.length) return null
  return getExpectedStartTimeFromSchedule(schedule[0])
}

function formatStartHourLabel(hour24: number): string {
  const d = new Date()
  d.setHours(hour24, 0, 0, 0)
  return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true })
}

/** When someone has no shift that day, we score lateness vs this implied start (same ±10 min window). */
const IMPLIED_UNSCHEDULED_START = "8:00 AM"

export interface LateArrivalsByShiftHourResult {
  chartData: { hour: number; label: string; late: number }[]
  severityData: { label: string; count: number }[]
  totalLate: number
  /** All clock-ins scored (scheduled + unscheduled) */
  totalArrivalsScored: number
  scheduledArrivals: number
  unscheduledArrivals: number
  lateRatePercent: number
  /** Average minutes after reference start, among late arrivals only */
  avgMinutesAfterStartLate: number | null
  /** Median minutes after reference start, among late arrivals only */
  medianMinutesAfterStartLate: number | null
}

export function getLateArrivalsByShiftHour(
  staffData: Student[],
  start: Date,
  end: Date
): LateArrivalsByShiftHourResult {
  const buckets = new Map<number, number>()
  for (let h = HOUR_START; h <= HOUR_END; h++) buckets.set(h, 0)

  let totalLate = 0
  let scheduledArrivals = 0
  let unscheduledArrivals = 0
  const impliedStartMinutes = timeToMinutes(IMPLIED_UNSCHEDULED_START)
  const lateMinutesAfterStart: number[] = []
  const severityCounts = SEVERITY_BUCKETS.map(() => 0)

  staffData.forEach((staff) => {
    (staff.clockEntries || [])
      .filter((e) => {
        if (e.type !== "in") return false
        const t = new Date(e.timestamp)
        return t >= start && t <= end
      })
      .forEach((entry) => {
        const entryDate = new Date(entry.timestamp)
        const expected = getExpectedStartTime(staff, entryDate)
        const isUnscheduled = !expected
        const referenceMinutes = expected ? timeToMinutes(expected) : impliedStartMinutes

        if (isUnscheduled) unscheduledArrivals++
        else scheduledArrivals++

        const diff = dateToMinutes(entryDate) - referenceMinutes
        if (diff <= 10) return

        totalLate++
        lateMinutesAfterStart.push(diff)
        const sevIdx = SEVERITY_BUCKETS.findIndex((b) => diff >= b.min && diff <= b.max)
        if (sevIdx >= 0) severityCounts[sevIdx]++

        const hourForBucket = isUnscheduled
          ? Math.floor(dateToMinutes(entryDate) / 60)
          : Math.floor(referenceMinutes / 60)
        if (hourForBucket < HOUR_START || hourForBucket > HOUR_END) return
        buckets.set(hourForBucket, (buckets.get(hourForBucket) || 0) + 1)
      })
  })

  const chartData: { hour: number; label: string; late: number }[] = []
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    chartData.push({
      hour: h,
      label: formatStartHourLabel(h),
      late: buckets.get(h) || 0,
    })
  }

  const totalArrivalsScored = scheduledArrivals + unscheduledArrivals
  const lateRatePercent =
    totalArrivalsScored > 0 ? Math.round((totalLate / totalArrivalsScored) * 1000) / 10 : 0

  const sortedLate = [...lateMinutesAfterStart].sort((a, b) => a - b)
  const avgMinutesAfterStartLate =
    totalLate > 0
      ? Math.round((lateMinutesAfterStart.reduce((s, m) => s + m, 0) / totalLate) * 10) / 10
      : null
  const medianMinutesAfterStartLate =
    totalLate > 0 ? Math.round(medianSorted(sortedLate) * 10) / 10 : null

  const severityData = SEVERITY_BUCKETS.map((b, i) => ({
    label: b.label,
    count: severityCounts[i],
  }))

  return {
    chartData,
    severityData,
    totalLate,
    totalArrivalsScored,
    scheduledArrivals,
    unscheduledArrivals,
    lateRatePercent,
    avgMinutesAfterStartLate,
    medianMinutesAfterStartLate,
  }
}

interface LateArrivalsByShiftHourChartProps {
  staffData: Student[]
  rangeStart: Date
  rangeEnd: Date
  periodLabel?: string
}

export function LateArrivalsByShiftHourChart({
  staffData,
  rangeStart,
  rangeEnd,
  periodLabel,
}: LateArrivalsByShiftHourChartProps) {
  const {
    chartData,
    severityData,
    totalLate,
    totalArrivalsScored,
    unscheduledArrivals,
    lateRatePercent,
    avgMinutesAfterStartLate,
    medianMinutesAfterStartLate,
  } = useMemo(
    () => getLateArrivalsByShiftHour(staffData, rangeStart, rangeEnd),
    [staffData, rangeStart, rangeEnd]
  )

  const maxLate = Math.max(...chartData.map((d) => d.late), 1)
  const maxSeverity = Math.max(...severityData.map((d) => d.count), 1)

  if (totalArrivalsScored === 0) {
    return (
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between gap-2 text-base font-medium">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Late arrivals
            </span>
            {periodLabel && (
              <span className="text-sm font-normal text-muted-foreground shrink-0">{periodLabel}</span>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground pt-1">
            Late is more than 10 minutes after the reference start (±10 min counts on time). Scheduled
            days use the shift start; days with no shift use {IMPLIED_UNSCHEDULED_START} as reference.
            By-hour bars: scheduled late by shift start hour; unscheduled late by clock-in hour (8
            AM–4 PM only).
          </p>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">No clock-ins in this period</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-base font-medium">
            <AlertCircle className="w-4 h-4" />
            Late arrivals
          </span>
          {periodLabel && (
            <span className="text-sm font-normal text-muted-foreground">{periodLabel}</span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-1">
          Late is more than 10 minutes after the reference start (±10 min counts on time). Scheduled days
          use the shift start; days with no shift use {IMPLIED_UNSCHEDULED_START} as reference. By-hour
          bars (8 AM–4 PM): scheduled late by shift start hour; unscheduled late by clock-in hour. 5 PM
          and later are omitted from the chart.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm pt-2">
          <span>
            <span className="text-muted-foreground">Late rate: </span>
            <span className="font-semibold tabular-nums">{lateRatePercent}%</span>
            <span className="text-muted-foreground">
              {" "}
              ({totalLate} of {totalArrivalsScored} arrivals
              {unscheduledArrivals > 0 && (
                <>
                  , {unscheduledArrivals} unscheduled
                </>
              )}
              )
            </span>
          </span>
          {totalLate > 0 && avgMinutesAfterStartLate != null && medianMinutesAfterStartLate != null && (
            <span>
              <span className="text-muted-foreground">When late: </span>
              <span className="font-semibold tabular-nums">{avgMinutesAfterStartLate} min</span>
              <span className="text-muted-foreground"> avg · </span>
              <span className="font-semibold tabular-nums">{medianMinutesAfterStartLate} min</span>
              <span className="text-muted-foreground"> median after start</span>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {totalLate === 0 && (
          <p className="text-sm text-muted-foreground">No late arrivals in this period.</p>
        )}
        {totalLate > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">How late (after reference start)</h4>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={severityData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  domain={[0, Math.max(Math.ceil(maxSeverity / 5) * 5, 5)]}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [`${value} arrivals`, "Count"]}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            By hour (8 AM–4 PM): shift start if scheduled, else clock-in time
          </h4>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={52}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                domain={[0, Math.max(Math.ceil(maxLate / 5) * 5, 5)]}
                allowDecimals={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`${value} late`, "Count"]}
              />
              <Bar dataKey="late" fill="var(--color-late)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
