/**
 * Week view component for daily breakdown
 */

"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { parseDateString } from "@/lib/utils"
import { getStatusBadge, renderHoursIndicator } from "./helpers"
import { type DailyBreakdownDay } from "../utils/student-calculations"

interface WeekViewProps {
  dailyBreakdownByWeek: Array<{
    weekNum: number
    startDate: Date
    endDate: Date
    days: Array<DailyBreakdownDay | null>
  }>
  currentWeekIndex: number
  termEndDate: string
  onPreviousWeek: () => void
  onNextWeek: () => void
  canGoToPreviousWeek: boolean
  canGoToNextWeek: boolean
}

export function WeekView({
  dailyBreakdownByWeek,
  currentWeekIndex,
  termEndDate,
  onPreviousWeek,
  onNextWeek,
  canGoToPreviousWeek,
  canGoToNextWeek,
}: WeekViewProps) {
  if (dailyBreakdownByWeek.length === 0 || currentWeekIndex >= dailyBreakdownByWeek.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No daily breakdown data available
      </div>
    )
  }

  const week = dailyBreakdownByWeek[currentWeekIndex]
  if (!week) return null

  // Find the first weekday (Monday) and last weekday (Friday) in the week
  const monday = new Date(week.startDate)
  const friday = new Date(monday)
  friday.setDate(friday.getDate() + 4) // Friday is 4 days after Monday
  
  // Cap to term end if Friday exceeds term end
  const termEnd = parseDateString(termEndDate)
  const lastWeekday = friday > termEnd ? termEnd : friday

  const renderDayCell = (day: DailyBreakdownDay | null, dayIndex: number) => {
    if (!day) {
      return (
        <TableCell key={dayIndex} className="text-center text-muted-foreground text-sm py-4">
          —
        </TableCell>
      )
    }

    const diff = day.actualHours - day.expectedHours
    return (
      <TableCell 
        key={dayIndex} 
        className={`p-2 ${
          day.isDayOff
            ? "bg-orange-50 dark:bg-orange-950/20"
            : ""
        }`}
      >
        <div className="space-y-1 text-xs">
          <div className="font-medium text-muted-foreground">
            {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          {day.isDayOff ? (
            <div className="text-orange-700 dark:text-orange-400 italic text-xs">
              Day Off
            </div>
          ) : (
            <>
              <div className="space-y-0.5">
                {day.expectedShifts.length > 0 ? (
                  <>
                    <div className="text-muted-foreground text-xs">Expected:</div>
                    {day.expectedShifts.map((shift, idx) => (
                      <div key={idx} className="text-xs pl-2">
                        <span className="font-mono">{shift.start}</span>
                        <span className="text-muted-foreground mx-1">to</span>
                        <span className="font-mono">{shift.end}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-1 text-xs">
                    <span className="text-muted-foreground">Expected:</span>
                    <span className="font-mono text-muted-foreground">—</span>
                  </div>
                )}
                <div className="text-muted-foreground text-xs pt-1 border-t">Actual:</div>
                {day.actualShifts.length > 0 ? (
                  day.actualShifts.map((shift, idx) => (
                    <div key={idx} className="text-xs pl-2">
                      <span className="font-mono">{shift.start}</span>
                      <span className="text-muted-foreground mx-1">to</span>
                      <span className="font-mono">{shift.end}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs pl-2 text-muted-foreground">—</div>
                )}
              </div>
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-muted-foreground text-xs">Hours:</span>
                <div className="flex items-center gap-1">
                  <span className={`font-mono text-xs ${day.actualHours > 0 ? (diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400') : 'text-muted-foreground'}`}>
                    {day.actualHours > 0 ? day.actualHours.toFixed(1) + "h" : "—"}
                  </span>
                  {renderHoursIndicator(day)}
                </div>
              </div>
            </>
          )}
          <div className="pt-1">
            {getStatusBadge(day.status)}
          </div>
        </div>
      </TableCell>
    )
  }

  return (
    <>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousWeek}
          disabled={!canGoToPreviousWeek}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous Week
        </Button>
        <div className="text-sm font-medium">
          Week {week.weekNum} of {dailyBreakdownByWeek.length}
          <span className="text-muted-foreground ml-2">
            ({monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {lastWeekday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextWeek}
          disabled={!canGoToNextWeek}
        >
          Next Week
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    
      {/* Week Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">Monday</TableHead>
              <TableHead className="min-w-[140px]">Tuesday</TableHead>
              <TableHead className="min-w-[140px]">Wednesday</TableHead>
              <TableHead className="min-w-[140px]">Thursday</TableHead>
              <TableHead className="min-w-[140px]">Friday</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow key={week.weekNum}>
              {week.days.map((day, dayIndex) => renderDayCell(day, dayIndex))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  )
}
