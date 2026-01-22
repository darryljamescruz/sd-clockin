"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Timer } from "lucide-react"
import { type Student } from "@/lib/api"
import { parseDateString } from "@/lib/utils"

interface WeeklyHoursChartProps {
  staffData: Student[]
  termStartDate: string
  termEndDate: string
}

const chartConfig = {
  hours: {
    label: "Hours",
    color: "hsl(142, 76%, 36%)", // Green
  },
} satisfies ChartConfig

export function WeeklyHoursChart({ staffData, termStartDate, termEndDate }: WeeklyHoursChartProps) {
  const weeklyData = useMemo(() => {
    const startDate = parseDateString(termStartDate)
    const endDate = parseDateString(termEndDate)
    const today = new Date()
    const effectiveEndDate = endDate > today ? today : endDate

    // Get the start of the first week (Monday)
    const firstWeekStart = new Date(startDate)
    const dayOfWeek = startDate.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Sunday = 6 days back, else day - 1
    firstWeekStart.setDate(startDate.getDate() - daysToMonday)

    // Create weekly buckets
    const weeks: { weekStart: Date; weekEnd: Date; label: string; hours: number }[] = []
    let currentWeekStart = new Date(firstWeekStart)

    while (currentWeekStart <= effectiveEndDate) {
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(currentWeekStart.getDate() + 6)

      weeks.push({
        weekStart: new Date(currentWeekStart),
        weekEnd: new Date(weekEnd),
        label: formatWeekLabel(currentWeekStart, weekEnd),
        hours: 0,
      })

      currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    }

    // Calculate hours for each week
    staffData.forEach((staff) => {
      const termEntries = (staff.clockEntries || []).filter((entry) => {
        const entryDate = new Date(entry.timestamp)
        return entryDate >= startDate && entryDate <= endDate
      })

      // Sort entries by timestamp
      const sortedEntries = [...termEntries].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      // Pair clock-ins with clock-outs and add hours to appropriate week
      let currentClockIn: Date | null = null
      sortedEntries.forEach((entry) => {
        if (entry.type === "in") {
          currentClockIn = new Date(entry.timestamp)
        } else if (entry.type === "out" && currentClockIn) {
          const clockOut = new Date(entry.timestamp)
          const hoursWorked = (clockOut.getTime() - currentClockIn.getTime()) / (1000 * 60 * 60)

          // Only count reasonable sessions (less than 12 hours)
          if (hoursWorked > 0 && hoursWorked < 12) {
            // Find which week this session belongs to
            const sessionDate = currentClockIn
            const weekIndex = weeks.findIndex(
              (w) => sessionDate >= w.weekStart && sessionDate <= w.weekEnd
            )
            if (weekIndex !== -1) {
              weeks[weekIndex].hours += hoursWorked
            }
          }
          currentClockIn = null
        }
      })
    })

    // Round hours and filter out weeks with no data before term started
    return weeks
      .filter((w) => w.weekEnd >= startDate)
      .map((w) => ({
        ...w,
        hours: Math.round(w.hours * 10) / 10,
      }))
  }, [staffData, termStartDate, termEndDate])

  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 1)

  if (weeklyData.length === 0 || weeklyData.every((d) => d.hours === 0)) {
    return (
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Timer className="w-4 h-4" />
            Weekly Hours Worked
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">No hours data for this term</p>
        </CardContent>
      </Card>
    )
  }

  const totalHours = weeklyData.reduce((sum, w) => sum + w.hours, 0)
  const avgPerWeek = weeklyData.length > 0 ? Math.round((totalHours / weeklyData.length) * 10) / 10 : 0

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-medium">
          <span className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Weekly Hours Worked
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            Avg: {avgPerWeek} hrs/week
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              domain={[0, Math.ceil(maxHours / 10) * 10]}
              allowDecimals={false}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value) => [`${value} hours`, "Total"]}
            />
            <Bar
              dataKey="hours"
              fill="var(--color-hours)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function formatWeekLabel(weekStart: Date, weekEnd: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${fmt(weekStart)} - ${fmt(weekEnd)}`
}
