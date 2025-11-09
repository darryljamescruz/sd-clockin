"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, AlertCircle, Shield } from "lucide-react"

interface StatsCardsProps {
  totalStaff: number
  presentStaff: number
  studentLeads: number
  lateToday: number
}

export function StatsCards({ totalStaff, presentStaff, studentLeads, lateToday }: StatsCardsProps) {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">{totalStaff}</div>
              <div className="text-muted-foreground">Total Staff</div>
            </div>
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{presentStaff}</div>
              <div className="text-muted-foreground">Present Today</div>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 font-bold">●</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{studentLeads}</div>
              <div className="text-muted-foreground">Student Leads</div>
            </div>
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{lateToday}</div>
              <div className="text-muted-foreground">Late Today</div>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
