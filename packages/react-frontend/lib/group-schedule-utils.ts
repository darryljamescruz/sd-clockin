import { type Student } from "@/lib/api"
import { timeToMinutes } from "@/lib/time-utils"

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const

export type WeekdayScheduleKey = keyof NonNullable<Student["weeklySchedule"]>

export interface HourlyScheduledRow {
  hour: string
  leads: number
  assistants: number
  total: number
}

function formatHourSlot(hour: number): string {
  const fmt = (h: number) => {
    if (h === 12) return "12PM"
    if (h < 12) return `${h}AM`
    return `${h - 12}PM`
  }
  return `${fmt(hour)}-${fmt(hour + 1)}`
}

/** Whether any availability block overlaps [hourStartMin, hourEndMin). */
function isStaffScheduledInWindow(
  staff: Student,
  dayKey: WeekdayScheduleKey,
  hourStartMin: number,
  hourEndMin: number
): boolean {
  const daySchedule = staff.weeklySchedule?.[dayKey] || []
  for (const block of daySchedule) {
    const [startStr, endStr] = block.split("-").map((s) => s.trim())
    if (!startStr) continue
    const sm = timeToMinutes(startStr)
    const em = endStr ? timeToMinutes(endStr) : sm + 240
    if (sm < hourEndMin && em > hourStartMin) return true
  }
  return false
}

/** Staff with at least one block on that weekday (any time). */
export function countStaffScheduledOnWeekday(
  staffList: Student[],
  dayKey: WeekdayScheduleKey
): { total: number; leads: number; assistants: number } {
  let leads = 0
  let assistants = 0
  for (const staff of staffList) {
    if (staff.role !== "Student Assistant" && staff.role !== "Student Lead") continue
    const daySchedule = staff.weeklySchedule?.[dayKey] || []
    if (daySchedule.length === 0) continue
    const hasBlock = daySchedule.some((block) => {
      const [startStr] = block.split("-").map((s) => s.trim())
      return Boolean(startStr)
    })
    if (!hasBlock) continue
    if (staff.role === "Student Lead") leads++
    else assistants++
  }
  return { total: leads + assistants, leads, assistants }
}

/** Mon–Fri keys in the saved weekly template (repeats every week). */
export const TEMPLATE_WEEKDAY_KEYS: WeekdayScheduleKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
]

export function buildHourlyScheduledCoverageForWeekday(
  staffData: Student[],
  dayKey: WeekdayScheduleKey,
  hourFrom = 8,
  hourTo = 16
): HourlyScheduledRow[] {
  const eligible = staffData.filter(
    (s) => s.role === "Student Assistant" || s.role === "Student Lead"
  )

  const rows: HourlyScheduledRow[] = []
  for (let hour = hourFrom; hour <= hourTo; hour++) {
    const hourStartMin = hour * 60
    const hourEndMin = (hour + 1) * 60
    let leads = 0
    let assistants = 0
    for (const staff of eligible) {
      if (!isStaffScheduledInWindow(staff, dayKey, hourStartMin, hourEndMin)) continue
      if (staff.role === "Student Lead") leads++
      else assistants++
    }
    rows.push({
      hour: formatHourSlot(hour),
      leads,
      assistants,
      total: leads + assistants,
    })
  }
  return rows
}

export function buildHourlyScheduledCoverage(
  staffData: Student[],
  selectedDate: Date,
  hourFrom = 8,
  hourTo = 16
): HourlyScheduledRow[] {
  const dayKey = DAY_NAMES[selectedDate.getDay()] as WeekdayScheduleKey
  return buildHourlyScheduledCoverageForWeekday(staffData, dayKey, hourFrom, hourTo)
}

export function summarizeCoverage(rows: HourlyScheduledRow[]): {
  peakTotal: number
  peakHourLabel: string
  peakLeads: number
  hoursWithoutLead: number
} {
  let peakTotal = 0
  let peakHourLabel = rows[0]?.hour ?? ""
  let peakLeads = 0
  let hoursWithoutLead = 0
  for (const r of rows) {
    if (r.total > peakTotal) {
      peakTotal = r.total
      peakHourLabel = r.hour
    }
    if (r.leads > peakLeads) peakLeads = r.leads
    if (r.total > 0 && r.leads === 0) hoursWithoutLead++
  }
  return { peakTotal, peakHourLabel, peakLeads, hoursWithoutLead }
}
