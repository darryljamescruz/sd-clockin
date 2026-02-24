"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DoorOpen, Shield, UserCheck } from "lucide-react"
import { type Student } from "@/lib/api"
import { getUpcomingShifts, formatTimeForDisplay } from "@/lib/shift-utils"

interface ExpectedArrivalsTableProps {
  expectedArrivals: Student[]
  currentTime: Date
  onClockInClick?: (user: Student) => void
}

export function ExpectedArrivalsTable({ expectedArrivals, currentTime, onClockInClick }: ExpectedArrivalsTableProps) {
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

  // Format shift time for display
  const formatShiftTime = (startTime: string, endTime: string) => {
    return `${formatTimeForDisplay(startTime)}-${formatTimeForDisplay(endTime)}`
  }

  return (
    <Card className="bg-gradient-to-br from-card via-card to-card/90 backdrop-blur-md shadow-xl border-border/50 ring-1 ring-border/20 overflow-hidden">
      <CardHeader className="pb-4 pt-5 px-5 sm:px-6 border-b border-border/30 bg-muted/20">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full shadow-sm shadow-blue-500/50"></div>
            <span className="text-base sm:text-lg font-semibold">Expected Arrivals</span>
          </div>
          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 sm:ml-auto font-medium shadow-sm">
            {expectedArrivals.length} Pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Name</TableHead>
                <TableHead className="min-w-[100px]">Role</TableHead>
                <TableHead className="min-w-[140px]">Today's Schedule</TableHead>
                <TableHead className="text-right min-w-[70px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expectedArrivals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-muted-foreground/60" />
                      </div>
                      <span className="text-sm font-medium">No expected arrivals in the next 2 hours</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                expectedArrivals.map((user) => {
                  // Get all upcoming shifts for this user
                  const upcomingShifts = getUpcomingShifts(user, currentTime, 2, 10)
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {upcomingShifts.length > 0 ? (
                          <div className="space-y-1">
                            {upcomingShifts.map((shift) => (
                              <div
                                key={`${user.id}-${shift.start}-${shift.end ?? "no-end"}`}
                                className="font-mono px-2 py-1 mr-1"
                              >
                                {formatShiftTime(shift.start, shift.end)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">No schedule</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onClockInClick?.(user)}
                          disabled={!onClockInClick}
                          aria-label={`Clock in ${user.name}`}
                          className="text-primary hover:text-primary focus-visible:ring-primary"
                        >
                          <DoorOpen className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
