/**
 * Punctuality breakdown — donut chart, weekly trend, and text insights
 */

"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell, Label, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Timer,
  CalendarOff,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Calendar,
  ArrowRight,
} from "lucide-react"
import { type DailyBreakdownDay } from "./utils/student-calculations"
import { dateToMinutes, timeToMinutes, normalizeTime } from "@/lib/time-utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface PunctualityBreakdownProps {
  punctuality: {
    early: number
    onTime: number
    late: number
    notScheduled: number
    percentage: number
  }
  dailyBreakdownByWeek: Array<{
    weekNum: number
    startDate: Date
    endDate: Date
    days: Array<DailyBreakdownDay | null>
  }>
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = {
  early: "hsl(217, 91%, 60%)",
  onTime: "hsl(142, 76%, 36%)",
  late: "hsl(24, 95%, 53%)",
}

const donutConfig = {
  early: { label: "Early", color: COLORS.early },
  onTime: { label: "On-time", color: COLORS.onTime },
  late: { label: "Late", color: COLORS.late },
} satisfies ChartConfig

const trendConfig = {
  early: { label: "Early", color: COLORS.early },
  onTime: { label: "On-time", color: COLORS.onTime },
  late: { label: "Late", color: COLORS.late },
} satisfies ChartConfig

const tileColors = {
  cyan: { bg: "bg-cyan-50 dark:bg-cyan-950/30", icon: "text-cyan-600 dark:text-cyan-400", text: "text-cyan-600 dark:text-cyan-400" },
  green: { bg: "bg-green-50 dark:bg-green-950/30", icon: "text-green-600 dark:text-green-400", text: "text-green-600 dark:text-green-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/30", icon: "text-orange-600 dark:text-orange-400", text: "text-orange-600 dark:text-orange-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-950/30", icon: "text-blue-600 dark:text-blue-400", text: "text-blue-600 dark:text-blue-400" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type WeeklyPunctualityRow = { label: string; early: number; onTime: number; late: number; total: number }

function computeWeeklyPunctuality(
  weeklyData: PunctualityBreakdownProps["dailyBreakdownByWeek"]
): WeeklyPunctualityRow[] {
  return weeklyData
    .map((week) => {
      let early = 0, onTime = 0, late = 0

      for (const day of week.days) {
        if (!day || day.isDayOff || day.expectedShifts.length === 0) continue
        for (const shift of day.actualShifts) {
          const actual = dateToMinutes(new Date(shift.clockInEntry.timestamp))
          let earliest = Infinity
          for (const exp of day.expectedShifts) {
            const m = timeToMinutes(normalizeTime(exp.start))
            if (m < earliest) earliest = m
          }
          if (earliest === Infinity) continue
          const diff = actual - earliest
          if (diff < -10) early++
          else if (diff <= 10) onTime++
          else late++
        }
      }

      return {
        label: week.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        early,
        onTime,
        late,
        total: early + onTime + late,
      }
    })
    .filter((w) => w.total > 0)
}

function computeTardinessStats(weeklyData: PunctualityBreakdownProps["dailyBreakdownByWeek"]) {
  const lateMinutes: number[] = []

  for (const week of weeklyData) {
    for (const day of week.days) {
      if (!day || day.isDayOff || day.expectedShifts.length === 0) continue
      for (const shift of day.actualShifts) {
        const actual = dateToMinutes(new Date(shift.clockInEntry.timestamp))
        let earliest = Infinity
        for (const exp of day.expectedShifts) {
          const m = timeToMinutes(normalizeTime(exp.start))
          if (m < earliest) earliest = m
        }
        if (earliest === Infinity) continue
        const diff = actual - earliest
        if (diff > 10) lateMinutes.push(diff)
      }
    }
  }

  if (lateMinutes.length === 0) return null
  const sorted = [...lateMinutes].sort((a, b) => a - b)
  const avg = Math.round(lateMinutes.reduce((a, b) => a + b, 0) / lateMinutes.length)
  const median = sorted[Math.floor(sorted.length / 2)]
  const worst = sorted[sorted.length - 1]
  return { avg, median, worst, count: lateMinutes.length }
}

function computeTrend(rows: WeeklyPunctualityRow[]): "improving" | "declining" | "consistent" | null {
  if (rows.length < 3) return null
  const half = Math.floor(rows.length / 2)
  const rate = (slice: WeeklyPunctualityRow[]) =>
    slice.reduce((s, w) => s + (w.total > 0 ? (w.early + w.onTime) / w.total : 0), 0) / slice.length
  const diff = rate(rows.slice(rows.length - half)) - rate(rows.slice(0, half))
  if (diff > 0.1) return "improving"
  if (diff < -0.1) return "declining"
  return "consistent"
}

function computeWorstDay(weeklyData: PunctualityBreakdownProps["dailyBreakdownByWeek"]) {
  const byDay: Record<string, { late: number; total: number }> = {}

  for (const week of weeklyData) {
    for (const day of week.days) {
      if (!day || day.isDayOff || day.expectedShifts.length === 0) continue
      const name = day.dayName
      if (!byDay[name]) byDay[name] = { late: 0, total: 0 }
      for (const shift of day.actualShifts) {
        const actual = dateToMinutes(new Date(shift.clockInEntry.timestamp))
        let earliest = Infinity
        for (const exp of day.expectedShifts) {
          const m = timeToMinutes(normalizeTime(exp.start))
          if (m < earliest) earliest = m
        }
        if (earliest === Infinity) continue
        byDay[name].total++
        if (actual - earliest > 10) byDay[name].late++
      }
    }
  }

  let worst: { day: string; late: number; total: number } | null = null
  for (const [day, stats] of Object.entries(byDay)) {
    if (stats.total >= 2 && stats.late > 0) {
      if (!worst || stats.late / stats.total > worst.late / worst.total) {
        worst = { day, ...stats }
      }
    }
  }
  return worst
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PunctualityBreakdown({ punctuality, dailyBreakdownByWeek }: PunctualityBreakdownProps) {
  const { early, onTime, late, notScheduled, percentage } = punctuality
  const scheduledTotal = early + onTime + late

  const donutData = useMemo(
    () =>
      [
        { name: "early", value: early, fill: COLORS.early },
        { name: "onTime", value: onTime, fill: COLORS.onTime },
        { name: "late", value: late, fill: COLORS.late },
      ].filter((d) => d.value > 0),
    [early, onTime, late]
  )

  const weeklyTrend = useMemo(() => computeWeeklyPunctuality(dailyBreakdownByWeek), [dailyBreakdownByWeek])
  const tardiness = useMemo(() => computeTardinessStats(dailyBreakdownByWeek), [dailyBreakdownByWeek])
  const trend = useMemo(() => computeTrend(weeklyTrend), [weeklyTrend])
  const worstDay = useMemo(() => computeWorstDay(dailyBreakdownByWeek), [dailyBreakdownByWeek])

  const pct = (n: number) =>
    scheduledTotal === 0 ? "0%" : `${((n / scheduledTotal) * 100).toFixed(1)}%`

  const tiles = [
    { label: "Early", value: early, description: ">10 min early", icon: Timer, color: "cyan" as const },
    { label: "On-Time", value: onTime, description: "±10 min window", icon: CheckCircle2, color: "green" as const },
    { label: "Late", value: late, description: ">10 min late", icon: AlertCircle, color: "orange" as const },
    { label: "Unscheduled", value: notScheduled, description: "Outside shifts", icon: CalendarOff, color: "blue" as const },
  ]

  return (
    <div className="space-y-4">

      {/* ── Stat tiles + donut ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Arrival Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="grid grid-cols-2 gap-3">
              {tiles.map((item) => {
                const colors = tileColors[item.color]
                const Icon = item.icon
                return (
                  <div key={item.label} className={`rounded-lg p-4 ${colors.bg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${colors.icon}`} />
                      <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${colors.text}`}>{item.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                  </div>
                )
              })}
            </div>

            {scheduledTotal === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No arrival data yet
              </div>
            ) : (
              <div className="flex items-center gap-4 justify-center">
                <ChartContainer config={donutConfig} className="h-[180px] w-[180px] flex-shrink-0">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <Label
                        content={({ viewBox }: { viewBox?: { cx?: number; cy?: number } }) => {
                          if (viewBox?.cx != null && viewBox?.cy != null) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xl font-bold">
                                  {percentage}%
                                </tspan>
                                <tspan x={viewBox.cx} y={viewBox.cy + 16} className="fill-muted-foreground text-xs">
                                  on-time
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </PieChart>
                </ChartContainer>

                <div className="flex flex-col gap-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS.early }} />
                    <span className="text-muted-foreground">Early:</span>
                    <span className="font-medium">{early}</span>
                    <span className="text-muted-foreground text-xs">({pct(early)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS.onTime }} />
                    <span className="text-muted-foreground">On-time:</span>
                    <span className="font-medium">{onTime}</span>
                    <span className="text-muted-foreground text-xs">({pct(onTime)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS.late }} />
                    <span className="text-muted-foreground">Late:</span>
                    <span className="font-medium">{late}</span>
                    <span className="text-muted-foreground text-xs">({pct(late)})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Weekly trend ── */}
      {weeklyTrend.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Punctuality Trend by Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-[220px] w-full">
              <BarChart data={weeklyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="early" name="Early" stackId="a" fill={COLORS.early} radius={[0, 0, 0, 0]} />
                <Bar dataKey="onTime" name="On-time" stackId="a" fill={COLORS.onTime} radius={[0, 0, 0, 0]} />
                <Bar dataKey="late" name="Late" stackId="a" fill={COLORS.late} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
              {[{ color: COLORS.early, label: "Early" }, { color: COLORS.onTime, label: "On-time" }, { color: COLORS.late, label: "Late" }].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Text insights ── */}
      {scheduledTotal > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">

              {/* On-time rate */}
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <div>
                  <span className="font-medium">On-time rate: </span>
                  <span className="font-bold">{percentage}%</span>
                  <span className="text-muted-foreground">
                    {" "}— {early + onTime} of {scheduledTotal} scheduled arrival{scheduledTotal !== 1 ? "s" : ""} on time or early
                  </span>
                </div>
              </div>

              {/* Tardiness stats */}
              {tardiness ? (
                <div className="flex items-start gap-3 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                  <div>
                    <span className="font-medium">When late: </span>
                    <span className="font-bold">{tardiness.avg} min</span>
                    <span className="text-muted-foreground"> avg · </span>
                    <span className="font-bold">{tardiness.median} min</span>
                    <span className="text-muted-foreground"> median after shift start</span>
                    {tardiness.worst > tardiness.avg + 5 && (
                      <span className="text-muted-foreground"> (worst: {tardiness.worst} min)</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <span className="font-medium">No late arrivals</span>
                    <span className="text-muted-foreground"> — all scheduled shifts started on time or early</span>
                  </div>
                </div>
              )}

              {/* Trend */}
              {trend && (
                <div className="flex items-start gap-3 text-sm">
                  {trend === "improving" ? (
                    <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                  ) : trend === "declining" ? (
                    <TrendingDown className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <Minus className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <span className="font-medium">Trend: </span>
                    <span className={`font-bold ${
                      trend === "improving" ? "text-green-600 dark:text-green-400"
                      : trend === "declining" ? "text-orange-600 dark:text-orange-400"
                      : ""
                    }`}>
                      {trend === "improving" ? "Improving" : trend === "declining" ? "Declining" : "Consistent"}
                    </span>
                    <span className="text-muted-foreground">
                      {trend === "improving" && " — on-time rate is higher in recent weeks"}
                      {trend === "declining" && " — on-time rate has dropped in recent weeks"}
                      {trend === "consistent" && " — punctuality has been steady across the term"}
                    </span>
                  </div>
                </div>
              )}

              {/* Worst day pattern */}
              {worstDay && worstDay.late >= 2 && (
                <div className="flex items-start gap-3 text-sm">
                  <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Day pattern: </span>
                    <span className="font-bold">{worstDay.day}s</span>
                    <span className="text-muted-foreground">
                      {" "}have the highest late rate — {worstDay.late} of {worstDay.total} arrival{worstDay.total !== 1 ? "s" : ""} late
                    </span>
                  </div>
                </div>
              )}

              {/* Unscheduled note */}
              {notScheduled > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="font-medium">{notScheduled} unscheduled</span>
                    <span className="text-muted-foreground"> clock-in{notScheduled !== 1 ? "s" : ""} outside of scheduled shifts (not counted toward punctuality)</span>
                  </div>
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
