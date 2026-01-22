/**
 * Student metrics cards component
 */

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, Calendar, TrendingUp, TrendingDown, BarChart3 } from "lucide-react"

interface StudentMetricsProps {
  punctuality: {
    percentage: number
    onTime: number
    early: number
    late: number
    notScheduled: number
  }
  totalExpected: number
  totalActual: number
}

export function StudentMetrics({ punctuality, totalExpected, totalActual }: StudentMetricsProps) {
  const diff = totalActual - totalExpected
  const isOverSchedule = diff >= 0
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Punctuality */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Punctuality</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{punctuality.percentage}%</p>
            </div>
            <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <Progress value={punctuality.percentage} className="mt-3 h-1.5" />
          <p className="text-xs text-muted-foreground mt-2">
            {punctuality.onTime + punctuality.early} on-time of {punctuality.onTime + punctuality.early + punctuality.late} shifts
          </p>
        </CardContent>
      </Card>

      {/* Expected Hours */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Expected</p>
              <p className="text-2xl font-bold">{totalExpected.toFixed(1)}<span className="text-base font-normal text-muted-foreground ml-1">hrs</span></p>
            </div>
            <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Total scheduled hours
          </p>
        </CardContent>
      </Card>

      {/* Actual Hours */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Actual</p>
              <p className="text-2xl font-bold">{totalActual.toFixed(1)}<span className="text-base font-normal text-muted-foreground ml-1">hrs</span></p>
            </div>
            <div className="rounded-full p-2 bg-cyan-100 dark:bg-cyan-900/30">
              <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Total hours worked
          </p>
        </CardContent>
      </Card>

      {/* Difference */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Difference</p>
              <p className={`text-2xl font-bold ${isOverSchedule ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {isOverSchedule ? '+' : ''}{diff.toFixed(1)}<span className="text-base font-normal ml-1">hrs</span>
              </p>
            </div>
            <div className={`rounded-full p-2 ${isOverSchedule ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
              {isOverSchedule ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {isOverSchedule ? 'Over' : 'Under'} scheduled hours
          </p>
        </CardContent>
      </Card>
    </div>
  )
}




