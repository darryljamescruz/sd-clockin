"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Shield, UserCheck } from "lucide-react"
import { type Student } from "@/lib/api"

interface ClockedInTableProps {
  clockedInUsers: Student[]
}

export function ClockedInTable({ clockedInUsers }: ClockedInTableProps) {
  const getTodaySchedule = (staff: Student, date = new Date()) => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = dayNames[date.getDay()]
    return staff.weeklySchedule?.[dayName] || []
  }

  const getShiftEndTime = (staff: Student) => {
    const todaySchedule = getTodaySchedule(staff)
    if (todaySchedule.length === 0) return "No schedule"

    const clockInTime = staff.todayActual
    if (!clockInTime) return "No schedule"

    const clockInMinutes = timeToMinutes(clockInTime)

    for (const shift of todaySchedule) {
      const [startTime, endTime] = shift.split("-").map((t) => t.trim())
      const shiftStartMinutes = timeToMinutes(convertTo12Hour(startTime))
      const shiftEndMinutes = timeToMinutes(convertTo12Hour(endTime))

      if (clockInMinutes >= shiftStartMinutes - 30 && clockInMinutes <= shiftEndMinutes) {
        return convertTo12Hour(endTime)
      }
    }

    const lastShift = todaySchedule[todaySchedule.length - 1]
    const endTime = lastShift.split("-")[1]?.trim()
    return endTime ? convertTo12Hour(endTime) : "No schedule"
  }

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0
    const [time, period] = timeStr.split(" ")
    const [hours, minutes] = time.split(":").map(Number)
    let totalMinutes = hours * 60 + (minutes || 0)

    if (period === "PM" && hours !== 12) {
      totalMinutes += 12 * 60
    } else if (period === "AM" && hours === 12) {
      totalMinutes -= 12 * 60
    }

    return totalMinutes
  }

  const convertTo12Hour = (timeStr: string) => {
    if (!timeStr) return ""

    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      return timeStr
    }

    const hour = Number.parseInt(timeStr)
    if (hour === 0) return "12:00 AM"
    if (hour < 12) return `${hour}:00 AM`
    if (hour === 12) return "12:00 PM"
    return `${hour - 12}:00 PM`
  }

  const getRoleBadge = (role: string) => {
    if (role === "Student Lead") {
      return (
        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">
          <Shield className="w-3 h-3 mr-1" />
          Student Lead
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">
          <UserCheck className="w-3 h-3 mr-1" />
          Assistant
        </Badge>
      )
    }
  }

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full"></div>
          Currently Clocked In
          <Badge variant="secondary" className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
            {clockedInUsers.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Shift End</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clockedInUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="font-mono">{user.todayActual}</TableCell>
                <TableCell className="font-mono">{getShiftEndTime(user)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
