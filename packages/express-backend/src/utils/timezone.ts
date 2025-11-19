/**
 * Timezone utility functions for PST/PDT handling
 * Ensures consistent date handling across different server timezones
 * Uses date-fns-tz for reliable timezone conversion
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const PST_TIMEZONE = 'America/Los_Angeles';

/**
 * Get the PST date components (year, month, day) from a given date
 * @param date - The date to convert to PST
 * @returns Object with pstYear, pstMonth (0-indexed), pstDate
 */
export function getPSTDateComponents(date: Date): {
  pstYear: number;
  pstMonth: number;
  pstDate: number;
} {
  const pstDate = toZonedTime(date, PST_TIMEZONE);
  return {
    pstYear: pstDate.getFullYear(),
    pstMonth: pstDate.getMonth(), // Already 0-indexed
    pstDate: pstDate.getDate(),
  };
}

/**
 * Get the PST date as a UTC Date object (midnight PST in UTC)
 * This is used for MongoDB queries to ensure consistent date matching
 * @param date - The date to convert
 * @returns Date object representing midnight PST of the given date (in UTC)
 */
export function getPSTDateAsUTC(date: Date): Date {
  const { pstYear, pstMonth, pstDate } = getPSTDateComponents(date);

  // Create a date representing midnight PST
  const pstMidnight = new Date(pstYear, pstMonth, pstDate, 0, 0, 0, 0);

  // Convert PST midnight to UTC using date-fns-tz
  // This automatically handles DST (PST/PDT)
  return fromZonedTime(pstMidnight, PST_TIMEZONE);
}

/**
 * Get start and end of day boundaries in PST, converted to UTC for MongoDB queries
 * @param date - The date to get boundaries for
 * @returns Object with startOfDay and endOfDay as Date objects (in UTC)
 */
export function getPSTDayBoundaries(date: Date): {
  startOfDay: Date;
  endOfDay: Date;
} {
  const { pstYear, pstMonth, pstDate } = getPSTDateComponents(date);

  // Create dates for PST midnight and end of day
  const pstMidnight = new Date(pstYear, pstMonth, pstDate, 0, 0, 0, 0);
  const pstEndOfDay = new Date(pstYear, pstMonth, pstDate, 23, 59, 59, 999);

  // Convert PST times to UTC using date-fns-tz (automatically handles DST)
  const startOfDay = fromZonedTime(pstMidnight, PST_TIMEZONE);
  const endOfDay = fromZonedTime(pstEndOfDay, PST_TIMEZONE);

  return { startOfDay, endOfDay };
}
