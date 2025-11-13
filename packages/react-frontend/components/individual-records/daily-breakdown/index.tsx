/**
 * Daily breakdown container component
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { WeekView } from "./week-view"
import { MonthView } from "./month-view"
import { type DailyBreakdownDay } from "../utils/student-calculations"

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
  isOpen: boolean
  onOpenChange: (open: boolean) => void
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
}

export function DailyBreakdown({
  dailyBreakdownByWeek,
  dailyBreakdownByMonth,
  dailyViewMode,
  termEndDate,
  isOpen,
  onOpenChange,
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
}: DailyBreakdownProps) {
  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Daily Hours Breakdown - {dailyViewMode === "week" ? "Week View" : "Month View"}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-muted rounded-md p-1">
                  <Button
                    variant={dailyViewMode === "week" ? "default" : "ghost"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSetDailyViewMode("week")
                    }}
                    className="h-7 text-xs"
                  >
                    Week
                  </Button>
                  <Button
                    variant={dailyViewMode === "month" ? "default" : "ghost"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSetDailyViewMode("month")
                    }}
                    className="h-7 text-xs"
                  >
                    Month
                  </Button>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {dailyViewMode === "week" ? (
              <WeekView
                dailyBreakdownByWeek={dailyBreakdownByWeek}
                currentWeekIndex={currentWeekIndex}
                termEndDate={termEndDate}
                onPreviousWeek={onPreviousWeek}
                onNextWeek={onNextWeek}
                canGoToPreviousWeek={canGoToPreviousWeek}
                canGoToNextWeek={canGoToNextWeek}
              />
            ) : (
              <MonthView
                dailyBreakdownByMonth={dailyBreakdownByMonth}
                currentMonthIndex={currentMonthIndex}
                onPreviousMonth={onPreviousMonth}
                onNextMonth={onNextMonth}
                canGoToPreviousMonth={canGoToPreviousMonth}
                canGoToNextMonth={canGoToNextMonth}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
