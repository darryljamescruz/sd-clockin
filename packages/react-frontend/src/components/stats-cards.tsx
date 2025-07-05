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
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">{totalStaff}</div>
              <div className="text-slate-600">Total Staff</div>
            </div>
            <Users className="w-8 h-8 text-slate-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">{presentStaff}</div>
              <div className="text-slate-600">Present Today</div>
            </div>
                          <div className="w-8 h-8 status-success rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">●</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">{studentLeads}</div>
              <div className="text-slate-600">Student Leads</div>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-700">{lateToday}</div>
              <div className="text-slate-600">Late Today</div>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
