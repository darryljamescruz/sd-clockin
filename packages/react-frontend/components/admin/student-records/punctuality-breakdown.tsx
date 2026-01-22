/**
 * Punctuality breakdown component
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle2, AlertCircle, Timer, CalendarOff } from "lucide-react"

interface PunctualityBreakdownProps {
  punctuality: {
    early: number
    onTime: number
    late: number
    notScheduled: number
  }
}

export function PunctualityBreakdown({ punctuality }: PunctualityBreakdownProps) {
  const items = [
    {
      label: "Early",
      value: punctuality.early,
      description: ">10 min early",
      icon: Timer,
      color: "cyan",
    },
    {
      label: "On-Time",
      value: punctuality.onTime,
      description: "±10 min window",
      icon: CheckCircle2,
      color: "green",
    },
    {
      label: "Late",
      value: punctuality.late,
      description: ">10 min late",
      icon: AlertCircle,
      color: "orange",
    },
    {
      label: "Unscheduled",
      value: punctuality.notScheduled || 0,
      description: "Outside shifts",
      icon: CalendarOff,
      color: "blue",
    },
  ]

  const colorClasses = {
    cyan: {
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
      icon: "text-cyan-600 dark:text-cyan-400",
      text: "text-cyan-600 dark:text-cyan-400",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-950/30",
      icon: "text-green-600 dark:text-green-400",
      text: "text-green-600 dark:text-green-400",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-950/30",
      icon: "text-orange-600 dark:text-orange-400",
      text: "text-orange-600 dark:text-orange-400",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      icon: "text-blue-600 dark:text-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    },
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Arrival Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((item) => {
            const colors = colorClasses[item.color as keyof typeof colorClasses]
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={`rounded-lg p-4 ${colors.bg}`}
              >
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
      </CardContent>
    </Card>
  )
}




