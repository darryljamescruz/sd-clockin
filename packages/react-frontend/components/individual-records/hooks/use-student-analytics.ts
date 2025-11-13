/**
 * Custom hook for calculating student analytics
 */

import { useMemo } from "react"
import { type Student, type Term } from "@/lib/api"
import {
  calculatePunctuality,
  getWeeklyBreakdown,
  getDailyBreakdown,
  groupDaysByWeek,
  groupDaysByMonth,
  type WeeklyBreakdown,
  type DailyBreakdownDay,
} from "../utils/student-calculations"

export interface StudentAnalytics {
  punctuality: ReturnType<typeof calculatePunctuality> | null
  weeklyBreakdown: WeeklyBreakdown
  dailyBreakdown: DailyBreakdownDay[]
  dailyBreakdownByWeek: ReturnType<typeof groupDaysByWeek>
  dailyBreakdownByMonth: ReturnType<typeof groupDaysByMonth>
  totalExpected: number
  totalActual: number
  hasFullStudentData: boolean
}

export function useStudentAnalytics(
  selectedStaff: Student | null,
  termStartDate: string,
  termEndDate: string,
  currentTerm?: Term
): StudentAnalytics {
  // Check if selectedStaff has term-specific data (clockEntries indicates full data loaded)
  const hasFullStudentData = useMemo(
    () => selectedStaff && (selectedStaff.clockEntries !== undefined || selectedStaff.weeklySchedule !== undefined),
    [selectedStaff]
  )

  // Calculate analytics for selected staff
  const punctuality = useMemo(
    () => (hasFullStudentData && selectedStaff ? calculatePunctuality(selectedStaff, termStartDate, termEndDate, currentTerm) : null),
    [hasFullStudentData, selectedStaff, termStartDate, termEndDate, currentTerm]
  )

  const weeklyBreakdown = useMemo(
    () => (hasFullStudentData && selectedStaff ? getWeeklyBreakdown(selectedStaff, termStartDate, termEndDate, currentTerm) : []),
    [hasFullStudentData, selectedStaff, termStartDate, termEndDate, currentTerm]
  )

  const dailyBreakdown = useMemo(
    () => (hasFullStudentData && selectedStaff ? getDailyBreakdown(selectedStaff, termStartDate, termEndDate, currentTerm) : []),
    [hasFullStudentData, selectedStaff, termStartDate, termEndDate, currentTerm]
  )

  const dailyBreakdownByWeek = useMemo(
    () => (hasFullStudentData ? groupDaysByWeek(dailyBreakdown, termStartDate, termEndDate) : []),
    [hasFullStudentData, dailyBreakdown, termStartDate, termEndDate]
  )

  const dailyBreakdownByMonth = useMemo(
    () => (hasFullStudentData ? groupDaysByMonth(dailyBreakdown) : []),
    [hasFullStudentData, dailyBreakdown]
  )

  const totalExpected = useMemo(
    () => weeklyBreakdown.reduce((sum, week) => sum + week.expectedHours, 0),
    [weeklyBreakdown]
  )

  const totalActual = useMemo(
    () => weeklyBreakdown.reduce((sum, week) => sum + week.actualHours, 0),
    [weeklyBreakdown]
  )

  return {
    punctuality,
    weeklyBreakdown,
    dailyBreakdown,
    dailyBreakdownByWeek,
    dailyBreakdownByMonth,
    totalExpected,
    totalActual,
    hasFullStudentData: !!hasFullStudentData,
  }
}
