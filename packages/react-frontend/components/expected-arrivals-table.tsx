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

  const getTodaySchedule = (staff: Staff, date = new Date()) => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = dayNames[date.getDay()]
    return staff.weeklySchedule?.[dayName] || []
  }

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
          Expected Arrivals
          <Badge variant="secondary" className="ml-auto bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
            {expectedArrivals.length} Pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Today's Schedule</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expectedArrivals.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="font-mono">
                  {getTodaySchedule(user).length > 0 ? (
                    <div className="space-y-1">
                      {getTodaySchedule(user).map((block, index) => (
                        <div key={index} className="text-xs bg-secondary px-2 py-1 rounded">
                          {block}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">No schedule</span>
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
