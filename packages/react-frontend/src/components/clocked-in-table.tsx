"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Shield, UserCheck, MapPin } from "lucide-react"

interface Staff {
  id: number
  name: string
  role: string
  todayActual: string
  assignedLocation?: string
  weeklySchedule?: {
    monday?: string[]
    tuesday?: string[]
    wednesday?: string[]
    thursday?: string[]
    friday?: string[]
    saturday?: string[]
    sunday?: string[]
  }
}

interface ClockedInTableProps {
  clockedInUsers: Staff[]
}

export function ClockedInTable({ clockedInUsers }: ClockedInTableProps) {
  const getTodaySchedule = (staff: Staff, date = new Date()) => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = dayNames[date.getDay()]
    return staff.weeklySchedule?.[dayName] || []
  }

  const getShiftEndTime = (staff: Staff) => {
    const todaySchedule = getTodaySchedule(staff)
    if (todaySchedule.length === 0) return "No schedule"

    // Find the shift that matches the clock-in time
    const clockInTime = staff.todayActual
    if (!clockInTime) return "No schedule"

    // Convert clock-in time to minutes for comparison
    const clockInMinutes = timeToMinutes(clockInTime)

    // Find the matching shift
    for (const shift of todaySchedule) {
      const [startTime, endTime] = shift.split("-").map((t) => t.trim())
      const shiftStartMinutes = timeToMinutes(convertTo12Hour(startTime))
      const shiftEndMinutes = timeToMinutes(convertTo12Hour(endTime))

      // Check if clock-in falls within this shift (with 30 min grace period)
      if (clockInMinutes >= shiftStartMinutes - 30 && clockInMinutes <= shiftEndMinutes) {
        return convertTo12Hour(endTime)
      }
    }

    // If no matching shift found, return the end of the last shift
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

    // If already in 12-hour format, return as is
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      return timeStr
    }

    // Convert 24-hour to 12-hour format
    const hour = Number.parseInt(timeStr)
    if (hour === 0) return "12:00 AM"
    if (hour < 12) return `${hour}:00 AM`
    if (hour === 12) return "12:00 PM"
    return `${hour - 12}:00 PM`
  }

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

  const getLocationBadge = (location?: string) => {
    if (!location) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <MapPin className="w-3 h-3 mr-1" />
          Pending Assignment
        </Badge>
      )
    }

    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <MapPin className="w-3 h-3 mr-1" />
        {location}
      </Badge>
    )
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          Currently Clocked In
          <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
            {clockedInUsers.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200">
              <TableHead className="text-slate-700">Name</TableHead>
              <TableHead className="text-slate-700">Role</TableHead>
              <TableHead className="text-slate-700">Clock In</TableHead>
              <TableHead className="text-slate-700">Shift End</TableHead>
              <TableHead className="text-slate-700">Assigned Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clockedInUsers.map((user) => (
              <TableRow key={user.id} className="border-slate-100">
                <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="font-mono text-slate-900">{user.todayActual}</TableCell>
                <TableCell className="font-mono text-slate-900">{getShiftEndTime(user)}</TableCell>
                <TableCell>{getLocationBadge(user.assignedLocation)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
