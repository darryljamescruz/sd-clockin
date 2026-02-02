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
import { formatTimestampToDisplay, formatTimeForDisplay } from "@/lib/time-utils"

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
    if (timeStr.includes("AM") || timeStr.includes("PM") || timeStr.includes("am") || timeStr.includes("pm")) {
      return timeStr
    }

    // If it's an ISO timestamp, parse and format
    try {
      return formatTimestampToDisplay(timeStr)
    } catch {
      // Fallback to formatTimeForDisplay for other formats
      return formatTimeForDisplay(timeStr)
    }
  }

  const getShiftEndTime = (staff: Student) => {
    if (staff.expectedEndShift) {
      return formatTimeForDisplay(staff.expectedEndShift)
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
      <Card className="bg-gradient-to-br from-card via-card to-card/90 backdrop-blur-md shadow-xl border-border/50 ring-1 ring-border/20 overflow-hidden">
        <CardHeader className="pb-4 pt-5 px-5 sm:px-6 border-b border-border/30 bg-muted/20">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-foreground">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full shadow-sm shadow-green-500/50 animate-pulse"></div>
              <span className="text-base sm:text-lg font-semibold">Currently Clocked In</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 sm:ml-auto font-medium shadow-sm">
              {clockedInUsers.length} Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-4">
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                          <UserCheck className="w-6 h-6 text-muted-foreground/60" />
                        </div>
                        <span className="text-sm font-medium">No one is currently clocked in</span>
                      </div>
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
                      <TableCell className="font-mono text-sm">{getShiftEndTime(user)}</TableCell>
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
