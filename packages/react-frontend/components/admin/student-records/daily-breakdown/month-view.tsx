/**
 * Month view component for daily breakdown
 */

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown, Minus, MoreHorizontal, LogIn, LogOut, Trash2, AlertTriangle, Pencil } from "lucide-react"
import { getStatusBadge, renderHoursIndicator } from "./helpers"
import { type DailyBreakdownDay, type ActualShift } from "../utils/student-calculations"

interface MonthViewProps {
  dailyBreakdownByMonth: Array<{
    monthName: string
    monthYear: string
    days: DailyBreakdownDay[]
    totalExpected: number
    totalActual: number
    calendarWeeks: Array<Array<DailyBreakdownDay | null>>
  }>
  currentMonthIndex: number
  onPreviousMonth: () => void
  onNextMonth: () => void
  canGoToPreviousMonth: boolean
  canGoToNextMonth: boolean
  onEditShift?: (shift: ActualShift, type: "in" | "out") => void
  onDeleteShift?: (shift: ActualShift) => void
}

const dayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri"]

export function MonthView({
  dailyBreakdownByMonth,
  currentMonthIndex,
  onPreviousMonth,
  onNextMonth,
  canGoToPreviousMonth,
  canGoToNextMonth,
  onEditShift,
  onDeleteShift,
}: MonthViewProps) {
  if (dailyBreakdownByMonth.length === 0 || currentMonthIndex >= dailyBreakdownByMonth.length) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground text-sm">No daily breakdown data available</p>
      </div>
    )
  }

  const month = dailyBreakdownByMonth[currentMonthIndex]
  if (!month) return null

  const diff = month.totalActual - month.totalExpected
  const isPositive = diff > 0.1
  const isNegative = diff < -0.1

  const renderShiftActions = (shift: ActualShift) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="h-2.5 w-2.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="end">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-7 text-xs"
              onClick={() => onEditShift?.(shift, "in")}
            >
              <LogIn className="w-3 h-3 mr-2 text-green-600" />
              Edit In
            </Button>
            {shift.clockOutEntry ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs"
                onClick={() => onEditShift?.(shift, "out")}
              >
                <LogOut className="w-3 h-3 mr-2" />
                Edit Out
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs text-yellow-600"
                onClick={() => onEditShift?.(shift, "out")}
              >
                <AlertTriangle className="w-3 h-3 mr-2" />
                Add Out
              </Button>
            )}
            <div className="h-px bg-border my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => onDeleteShift?.(shift)}
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousMonth}
          disabled={!canGoToPreviousMonth}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <h3 className="text-lg font-semibold">
          {month.monthYear}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextMonth}
          disabled={!canGoToNextMonth}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Expected</div>
            <div className="text-xl font-bold">{month.totalExpected.toFixed(1)}<span className="text-sm font-normal">h</span></div>
          </CardContent>
        </Card>
        <Card className="bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Actual</div>
            <div className="text-xl font-bold">{month.totalActual.toFixed(1)}<span className="text-sm font-normal">h</span></div>
          </CardContent>
        </Card>
        <Card className={`${
          isPositive ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' :
          isNegative ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800' :
          'bg-muted/50'
        }`}>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Difference</div>
            <div className={`text-xl font-bold flex items-center justify-center gap-1 ${
              isPositive ? 'text-green-600 dark:text-green-400' :
              isNegative ? 'text-orange-600 dark:text-orange-400' :
              'text-muted-foreground'
            }`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : 
               isNegative ? <TrendingDown className="w-4 h-4" /> : 
               <Minus className="w-4 h-4" />}
              {diff >= 0 ? '+' : ''}{diff.toFixed(1)}<span className="text-sm font-normal">h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-5 bg-muted/50">
          {dayHeaders.map((dayName) => (
            <div key={dayName} className="text-center font-medium text-xs text-muted-foreground py-2 border-b">
              {dayName}
            </div>
          ))}
        </div>
        
        {/* Calendar Weeks */}
        <div className="divide-y">
          {month.calendarWeeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-5 divide-x">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <div
                      key={dayIndex}
                      className="min-h-[100px] bg-muted/10 p-2"
                    />
                  )
                }

                const dayDiff = day.actualHours - day.expectedHours
                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[100px] p-2 transition-colors ${
                      day.isDayOff
                        ? "bg-orange-50 dark:bg-orange-950/20"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm">
                        {day.date.getDate()}
                      </span>
                      {getStatusBadge(day.status)}
                    </div>

                    {/* Content */}
                    {day.isDayOff ? (
                      <div className="text-[10px] text-orange-600 dark:text-orange-400 italic">
                        Day Off
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {/* Expected */}
                        {day.expectedShifts.length > 0 ? (
                          <div>
                            <div className="text-[10px] text-muted-foreground">Expected</div>
                            {day.expectedShifts.map((shift, idx) => (
                              <div key={idx} className="font-mono text-[10px]">
                                {shift.start}–{shift.end}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground">Not scheduled</div>
                        )}

                        {/* Actual */}
                        {day.actualShifts.length > 0 && (
                          <div>
                            <div className="text-[10px] text-muted-foreground">Actual</div>
                            {day.actualShifts.map((shift, idx) => (
                              <div key={idx} className="group flex items-center justify-between">
                                <div className="font-mono text-[10px] flex items-center gap-0.5">
                                  {shift.start}–{shift.end}
                                  {!shift.clockOutEntry && (
                                    <AlertTriangle className="w-2 h-2 text-yellow-500" />
                                  )}
                                </div>
                                {(onEditShift || onDeleteShift) && renderShiftActions(shift)}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Hours */}
                        {day.actualHours > 0 && (
                          <div className="flex items-center gap-1 pt-1 border-t">
                            <span className={`font-mono text-xs font-medium ${
                              dayDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                            }`}>
                              {day.actualHours.toFixed(1)}h
                            </span>
                            {renderHoursIndicator(day)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}




