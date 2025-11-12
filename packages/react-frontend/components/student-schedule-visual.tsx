"use client"

import { Badge } from "@/components/ui/badge"
import type { Schedule } from "@/lib/api"

interface StudentScheduleVisualProps {
  schedule?: Schedule
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const HOURS = Array.from({ length: 9 }, (_, i) => i + 8) // 8 AM to 5 PM

export function StudentScheduleVisual({ schedule }: StudentScheduleVisualProps) {
  if (!schedule || !schedule.availability) {
    return (
      <span className="text-muted-foreground italic text-sm">No schedule set</span>
    )
  }

  // Parse time string to minutes from midnight
  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0
    
    const upperTime = timeStr.toUpperCase().trim()
    const hasAM = upperTime.includes("AM")
    const hasPM = upperTime.includes("PM")
    
    const timeWithoutPeriod = timeStr.replace(/\s*(AM|PM)\s*/gi, "").trim()
    
    let hours: number
    let minutes: number
    
    if (timeWithoutPeriod.includes(":")) {
      const parts = timeWithoutPeriod.split(":")
      hours = parseInt(parts[0], 10)
      minutes = parseInt(parts[1] || "0", 10)
    } else {
      hours = parseInt(timeWithoutPeriod, 10)
      minutes = 0
    }
    
    if (isNaN(hours) || isNaN(minutes)) return 0
    
    if (hasAM || hasPM) {
      if (hours === 12 && hasAM) {
        hours = 0
      } else if (hours !== 12 && hasPM) {
        hours += 12
      }
    }
    
    return hours * 60 + minutes
  }

  // Check if available at a specific hour on a specific day
  const isAvailableAtHour = (day: typeof DAYS[number], hour: number): boolean => {
    const daySchedule = schedule.availability[day]
    if (!daySchedule || daySchedule.length === 0) return false
    
    const hourStartMinutes = hour * 60
    const hourEndMinutes = (hour + 1) * 60
    
    return daySchedule.some((block) => {
      const [startStr, endStr] = block.split("-").map(s => s.trim())
      if (!startStr) return false
      
      const startMinutes = parseTime(startStr)
      const endMinutes = endStr ? parseTime(endStr) : startMinutes + 240 // Default 4 hours
      
      return startMinutes < hourEndMinutes && endMinutes > hourStartMinutes
    })
  }

  // Check if has any availability
  const hasAnyAvailability = Object.values(schedule.availability).some(blocks => blocks.length > 0)
  
  if (!hasAnyAvailability) {
    return (
      <span className="text-muted-foreground italic text-sm">No schedule set</span>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Visual grid */}
      <div className="flex gap-1 shrink-0">
        {DAYS.map((day) => (
          <div key={day} className="flex flex-col gap-0.5">
            <div className="text-[10px] text-muted-foreground text-center mb-1 font-medium">
              {DAY_LABELS[DAYS.indexOf(day)]}
            </div>
            {HOURS.map((hour) => {
              const isAvailable = isAvailableAtHour(day, hour)
              return (
                <div
                  key={hour}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm border ${
                    isAvailable
                      ? "bg-slate-600 dark:bg-slate-500"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                  title={`${DAY_LABELS[DAYS.indexOf(day)]} ${hour}:00`}
                />
              )
            })}
          </div>
        ))}
      </div>
      
      {/* Text summary */}
      <div className="flex flex-col gap-1 text-xs text-muted-foreground min-w-0 flex-1">
        {Object.entries(schedule.availability).map(([day, blocks]) => 
          blocks.length > 0 ? (
            <div key={day} className="flex items-start sm:items-center gap-1 flex-wrap">
              <span className="font-medium capitalize w-12 shrink-0">{day.slice(0, 3)}:</span>
              <span className="text-foreground break-words">{blocks.join(", ")}</span>
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}

