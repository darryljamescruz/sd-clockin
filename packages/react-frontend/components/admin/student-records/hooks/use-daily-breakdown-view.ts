/**
 * Custom hook for managing daily breakdown view state
 */

import { useState, useEffect } from "react"
import { type Student } from "@/lib/api"

export interface UseDailyBreakdownViewReturn {
  currentWeekIndex: number
  currentMonthIndex: number
  isWeeklyBreakdownOpen: boolean
  isDailyBreakdownOpen: boolean
  dailyViewMode: "week" | "month"
  setCurrentWeekIndex: (index: number) => void
  setCurrentMonthIndex: (index: number) => void
  setIsWeeklyBreakdownOpen: (open: boolean) => void
  setIsDailyBreakdownOpen: (open: boolean) => void
  setDailyViewMode: (mode: "week" | "month") => void
  goToPreviousWeek: () => void
  goToNextWeek: () => void
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  canGoToPreviousWeek: boolean
  canGoToNextWeek: boolean
  canGoToPreviousMonth: boolean
  canGoToNextMonth: boolean
}

export function useDailyBreakdownView(
  selectedStaff: Student | null,
  dailyBreakdownByWeekLength: number,
  dailyBreakdownByMonthLength: number
): UseDailyBreakdownViewReturn {
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  const [isWeeklyBreakdownOpen, setIsWeeklyBreakdownOpen] = useState(true)
  const [isDailyBreakdownOpen, setIsDailyBreakdownOpen] = useState(true)
  const [dailyViewMode, setDailyViewMode] = useState<"week" | "month">("week")

  // Reset week/month index when staff changes
  useEffect(() => {
    setCurrentWeekIndex(0)
    setCurrentMonthIndex(0)
  }, [selectedStaff?.id])

  const goToPreviousWeek = () => {
    setCurrentWeekIndex(prev => Math.max(0, prev - 1))
  }

  const goToNextWeek = () => {
    setCurrentWeekIndex(prev => Math.min(dailyBreakdownByWeekLength - 1, prev + 1))
  }

  const goToPreviousMonth = () => {
    setCurrentMonthIndex(prev => Math.max(0, prev - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonthIndex(prev => Math.min(dailyBreakdownByMonthLength - 1, prev + 1))
  }

  const canGoToPreviousWeek = currentWeekIndex > 0
  const canGoToNextWeek = currentWeekIndex < dailyBreakdownByWeekLength - 1
  const canGoToPreviousMonth = currentMonthIndex > 0
  const canGoToNextMonth = currentMonthIndex < dailyBreakdownByMonthLength - 1

  return {
    currentWeekIndex,
    currentMonthIndex,
    isWeeklyBreakdownOpen,
    isDailyBreakdownOpen,
    dailyViewMode,
    setCurrentWeekIndex,
    setCurrentMonthIndex,
    setIsWeeklyBreakdownOpen,
    setIsDailyBreakdownOpen,
    setDailyViewMode,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousMonth,
    goToNextMonth,
    canGoToPreviousWeek,
    canGoToNextWeek,
    canGoToPreviousMonth,
    canGoToNextMonth,
  }
}




