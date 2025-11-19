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
          Lead
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/30">
          <UserCheck className="w-3 h-3 mr-1" />
          Assistant
        </Badge>
      )
    }
  }

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full"></div>
            <span className="text-base sm:text-lg">Currently Clocked In</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 sm:ml-auto">
            {clockedInUsers.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Name</TableHead>
                <TableHead className="min-w-[100px]">Role</TableHead>
                <TableHead className="min-w-[100px]">Clock In</TableHead>
                <TableHead className="min-w-[100px]">Shift End</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clockedInUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No one is currently clocked in
                  </TableCell>
                </TableRow>
              ) : (
                clockedInUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="font-mono text-sm">{formatClockInTime(user.todayActual || null)}</TableCell>
                    <TableCell className="text-sm">{getShiftEndTime(user)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
