/**
 * Time calculation utilities for student records
 *
 * This file re-exports from the consolidated lib utilities for backwards compatibility.
 * New code should import directly from @/lib/time-utils or @/lib/schedule-utils
 */

// Re-export time utilities
export {
  timeToMinutes,
  formatMinutesToTime,
  normalizeTime,
} from "@/lib/time-utils"

// Re-export schedule utilities
export {
  getWeekNumber,
  getWeekStartDate,
  getWeekdaysInRange,
  isDayOff,
} from "@/lib/schedule-utils"
