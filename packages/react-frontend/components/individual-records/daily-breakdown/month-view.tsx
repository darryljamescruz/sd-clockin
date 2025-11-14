/**
 * Month view component for daily breakdown
 */

"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getStatusBadge, getHoursStatus, renderHoursIndicator } from "./helpers"
import { type DailyBreakdownDay } from "../utils/student-calculations"

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
}

export function MonthView({
  dailyBreakdownByMonth,
  currentMonthIndex,
  onPreviousMonth,
  onNextMonth,
  canGoToPreviousMonth,
  canGoToNextMonth,
}: MonthViewProps) {
  if (dailyBreakdownByMonth.length === 0 || currentMonthIndex >= dailyBreakdownByMonth.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No daily breakdown data available
      </div>
    )
  }

  const month = dailyBreakdownByMonth[currentMonthIndex]
  if (!month) return null

  const diff = month.totalActual - month.totalExpected

  return (
    <>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousMonth}
          disabled={!canGoToPreviousMonth}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous Month
        </Button>
        <div className="text-sm font-medium">
          {month.monthYear}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextMonth}
          disabled={!canGoToNextMonth}
        >
          Next Month
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Month Summary */}
      <div className="mb-4 p-4 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-muted-foreground">Expected Hours</div>
            <div className="text-lg font-bold">{month.totalExpected.toFixed(1)}h</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Actual Hours</div>
            <div className="text-lg font-bold">{month.totalActual.toFixed(1)}h</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Difference</div>
            <div className={`text-lg font-bold ${
              diff >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              {diff >= 0 ? '+' : ''}{diff.toFixed(1)}h
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Calendar Header */}
          <div className="grid grid-cols-5 gap-2 mb-2">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((dayName) => (
              <div key={dayName} className="text-center font-semibold text-sm text-muted-foreground py-2 border-b">
                {dayName}
              </div>
            ))}
          </div>
          
          {/* Calendar Weeks */}
          {month.calendarWeeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-5 gap-2 mb-2">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <div
                      key={dayIndex}
                      className="min-h-[120px] border border-dashed border-muted rounded-lg bg-muted/20"
                    />
                  )
                }

                const dayDiff = day.actualHours - day.expectedHours
                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[120px] border rounded-lg p-2 transition-colors ${
                      day.isDayOff
                        ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                        : "bg-card hover:bg-muted/50"
                    }`}
                  >
                    <div className="space-y-1">
                      {/* Date Header */}
                      <div className="flex items-center justify-between mb-2 pb-2 border-b">
                        <div className="font-semibold text-sm">
                          {day.date.getDate()}
                        </div>
                        {getStatusBadge(day.status)}
                      </div>

                      {/* Expected Time */}
                      {day.isDayOff ? (
                        <div className="text-xs text-orange-700 dark:text-orange-400 italic">
                          Day Off - No Tracking
                        </div>
                      ) : day.expectedShifts.length > 0 ? (
                        <div className="text-xs space-y-0.5">
                          <div className="text-muted-foreground">Expected:</div>
                          {day.expectedShifts.map((shift, idx) => (
                            <div key={idx} className="font-mono pl-2">
                              {shift.start} <span className="text-muted-foreground">to</span> {shift.end}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Not scheduled</div>
                      )}

                      {/* Actual Time */}
                      {day.actualShifts.length > 0 && (
                        <div className="text-xs space-y-0.5 pt-1 border-t">
                          <div className="text-muted-foreground">Actual:</div>
                          {day.actualShifts.map((shift, idx) => (
                            <div key={idx} className="font-mono pl-2">
                              {shift.start} <span className="text-muted-foreground">to</span> {shift.end}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Hours */}
                      {day.actualHours > 0 && (
                        <div className="pt-1 border-t">
                          <div className="text-xs text-muted-foreground">Hours:</div>
                          <div className="flex items-center gap-1">
                            <div className={`text-sm font-bold font-mono ${
                              dayDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                            }`}>
                              {day.actualHours.toFixed(1)}h
                            </div>
                            {renderHoursIndicator(day)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}


