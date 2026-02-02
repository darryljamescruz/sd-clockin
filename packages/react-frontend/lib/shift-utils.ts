/**
 * Shared utility functions for shift and time calculations
 * Used across multiple components to ensure consistent logic
 */

import { type Student } from "@/lib/api"

export interface ShiftTime {
  start: string
  end: string
  original: string
}

export interface MatchedShift {
  shift: ShiftTime
  clockIn: string | null
  clockOut: string | null
  status: "incoming" | "early" | "on-time" | "late" | "absent"
  isOnTime: boolean
}

/**
 * Convert time string to minutes since midnight
 * Handles various formats: "9:00 AM", "9 AM", "09:00", "17:00", etc.
 */
export function timeToMinutes(timeStr: string | null): number {
  if (!timeStr) return 0
  
  const upperTime = timeStr.toUpperCase().trim()
  const hasAM = upperTime.includes("AM")
  const hasPM = upperTime.includes("PM")
  
  // Remove AM/PM for parsing
  const timeWithoutPeriod = timeStr.replace(/\s*(AM|PM)\s*/gi, "").trim()
  
  // Parse hours and minutes
  let hours: number
  let minutes: number
  
  if (timeWithoutPeriod.includes(":")) {
    const parts = timeWithoutPeriod.split(":")
    hours = parseInt(parts[0], 10)
    minutes = parseInt(parts[1] || "0", 10)
  } else {
    // Just a number (e.g., "5" or "12" or "17")
    hours = parseInt(timeWithoutPeriod, 10)
    minutes = 0
  }
  
  if (isNaN(hours) || isNaN(minutes)) return 0
  
  // Convert to 24-hour format
  if (hasAM || hasPM) {
    // 12-hour format with AM/PM
    if (hours === 12 && hasAM) {
      hours = 0 // 12 AM is midnight
    } else if (hours !== 12 && hasPM) {
      hours += 12 // PM adds 12 hours (except 12 PM)
    }
    // If hours === 12 && hasPM, it stays 12 (noon)
  } else {
    // No AM/PM specified - assume 24-hour format
    // Times like "12:30" or "17" are already in 24-hour format
  }
  
  return hours * 60 + minutes
}

/**
 * Get today's schedule for a specific date
 */
export function getTodayScheduleForDate(
  staff: Student,
  date: Date
): string[] {
  const dayNames: Array<keyof NonNullable<Student['weeklySchedule']> | null> = [
    null,
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    null,
  ]
  const dayName = dayNames[date.getDay()]
  if (!dayName) return []
  return staff.weeklySchedule?.[dayName] || []
}

/**
 * Extract start time from a schedule block (e.g., "9:00 AM-5:00 PM" -> "9:00 AM")
 */
export function getExpectedStartTimeFromSchedule(
  scheduleBlock: string
): string | null {
  if (!scheduleBlock) return null
  const startTime = scheduleBlock.split("-")[0].trim()
  return startTime || null
}

/**
 * Extract end time from a schedule block (e.g., "9:00 AM-5:00 PM" -> "5:00 PM")
 */
export function getExpectedEndTimeFromSchedule(
  scheduleBlock: string
): string | null {
  if (!scheduleBlock) return null
  const endTime = scheduleBlock.split("-")[1]?.trim()
  return endTime || null
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
 */
export function aggregateConsecutiveShifts(shifts: ShiftTime[]): ShiftTime[] {
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

    // Check if shifts are consecutive or overlapping (within 5 minute tolerance)
    if (Math.abs(currentEndMinutes - shiftStartMinutes) <= 5) {
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
 * Format minutes since midnight to time string (e.g., 540 -> "9:00 am")
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  let hours12 = hours24
  let period = "am"

  if (hours24 === 0) {
    hours12 = 12
    period = "am"
  } else if (hours24 === 12) {
    hours12 = 12
    period = "pm"
  } else if (hours24 > 12) {
    hours12 = hours24 - 12
    period = "pm"
  }

  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
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
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  
  const clockOuts = (staff.clockEntries || [])
    .filter((entry) => {
      const entryDate = new Date(entry.timestamp)
      return entryDate.toDateString() === dateStr && entry.type === "out"
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  
  // Track used clock entries to avoid matching them to multiple shifts
  const usedClockIns = new Set<string>()
  const usedClockOuts = new Set<string>()
  
  const matchedShifts: MatchedShift[] = []
  
  // For each expected shift, try to find matching clock entries
  shifts.forEach((shift) => {
    const shiftStartMinutes = timeToMinutes(shift.start)
    const shiftEndMinutes = shift.end ? timeToMinutes(shift.end) : shiftStartMinutes + 240 // Default 4 hours
    
    // Find clock-in for this shift - match within 1 hour before shift start to shift end
    const clockInEntry = clockIns.find((entry) => {
      const entryId = entry.id || entry.timestamp
      if (usedClockIns.has(entryId)) return false
      
      const entryDate = new Date(entry.timestamp)
      const entryMinutes = entryDate.getHours() * 60 + entryDate.getMinutes()
      
      // Match if within 1 hour before shift start to shift end
      return entryMinutes >= shiftStartMinutes - 60 && entryMinutes <= shiftEndMinutes
    })
    
    let clockIn: string | null = null
    let clockOut: string | null = null
    let status: "incoming" | "early" | "on-time" | "late" | "absent" = "incoming"
    let isOnTime = false
    
    if (clockInEntry) {
      const clockInId = clockInEntry.id || clockInEntry.timestamp
      usedClockIns.add(clockInId)
      
      const clockInDate = new Date(clockInEntry.timestamp)
      const hours = clockInDate.getHours()
      const minutes = clockInDate.getMinutes()
      const period = hours >= 12 ? "pm" : "am"
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      clockIn = `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
      
      // Find matching clock-out
      const clockOutEntry = clockOuts.find((entry) => {
        const entryId = entry.id || entry.timestamp
        if (usedClockOuts.has(entryId)) return false
        
        const entryDate = new Date(entry.timestamp)
        if (entryDate <= clockInDate) return false
        
        const entryMinutes = entryDate.getHours() * 60 + entryDate.getMinutes()
        
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
        
        const clockOutDate = new Date(clockOutEntry.timestamp)
        const outHours = clockOutDate.getHours()
        const outMinutes = clockOutDate.getMinutes()
        const outPeriod = outHours >= 12 ? "pm" : "am"
        const outDisplayHours = outHours === 0 ? 12 : outHours > 12 ? outHours - 12 : outHours
        clockOut = `${outDisplayHours}:${outMinutes.toString().padStart(2, "0")} ${outPeriod}`
      }
      
      // Determine status based on clock-in time
      const expectedMinutes = shiftStartMinutes
      const actualMinutes = clockInDate.getHours() * 60 + clockInDate.getMinutes()
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
        const nowMinutes = now.getHours() * 60 + now.getMinutes()
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
export function isCurrentlyClockedIn(staff: Student, date: Date = new Date()): boolean {
  const dateStr = date.toDateString()
  const clockEntries = staff.clockEntries || []
  
  // Get all clock-ins and clock-outs for today, sorted by time
  const todayEntries = clockEntries
    .filter((entry) => {
      const entryDate = new Date(entry.timestamp)
      return entryDate.toDateString() === dateStr
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  
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
  
  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const currentTotalMinutes = currentHour * 60 + currentMinute
  
  return shifts.filter((shift) => {
    const shiftStartMinutes = timeToMinutes(shift.start)
    
    // Calculate minutes until shift starts
    let minutesUntilShift = shiftStartMinutes - currentTotalMinutes
    
    // Handle next day (if shift is tomorrow)
    if (minutesUntilShift < 0) {
      minutesUntilShift += 24 * 60
    }
    
    // Calculate minutes after shift starts (if shift has already started today)
    const minutesAfterShift = shiftStartMinutes <= currentTotalMinutes
      ? currentTotalMinutes - shiftStartMinutes
      : -1
    
    // Include if:
    // 1. Shift starts within N hours from now, OR
    // 2. Shift has started today and it's within N minutes after shift start
    const isBeforeShift = minutesUntilShift >= 0 && minutesUntilShift <= hoursAhead * 60
    const isWithinGracePeriod = minutesAfterShift >= 0 && minutesAfterShift <= minutesAfterStart
    
    return isBeforeShift || isWithinGracePeriod
  })
}

/**
 * Format time for display (converts to 12-hour format with lowercase am/pm)
 */
export function formatTimeForDisplay(timeStr: string | null): string {
  if (!timeStr) return "—"
  
  const upperTime = timeStr.toUpperCase().trim()
  const hasAM = upperTime.includes("AM")
  const hasPM = upperTime.includes("PM")
  
  // If already has AM/PM, convert to lowercase
  if (hasAM || hasPM) {
    return timeStr.replace(/\s*(AM|PM)\s*/gi, (_, period) => ` ${period.toLowerCase()}`).trim()
  }
  
  // Parse 24-hour format and convert to 12-hour am/pm
  let hours: number
  let minutes: number
  
  if (timeStr.includes(":")) {
    const parts = timeStr.split(":")
    hours = parseInt(parts[0], 10)
    minutes = parseInt(parts[1] || "0", 10)
  } else {
    // Just a number (e.g., "5" or "17")
    hours = parseInt(timeStr, 10)
    minutes = 0
  }
  
  if (isNaN(hours) || isNaN(minutes)) return timeStr
  
  // Convert to 12-hour format
  let period = "am"
  let displayHours = hours
  
  if (hours === 0) {
    displayHours = 12 // Midnight
    period = "am"
  } else if (hours === 12) {
    displayHours = 12 // Noon
    period = "pm"
  } else if (hours > 12) {
    displayHours = hours - 12
    period = "pm"
  } else {
    displayHours = hours
    period = "am"
  }
  
  // Always format with minutes (pad to 2 digits)
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
}

