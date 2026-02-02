"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { Users } from "lucide-react"
import { type Student } from "@/lib/api"
import { parseDateString } from "@/lib/utils"
import { timeToMinutes } from "@/lib/shift-utils"

interface HourlyStaffingChartProps {
  staffData: Student[]
  termStartDate?: string
  termEndDate?: string
  selectedDate?: Date // When provided externally, hides the date picker
}

const chartConfig = {
  expected: {
    label: "Expected",
    color: "hsl(var(--muted-foreground))",
  },
  actual: {
    label: "Actual",
    color: "hsl(142, 76%, 36%)", // Green
  },
} satisfies ChartConfig

export function HourlyStaffingChart({ staffData, termStartDate, termEndDate, selectedDate: externalSelectedDate }: HourlyStaffingChartProps) {
  // Default to today if within term range, otherwise use term start date
  const getDefaultDate = () => {
    if (!termStartDate || !termEndDate) return new Date().toISOString().split("T")[0]
    const today = new Date()
    const start = parseDateString(termStartDate)
    const end = parseDateString(termEndDate)

    if (today >= start && today <= end) {
      return today.toISOString().split("T")[0]
    }
    return termStartDate
  }

  const [internalSelectedDate, setInternalSelectedDate] = useState(getDefaultDate)

  // Use external date if provided, otherwise use internal state
  const selectedDate = externalSelectedDate
    ? externalSelectedDate.toISOString().split("T")[0]
    : internalSelectedDate
  const showDatePicker = !externalSelectedDate && termStartDate && termEndDate

  const hourlyData = useMemo(() => {
    const hours = []
    const selectedDateObj = parseDateString(selectedDate)
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const
    const dayName = dayNames[selectedDateObj.getDay()] as keyof NonNullable<Student["weeklySchedule"]>

    // Generate hours from 8 AM to 5 PM
    for (let hour = 8; hour <= 16; hour++) {
      const hourStart = new Date(selectedDateObj)
      hourStart.setHours(hour, 0, 0, 0)
      const hourEnd = new Date(selectedDateObj)
      hourEnd.setHours(hour, 59, 59, 999)

      let actualCount = 0
      let expectedCount = 0

      staffData.forEach((staff) => {
        // Calculate EXPECTED workers from schedule
        const daySchedule = staff.weeklySchedule?.[dayName] || []
        daySchedule.forEach((shift) => {
          const [startStr, endStr] = shift.split("-").map((s) => s.trim())
          if (!startStr || !endStr) return

          const shiftStartMinutes = timeToMinutes(startStr)
          const shiftEndMinutes = timeToMinutes(endStr)
          const hourStartMinutes = hour * 60
          const hourEndMinutes = (hour + 1) * 60

          // Check if shift overlaps with this hour
          if (shiftStartMinutes < hourEndMinutes && shiftEndMinutes > hourStartMinutes) {
            expectedCount++
          }
        })

        // Calculate ACTUAL workers from clock entries
        const dayEntries = (staff.clockEntries || []).filter((entry) => {
          const entryDate = new Date(entry.timestamp)
          return entryDate.toDateString() === selectedDateObj.toDateString()
        })

        // Sort entries by timestamp
        const sortedEntries = [...dayEntries].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )

        // Pair clock-ins with clock-outs
        const sessions: { clockIn: Date; clockOut: Date | null }[] = []
        let currentClockIn: Date | null = null

        sortedEntries.forEach((entry) => {
          if (entry.type === "in") {
            currentClockIn = new Date(entry.timestamp)
          } else if (entry.type === "out" && currentClockIn) {
            sessions.push({
              clockIn: currentClockIn,
              clockOut: new Date(entry.timestamp),
            })
            currentClockIn = null
          }
        })

        // Handle open session (clocked in but not out yet)
        if (currentClockIn) {
          sessions.push({
            clockIn: currentClockIn,
            clockOut: null, // Still clocked in
          })
        }

        // Check if any session overlaps with this hour
        const isWorkingThisHour = sessions.some((session) => {
          const sessionEnd = session.clockOut || new Date() // Use current time if still clocked in
          // Session overlaps if it starts before hour ends AND ends after hour starts
          return session.clockIn <= hourEnd && sessionEnd >= hourStart
        })

        if (isWorkingThisHour) {
          actualCount++
        }
      })

      const formatHour = (h: number) => {
        if (h === 12) return "12PM"
        if (h < 12) return `${h}AM`
        return `${h - 12}PM`
      }
      const hourLabel = `${formatHour(hour)}-${formatHour(hour + 1)}`

      hours.push({
        hour: hourLabel,
        expected: expectedCount,
        actual: actualCount,
      })
    }

    return hours
  }, [staffData, selectedDate])

  const maxWorkers = Math.max(...hourlyData.map((d) => Math.max(d.expected, d.actual)), 1)

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Users className="w-4 h-4" />
          Hourly Staffing
        </CardTitle>
        {showDatePicker && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setInternalSelectedDate(e.target.value)}
            min={termStartDate}
            max={termEndDate}
            className="px-2 py-1 text-sm border rounded-md bg-background"
          />
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {/* @ts-expect-error - recharts types incompatibility with React 19 */}
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
            />
            {/* @ts-expect-error - recharts types incompatibility with React 19 */}
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              domain={[0, maxWorkers + 1]}
              allowDecimals={false}
            />
            {/* @ts-expect-error - recharts types incompatibility with React 19 */}
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            {/* @ts-expect-error - recharts types incompatibility with React 19 */}
            <Legend
              verticalAlign="top"
              height={30}
              formatter={(value: string) => <span className="text-xs text-muted-foreground capitalize">{value}</span>}
            />
            {/* @ts-expect-error - recharts types incompatibility with React 19 */}
            <Bar
              dataKey="expected"
              fill="var(--color-expected)"
              radius={[4, 4, 0, 0]}
              opacity={0.5}
            />
            {/* @ts-expect-error - recharts types incompatibility with React 19 */}
            <Bar
              dataKey="actual"
              fill="var(--color-actual)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
