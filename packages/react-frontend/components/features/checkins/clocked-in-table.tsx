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
  const formatClockInTime = (timeStr: string | null) => {
    if (!timeStr) return ""

    // If it's already formatted (includes AM/PM), return as is
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      return timeStr
    }

    // If it's an ISO timestamp, parse and format in user's timezone
    try {
      const date = new Date(timeStr)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch (e) {
      // Fallback: try to parse as HH:MM format
      const [hours, minutes] = timeStr.split(':')
      const hour = Number.parseInt(hours)
      const mins = minutes || '00'
      
      if (hour === 0) return `12:${mins} AM`
      if (hour < 12) return `${hour}:${mins} AM`
      if (hour === 12) return `12:${mins} PM`
      return `${hour - 12}:${mins} PM`
    }
  }
  
  const convertTo12Hour = (timeStr: string) => {
    if (!timeStr || timeStr === "No schedule") return timeStr

    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      return timeStr
    }

    const [hours, minutes] = timeStr.split(':')
    const hour = Number.parseInt(hours)
    const mins = minutes || '00'
    
    // Remove minutes if they're :00
    const displayMinutes = mins === '00' ? '' : `:${mins}`
    
    if (hour === 0) return `12${displayMinutes} AM`
    if (hour < 12) return `${hour}${displayMinutes} AM`
    if (hour === 12) return `12${displayMinutes} PM`
    return `${hour - 12}${displayMinutes} PM`
  }

  const getShiftEndTime = (staff: Student) => {
    if (staff.expectedEndShift) {
      return convertTo12Hour(staff.expectedEndShift)
    }
    return "No schedule"
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
                <TableCell className="font-mono">{formatClockInTime(user.todayActual || null)}</TableCell>
                <TableCell>{getShiftEndTime(user)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
