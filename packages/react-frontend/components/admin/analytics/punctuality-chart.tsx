"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Label } from "recharts"
import { Clock } from "lucide-react"

interface PunctualityChartProps {
  onTimeCount: number
  lateCount: number
  earlyCount: number
  title?: string
  periodLabel?: string
}

const COLORS = {
  early: "hsl(217, 91%, 60%)", // Blue
  onTime: "hsl(142, 76%, 36%)", // Green
  late: "hsl(0, 84%, 60%)", // Red
}

const chartConfig = {
  early: {
    label: "Early",
    color: COLORS.early,
  },
  onTime: {
    label: "On-time",
    color: COLORS.onTime,
  },
  late: {
    label: "Late",
    color: COLORS.late,
  },
} satisfies ChartConfig

export function PunctualityChart({ onTimeCount, lateCount, earlyCount, title = "Punctuality Breakdown", periodLabel }: PunctualityChartProps) {
  const data = useMemo(() => {
    // On-time count includes early arrivals in the parent component, so we need to calculate "strictly on-time"
    const strictlyOnTime = onTimeCount - earlyCount

    return [
      { name: "early", value: earlyCount, fill: COLORS.early },
      { name: "onTime", value: strictlyOnTime, fill: COLORS.onTime },
      { name: "late", value: lateCount, fill: COLORS.late },
    ].filter((item) => item.value > 0)
  }, [onTimeCount, lateCount, earlyCount])

  const total = onTimeCount + lateCount // Total arrivals (early is already in onTimeCount)

  const getPercentage = (count: number) => {
    if (total === 0) return "0%"
    return `${((count / total) * 100).toFixed(1)}%`
  }

  // If no data, show empty state
  if (total === 0) {
    return (
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base font-medium">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {title}
            </span>
            {periodLabel && (
              <span className="text-sm font-normal text-muted-foreground">{periodLabel}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">No arrival data for this period</p>
        </CardContent>
      </Card>
    )
  }

  const strictlyOnTime = onTimeCount - earlyCount

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-medium">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {title}
          </span>
          {periodLabel && (
            <span className="text-sm font-normal text-muted-foreground">{periodLabel}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {total}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 18}
                            className="fill-muted-foreground text-xs"
                          >
                            arrivals
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
              />
            </PieChart>
          </ChartContainer>

          {/* Legend */}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.early }} />
              <span className="text-muted-foreground">Early:</span>
              <span className="font-medium">{earlyCount}</span>
              <span className="text-muted-foreground">({getPercentage(earlyCount)})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.onTime }} />
              <span className="text-muted-foreground">On-time:</span>
              <span className="font-medium">{strictlyOnTime}</span>
              <span className="text-muted-foreground">({getPercentage(strictlyOnTime)})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.late }} />
              <span className="text-muted-foreground">Late:</span>
              <span className="font-medium">{lateCount}</span>
              <span className="text-muted-foreground">({getPercentage(lateCount)})</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
