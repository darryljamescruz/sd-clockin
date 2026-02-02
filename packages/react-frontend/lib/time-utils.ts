/**
 * Consolidated time utility functions
 * Single source of truth for all time conversion, formatting, and calculation logic
 */

/**
 * Convert time string to minutes since midnight
 * Handles various formats: "9:00 AM", "9 AM", "09:00", "17:00", etc.
 */
export function timeToMinutes(timeStr: string | null | undefined): number {
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
  }
  // No AM/PM specified - assume 24-hour format

  return hours * 60 + minutes
}

/**
 * Convert a Date object to minutes since midnight
 */
export function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

/**
 * Format minutes since midnight to time string
 * @param totalMinutes - Minutes since midnight
 * @param uppercase - If true, returns "AM/PM", otherwise "am/pm" (default: false)
 */
export function formatMinutesToTime(
  totalMinutes: number,
  uppercase: boolean = false
): string {
  const hours24 = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)

  let hours12 = hours24
  let period = uppercase ? "AM" : "am"

  if (hours24 === 0) {
    hours12 = 12
    period = uppercase ? "AM" : "am"
  } else if (hours24 === 12) {
    hours12 = 12
    period = uppercase ? "PM" : "pm"
  } else if (hours24 > 12) {
    hours12 = hours24 - 12
    period = uppercase ? "PM" : "pm"
  }

  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
}

/**
 * Format time for display (converts to 12-hour format with lowercase am/pm)
 */
export function formatTimeForDisplay(timeStr: string | null | undefined): string {
  if (!timeStr) return "—"

  const upperTime = timeStr.toUpperCase().trim()
  const hasAM = upperTime.includes("AM")
  const hasPM = upperTime.includes("PM")

  // If already has AM/PM, convert to lowercase
  if (hasAM || hasPM) {
    return timeStr
      .replace(/\s*(AM|PM)\s*/gi, (_, period) => ` ${period.toLowerCase()}`)
      .trim()
  }

  // Parse 24-hour format and convert to 12-hour am/pm
  const minutes = timeToMinutes(timeStr)
  return formatMinutesToTime(minutes)
}

/**
 * Normalizes a time string to a consistent format (12-hour format with AM/PM uppercase)
 */
export function normalizeTime(timeStr: string): string {
  const upperTime = timeStr.toUpperCase()
  const hasMinutes = timeStr.includes(":")
  const hasAMPM = upperTime.includes("AM") || upperTime.includes("PM")

  if (hasAMPM) {
    let normalized = timeStr
      .replace(/([ap]m)/gi, (match) => ` ${match.toUpperCase()}`)
      .replace(/\s+/g, " ")
      .trim()
    if (!hasMinutes) {
      normalized = normalized.replace(/\s(AM|PM)/, ":00 $1")
    }
    return normalized
  }

  // If no AM/PM, assume it's 24-hour format and convert to 12-hour
  const parts = timeStr.split(":")
  if (parts.length >= 1) {
    const hour = parseInt(parts[0], 10)
    const minute = parts[1] || "00"

    if (hour === 0) {
      return `12:${minute} AM`
    } else if (hour < 12) {
      return `${hour}:${minute} AM`
    } else if (hour === 12) {
      return `12:${minute} PM`
    } else {
      return `${hour - 12}:${minute} PM`
    }
  }

  return timeStr
}

/**
 * Format a Date timestamp to a display time string (e.g., "9:30 am")
 */
export function formatTimestampToDisplay(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? "pm" : "am"
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
}

/**
 * Calculate duration between two times in minutes
 */
export function calculateDurationMinutes(
  startTime: string,
  endTime: string
): number {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  return endMinutes - startMinutes
}

/**
 * Format a duration in minutes to a human-readable string
 * @param minutes - Duration in minutes
 * @param format - "short" (e.g., "2h 30m") or "long" (e.g., "2 hours 30 minutes")
 */
export function formatDuration(
  minutes: number,
  format: "short" | "long" = "short"
): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)

  if (format === "long") {
    if (hours === 0) return `${mins} minute${mins !== 1 ? "s" : ""}`
    if (mins === 0) return `${hours} hour${hours !== 1 ? "s" : ""}`
    return `${hours} hour${hours !== 1 ? "s" : ""} ${mins} minute${mins !== 1 ? "s" : ""}`
  }

  // Short format
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format hours as a decimal string (e.g., 2.5 -> "2.5 hrs")
 */
export function formatHours(hours: number, decimals: number = 1): string {
  return `${hours.toFixed(decimals)} hr${hours !== 1 ? "s" : ""}`
}
