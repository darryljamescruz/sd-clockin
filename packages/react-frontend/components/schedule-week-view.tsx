"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import type { Schedule, Student } from "@/lib/api"
import { useMemo } from "react"

interface ScheduleWeekViewProps {
  students: Student[]
  schedules: Record<string, Schedule>
  selectedTermName?: string
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const HOURS = Array.from({ length: 9 }, (_, i) => i + 8) // 8 AM to 5 PM

export function ScheduleWeekView({ students, schedules, selectedTermName }: ScheduleWeekViewProps) {
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

  // Check if a student is available at a specific hour on a specific day
  const isAvailableAtHour = (student: Student, day: typeof DAYS[number], hour: number): boolean => {
    const schedule = schedules[student.id]
    if (!schedule || !schedule.availability) return false
    
    const daySchedule = schedule.availability[day]
    if (!daySchedule || daySchedule.length === 0) return false
    
    const hourStartMinutes = hour * 60
    const hourEndMinutes = (hour + 1) * 60
    
    return daySchedule.some((block) => {
      const [startStr, endStr] = block.split("-").map(s => s.trim())
      if (!startStr) return false
      
      const startMinutes = parseTime(startStr)
      const endMinutes = endStr ? parseTime(endStr) : startMinutes + 240 // Default 4 hours if no end
      
      // Check if hour overlaps with the time block
      return startMinutes < hourEndMinutes && endMinutes > hourStartMinutes
    })
  }

  // Get all students available at a specific hour on a specific day
  const getStudentsAtHour = (day: typeof DAYS[number], hour: number): Student[] => {
    return students.filter(student => isAvailableAtHour(student, day, hour))
  }

  // Format hour for display (condensed format)
  const formatHour = (hour: number): string => {
    if (hour === 0) return "12a"
    if (hour < 12) return `${hour}a`
    if (hour === 12) return "12p"
    return `${hour - 12}p`
  }

  // Get color for student role
  const getRoleColor = (role: string): string => {
    if (role === "Student Lead") {
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
    }
    return "bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400"
  }

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="w-5 h-5" />
          Weekly Schedule View {selectedTermName && `- ${selectedTermName}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with day labels */}
            <div className="grid grid-cols-6 gap-3 mb-3 pb-3 border-b">
              <div className="font-semibold text-sm text-muted-foreground">Time</div>
              {DAY_LABELS.map((label, idx) => (
                <div key={label} className="font-semibold text-sm text-center text-foreground">
                  {label}
                </div>
              ))}
            </div>

            {/* Hour rows */}
            <div className="space-y-2">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-6 gap-3">
                  {/* Time label */}
                  <div className="text-xs text-muted-foreground font-mono py-3 flex items-center font-medium">
                    {formatHour(hour)}
                  </div>

                  {/* Day columns */}
                  {DAYS.map((day) => {
                    const availableStudents = getStudentsAtHour(day, hour)
                    const studentLeads = availableStudents.filter(s => s.role === "Student Lead")
                    const assistants = availableStudents.filter(s => s.role !== "Student Lead")
                    const totalCount = availableStudents.length

                    return (
                      <div
                        key={day}
                        className={`border rounded-lg p-3 min-h-[70px] transition-all hover:shadow-sm ${
                          totalCount > 0
                            ? "bg-card"
                            : "bg-slate-50 dark:bg-slate-950/20"
                        }`}
                      >
                        {totalCount > 0 ? (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              {studentLeads.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-xs py-0.5 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-semibold">
                                    {studentLeads.length}
                                  </Badge>
                                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Lead{studentLeads.length !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {assistants.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-xs py-0.5 px-2 bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400 font-semibold">
                                    {assistants.length}
                                  </Badge>
                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-400">Assistant{assistants.length !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {availableStudents.slice(0, 3).map((student) => (
                                <Badge
                                  key={student.id}
                                  variant="outline"
                                  className={`text-xs py-0.5 px-2 ${getRoleColor(student.role)}`}
                                >
                                  {student.name.split(" ")[0]}
                                </Badge>
                              ))}
                              {totalCount > 3 && (
                                <Badge variant="outline" className="text-xs py-0.5 px-2 bg-slate-100 dark:bg-slate-900/30">
                                  +{totalCount - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground/50 italic flex items-center h-full">
                            —
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs py-0.5 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-semibold">
              2
            </Badge>
            <span className="font-medium text-blue-700 dark:text-blue-400">Lead(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs py-0.5 px-2 bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400 font-semibold">
              3
            </Badge>
            <span className="font-medium text-slate-700 dark:text-slate-400">Assistant(s)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

