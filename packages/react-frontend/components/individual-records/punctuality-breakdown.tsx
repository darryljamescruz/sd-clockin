/**
 * Punctuality breakdown component
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface PunctualityBreakdownProps {
  punctuality: {
    early: number
    onTime: number
    late: number
    notScheduled: number
  }
}

export function PunctualityBreakdown({ punctuality }: PunctualityBreakdownProps) {
  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Arrival Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Early Arrivals</div>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{punctuality.early}</div>
            <Badge className="mt-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400">
              &gt;10 min early
            </Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">On-Time Arrivals</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{punctuality.onTime}</div>
            <Badge className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
              ±10 min window
            </Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Late Arrivals</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{punctuality.late}</div>
            <Badge className="mt-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">
              &gt;10 min late
            </Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Not Scheduled</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{punctuality.notScheduled || 0}</div>
            <Badge className="mt-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
              Outside shifts
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


