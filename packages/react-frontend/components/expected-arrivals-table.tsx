"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Shield, UserCheck } from "lucide-react"
import { type Student } from "@/lib/api"

interface ExpectedArrivalsTableProps {
  expectedArrivals: Student[]
}

export function ExpectedArrivalsTable({ expectedArrivals }: ExpectedArrivalsTableProps) {
  const getRoleBadge = (role: string) => {
    if (role === "Student Lead") {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Shield className="w-3 h-3 mr-1" />
          Student Lead
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">
          <UserCheck className="w-3 h-3 mr-1" />
          Assistant
        </Badge>
      )
    }
  }

  const getTodaySchedule = (staff: Staff, date = new Date()) => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = dayNames[date.getDay()]
    return staff.weeklySchedule?.[dayName] || []
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          Expected Arrivals
          <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800">
            {expectedArrivals.length} Pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200">
              <TableHead className="text-slate-700">Name</TableHead>
              <TableHead className="text-slate-700">Role</TableHead>
              <TableHead className="text-slate-700">Today's Schedule</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expectedArrivals.map((user) => (
              <TableRow key={user.id} className="border-slate-100">
                <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="font-mono text-slate-900">
                  {getTodaySchedule(user).length > 0 ? (
                    <div className="space-y-1">
                      {getTodaySchedule(user).map((block, index) => (
                        <div key={index} className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {block}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No schedule</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
