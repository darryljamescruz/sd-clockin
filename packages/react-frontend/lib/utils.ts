import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a date string (YYYY-MM-DD) as a local Date object without timezone conversion issues.
 * This prevents dates from shifting by a day when converted from UTC to local time.
 */
export function parseDateString(dateString: string): Date {
  if (!dateString) return new Date()
  
  // If it's already in YYYY-MM-DD format, parse it directly as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day) // Month is 0-indexed
  }
  
  // If it's an ISO string, extract the date part and parse as local
  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch.map(Number)
    return new Date(year, month - 1, day) // Month is 0-indexed
  }
  
  // Fallback: try to parse as Date and use UTC methods
  const date = new Date(dateString)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()
  return new Date(year, month, day)
}

/**
 * Formats a date string (YYYY-MM-DD) to a localized date string without timezone conversion issues.
 * This prevents dates from shifting by a day when converted from UTC to local time.
 */
export function formatDateString(dateString: string): string {
  const date = parseDateString(dateString)
  return date.toLocaleDateString()
}
