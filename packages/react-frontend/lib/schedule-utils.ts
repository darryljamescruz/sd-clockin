/**
 * Consolidated schedule utility functions
 * Single source of truth for schedule parsing, week calculations, and day-off handling
 */

import { type Student, type Term } from "@/lib/api"
import {
  timeToMinutes,
  formatMinutesToTime,
  normalizeTime,
} from "@/lib/time-utils"
import { parseDateString } from "@/lib/utils"

// Re-export time utils for convenience
export {
  timeToMinutes,
  formatMinutesToTime,
  normalizeTime,
  formatTimeForDisplay,
  formatTimestampToDisplay,
  dateToMinutes,
  calculateDurationMinutes,
  formatDuration,
  formatHours,
} from "@/lib/time-utils"

/**
 * Day name type for weekly schedules
 */
export type DayName = "monday" | "tuesday" | "wednesday" | "thursday" | "friday"

/**
 * Maps Date.getDay() to day name (0=Sunday, 1=Monday, etc.)
 */
export const DAY_INDEX_TO_NAME: Array<DayName | null> = [
  null, // Sunday
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  null, // Saturday
]

/**
 * Shift time structure
 */
export interface ShiftTime {
  start: string
  end: string
  original: string
}

/**
 * Parsed schedule block
 */
export interface ParsedScheduleBlock {
  start: string
  end: string
  startMinutes: number
  endMinutes: number
  durationMinutes: number
}

/**
 * Parse a schedule block string (e.g., "9:00 AM-5:00 PM") into structured data
 */
export function parseScheduleBlock(block: string): ParsedScheduleBlock | null {
  if (!block || !block.includes("-")) return null

  const [startRaw, endRaw] = block.split("-")
  if (!startRaw || !endRaw) return null

  const start = normalizeTime(startRaw.trim())
  const end = normalizeTime(endRaw.trim())
  const startMinutes = timeToMinutes(start)
  const endMinutes = timeToMinutes(end)

  return {
    start,
    end,
    startMinutes,
    endMinutes,
    durationMinutes: endMinutes - startMinutes,
  }
}

/**
 * Extract start time from a schedule block (e.g., "9:00 AM-5:00 PM" -> "9:00 AM")
 */
export function getExpectedStartTimeFromSchedule(
  scheduleBlock: string
): string | null {
  if (!scheduleBlock) return null
  const startTime = scheduleBlock.split("-")[0]?.trim()
  return startTime ? normalizeTime(startTime) : null
}

/**
 * Extract end time from a schedule block (e.g., "9:00 AM-5:00 PM" -> "5:00 PM")
 */
export function getExpectedEndTimeFromSchedule(
  scheduleBlock: string
): string | null {
  if (!scheduleBlock) return null
  const endTime = scheduleBlock.split("-")[1]?.trim()
  return endTime ? normalizeTime(endTime) : null
}

/**
 * Get today's schedule for a specific date
 */
export function getTodayScheduleForDate(
  staff: Student,
  date: Date
): string[] {
  const dayName = DAY_INDEX_TO_NAME[date.getDay()]
  if (!dayName) return []
  return staff.weeklySchedule?.[dayName] || []
}

/**
 * Parse schedule blocks into structured shift times
 */
export function parseScheduleBlocks(schedule: string[]): ShiftTime[] {
  return schedule.map((block) => {
    const start = getExpectedStartTimeFromSchedule(block)
    const end = getExpectedEndTimeFromSchedule(block)
    return {
      start: start || "",
      end: end || "",
      original: block,
    }
  })
}

/**
 * Aggregate consecutive shifts into single continuous shifts
 * Example: ["8-9", "9-10", "10-11"] => ["8-11"]
 * @param shifts - Array of shifts to aggregate
 * @param toleranceMinutes - Minutes tolerance for considering shifts consecutive (default: 5)
 */
export function aggregateConsecutiveShifts(
  shifts: ShiftTime[],
  toleranceMinutes: number = 5
): ShiftTime[] {
  if (shifts.length === 0) return []

  // Sort shifts by start time
  const sortedShifts = [...shifts].sort((a, b) => {
    const aMinutes = timeToMinutes(a.start)
    const bMinutes = timeToMinutes(b.start)
    return aMinutes - bMinutes
  })

  const aggregated: ShiftTime[] = []
  let currentShift = { ...sortedShifts[0] }

  for (let i = 1; i < sortedShifts.length; i++) {
    const shift = sortedShifts[i]
    const currentEndMinutes = timeToMinutes(currentShift.end)
    const shiftStartMinutes = timeToMinutes(shift.start)

    // Check if shifts are consecutive or overlapping (within tolerance)
    if (Math.abs(currentEndMinutes - shiftStartMinutes) <= toleranceMinutes) {
      // Extend current shift to include this shift's end time
      const shiftEndMinutes = timeToMinutes(shift.end)
      const extendedEndMinutes = Math.max(currentEndMinutes, shiftEndMinutes)
      currentShift.end = formatMinutesToTime(extendedEndMinutes)
      currentShift.original = `${currentShift.start}-${currentShift.end}`
    } else {
      // Not consecutive, save current shift and start a new one
      aggregated.push(currentShift)
      currentShift = { ...shift }
    }
  }

  // Add the last shift
  aggregated.push(currentShift)

  return aggregated
}

/**
 * Aggregate simple shift objects (used in student-calculations)
 */
export function aggregateSimpleShifts(
  shifts: Array<{ start: string; end: string }>,
  toleranceMinutes: number = 1
): Array<{ start: string; end: string }> {
  if (shifts.length === 0) return []

  // Convert to ShiftTime format, aggregate, then convert back
  const shiftTimes: ShiftTime[] = shifts.map((s) => ({
    start: s.start,
    end: s.end,
    original: `${s.start}-${s.end}`,
  }))

  const aggregated = aggregateConsecutiveShifts(shiftTimes, toleranceMinutes)

  return aggregated.map((s) => ({
    start: s.start,
    end: s.end,
  }))
}

// ============================================================================
// Week/Date Calculation Utilities
// ============================================================================

/**
 * Gets the week number for a given date within a term
 */
export function getWeekNumber(
  date: Date,
  termStartDate: string,
  termEndDate: string
): number {
  const startDate = parseDateString(termStartDate)

  // Find the Monday of the week containing the term start date
  const termStartMonday = new Date(startDate)
  const startDayOfWeek = termStartMonday.getDay()
  const daysToMonday = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek
  termStartMonday.setDate(termStartMonday.getDate() + daysToMonday)
  termStartMonday.setHours(0, 0, 0, 0)

  // Find the Monday of the week containing the given date
  const dateMonday = new Date(date)
  const dateDayOfWeek = dateMonday.getDay()
  const daysToDateMonday = dateDayOfWeek === 0 ? -6 : 1 - dateDayOfWeek
  dateMonday.setDate(dateMonday.getDate() + daysToDateMonday)
  dateMonday.setHours(0, 0, 0, 0)

  // Calculate the week number (1-based)
  const diffTime = dateMonday.getTime() - termStartMonday.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const weekNum = Math.floor(diffDays / 7) + 1

  return weekNum
}

/**
 * Gets the start date (Monday) for a given week number
 */
export function getWeekStartDate(weekNum: number, termStartDate: string): Date {
  const startDate = parseDateString(termStartDate)
  const termStartMonday = new Date(startDate)
  const startDayOfWeek = termStartMonday.getDay()
  const daysToMonday = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek
  termStartMonday.setDate(termStartMonday.getDate() + daysToMonday)
  termStartMonday.setHours(0, 0, 0, 0)

  const weekStart = new Date(termStartMonday)
  weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7)
  return weekStart
}

/**
 * Gets all weekdays (Monday-Friday) in a date range
 */
export function getWeekdaysInRange(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = []
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  return days
}

/**
 * Checks if a date is a day off based on term configuration
 */
export function isDayOff(
  date: Date,
  currentTerm?: Term | { daysOff?: Array<{ startDate: string; endDate: string }> }
): boolean {
  if (!currentTerm || !currentTerm.daysOff || currentTerm.daysOff.length === 0) {
    return false
  }

  const dateStr = date.toISOString().split("T")[0]

  return currentTerm.daysOff.some((range) => {
    const rangeStart = new Date(range.startDate)
    const rangeEnd = new Date(range.endDate)
    const checkDate = new Date(dateStr)

    // Set to midnight for accurate comparison
    rangeStart.setHours(0, 0, 0, 0)
    rangeEnd.setHours(23, 59, 59, 999)
    checkDate.setHours(0, 0, 0, 0)

    return checkDate >= rangeStart && checkDate <= rangeEnd
  })
}

/**
 * Format shift time for display (e.g., "9:00 AM-5:00 PM" -> "9am-5pm")
 */
export function formatShiftTimeCompact(shiftBlock: string): string {
  const parsed = parseScheduleBlock(shiftBlock)
  if (!parsed) return shiftBlock

  const formatCompact = (time: string): string => {
    const minutes = timeToMinutes(time)
    const hours24 = Math.floor(minutes / 60)
    const mins = minutes % 60

    let hours12 = hours24
    let period = "am"

    if (hours24 === 0) {
      hours12 = 12
    } else if (hours24 === 12) {
      period = "pm"
    } else if (hours24 > 12) {
      hours12 = hours24 - 12
      period = "pm"
    }

    if (mins === 0) {
      return `${hours12}${period}`
    }
    return `${hours12}:${mins.toString().padStart(2, "0")}${period}`
  }

  return `${formatCompact(parsed.start)}-${formatCompact(parsed.end)}`
}
