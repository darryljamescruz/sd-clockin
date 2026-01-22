"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar, Search, Shield, UserCheck, Save, Loader2, User, Grid3X3, Type } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { CSVImport } from "./csv-import"
import type { Term, Student, Schedule } from "@/lib/api"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

interface SchedulesPageProps {
  students: Student[]
  terms: Term[]
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const HOURS = Array.from({ length: 9 }, (_, i) => i + 8) // 8 AM to 5 PM

type Availability = {
  monday: string[]
  tuesday: string[]
  wednesday: string[]
  thursday: string[]
  friday: string[]
}

export function SchedulesPage({ students, terms }: SchedulesPageProps) {
  const [selectedTermId, setSelectedTermId] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [schedules, setSchedules] = useState<Record<string, Schedule>>({})
  const [availability, setAvailability] = useState<Availability>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<"add" | "remove">("add")
  const [inputMode, setInputMode] = useState<"grid" | "manual">("grid")
  const [manualInputs, setManualInputs] = useState<Record<typeof DAYS[number], { start: string; end: string }[]>>({
    monday: [{ start: "", end: "" }],
    tuesday: [{ start: "", end: "" }],
    wednesday: [{ start: "", end: "" }],
    thursday: [{ start: "", end: "" }],
    friday: [{ start: "", end: "" }],
  })

  // Set default term to active term
  useEffect(() => {
    const activeTerm = terms.find((t) => t.isActive)
    if (activeTerm) {
      setSelectedTermId(activeTerm.id)
    } else if (terms.length > 0) {
      setSelectedTermId(terms[0].id)
    }
  }, [terms])

  // Fetch all schedules for the selected term
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!selectedTermId) return

      setIsLoading(true)
      const schedulesData: Record<string, Schedule> = {}

      await Promise.all(
        students.map(async (student) => {
          try {
            const schedule = await api.schedules.get(student.id, selectedTermId)
            if (schedule) {
              schedulesData[student.id] = schedule
            }
          } catch (error) {
            // Student might not have a schedule
          }
        })
      )

      setSchedules(schedulesData)
      setIsLoading(false)
    }

    fetchSchedules()
  }, [selectedTermId, students])

  // Convert a time block like "8-11" or "9 AM - 12 PM" to individual hour blocks
  const expandTimeBlock = (block: string): string[] => {
    const [startStr, endStr] = block.split("-").map(s => s.trim())
    if (!startStr) return []

    const startHour = parseTimeToHour(startStr)
    const endHour = endStr ? parseTimeToHour(endStr) : startHour + 1

    const hours: string[] = []
    for (let h = startHour; h < endHour && h < 17; h++) {
      if (h >= 8) {
        hours.push(`${h}-${h + 1}`)
      }
    }
    return hours
  }

  // Normalize availability to individual hour blocks
  const normalizeAvailability = (avail: Availability): Availability => {
    const normalized: Availability = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    }

    for (const day of DAYS) {
      const blocks = avail[day] || []
      const expandedHours = new Set<string>()

      for (const block of blocks) {
        const expanded = expandTimeBlock(block)
        expanded.forEach(h => expandedHours.add(h))
      }

      normalized[day] = Array.from(expandedHours).sort((a, b) => {
        return parseInt(a.split("-")[0]) - parseInt(b.split("-")[0])
      })
    }

    return normalized
  }

  // Format hour to 12-hour format
  const formatHourTo12 = (hour: number): string => {
    if (hour === 0) return "12 AM"
    if (hour === 12) return "12 PM"
    if (hour > 12) return `${hour - 12} PM`
    return `${hour} AM`
  }

  // Convert availability to manual inputs format
  const availabilityToManualInputs = (avail: Availability) => {
    const inputs: Record<typeof DAYS[number], { start: string; end: string }[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    }

    for (const day of DAYS) {
      const blocks = avail[day] || []
      if (blocks.length === 0) {
        inputs[day] = [{ start: "", end: "" }]
        continue
      }

      // Group consecutive hours into ranges
      const hours = blocks
        .map(b => parseInt(b.split("-")[0]))
        .sort((a, b) => a - b)

      const ranges: { start: number; end: number }[] = []
      let rangeStart = hours[0]
      let rangeEnd = hours[0] + 1

      for (let i = 1; i < hours.length; i++) {
        if (hours[i] === rangeEnd) {
          rangeEnd = hours[i] + 1
        } else {
          ranges.push({ start: rangeStart, end: rangeEnd })
          rangeStart = hours[i]
          rangeEnd = hours[i] + 1
        }
      }
      ranges.push({ start: rangeStart, end: rangeEnd })

      inputs[day] = ranges.map(r => ({
        start: formatHourTo12(r.start),
        end: formatHourTo12(r.end),
      }))
    }

    return inputs
  }

  // Load selected student's schedule into availability state
  useEffect(() => {
    if (selectedStudent && schedules[selectedStudent.id]) {
      const normalized = normalizeAvailability(schedules[selectedStudent.id].availability)
      setAvailability(normalized)
      setManualInputs(availabilityToManualInputs(normalized))
    } else {
      setAvailability({
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
      })
      setManualInputs({
        monday: [{ start: "", end: "" }],
        tuesday: [{ start: "", end: "" }],
        wednesday: [{ start: "", end: "" }],
        thursday: [{ start: "", end: "" }],
        friday: [{ start: "", end: "" }],
      })
    }
  }, [selectedStudent, schedules])

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students
    return students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [students, searchQuery])

  // Parse time string to hour (24h format)
  const parseTimeToHour = (timeStr: string): number => {
    if (!timeStr) return 0

    const trimmed = timeStr.trim().toUpperCase()
    const hasAM = trimmed.includes("AM")
    const hasPM = trimmed.includes("PM")

    const numericPart = timeStr.replace(/\s*(AM|PM)\s*/gi, "").trim()

    let hours: number
    if (numericPart.includes(":")) {
      hours = parseInt(numericPart.split(":")[0], 10)
    } else {
      hours = parseInt(numericPart, 10)
    }

    if (isNaN(hours)) return 0

    // Handle AM/PM
    if (hasAM && hours === 12) {
      hours = 0
    } else if (hasPM && hours !== 12) {
      hours += 12
    }

    return hours
  }

  // Check if a specific hour is selected
  const isHourSelected = (day: typeof DAYS[number], hour: number): boolean => {
    const blocks = availability[day]
    if (!blocks || blocks.length === 0) return false

    return blocks.some(block => {
      const [startStr, endStr] = block.split("-").map(s => s.trim())
      if (!startStr) return false

      const startHour = parseTimeToHour(startStr)
      const endHour = endStr ? parseTimeToHour(endStr) : startHour + 1

      // Check if the hour falls within this block
      return hour >= startHour && hour < endHour
    })
  }

  // Toggle hour selection
  const toggleHour = (day: typeof DAYS[number], hour: number, forceMode?: "add" | "remove") => {
    const hourStr = `${hour}-${hour + 1}`
    const isSelected = isHourSelected(day, hour)
    const mode = forceMode || (isSelected ? "remove" : "add")

    setAvailability(prev => {
      const dayBlocks = [...prev[day]]

      if (mode === "remove") {
        return {
          ...prev,
          [day]: dayBlocks.filter(b => b !== hourStr)
        }
      } else {
        if (!dayBlocks.includes(hourStr)) {
          return {
            ...prev,
            [day]: [...dayBlocks, hourStr].sort((a, b) => {
              const aStart = parseInt(a.split("-")[0])
              const bStart = parseInt(b.split("-")[0])
              return aStart - bStart
            })
          }
        }
        return prev
      }
    })
  }

  // Handle mouse events for drag selection
  const handleMouseDown = (day: typeof DAYS[number], hour: number) => {
    const isSelected = isHourSelected(day, hour)
    setDragMode(isSelected ? "remove" : "add")
    setIsDragging(true)
    toggleHour(day, hour)
  }

  const handleMouseEnter = (day: typeof DAYS[number], hour: number) => {
    if (isDragging) {
      toggleHour(day, hour, dragMode)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Update manual inputs when availability changes (for syncing from grid)
  useEffect(() => {
    if (inputMode === "grid") {
      setManualInputs(availabilityToManualInputs(availability))
    }
  }, [availability, inputMode])

  // Handle manual input changes
  const handleManualInputChange = (
    day: typeof DAYS[number],
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    setManualInputs(prev => ({
      ...prev,
      [day]: prev[day].map((input, i) =>
        i === index ? { ...input, [field]: value } : input
      ),
    }))
  }

  // Add a new time range for a day
  const addTimeRange = (day: typeof DAYS[number]) => {
    setManualInputs(prev => ({
      ...prev,
      [day]: [...prev[day], { start: "", end: "" }],
    }))
  }

  // Remove a time range for a day
  const removeTimeRange = (day: typeof DAYS[number], index: number) => {
    setManualInputs(prev => ({
      ...prev,
      [day]: prev[day].length > 1
        ? prev[day].filter((_, i) => i !== index)
        : [{ start: "", end: "" }],
    }))
  }

  // Apply manual inputs to availability
  const applyManualInputs = () => {
    const newAvailability: Availability = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    }

    for (const day of DAYS) {
      const ranges = manualInputs[day]
      const hours = new Set<string>()

      for (const range of ranges) {
        if (!range.start || !range.end) continue

        const startHour = parseTimeToHour(range.start)
        const endHour = parseTimeToHour(range.end)

        if (startHour >= endHour || startHour < 8 || endHour > 17) continue

        for (let h = startHour; h < endHour; h++) {
          hours.add(`${h}-${h + 1}`)
        }
      }

      newAvailability[day] = Array.from(hours).sort((a, b) => {
        return parseInt(a.split("-")[0]) - parseInt(b.split("-")[0])
      })
    }

    setAvailability(newAvailability)
  }

  // Apply manual inputs when switching to grid mode
  const handleModeChange = (mode: "grid" | "manual") => {
    if (inputMode === "manual" && mode === "grid") {
      applyManualInputs()
    }
    setInputMode(mode)
  }

  // Save schedule
  const handleSave = async () => {
    if (!selectedStudent || !selectedTermId) return

    setIsSaving(true)
    try {
      await api.schedules.createOrUpdate({
        studentId: selectedStudent.id,
        termId: selectedTermId,
        availability,
      })

      // Update local state
      setSchedules(prev => ({
        ...prev,
        [selectedStudent.id]: {
          ...prev[selectedStudent.id],
          studentId: selectedStudent.id,
          termId: selectedTermId,
          availability,
        }
      }))
    } catch (error) {
      console.error("Failed to save schedule:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Check if student has any schedule
  const hasSchedule = (studentId: string) => {
    const schedule = schedules[studentId]
    return schedule && Object.values(schedule.availability).some(day => day.length > 0)
  }

  return (
    <div className="space-y-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Manage Schedules</h2>
          <p className="text-sm text-muted-foreground">Select a student to edit their weekly availability</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedTermId} onValueChange={setSelectedTermId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name} {term.isActive && "(Active)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CSV Import */}
      {selectedTermId && (
        <CSVImport
          termId={selectedTermId}
          onImportComplete={() => {
            // Refetch schedules
            const fetchSchedules = async () => {
              const schedulesData: Record<string, Schedule> = {}
              await Promise.all(
                students.map(async (student) => {
                  try {
                    const schedule = await api.schedules.get(student.id, selectedTermId)
                    if (schedule) schedulesData[student.id] = schedule
                  } catch (error) {}
                })
              )
              setSchedules(schedulesData)
            }
            fetchSchedules()
          }}
        />
      )}

      {/* Main content - master detail layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
        {/* Left panel - Student list */}
        <Card className="lg:col-span-1 bg-card/70">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                {filteredStudents.length} students
              </div>

              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md transition-colors",
                        "hover:bg-accent",
                        selectedStudent?.id === student.id
                          ? "bg-accent"
                          : ""
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate">{student.name}</span>
                          {student.role === "Student Lead" && (
                            <Shield className="w-3 h-3 text-blue-500 shrink-0" />
                          )}
                        </div>
                        {hasSchedule(student.id) && (
                          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right panel - Schedule editor */}
        <Card className="lg:col-span-2 bg-card/70">
          <CardContent className="p-6">
            {!selectedStudent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <User className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">Select a Student</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a student from the list to view and edit their schedule
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Student info header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedStudent.role === "Student Lead" ? (
                        <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          <Shield className="w-3 h-3 mr-1" />
                          Student Lead
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Student Assistant
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>

                {/* Input mode toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={inputMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModeChange("grid")}
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    Grid
                  </Button>
                  <Button
                    variant={inputMode === "manual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModeChange("manual")}
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Manual
                  </Button>
                </div>

                {inputMode === "grid" ? (
                  /* Week calendar grid */
                  <div className="select-none">
                    <p className="text-sm text-muted-foreground mb-3">
                      Click or drag to select available hours
                    </p>

                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        {/* Header row with day names */}
                        <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-1 mb-1">
                          <div /> {/* Empty corner */}
                          {DAY_LABELS.map((day) => (
                            <div key={day} className="text-center text-sm font-medium py-2">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Hour rows */}
                        {HOURS.map((hour) => (
                          <div key={hour} className="grid grid-cols-[60px_repeat(5,1fr)] gap-1 mb-1">
                            {/* Hour label */}
                            <div className="text-xs text-muted-foreground text-right pr-2 py-2">
                              {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'pm' : 'am'}
                            </div>

                            {/* Day cells */}
                            {DAYS.map((day) => {
                              const isSelected = isHourSelected(day, hour)
                              return (
                                <div
                                  key={`${day}-${hour}`}
                                  onMouseDown={() => handleMouseDown(day, hour)}
                                  onMouseEnter={() => handleMouseEnter(day, hour)}
                                  className={cn(
                                    "h-10 rounded-md border cursor-pointer transition-colors",
                                    isSelected
                                      ? "bg-primary border-primary"
                                      : "bg-muted/50 border-border hover:bg-muted"
                                  )}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Manual time input */
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Enter shift times for each day (e.g., 9 AM, 9am, 9:00 AM, or 9)
                    </p>

                    {DAYS.map((day, dayIndex) => (
                      <div key={day} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-12 text-sm">{DAY_LABELS[dayIndex]}</span>
                        </div>
                        {manualInputs[day].map((range, rangeIndex) => (
                          <div key={rangeIndex} className="flex items-center gap-2 ml-14">
                            <Input
                              placeholder="Start (e.g., 9 AM)"
                              value={range.start}
                              onChange={(e) => handleManualInputChange(day, rangeIndex, "start", e.target.value)}
                              className="w-32"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                              placeholder="End (e.g., 5 PM)"
                              value={range.end}
                              onChange={(e) => handleManualInputChange(day, rangeIndex, "end", e.target.value)}
                              className="w-32"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTimeRange(day, rangeIndex)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </Button>
                            {rangeIndex === manualInputs[day].length - 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addTimeRange(day)}
                                className="text-muted-foreground"
                              >
                                + Add
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={applyManualInputs}
                      className="mt-4"
                    >
                      Apply Times
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
