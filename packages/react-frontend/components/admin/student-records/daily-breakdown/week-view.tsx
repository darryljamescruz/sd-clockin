/**
 * Week view component for daily breakdown
 */

"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronLeft, ChevronRight, Calendar, Pencil, Trash2, MoreHorizontal, LogIn, LogOut, AlertTriangle } from "lucide-react"
import { parseDateString } from "@/lib/utils"
import { getStatusBadge, renderHoursIndicator } from "./helpers"
import { type DailyBreakdownDay, type ActualShift } from "../utils/student-calculations"

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
  onEditShift?: (shift: ActualShift, type: "in" | "out") => void
  onDeleteShift?: (shift: ActualShift) => void
}

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"]

export function WeekView({
  dailyBreakdownByWeek,
  currentWeekIndex,
  termEndDate,
  onPreviousWeek,
  onNextWeek,
  canGoToPreviousWeek,
  canGoToNextWeek,
  onEditShift,
  onDeleteShift,
}: WeekViewProps) {
  if (dailyBreakdownByWeek.length === 0 || currentWeekIndex >= dailyBreakdownByWeek.length) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground text-sm">No daily breakdown data available</p>
      </div>
    )
  }

  const week = dailyBreakdownByWeek[currentWeekIndex]
  if (!week) return null

  // Find the first weekday (Monday) and last weekday (Friday) in the week
  const monday = new Date(week.startDate)
  const friday = new Date(monday)
  friday.setDate(friday.getDate() + 4)
  
  // Cap to term end if Friday exceeds term end
  const termEnd = parseDateString(termEndDate)
  const lastWeekday = friday > termEnd ? termEnd : friday

  const renderShiftActions = (shift: ActualShift) => {
    const hasMissingClockOut = !shift.clockOutEntry

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="end">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 text-xs"
              onClick={() => onEditShift?.(shift, "in")}
            >
              <LogIn className="w-3 h-3 mr-2 text-green-600" />
              Edit Clock In
            </Button>
            {shift.clockOutEntry ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-xs"
                onClick={() => onEditShift?.(shift, "out")}
              >
                <LogOut className="w-3 h-3 mr-2" />
                Edit Clock Out
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-xs text-yellow-600"
                onClick={() => onEditShift?.(shift, "out")}
              >
                <AlertTriangle className="w-3 h-3 mr-2" />
                Add Clock Out
              </Button>
            )}
            <div className="h-px bg-border my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 text-xs text-destructive hover:text-destructive"
              onClick={() => onDeleteShift?.(shift)}
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete Shift
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  const renderDayCard = (day: DailyBreakdownDay | null, dayIndex: number) => {
    if (!day) {
      return (
        <div key={dayIndex} className="rounded-lg border border-dashed bg-muted/20 p-3 min-h-[160px] flex items-center justify-center">
          <span className="text-xs text-muted-foreground">—</span>
        </div>
      )
    }

    const diff = day.actualHours - day.expectedHours

    return (
      <div
        key={dayIndex}
        className={`rounded-lg border p-3 min-h-[160px] transition-colors ${
          day.isDayOff
            ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
            : "bg-card hover:bg-muted/30"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b">
          <div>
            <div className="text-xs text-muted-foreground">{dayNames[dayIndex]}</div>
            <div className="font-semibold text-sm">
              {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          {getStatusBadge(day.status)}
        </div>

        {/* Content */}
        {day.isDayOff ? (
          <div className="text-xs text-orange-600 dark:text-orange-400 italic py-4 text-center">
            Day Off
          </div>
        ) : (
          <div className="space-y-2">
            {/* Expected */}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Expected</div>
              {day.expectedShifts.length > 0 ? (
                day.expectedShifts.map((shift, idx) => (
                  <div key={idx} className="font-mono text-xs">
                    {shift.start} – {shift.end}
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">Not scheduled</div>
              )}
            </div>

            {/* Actual */}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Actual</div>
              {day.actualShifts.length > 0 ? (
                day.actualShifts.map((shift, idx) => (
                  <div key={idx} className="group flex items-center justify-between">
                    <div className="font-mono text-xs flex items-center gap-1">
                      {shift.start} – {shift.end}
                      {!shift.clockOutEntry && (
                        <AlertTriangle className="w-2.5 h-2.5 text-yellow-500" />
                      )}
                    </div>
                    {(onEditShift || onDeleteShift) && renderShiftActions(shift)}
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">—</div>
              )}
            </div>

            {/* Hours Summary */}
            {(day.actualHours > 0 || day.expectedHours > 0) && (
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Hours</span>
                <div className="flex items-center gap-1">
                  <span className={`font-mono text-xs font-medium ${
                    day.actualHours > 0 
                      ? (diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400') 
                      : 'text-muted-foreground'
                  }`}>
                    {day.actualHours > 0 ? day.actualHours.toFixed(1) + "h" : "—"}
                  </span>
                  {renderHoursIndicator(day)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousWeek}
          disabled={!canGoToPreviousWeek}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            Week {week.weekNum}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {lastWeekday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextWeek}
          disabled={!canGoToNextWeek}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    
      {/* Week Grid */}
      <div className="grid grid-cols-5 gap-2">
        {week.days.map((day, dayIndex) => renderDayCard(day, dayIndex))}
      </div>
    </div>
  )
}
