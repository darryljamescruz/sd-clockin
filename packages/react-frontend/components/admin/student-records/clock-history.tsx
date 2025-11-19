/**
 * Clock history component
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Plus, Edit, Trash2 } from "lucide-react"
import { type Student, type ClockEntry } from "@/lib/api"
import { getWeekNumber } from "./utils/time-calculations"

interface ClockHistoryProps {
  selectedStaff: Student
  termStartDate: string
  termEndDate: string
  onAddClick: () => void
  onEditClick: (entry: ClockEntry, index: number) => void
  onDeleteClick: (entry: ClockEntry, index: number) => void
}

function getEntryTypeBadge(entry: { type: "in" | "out"; isManual?: boolean }) {
  const baseClass = entry.type === "in" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  const label = entry.type === "in" ? "Clock In" : "Clock Out"
  const manualFlag = entry.isManual ? " (Manual)" : ""

  return (
    <div className="flex items-center gap-1">
      <Badge className={baseClass}>{label}</Badge>
      {entry.isManual && <Badge className="bg-yellow-100 text-yellow-800 text-xs">Manual</Badge>}
    </div>
  )
}

function findMissingClockOuts(selectedStaff: Student) {
  const clockIns = (selectedStaff.clockEntries || []).filter(e => e.type === "in")
  const clockOuts = (selectedStaff.clockEntries || []).filter(e => e.type === "out")
  
  const missing: Array<{ clockIn: ClockEntry; date: Date }> = []
  
  clockIns.forEach(clockIn => {
    const inDate = new Date(clockIn.timestamp)
    const hasMatchingOut = clockOuts.some(out => {
      const outDate = new Date(out.timestamp)
      return outDate > inDate && outDate.toDateString() === inDate.toDateString()
    })
    
    if (!hasMatchingOut) {
      missing.push({ clockIn, date: inDate })
    }
  })
  
  return missing
}

export function ClockHistory({
  selectedStaff,
  termStartDate,
  termEndDate,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: ClockHistoryProps) {
  const missingClockOuts = findMissingClockOuts(selectedStaff)

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Complete Clock In/Out History
          </CardTitle>
          <Button onClick={onAddClick} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>
        {missingClockOuts.length > 0 && (
          <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ {missingClockOuts.length} clock-in{missingClockOuts.length > 1 ? 's' : ''} missing clock-out
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Week</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(selectedStaff.clockEntries || []).length > 0 ? (
              (selectedStaff.clockEntries || [])
                .slice()
                .reverse()
                .map((entry, index) => {
                  const date = new Date(entry.timestamp)
                  const weekNum = getWeekNumber(date, termStartDate, termEndDate)
                  const originalIndex = (selectedStaff.clockEntries || []).length - 1 - index
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{date.toLocaleString()}</TableCell>
                      <TableCell>{getEntryTypeBadge(entry)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {date.toLocaleDateString("en-US", { weekday: "long" })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Week {weekNum}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditClick(entry, originalIndex)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteClick(entry, originalIndex)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No clock entries found for this term
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}




