"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DoorOpen, Shield, UserCheck } from "lucide-react"
import { type Student } from "@/lib/api"

interface ClockedInTableProps {
  clockedInUsers: Student[]
  onClockOutClick?: (user: Student) => void
}

export function ClockedInTable({ clockedInUsers, onClockOutClick }: ClockedInTableProps) {
  const [selectedUser, setSelectedUser] = useState<Student | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const formatClockInTime = (timeStr: string | null) => {
    if (!timeStr) return ""

    // If it's already formatted (includes AM/PM), return as is
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      return timeStr
    }

    // If it's an ISO timestamp, parse and format in user's timezone
    try {
      const date = new Date(timeStr)
      // Use numeric hour to avoid leading zeros (e.g., 8:05 AM instead of 08:05 AM)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
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

  const requestClockOut = (user: Student) => {
    if (!onClockOutClick) return
    setSelectedUser(user)
    setIsConfirmOpen(true)
  }

  const handleConfirmClockOut = () => {
    if (selectedUser && onClockOutClick) {
      onClockOutClick(selectedUser)
    }
    setIsConfirmOpen(false)
    setSelectedUser(null)
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsConfirmOpen(false)
      setSelectedUser(null)
    } else {
      setIsConfirmOpen(true)
    }
  }

  return (
    <>
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
                  <TableHead className="min-w-[180px]">Name</TableHead>
                  <TableHead className="min-w-[100px]">Role</TableHead>
                  <TableHead className="min-w-[100px]">Clock In</TableHead>
                  <TableHead className="min-w-[100px]">Shift End</TableHead>
                  <TableHead className="text-right min-w-[70px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clockedInUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No one is currently clocked in
                    </TableCell>
                  </TableRow>
                ) : (
                  clockedInUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell
                        className={`font-medium whitespace-normal break-words ${onClockOutClick ? "text-primary hover:underline cursor-pointer" : ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
                        role={onClockOutClick ? "button" : undefined}
                        tabIndex={onClockOutClick ? 0 : -1}
                        onClick={() => requestClockOut(user)}
                        onKeyDown={(e) => {
                          if (!onClockOutClick) return
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            requestClockOut(user)
                          }
                        }}
                        title={onClockOutClick ? "Click to clock out" : undefined}
                      >
                        {user.name}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="font-mono text-sm">{formatClockInTime(user.todayActual || null)}</TableCell>
                      <TableCell className="text-sm">{getShiftEndTime(user)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => requestClockOut(user)}
                          disabled={!onClockOutClick}
                          aria-label={`Clock out ${user.name}`}
                          className="text-destructive hover:text-destructive focus-visible:ring-destructive"
                        >
                          <DoorOpen className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to clock out?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser ? `Clock out ${selectedUser.name} now?` : "This will clock out the selected person."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleDialogClose(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClockOut}>Clock Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
