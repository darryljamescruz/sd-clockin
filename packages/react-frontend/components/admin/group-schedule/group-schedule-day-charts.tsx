"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts"
import { Users, Shield } from "lucide-react"
import { type Student } from "@/lib/api"
import {
  buildHourlyScheduledCoverage,
  buildHourlyScheduledCoverageForWeekday,
  type WeekdayScheduleKey,
} from "@/lib/group-schedule-utils"
import { cn } from "@/lib/utils"

const stackedConfig = {
  assistants: {
    label: "Assistants",
    color: "hsl(215, 16%, 47%)",
  },
  leads: {
    label: "Leads",
    color: "hsl(217, 91%, 60%)",
  },
} satisfies ChartConfig

const lineConfig = {
  leads: {
    label: "Leads scheduled",
    color: "hsl(217, 91%, 60%)",
  },
} satisfies ChartConfig

interface GroupScheduleDayChartsProps {
  staffData: Student[]
  /** Calendar day (uses that day’s weekday in each student’s template). */
  date?: Date
  /** Saved template for this weekday only — same every week, no specific calendar date. */
  weekdayKey?: WeekdayScheduleKey
  /** Taller charts when false (default). */
  compact?: boolean
}

export function GroupScheduleDayCharts({
  staffData,
  date,
  weekdayKey,
  compact = false,
}: GroupScheduleDayChartsProps) {
  const hourlyRows = useMemo(() => {
    if (weekdayKey) return buildHourlyScheduledCoverageForWeekday(staffData, weekdayKey)
    if (date) return buildHourlyScheduledCoverage(staffData, date)
    return []
  }, [staffData, date, weekdayKey])
  const lineData = useMemo(() => hourlyRows.map((r) => ({ hour: r.hour, leads: r.leads })), [hourlyRows])

  const maxStack = Math.max(...hourlyRows.map((d) => d.total), 1)
  const maxLeads = Math.max(...hourlyRows.map((d) => d.leads), 1)

  return (
    <div className="space-y-4">
      <Card className="bg-card/70 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Users className="h-4 w-4" />
            Headcount by hour (scheduled)
          </CardTitle>
          <CardDescription>Stacked: assistants and leads on shift each hour.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={stackedConfig}
            className={cn("w-full", compact ? "h-[220px]" : "h-[280px]")}
          >
            <BarChart data={hourlyRows} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              {/* @ts-expect-error recharts / React 19 */}
              <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              {/* @ts-expect-error recharts / React 19 */}
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                domain={[0, maxStack + 1]}
                allowDecimals={false}
              />
              {/* @ts-expect-error recharts / React 19 */}
              <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.25 }} />
              {/* @ts-expect-error recharts / React 19 */}
              <Legend
                verticalAlign="top"
                height={32}
                formatter={(value: string) => (
                  <span className="text-xs capitalize text-muted-foreground">{value}</span>
                )}
              />
              {/* @ts-expect-error recharts / React 19 */}
              <Bar
                dataKey="assistants"
                stackId="a"
                fill="var(--color-assistants)"
                radius={[0, 0, 0, 0]}
              />
              {/* @ts-expect-error recharts / React 19 */}
              <Bar dataKey="leads" stackId="a" fill="var(--color-leads)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="bg-card/70 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Shield className="h-4 w-4" />
            Leads by hour
          </CardTitle>
          <CardDescription>How many student leads are scheduled in each hour.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineConfig} className={cn("w-full", compact ? "h-[200px]" : "h-[240px]")}>
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              {/* @ts-expect-error recharts / React 19 */}
              <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              {/* @ts-expect-error recharts / React 19 */}
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                domain={[0, maxLeads + 1]}
                allowDecimals={false}
              />
              {/* @ts-expect-error recharts / React 19 */}
              <ChartTooltip content={<ChartTooltipContent />} />
              {/* @ts-expect-error recharts / React 19 */}
              <Line
                type="monotone"
                dataKey="leads"
                stroke="var(--color-leads)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-leads)" }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
