/**
 * Daily breakdown container component
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, ChevronDown, ChevronUp, Plus } from "lucide-react"
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
  onEditShift?: (shift: ActualShift, type: "in" | "out") => void
  onDeleteShift?: (shift: ActualShift) => void
  onAddEntry?: () => void
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
  onEditShift,
  onDeleteShift,
  onAddEntry,
}: DailyBreakdownProps) {
  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-base font-medium">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Daily Breakdown
              </div>
              <div className="flex items-center gap-3">
                {onAddEntry && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddEntry()
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </Button>
                )}
                <Tabs 
                  value={dailyViewMode} 
                  onValueChange={(value) => onSetDailyViewMode(value as "week" | "month")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="week" className="text-xs px-3 h-6">Week</TabsTrigger>
                    <TabsTrigger value="month" className="text-xs px-3 h-6">Month</TabsTrigger>
                  </TabsList>
                </Tabs>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}




