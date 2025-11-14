"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Shield, UserCheck } from "lucide-react"
import { getTodayScheduleForDate, isCurrentlyClockedIn, matchClockEntriesToShifts, formatTimeForDisplay } from "@/lib/shift-utils"
import { type Student } from "@/lib/api"

interface AttendanceOverviewProps {
  staffData: Student[]
  selectedTerm: string
}

export function AttendanceOverview({ staffData, selectedTerm }: AttendanceOverviewProps) {
  const getRoleBadge = (role: string) => {
    if (role === "Student Lead") {
      return (
        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-100">
          <Shield className="w-3 h-3 mr-1" />
          Student Lead
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <UserCheck className="w-3 h-3 mr-1" />
          Student Assistant
        </Badge>
      )
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      early: { color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400", label: "Early" },
      "on-time": { color: "bg-green-100 text-green-800", label: "On Time" },
      late: { color: "bg-red-100 text-red-800", label: "Late" },
      absent: { color: "bg-gray-100 text-gray-800", label: "Absent" },
      expected: { color: "bg-yellow-100 text-yellow-800", label: "Expected" },
    }

    const config = statusConfig[status] || statusConfig["expected"]
    return <Badge className={`${config.color} hover:${config.color}`}>{config.label}</Badge>
  }

  const getCurrentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
      present: { color: "bg-green-100 text-green-800", label: "Present", icon: "●" },
      expected: { color: "bg-yellow-100 text-yellow-800", label: "Expected", icon: "○" },
      absent: { color: "bg-red-100 text-red-800", label: "Absent", icon: "×" },
    }

    const config = statusConfig[status] || statusConfig["expected"]
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    )
  }

  const getTodayStatus = (staff: Student, date = new Date()) => {
    // Use shared logic to match clock entries to shifts
    const matchedShifts = matchClockEntriesToShifts(staff, date)
    
    // If any shift has a clock-in, use that status
    const shiftWithClockIn = matchedShifts.find(s => s.clockIn !== null)
    if (shiftWithClockIn) {
      return shiftWithClockIn.status
    }
    
    // If any shift is incoming, return incoming
    if (matchedShifts.some(s => s.status === "incoming")) {
      return "incoming"
    }
    
    // If any shift is absent, return absent
    if (matchedShifts.some(s => s.status === "absent")) {
      return "absent"
    }
    
    // Default to expected
    return "expected"
  }

  const getTodaySchedule = (staff: Student, date = new Date()) => {
    return getTodayScheduleForDate(staff, date)
  }
  
  const getCurrentStatus = (staff: Student, date = new Date()) => {
    // Use shared logic to check if currently clocked in (handles multiple shifts)
    if (isCurrentlyClockedIn(staff, date)) {
      return "present"
    }
    
    // Check if they have any upcoming shifts today
    const todaySchedule = getTodayScheduleForDate(staff, date)
    if (todaySchedule.length > 0) {
      return "expected"
    }
    
    return "absent"
  }

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Users className="w-5 h-5" />
          Today's Attendance Overview - {selectedTerm}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="">
              <TableHead className="text-foreground">Name</TableHead>
              <TableHead className="text-foreground">Role</TableHead>
              <TableHead className="text-foreground">Today's Schedule</TableHead>
              <TableHead className="text-foreground">Actual</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground">Current</TableHead>
              <TableHead className="text-foreground">Last Entry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffData.map((staff) => (
              <TableRow key={staff.id} className="border-slate-100">
                <TableCell className="font-medium text-foreground">{staff.name}</TableCell>
                <TableCell>{getRoleBadge(staff.role)}</TableCell>
                <TableCell className="font-mono text-foreground">
                  {getTodaySchedule(staff).length > 0 ? (
                    <div className="space-y-1">
                      {getTodaySchedule(staff).map((block, index) => (
                        <div
                          key={index}
                          className="text-xs bg-card border px-2 py-1 rounded shadow-sm"
                        >
                          {block}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Not scheduled</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-foreground">
                  {(() => {
                    const matchedShifts = matchClockEntriesToShifts(staff, new Date())
                    const shiftWithClockIn = matchedShifts.find(s => s.clockIn !== null)
                    return shiftWithClockIn?.clockIn || "—"
                  })()}
                </TableCell>
                <TableCell>{getStatusBadge(getTodayStatus(staff, new Date()))}</TableCell>
                <TableCell>{getCurrentStatusBadge(getCurrentStatus(staff, new Date()))}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {staff.clockEntries && staff.clockEntries.length > 0
                    ? new Date(staff.clockEntries[staff.clockEntries.length - 1].timestamp).toLocaleString()
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
