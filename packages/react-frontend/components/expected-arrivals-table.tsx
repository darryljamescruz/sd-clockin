"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Shield, UserCheck } from "lucide-react"
import { type Student } from "@/lib/api"
import { getUpcomingShifts, formatTimeForDisplay } from "@/lib/shift-utils"

interface ExpectedArrivalsTableProps {
  expectedArrivals: Student[]
  currentTime: Date
}

export function ExpectedArrivalsTable({ expectedArrivals, currentTime }: ExpectedArrivalsTableProps) {
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
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
            <span className="text-base sm:text-lg">Expected Arrivals</span>
          </div>
          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 sm:ml-auto">
            {expectedArrivals.length} Pending
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
                <TableHead className="min-w-[140px]">Today's Schedule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expectedArrivals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No expected arrivals in the next 2 hours
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
                            {upcomingShifts.map((shift, index) => (
                              <div
                                key={index}
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
