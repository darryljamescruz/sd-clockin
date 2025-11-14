/**
 * Student metrics cards component
 */

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, Calendar, TrendingUp, BarChart3 } from "lucide-react"

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
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Punctuality</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{punctuality.percentage}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {punctuality.onTime + punctuality.early} on-time / {punctuality.onTime + punctuality.early + punctuality.late} scheduled
                {punctuality.notScheduled > 0 && ` (${punctuality.notScheduled} not scheduled)`}
              </div>
            </div>
            <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <Progress value={punctuality.percentage} className="mt-3" />
        </CardContent>
      </Card>

      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Expected</div>
              <div className="text-3xl font-bold text-foreground">{totalExpected.toFixed(1)}h</div>
              <div className="text-xs text-muted-foreground mt-1">Scheduled hours</div>
            </div>
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Actual</div>
              <div className="text-3xl font-bold text-foreground">{totalActual.toFixed(1)}h</div>
              <div className="text-xs text-muted-foreground mt-1">Hours worked</div>
            </div>
            <TrendingUp className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Difference</div>
              <div className={`text-3xl font-bold ${totalActual >= totalExpected ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {totalActual >= totalExpected ? '+' : ''}{(totalActual - totalExpected).toFixed(1)}h
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalActual >= totalExpected ? 'Over' : 'Under'} schedule
              </div>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


