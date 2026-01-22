/**
 * Calculation logic for student analytics and breakdowns
 */

import { type Student, type Term } from "@/lib/api"
import { parseDateString } from "@/lib/utils"
import {
  timeToMinutes,
  formatMinutesToTime,
  normalizeTime,
  getWeekdaysInRange,
  isDayOff,
} from "./time-calculations"

/**
 * Calculates expected hours for a student within a date range
 */
export function calculateExpectedHours(
  staff: Student,
  startDate: Date,
  endDate: Date,
  currentTerm?: Term
): number {
  const weekdays = getWeekdaysInRange(startDate, endDate)
  let totalMinutes = 0

  weekdays.forEach(day => {
    // Skip days off
    if (isDayOff(day, currentTerm)) return

    const dayNames: Array<keyof NonNullable<Student['weeklySchedule']> | null> = [null, "monday", "tuesday", "wednesday", "thursday", "friday", null]
    const dayName = dayNames[day.getDay()]
    if (!dayName) return

    const daySchedule = staff.weeklySchedule?.[dayName] || []
    daySchedule.forEach((shiftBlock: string) => {
      const [start, end] = shiftBlock.split("-")
      if (!start || !end) return

      const startTime = normalizeTime(start.trim())
      const endTime = normalizeTime(end.trim())
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(endTime)
      totalMinutes += (endMinutes - startMinutes)
    })
  })

  return totalMinutes / 60 // Convert to hours
}

/**
 * Calculates actual hours worked for a student within a date range
 */
export function calculateActualHours(
  staff: Student,
  startDate: Date,
  endDate: Date
): number {
  const clockIns = (staff.clockEntries || [])
    .filter(e => e.type === "in")
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const clockOuts = (staff.clockEntries || [])
    .filter(e => e.type === "out")
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  
  let totalMinutes = 0
  const usedClockOuts = new Set<number>()
  
  clockIns.forEach(clockIn => {
    const inDate = new Date(clockIn.timestamp)
    if (inDate < startDate || inDate > endDate) return

    // Find the earliest unused clock-out after this clock-in on the same day
    let matchingClockOutIndex = -1
    const clockOut = clockOuts.find((out, idx) => {
      if (usedClockOuts.has(idx)) return false
      const outDate = new Date(out.timestamp)
      if (outDate > inDate && outDate.toDateString() === inDate.toDateString()) {
        matchingClockOutIndex = idx
        return true
      }
      return false
    })

    if (clockOut && matchingClockOutIndex >= 0) {
      usedClockOuts.add(matchingClockOutIndex)
      const outDate = new Date(clockOut.timestamp)
      const diffMs = outDate.getTime() - inDate.getTime()
      totalMinutes += diffMs / (1000 * 60)
    }
  })

  return totalMinutes / 60 // Convert to hours
}

/**
 * Calculates punctuality metrics for a student
 */
export function calculatePunctuality(
  staff: Student,
  termStartDate: string,
  termEndDate: string,
  currentTerm?: Term
) {
  const clockInEntries = (staff.clockEntries || []).filter(e => e.type === "in")
  const termStart = parseDateString(termStartDate)
  const termEnd = parseDateString(termEndDate)
  
  const relevantEntries = clockInEntries.filter(entry => {
    const date = new Date(entry.timestamp)
    return date >= termStart && date <= termEnd
  })

  if (relevantEntries.length === 0) return { onTime: 0, early: 0, late: 0, notScheduled: 0, percentage: 0 }

  let onTimeCount = 0
  let earlyCount = 0
  let lateCount = 0
  let notScheduledCount = 0

  relevantEntries.forEach(entry => {
    const entryDate = new Date(entry.timestamp)
    const dayNames: Array<keyof NonNullable<Student['weeklySchedule']> | null> = [null, "monday", "tuesday", "wednesday", "thursday", "friday", null]
    const dayName = dayNames[entryDate.getDay()]
    if (!dayName) return

    const daySchedule = staff.weeklySchedule?.[dayName] || []
    if (daySchedule.length === 0) {
      // No schedule for this day - count as not scheduled
      notScheduledCount++
      return
    }

    // Find matching clock-out for this clock-in
    const clockOuts = (staff.clockEntries || []).filter(e => e.type === "out")
    const matchingClockOut = clockOuts.find(out => {
      const outDate = new Date(out.timestamp)
      return outDate > entryDate && outDate.toDateString() === entryDate.toDateString()
    })

    if (!matchingClockOut) {
      // No clock-out found - can't determine if it overlaps with scheduled shifts
      // Count as not scheduled to be safe
      notScheduledCount++
      return
    }

    const outDate = new Date(matchingClockOut.timestamp)
    const actualStartMinutes = entryDate.getHours() * 60 + entryDate.getMinutes()
    const actualEndMinutes = outDate.getHours() * 60 + outDate.getMinutes()

    // Check if actual work period overlaps with any scheduled shift period
    let overlapsWithScheduledShift = false
    let earliestShiftStart = Infinity

    daySchedule.forEach((shiftBlock: string) => {
      const [shiftStart, shiftEnd] = shiftBlock.split("-")
      if (shiftStart && shiftEnd) {
        const shiftStartTime = normalizeTime(shiftStart.trim())
        const shiftEndTime = normalizeTime(shiftEnd.trim())
        const shiftStartMinutes = timeToMinutes(shiftStartTime)
        const shiftEndMinutes = timeToMinutes(shiftEndTime)
        
        // Track earliest shift start for punctuality comparison
        if (shiftStartMinutes < earliestShiftStart) {
          earliestShiftStart = shiftStartMinutes
        }
        
        // Check if actual work period overlaps with this scheduled shift
        // Two periods overlap if: actualStart < shiftEnd AND actualEnd > shiftStart
        // (with 30 min buffer before shift start for early arrivals)
        const adjustedShiftStart = shiftStartMinutes - 30
        if (actualStartMinutes < shiftEndMinutes && actualEndMinutes > adjustedShiftStart) {
          overlapsWithScheduledShift = true
        }
      }
    })

    // If work period doesn't overlap with any scheduled shift, mark as not scheduled
    if (!overlapsWithScheduledShift) {
      notScheduledCount++
      return
    }

    // Only calculate punctuality if work period overlaps with a scheduled shift
    // Compare clock-in time to earliest shift start time
    const diffMinutes = actualStartMinutes - earliestShiftStart

    if (diffMinutes < -10) earlyCount++
    else if (diffMinutes <= 10) onTimeCount++
    else lateCount++
  })

  const scheduledEntries = onTimeCount + earlyCount + lateCount
  return {
    onTime: onTimeCount,
    early: earlyCount,
    late: lateCount,
    notScheduled: notScheduledCount,
    percentage: scheduledEntries > 0 ? Math.round(((onTimeCount + earlyCount) / scheduledEntries) * 100) : 0
  }
}

/**
 * Weekly breakdown type
 */
export type WeeklyBreakdown = Array<{
  weekNum: number
  startDate: Date
  endDate: Date
  expectedHours: number
  actualHours: number
  shifts: number
}>

/**
 * Gets weekly breakdown for a student
 */
export function getWeeklyBreakdown(
  staff: Student,
  termStartDate: string,
  termEndDate: string,
  currentTerm?: Term
): WeeklyBreakdown {
  const termStart = parseDateString(termStartDate)
  const termEnd = parseDateString(termEndDate)
  const weeks: WeeklyBreakdown = []

  // Find the Monday of the week containing the term start date
  const termStartMonday = new Date(termStart)
  const startDayOfWeek = termStartMonday.getDay()
  const daysToMonday = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek
  termStartMonday.setDate(termStartMonday.getDate() + daysToMonday)
  termStartMonday.setHours(0, 0, 0, 0)
  
  // Find the Sunday of the week containing the term end date
  const termEndSunday = new Date(termEnd)
  const endDayOfWeek = termEndSunday.getDay()
  const daysToSunday = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek
  termEndSunday.setDate(termEndSunday.getDate() + daysToSunday)
  termEndSunday.setHours(23, 59, 59, 999)

  let currentMonday = new Date(termStartMonday)
  let weekNum = 1

  while (currentMonday <= termEndSunday) {
    const weekSunday = new Date(currentMonday)
    weekSunday.setDate(weekSunday.getDate() + 6)
    weekSunday.setHours(23, 59, 59, 999)
    
    // Cap the week end to term end
    const weekEndCapped = weekSunday > termEnd ? termEnd : weekSunday
    
    // Only calculate for weeks that overlap with the term
    if (currentMonday <= termEnd && weekEndCapped >= termStart) {
      const expectedHours = calculateExpectedHours(staff, currentMonday, weekEndCapped, currentTerm)
      const actualHours = calculateActualHours(staff, currentMonday, weekEndCapped)
      
      const weekClockIns = (staff.clockEntries || []).filter(e => {
        const date = new Date(e.timestamp)
        return e.type === "in" && date >= currentMonday && date <= weekEndCapped
      })

      weeks.push({
        weekNum,
        startDate: new Date(currentMonday),
        endDate: new Date(weekEndCapped),
        expectedHours,
        actualHours,
        shifts: weekClockIns.length
      })
    }

    currentMonday.setDate(currentMonday.getDate() + 7)
    weekNum++
  }

  return weeks
}

/**
 * Aggregates consecutive shifts into single continuous shifts
 * Example: ["8:00 AM-9:00 AM", "9:00 AM-10:00 AM"] => ["8:00 AM-10:00 AM"]
 */
function aggregateConsecutiveShifts(shifts: Array<{ start: string; end: string }>): Array<{ start: string; end: string }> {
  if (shifts.length === 0) return []
  
  // Sort shifts by start time
  const sortedShifts = [...shifts].sort((a, b) => {
    const aMinutes = timeToMinutes(a.start)
    const bMinutes = timeToMinutes(b.start)
    return aMinutes - bMinutes
  })
  
  const aggregated: Array<{ start: string; end: string }> = []
  let currentShift = { ...sortedShifts[0] }
  
  for (let i = 1; i < sortedShifts.length; i++) {
    const shift = sortedShifts[i]
    const currentEndMinutes = timeToMinutes(currentShift.end)
    const shiftStartMinutes = timeToMinutes(shift.start)
    
    // Check if shifts are consecutive or overlapping (within 1 minute tolerance)
    if (Math.abs(currentEndMinutes - shiftStartMinutes) <= 1) {
      // Extend current shift to include this shift's end time
      const shiftEndMinutes = timeToMinutes(shift.end)
      const extendedEndMinutes = Math.max(currentEndMinutes, shiftEndMinutes)
      currentShift.end = formatMinutesToTime(extendedEndMinutes)
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
 * Actual shift with references to original clock entries
 */
export type ActualShift = {
  start: string
  end: string
  clockInEntry: { timestamp: string; index: number }
  clockOutEntry?: { timestamp: string; index: number }
  hours: number
}

/**
 * Daily breakdown day type
 */
export type DailyBreakdownDay = {
  date: Date
  dayName: string
  expectedShifts: Array<{ start: string; end: string }>
  actualShifts: Array<ActualShift>
  expectedHours: number
  actualHours: number
  status: string
  isDayOff: boolean
}

/**
 * Gets daily breakdown for a student
 */
export function getDailyBreakdown(
  staff: Student,
  termStartDate: string,
  termEndDate: string,
  currentTerm?: Term
): DailyBreakdownDay[] {
  const termStart = parseDateString(termStartDate)
  const termEnd = parseDateString(termEndDate)
  const days: DailyBreakdownDay[] = []
  
  // Get all clock entries with their original indices
  const allClockEntries = staff.clockEntries || []

  const weekdays = getWeekdaysInRange(termStart, termEnd)
  
  weekdays.forEach(day => {
    const isOffDay = isDayOff(day, currentTerm)
    const dayNames: Array<keyof NonNullable<Student['weeklySchedule']> | null> = [null, "monday", "tuesday", "wednesday", "thursday", "friday", null]
    const dayName = dayNames[day.getDay()]
    if (!dayName) return

    const daySchedule = staff.weeklySchedule?.[dayName] || []
    const dayStr = day.toDateString()
    
    // Calculate expected hours from ALL shifts - skip for days off
    const rawExpectedShifts: Array<{ start: string; end: string }> = []
    let expectedMinutes = 0
    
    if (!isOffDay && daySchedule.length > 0) {
      // Process all shifts
      daySchedule.forEach((shiftBlock: string) => {
        const [shiftStart, shiftEnd] = shiftBlock.split("-")
        if (shiftStart && shiftEnd) {
          const shiftStartTime = normalizeTime(shiftStart.trim())
          const shiftEndTime = normalizeTime(shiftEnd.trim())
          rawExpectedShifts.push({
            start: shiftStartTime,
            end: shiftEndTime
          })
          
          const shiftStartMinutes = timeToMinutes(shiftStartTime)
          const shiftEndMinutes = timeToMinutes(shiftEndTime)
          expectedMinutes += (shiftEndMinutes - shiftStartMinutes)
        }
      })
    }
    
    // Aggregate consecutive shifts (e.g., 8-9, 9-10 becomes 8-10)
    const expectedShifts = aggregateConsecutiveShifts(rawExpectedShifts)

    // Get actual clock-in/out for this day with their original indices
    const dayClockInsWithIndex = allClockEntries
      .map((e, idx) => ({ entry: e, originalIndex: idx }))
      .filter(({ entry }) => {
        const date = new Date(entry.timestamp)
        return entry.type === "in" && date.toDateString() === dayStr
      })
      .sort((a, b) => new Date(a.entry.timestamp).getTime() - new Date(b.entry.timestamp).getTime())
    
    const dayClockOutsWithIndex = allClockEntries
      .map((e, idx) => ({ entry: e, originalIndex: idx }))
      .filter(({ entry }) => {
        const date = new Date(entry.timestamp)
        return entry.type === "out" && date.toDateString() === dayStr
      })
      .sort((a, b) => new Date(a.entry.timestamp).getTime() - new Date(b.entry.timestamp).getTime())

    const actualShifts: ActualShift[] = []
    let actualMinutes = 0

    // Handle multiple shifts: match each clock-in with its corresponding clock-out
    if (dayClockInsWithIndex.length > 0) {
      const usedClockOuts = new Set<number>()
      
      dayClockInsWithIndex.forEach(({ entry: clockIn, originalIndex: clockInIndex }) => {
        const inDate = new Date(clockIn.timestamp)
        
        // Find the earliest unused clock-out after this clock-in
        let matchingClockOutIdx = -1
        const matchingClockOutData = dayClockOutsWithIndex.find(({ originalIndex }, idx) => {
          if (usedClockOuts.has(idx)) return false
          const outDate = new Date(allClockEntries[originalIndex].timestamp)
          if (outDate > inDate) {
            matchingClockOutIdx = idx
            return true
          }
          return false
        })
        
        const shiftStart = formatMinutesToTime(inDate.getHours() * 60 + inDate.getMinutes())
        
        if (matchingClockOutData && matchingClockOutIdx >= 0) {
          const outDate = new Date(matchingClockOutData.entry.timestamp)
          usedClockOuts.add(matchingClockOutIdx)
          
          const shiftEnd = formatMinutesToTime(outDate.getHours() * 60 + outDate.getMinutes())
          const shiftMinutes = (outDate.getTime() - inDate.getTime()) / (1000 * 60)
          
          actualShifts.push({
            start: shiftStart,
            end: shiftEnd,
            clockInEntry: { timestamp: clockIn.timestamp, index: clockInIndex },
            clockOutEntry: { timestamp: matchingClockOutData.entry.timestamp, index: matchingClockOutData.originalIndex },
            hours: shiftMinutes / 60
          })
          
          actualMinutes += shiftMinutes
        } else {
          // Clock-in without matching clock-out
          actualShifts.push({
            start: shiftStart,
            end: "—",
            clockInEntry: { timestamp: clockIn.timestamp, index: clockInIndex },
            clockOutEntry: undefined,
            hours: 0
          })
        }
      })
    }

    // Determine status
    let status = "not-scheduled"
    if (isOffDay) {
      status = "day-off"
    } else if (daySchedule.length > 0) {
      if (dayClockInsWithIndex.length === 0) {
        status = "absent"
      } else {
        // Check if any clock-ins have work periods that don't overlap with scheduled shifts
        const clockInsOutsideSchedule = dayClockInsWithIndex.filter(({ entry: clockIn }) => {
          const inDate = new Date(clockIn.timestamp)
          const actualStartMinutes = inDate.getHours() * 60 + inDate.getMinutes()
          
          // Find matching clock-out
          const matchingClockOut = dayClockOutsWithIndex.find(({ entry: out }) => {
            const outDate = new Date(out.timestamp)
            return outDate > inDate
          })
          
          if (!matchingClockOut) {
            return true
          }
          
          const outDate = new Date(matchingClockOut.entry.timestamp)
          const actualEndMinutes = outDate.getHours() * 60 + outDate.getMinutes()
          
          let overlapsWithScheduledShift = false
          daySchedule.forEach((shiftBlock: string) => {
            const [shiftStart, shiftEnd] = shiftBlock.split("-")
            if (shiftStart && shiftEnd) {
              const shiftStartTime = normalizeTime(shiftStart.trim())
              const shiftEndTime = normalizeTime(shiftEnd.trim())
              const shiftStartMinutes = timeToMinutes(shiftStartTime)
              const shiftEndMinutes = timeToMinutes(shiftEndTime)
              
              const adjustedShiftStart = shiftStartMinutes - 30
              if (actualStartMinutes < shiftEndMinutes && actualEndMinutes > adjustedShiftStart) {
                overlapsWithScheduledShift = true
              }
            }
          })
          
          return !overlapsWithScheduledShift
        })
        
        if (clockInsOutsideSchedule.length > 0) {
          status = "unscheduled-work"
        } else {
          const unmatchedClockIns = dayClockInsWithIndex.filter(({ entry: clockIn }) => {
            const inDate = new Date(clockIn.timestamp)
            return !dayClockOutsWithIndex.some(({ entry: out }) => {
              const outDate = new Date(out.timestamp)
              return outDate > inDate
            })
          })
          
          if (unmatchedClockIns.length > 0) {
            status = "no-clock-out"
          } else {
            status = "completed"
          }
        }
      }
    } else if (dayClockInsWithIndex.length > 0) {
      status = "unscheduled-work"
    }

    days.push({
      date: new Date(day),
      dayName: day.toLocaleDateString("en-US", { weekday: "long" }),
      expectedShifts,
      actualShifts,
      expectedHours: expectedMinutes / 60,
      actualHours: actualMinutes / 60,
      status,
      isDayOff: isOffDay
    })
  })

  return days
}

/**
 * Groups daily breakdown days by week
 */
export function groupDaysByWeek(
  days: DailyBreakdownDay[],
  termStartDate: string,
  termEndDate: string
): Array<{
  weekNum: number
  startDate: Date
  endDate: Date
  days: Array<DailyBreakdownDay | null>
}> {
  const weeks: Array<{
    weekNum: number
    startDate: Date
    endDate: Date
    days: Array<DailyBreakdownDay | null>
  }> = []

  if (days.length === 0) return weeks

  const termStart = parseDateString(termStartDate)
  const termEnd = parseDateString(termEndDate)
  
  // Find the Monday of the week containing the term start date
  const termStartMonday = new Date(termStart)
  const startDayOfWeek = termStartMonday.getDay()
  const daysToMonday = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek
  termStartMonday.setDate(termStartMonday.getDate() + daysToMonday)
  termStartMonday.setHours(0, 0, 0, 0)
  
  // Find the Sunday of the week containing the term end date
  const termEndSunday = new Date(termEnd)
  const endDayOfWeek = termEndSunday.getDay()
  const daysToSunday = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek
  termEndSunday.setDate(termEndSunday.getDate() + daysToSunday)
  termEndSunday.setHours(23, 59, 59, 999)
  
  // Create weeks from Monday to Sunday within term bounds
  let currentMonday = new Date(termStartMonday)
  let weekNum = 1
  
  while (currentMonday <= termEndSunday) {
    const weekSunday = new Date(currentMonday)
    weekSunday.setDate(weekSunday.getDate() + 6)
    weekSunday.setHours(23, 59, 59, 999)
    
    // Cap the week end to term end
    const weekEndCapped = weekSunday > termEnd ? termEnd : weekSunday
    
    const weekDays: Array<DailyBreakdownDay | null> = [null, null, null, null, null] // Monday-Friday slots
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    
    // Find days that fall within this calendar week
    days.forEach(day => {
      const dayDate = new Date(day.date)
      dayDate.setHours(0, 0, 0, 0)
      
      if (dayDate >= currentMonday && dayDate <= weekEndCapped) {
        const dayIndex = dayOrder.indexOf(day.dayName)
        if (dayIndex >= 0) {
          weekDays[dayIndex] = day
        }
      }
    })
    
    // Only add week if it has at least one day or is within term bounds
    if (weekDays.some(d => d !== null) || (currentMonday <= termEnd && weekEndCapped >= termStart)) {
      weeks.push({
        weekNum,
        startDate: new Date(currentMonday),
        endDate: new Date(weekEndCapped),
        days: weekDays
      })
    }
    
    currentMonday.setDate(currentMonday.getDate() + 7)
    weekNum++
  }

  return weeks
}

/**
 * Groups daily breakdown days by month
 */
export function groupDaysByMonth(
  days: DailyBreakdownDay[]
): Array<{
  monthName: string
  monthYear: string
  days: DailyBreakdownDay[]
  totalExpected: number
  totalActual: number
  calendarWeeks: Array<Array<DailyBreakdownDay | null>>
}> {
  const months: Array<{
    monthName: string
    monthYear: string
    days: DailyBreakdownDay[]
    totalExpected: number
    totalActual: number
    calendarWeeks: Array<Array<DailyBreakdownDay | null>>
  }> = []

  let currentMonth: typeof months[0] | null = null

  days.forEach(day => {
    const monthKey = day.date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    const monthName = day.date.toLocaleDateString("en-US", { month: "long" })
    const monthYear = day.date.toLocaleDateString("en-US", { year: "numeric" })
    
    if (!currentMonth || currentMonth.monthYear !== monthKey) {
      currentMonth = {
        monthName,
        monthYear: monthKey,
        days: [],
        totalExpected: 0,
        totalActual: 0,
        calendarWeeks: [],
      }
      months.push(currentMonth)
    }

    currentMonth.days.push(day)
    currentMonth.totalExpected += day.expectedHours
    currentMonth.totalActual += day.actualHours
  })

  // Build calendar weeks for each month
  months.forEach(month => {
    const weeks: Array<Array<DailyBreakdownDay | null>> = []
    let currentWeek: Array<DailyBreakdownDay | null> = [null, null, null, null, null] // Monday-Friday slots
    
    month.days.forEach(day => {
      const dayOfWeek = day.date.getDay()
      // Map: Monday=1, Tuesday=2, ..., Friday=5
      const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1 // Sunday becomes -1, but we skip weekends
      
      // If we hit a Monday (dayIndex === 0) and currentWeek has data, start a new week
      if (dayIndex === 0 && currentWeek.some(d => d !== null)) {
        weeks.push(currentWeek)
        currentWeek = [null, null, null, null, null]
      }
      
      // Only add weekdays (Monday-Friday)
      if (dayIndex >= 0 && dayIndex < 5) {
        currentWeek[dayIndex] = day
      }
    })
    
    // Add the last week if it has any data
    if (currentWeek.some(d => d !== null)) {
      weeks.push(currentWeek)
    }
    
    month.calendarWeeks = weeks
  })

  return months
}




