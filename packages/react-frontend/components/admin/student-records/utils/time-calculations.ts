/**
 * Utility functions for time calculations and formatting
 */

import { parseDateString } from "@/lib/utils"

/**
 * Converts a time string (e.g., "9:00 AM") to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [time, period] = timeStr.split(" ")
  const [hours, minutes] = time.split(":").map(Number)
  let totalMinutes = hours * 60 + minutes
  if (period === "PM" && hours !== 12) totalMinutes += 12 * 60
  else if (period === "AM" && hours === 12) totalMinutes -= 12 * 60
  return totalMinutes
}

/**
 * Formats minutes since midnight to a time string (e.g., "9:00 AM")
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`
}

/**
 * Normalizes a time string to a consistent format (12-hour format with AM/PM)
 */
export function normalizeTime(timeStr: string): string {
  const upperTime = timeStr.toUpperCase()
  const hasMinutes = timeStr.includes(":")
  const hasAMPM = upperTime.includes("AM") || upperTime.includes("PM")
  
  if (hasAMPM) {
    let normalized = timeStr.replace(/([ap]m)/gi, (match) => ` ${match.toUpperCase()}`)
      .replace(/\s+/g, ' ')
    if (!hasMinutes) {
      normalized = normalized.replace(/\s(AM|PM)/, ':00 $1')
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
 * Gets the week number for a given date within a term
 */
export function getWeekNumber(date: Date, termStartDate: string, termEndDate: string): number {
  const startDate = parseDateString(termStartDate)
  const termEnd = parseDateString(termEndDate)
  
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
  while (current <= endDate) {
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
export function isDayOff(date: Date, currentTerm?: { daysOff?: Array<{ startDate: string; endDate: string }> }): boolean {
  if (!currentTerm || !currentTerm.daysOff || currentTerm.daysOff.length === 0) {
    return false
  }

  const dateStr = date.toISOString().split('T')[0]
  
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
