/**
 * Daily breakdown container component
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CalendarDays, Plus, Zap } from "lucide-react"
import { WeekView } from "./week-view"
import { MonthView } from "./month-view"
import { type DailyBreakdownDay, type ActualShift } from "../utils/student-calculations"

interface DailyBreakdownProps {
  dailyBreakdownByWeek: Array<{
    weekNum: number
    startDate: Date
    endDate: Date
    days: Array<DailyBreakdownDay | null>
  }>
  dailyBreakdownByMonth: Array<{
    monthName: string
    monthYear: string
    days: DailyBreakdownDay[]
    totalExpected: number
    totalActual: number
    calendarWeeks: Array<Array<DailyBreakdownDay | null>>
  }>
  dailyViewMode: "week" | "month"
  termEndDate: string
  currentWeekIndex: number
  currentMonthIndex: number
  onSetDailyViewMode: (mode: "week" | "month") => void
  onPreviousWeek: () => void
  onNextWeek: () => void
  onPreviousMonth: () => void
  onNextMonth: () => void
  canGoToPreviousWeek: boolean
  canGoToNextWeek: boolean
  canGoToPreviousMonth: boolean
  canGoToNextMonth: boolean
  onEditShift?: (shift: ActualShift, type: "in" | "out") => void
  onDeleteShift?: (shift: ActualShift) => void
  onAddEntry?: () => void
  missingClockOuts?: number
  autoClockOuts?: number
}

export function DailyBreakdown({
  dailyBreakdownByWeek,
  dailyBreakdownByMonth,
  dailyViewMode,
  termEndDate,
  currentWeekIndex,
  currentMonthIndex,
  onSetDailyViewMode,
  onPreviousWeek,
  onNextWeek,
  onPreviousMonth,
  onNextMonth,
  canGoToPreviousWeek,
  canGoToNextWeek,
  canGoToPreviousMonth,
  canGoToNextMonth,
  onEditShift,
  onDeleteShift,
  onAddEntry,
  missingClockOuts = 0,
  autoClockOuts = 0,
}: DailyBreakdownProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-medium">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Daily Breakdown
            {missingClockOuts > 0 && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400 ml-1">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {missingClockOuts} missing
              </Badge>
            )}
            {autoClockOuts > 0 && (
              <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400">
                <Zap className="w-3 h-3 mr-1" />
                {autoClockOuts} auto
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onAddEntry && (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={onAddEntry}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            )}
            <Tabs 
              value={dailyViewMode} 
              onValueChange={(value) => onSetDailyViewMode(value as "week" | "month")}
            >
              <TabsList className="h-8">
                <TabsTrigger value="week" className="text-xs px-3 h-6">Week</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-3 h-6">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {dailyViewMode === "week" ? (
          <WeekView
            dailyBreakdownByWeek={dailyBreakdownByWeek}
            currentWeekIndex={currentWeekIndex}
            termEndDate={termEndDate}
            onPreviousWeek={onPreviousWeek}
            onNextWeek={onNextWeek}
            canGoToPreviousWeek={canGoToPreviousWeek}
            canGoToNextWeek={canGoToNextWeek}
            onEditShift={onEditShift}
            onDeleteShift={onDeleteShift}
          />
        ) : (
          <MonthView
            dailyBreakdownByMonth={dailyBreakdownByMonth}
            currentMonthIndex={currentMonthIndex}
            onPreviousMonth={onPreviousMonth}
            onNextMonth={onNextMonth}
            canGoToPreviousMonth={canGoToPreviousMonth}
            canGoToNextMonth={canGoToNextMonth}
            onEditShift={onEditShift}
            onDeleteShift={onDeleteShift}
          />
        )}
      </CardContent>
    </Card>
  )
}




