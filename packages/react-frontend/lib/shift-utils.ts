/**
 * Shift matching and status calculation utilities
 * Handles clock entry matching, shift status determination, and related logic
 */

import { type Student } from "@/lib/api"
import {
  timeToMinutes,
  formatMinutesToTime,
  dateToMinutes,
  formatTimestampToDisplay,
} from "@/lib/time-utils"
import {
  type ShiftTime,
  getTodayScheduleForDate,
  parseScheduleBlocks,
  aggregateConsecutiveShifts,
  getExpectedStartTimeFromSchedule,
  getExpectedEndTimeFromSchedule,
} from "@/lib/schedule-utils"

// Re-export types and commonly used functions for backwards compatibility
export type { ShiftTime }
export {
  timeToMinutes,
  formatMinutesToTime,
  getTodayScheduleForDate,
  parseScheduleBlocks,
  aggregateConsecutiveShifts,
  getExpectedStartTimeFromSchedule,
  getExpectedEndTimeFromSchedule,
} from "@/lib/schedule-utils"
export { formatTimeForDisplay } from "@/lib/time-utils"

/**
 * Matched shift with clock entry information
 */
export interface MatchedShift {
  shift: ShiftTime
  clockIn: string | null
  clockOut: string | null
  status: "incoming" | "early" | "on-time" | "late" | "absent"
  isOnTime: boolean
}

/**
 * Match clock entries to shifts for a given date
 * Handles multiple shifts per day and early clock-ins (up to 1 hour early)
 */
export function matchClockEntriesToShifts(
  staff: Student,
  date: Date
): MatchedShift[] {
  const dateStr = date.toDateString()
  const expectedSchedule = getTodayScheduleForDate(staff, date)
  const rawShifts = parseScheduleBlocks(expectedSchedule)
  // Aggregate consecutive shifts (e.g., 8-9, 9-10, 10-11 becomes 8-11)
  const shifts = aggregateConsecutiveShifts(rawShifts)

  // Get all clock entries for this date
  const clockIns = (staff.clockEntries || [])
    .filter((entry) => {
      const entryDate = new Date(entry.timestamp)
      return entryDate.toDateString() === dateStr && entry.type === "in"
    })
    .sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

  const clockOuts = (staff.clockEntries || [])
    .filter((entry) => {
      const entryDate = new Date(entry.timestamp)
      return entryDate.toDateString() === dateStr && entry.type === "out"
    })
    .sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

  // Track used clock entries to avoid matching them to multiple shifts
  const usedClockIns = new Set<string>()
  const usedClockOuts = new Set<string>()

  const matchedShifts: MatchedShift[] = []

  // For each expected shift, try to find matching clock entries
  shifts.forEach((shift) => {
    const shiftStartMinutes = timeToMinutes(shift.start)
    const shiftEndMinutes = shift.end
      ? timeToMinutes(shift.end)
      : shiftStartMinutes + 240 // Default 4 hours

    // Find clock-in for this shift - match within 1 hour before shift start to shift end
    const clockInEntry = clockIns.find((entry) => {
      const entryId = entry.id || entry.timestamp
      if (usedClockIns.has(entryId)) return false

      const entryDate = new Date(entry.timestamp)
      const entryMinutes = dateToMinutes(entryDate)

      // Match if within 1 hour before shift start to shift end
      return (
        entryMinutes >= shiftStartMinutes - 60 && entryMinutes <= shiftEndMinutes
      )
    })

    let clockIn: string | null = null
    let clockOut: string | null = null
    let status: "incoming" | "early" | "on-time" | "late" | "absent" = "incoming"
    let isOnTime = false

    if (clockInEntry) {
      const clockInId = clockInEntry.id || clockInEntry.timestamp
      usedClockIns.add(clockInId)

      const clockInDate = new Date(clockInEntry.timestamp)
      clockIn = formatTimestampToDisplay(clockInDate)

      // Find matching clock-out
      const clockOutEntry = clockOuts.find((entry) => {
        const entryId = entry.id || entry.timestamp
        if (usedClockOuts.has(entryId)) return false

        const entryDate = new Date(entry.timestamp)
        if (entryDate <= clockInDate) return false

        const entryMinutes = dateToMinutes(entryDate)

        // Clock-out should be after clock-in and before next shift or within reasonable time
        const nextShift = shifts.find((s) => {
          const nextStart = timeToMinutes(s.start)
          return nextStart > shiftStartMinutes
        })

        if (nextShift) {
          const nextStartMinutes = timeToMinutes(nextShift.start)
          return entryMinutes < nextStartMinutes
        }

        // If no next shift, accept clock-out up to end of shift + 1 hour buffer
        return entryMinutes <= shiftEndMinutes + 60
      })

      if (clockOutEntry) {
        const clockOutId = clockOutEntry.id || clockOutEntry.timestamp
        usedClockOuts.add(clockOutId)
        clockOut = formatTimestampToDisplay(new Date(clockOutEntry.timestamp))
      }

      // Determine status based on clock-in time
      const expectedMinutes = shiftStartMinutes
      const actualMinutes = dateToMinutes(clockInDate)
      const diffMinutes = actualMinutes - expectedMinutes

      if (diffMinutes < -10) {
        status = "early"
        isOnTime = true // Early counts as on-time
      } else if (diffMinutes <= 10) {
        status = "on-time"
        isOnTime = true
      } else {
        status = "late"
        isOnTime = false
      }
    } else {
      // No clock-in found - determine status based on current time
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()

      if (isToday) {
        const nowMinutes = dateToMinutes(now)
        const minutesLate = nowMinutes - shiftStartMinutes

        if (minutesLate < 0) {
          // Shift hasn't started yet
          status = "incoming"
        } else if (minutesLate <= 10) {
          // Within 10 minute grace period
          status = "incoming"
        } else {
          // More than 10 minutes late - absent
          status = "absent"
        }
      } else {
        // Compare dates without time
        const selectedDateOnly = new Date(date)
        selectedDateOnly.setHours(0, 0, 0, 0)
        const nowDateOnly = new Date(now)
        nowDateOnly.setHours(0, 0, 0, 0)

        if (selectedDateOnly < nowDateOnly) {
          // Past date - they didn't clock in, so absent
          status = "absent"
        } else {
          // Future date
          status = "incoming"
        }
      }
    }

    matchedShifts.push({
      shift,
      clockIn,
      clockOut,
      status,
      isOnTime,
    })
  })

  return matchedShifts
}

/**
 * Check if a student is currently clocked in (for ANY shift today)
 */
export function isCurrentlyClockedIn(
  staff: Student,
  date: Date = new Date()
): boolean {
  const dateStr = date.toDateString()
  const clockEntries = staff.clockEntries || []

  // Get all clock-ins and clock-outs for today, sorted by time
  const todayEntries = clockEntries
    .filter((entry) => {
      const entryDate = new Date(entry.timestamp)
      return entryDate.toDateString() === dateStr
    })
    .sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

  // Count unmatched clock-ins
  let unmatchedIns = 0
  for (const entry of todayEntries) {
    if (entry.type === "in") {
      unmatchedIns++
    } else if (entry.type === "out" && unmatchedIns > 0) {
      unmatchedIns--
    }
  }

  return unmatchedIns > 0
}

/**
 * Get all upcoming shifts within a time window (for expected arrivals)
 * Returns shifts that start within the next N hours or have started within the last N minutes
 */
export function getUpcomingShifts(
  staff: Student,
  currentTime: Date,
  hoursAhead: number = 2,
  minutesAfterStart: number = 10
): ShiftTime[] {
  const todaySchedule = getTodayScheduleForDate(staff, currentTime)
  const shifts = parseScheduleBlocks(todaySchedule)

  const currentTotalMinutes = dateToMinutes(currentTime)

  return shifts.filter((shift) => {
    const shiftStartMinutes = timeToMinutes(shift.start)

    // Calculate minutes until shift starts
    let minutesUntilShift = shiftStartMinutes - currentTotalMinutes

    // Handle next day (if shift is tomorrow)
    if (minutesUntilShift < 0) {
      minutesUntilShift += 24 * 60
    }

    // Calculate minutes after shift starts (if shift has already started today)
    const minutesAfterShift =
      shiftStartMinutes <= currentTotalMinutes
        ? currentTotalMinutes - shiftStartMinutes
        : -1

    // Include if:
    // 1. Shift starts within N hours from now, OR
    // 2. Shift has started today and it's within N minutes after shift start
    const isBeforeShift =
      minutesUntilShift >= 0 && minutesUntilShift <= hoursAhead * 60
    const isWithinGracePeriod =
      minutesAfterShift >= 0 && minutesAfterShift <= minutesAfterStart

    return isBeforeShift || isWithinGracePeriod
  })
}
