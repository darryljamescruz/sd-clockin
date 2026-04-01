/**
 * Clock In Logs - Chronological table of all clock sessions
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClipboardList, Plus, AlertTriangle, Zap, Wrench, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { type ClockEntry } from "@/lib/api"
import { type ActualShift, type DailyBreakdownDay } from "./utils/student-calculations"

interface ClockInLogsProps {
  dailyBreakdownByWeek: Array<{
    weekNum: number
    startDate: Date
    endDate: Date
    days: Array<DailyBreakdownDay | null>
  }>
  clockEntries: ClockEntry[]
  onEditShift?: (shift: ActualShift, type: "in" | "out") => void
  onDeleteShift?: (shift: ActualShift) => void
  onAddEntry?: () => void
}

function formatTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function ClockInLogs({
  dailyBreakdownByWeek,
  clockEntries,
  onEditShift,
  onDeleteShift,
  onAddEntry,
}: ClockInLogsProps) {
  // Flatten all shifts from all days, sorted most recent first
  const allShifts: Array<{ date: Date; shift: ActualShift }> = []

  for (const week of dailyBreakdownByWeek) {
    for (const day of week.days) {
      if (!day) continue
      for (const shift of day.actualShifts) {
        allShifts.push({ date: day.date, shift })
      }
    }
  }

  allShifts.sort(
    (a, b) =>
      new Date(b.shift.clockInEntry.timestamp).getTime() -
      new Date(a.shift.clockInEntry.timestamp).getTime()
  )

  if (allShifts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No clock sessions found for this term.</p>
          {onAddEntry && (
            <Button size="sm" variant="outline" className="mt-4" onClick={onAddEntry}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Entry
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-medium">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Clock In Logs
            <Badge variant="secondary" className="font-normal">
              {allShifts.length} sessions
            </Badge>
          </div>
          {onAddEntry && (
            <Button size="sm" variant="outline" className="h-8" onClick={onAddEntry}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Entry
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Clock In</TableHead>
                <TableHead className="font-semibold">Clock Out</TableHead>
                <TableHead className="text-right font-semibold">Duration</TableHead>
                <TableHead className="font-semibold">Tags</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allShifts.map(({ date, shift }, i) => {
                const clockInEntry = clockEntries[shift.clockInEntry.index]
                const clockOutEntry = shift.clockOutEntry
                  ? clockEntries[shift.clockOutEntry.index]
                  : null
                const isManualIn = clockInEntry?.isManual
                const isAutoOut = clockOutEntry?.isAutoClockOut
                const isMissingOut = !shift.clockOutEntry

                return (
                  <TableRow key={i}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(date)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {formatTime(shift.clockInEntry.timestamp)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isMissingOut ? (
                        <Badge
                          variant="outline"
                          className="border-yellow-500 text-yellow-700 dark:text-yellow-400 text-xs"
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Missing
                        </Badge>
                      ) : (
                        <span className="font-mono text-sm">
                          {formatTime(shift.clockOutEntry!.timestamp)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm text-muted-foreground">
                        {shift.hours > 0 ? `${shift.hours.toFixed(1)}h` : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {isManualIn && (
                          <Badge
                            variant="outline"
                            className="text-xs border-purple-400 text-purple-700 dark:text-purple-400"
                          >
                            <Wrench className="w-2.5 h-2.5 mr-1" />
                            Manual
                          </Badge>
                        )}
                        {isAutoOut && (
                          <Badge
                            variant="outline"
                            className="text-xs border-blue-400 text-blue-700 dark:text-blue-400"
                          >
                            <Zap className="w-2.5 h-2.5 mr-1" />
                            Auto-out
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(onEditShift || onDeleteShift) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEditShift && (
                              <>
                                <DropdownMenuItem onClick={() => onEditShift(shift, "in")}>
                                  <Pencil className="w-3.5 h-3.5 mr-2" />
                                  Edit Clock-in
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEditShift(shift, "out")}>
                                  <Pencil className="w-3.5 h-3.5 mr-2" />
                                  Edit Clock-out
                                </DropdownMenuItem>
                              </>
                            )}
                            {onEditShift && onDeleteShift && <DropdownMenuSeparator />}
                            {onDeleteShift && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDeleteShift(shift)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Delete Session
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
