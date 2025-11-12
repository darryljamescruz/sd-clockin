"use client"

import { Button } from "@/components/ui/button"
import { TermSelector } from "./term-selector"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface DashboardHeaderProps {
  terms: Term[]
  selectedTerm: string
  onTermChange: (termName: string) => void
  selectedDate: Date
  currentDateIndex: number
  termWeekdays: Date[]
  onPreviousDay: () => void
  onNextDay: () => void
  onToday: () => void
  getTermStatus: () => { status: string }
}

export function DashboardHeader({
  terms,
  selectedTerm,
  onTermChange,
  selectedDate,
  currentDateIndex,
  termWeekdays,
  onPreviousDay,
  onNextDay,
  onToday,
  getTermStatus,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6 w-full max-w-full overflow-x-hidden">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">Attendance Dashboard</h2>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0">
        <TermSelector terms={terms} selectedTerm={selectedTerm} onTermChange={onTermChange} />

        {/* Day Navigation */}
        <div className="flex items-center gap-2 bg-card/70 backdrop-blur-sm border rounded-lg px-2 sm:px-3 py-2 w-full sm:w-auto min-w-0 overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousDay}
            disabled={currentDateIndex <= 0}
            className="h-7 w-7 p-0 flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-xs sm:text-sm font-medium text-foreground min-w-[80px] sm:min-w-[100px] text-center flex-shrink-0">
            {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onNextDay}
            disabled={currentDateIndex >= termWeekdays.length - 1}
            className="h-7 w-7 p-0 flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            disabled={getTermStatus().status === "future"}
            className="ml-0 sm:ml-2 h-7 text-xs flex-shrink-0"
          >
            Today
          </Button>
        </div>
      </div>
    </div>
  )
}
