"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Users, Shield, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { type Student, type Term } from "@/lib/api"
import { parseDateString } from "@/lib/utils"
import { TermSelector } from "@/components/admin/terms/term-selector"
import {
  buildHourlyScheduledCoverage,
  buildHourlyScheduledCoverageForWeekday,
  countStaffScheduledOnWeekday,
  summarizeCoverage,
  TEMPLATE_WEEKDAY_KEYS,
  type WeekdayScheduleKey,
} from "@/lib/group-schedule-utils"
import { GroupScheduleDayCharts } from "@/components/admin/group-schedule/group-schedule-day-charts"

interface ServiceDeskGroupScheduleProps {
  staffData: Student[]
  terms: Term[]
  selectedTerm: string
  onTermChange: (name: string) => void
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const CAL_DOW = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const

const TEMPLATE_LABELS: Record<(typeof TEMPLATE_WEEKDAY_KEYS)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
}

export function ServiceDeskGroupSchedule({
  staffData,
  terms,
  selectedTerm,
  onTermChange,
}: ServiceDeskGroupScheduleProps) {
  const currentTerm = terms.find((t) => t.name === selectedTerm) || terms[0]

  const getDefaultDateStr = () => {
    if (!currentTerm) return toDateInputValue(new Date())
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = parseDateString(currentTerm.startDate)
    const end = parseDateString(currentTerm.endDate)
    if (today >= start && today <= end) return toDateInputValue(today)
    return currentTerm.startDate
  }

  const [viewMode, setViewMode] = useState<"day" | "weekday">("day")
  const [selectedDateStr, setSelectedDateStr] = useState(getDefaultDateStr)
  /** 0 = Monday … 4 = Friday — recurring template only. */
  const [templateDayIndex, setTemplateDayIndex] = useState(0)

  useEffect(() => {
    if (!currentTerm) return
    const start = parseDateString(currentTerm.startDate)
    const end = parseDateString(currentTerm.endDate)
    setSelectedDateStr((prev) => {
      const d = parseDateString(prev)
      if (d >= start && d <= end) return prev
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (today >= start && today <= end) return toDateInputValue(today)
      return currentTerm.startDate
    })
  }, [currentTerm?.id, currentTerm?.startDate, currentTerm?.endDate])

  const selectedDate = useMemo(() => parseDateString(selectedDateStr), [selectedDateStr])

  const templateWeekdayKey = TEMPLATE_WEEKDAY_KEYS[templateDayIndex] as WeekdayScheduleKey

  const dayKey = CAL_DOW[selectedDate.getDay()] as WeekdayScheduleKey
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6

  const isDateDayOff = useCallback(
    (d: Date) => {
      if (!currentTerm?.daysOff?.length) return false
      const check = parseDateString(toDateInputValue(d))
      check.setHours(0, 0, 0, 0)
      return currentTerm.daysOff.some((range) => {
        const rangeStart = new Date(range.startDate)
        const rangeEnd = new Date(range.endDate)
        rangeStart.setHours(0, 0, 0, 0)
        rangeEnd.setHours(23, 59, 59, 999)
        return check >= rangeStart && check <= rangeEnd
      })
    },
    [currentTerm]
  )

  const selectedDayOff = useMemo(() => isDateDayOff(selectedDate), [selectedDate, isDateDayOff])

  const dayHourlyRows = useMemo(
    () => buildHourlyScheduledCoverage(staffData, selectedDate),
    [staffData, selectedDate]
  )

  const dayRollup = useMemo(
    () => countStaffScheduledOnWeekday(staffData, dayKey),
    [staffData, dayKey]
  )

  const daySummary = useMemo(() => summarizeCoverage(dayHourlyRows), [dayHourlyRows])

  const templateHourlyRows = useMemo(
    () => buildHourlyScheduledCoverageForWeekday(staffData, templateWeekdayKey),
    [staffData, templateWeekdayKey]
  )

  const templateRollup = useMemo(
    () => countStaffScheduledOnWeekday(staffData, templateWeekdayKey),
    [staffData, templateWeekdayKey]
  )

  const templateSummary = useMemo(
    () => summarizeCoverage(templateHourlyRows),
    [templateHourlyRows]
  )

  const handleViewMode = (value: string) => {
    if (value !== "day" && value !== "weekday") return
    if (value === viewMode) return
    setViewMode(value)
  }

  if (!currentTerm) {
    return null
  }

  const lastTemplateIdx = TEMPLATE_WEEKDAY_KEYS.length - 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Group schedule</h2>
          <p className="text-muted-foreground">
            Scheduled desk coverage from saved availability (not clock-in/out). Day uses a real calendar date. Mon–Fri
            steps through the weekly template that repeats every term week — no week picker.
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => {
            if (v) handleViewMode(v)
          }}
          variant="outline"
          size="sm"
          className="justify-start"
        >
          <ToggleGroupItem value="day" aria-label="Calendar day">
            Day
          </ToggleGroupItem>
          <ToggleGroupItem value="weekday" aria-label="Weekday template">
            Mon–Fri
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <TermSelector terms={terms} selectedTerm={selectedTerm} onTermChange={onTermChange} />

      {viewMode === "day" && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="group-schedule-day">
              Date
            </label>
            <input
              id="group-schedule-day"
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              min={currentTerm.startDate}
              max={currentTerm.endDate}
              className="w-full max-w-[200px] rounded-md border bg-background px-2 py-1.5 text-sm sm:ml-auto"
            />
          </div>

          {selectedDayOff && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  This date is a term day off. Charts still reflect who is scheduled on{" "}
                  {dayKey.charAt(0).toUpperCase() + dayKey.slice(1)} in their availability.
                </p>
              </CardContent>
            </Card>
          )}

          {isWeekend && (
            <p className="text-sm text-muted-foreground">
              Weekend dates use Saturday/Sunday in each student&apos;s schedule; if those are empty, counts will be
              zero.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/70 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription>On roster this day</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  {dayRollup.total}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Unique assistants and leads with at least one block on this weekday.
              </CardContent>
            </Card>
            <Card className="bg-card/70 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription>Leads on roster</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {dayRollup.leads}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Student leads with any shift this weekday.</CardContent>
            </Card>
            <Card className="bg-card/70 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription>Peak simultaneous</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{daySummary.peakTotal}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Max people in any one hour ({daySummary.peakHourLabel}). Up to {daySummary.peakLeads} lead
                {daySummary.peakLeads !== 1 ? "s" : ""} in a single hour.
              </CardContent>
            </Card>
            <Card className="bg-card/70 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription>Hours staffed, no lead</CardDescription>
                <CardTitle className="text-2xl tabular-nums text-amber-700 dark:text-amber-400">
                  {daySummary.hoursWithoutLead}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                8AM–5PM slots with assistants but zero leads scheduled.
              </CardContent>
            </Card>
          </div>

          <GroupScheduleDayCharts staffData={staffData} date={selectedDate} />
        </>
      )}

      {viewMode === "weekday" && (
        <>
          <p className="text-sm text-muted-foreground">
            Same pattern every week — use arrows to move between weekdays in the saved schedule.
          </p>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={templateDayIndex <= 0}
                onClick={() => setTemplateDayIndex((i) => Math.max(0, i - 1))}
                aria-label="Previous weekday"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1 px-2 text-center sm:min-w-[220px] sm:flex-none">
                <p className="text-base font-semibold tracking-tight sm:text-lg">{TEMPLATE_LABELS[templateWeekdayKey]}</p>
                <p className="text-xs text-muted-foreground">
                  Weekly template · {templateDayIndex + 1} of {TEMPLATE_WEEKDAY_KEYS.length}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={templateDayIndex >= lastTemplateIdx}
                onClick={() => setTemplateDayIndex((i) => Math.min(lastTemplateIdx, i + 1))}
                aria-label="Next weekday"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/70 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription>On roster (this weekday)</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  {templateRollup.total}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Unique assistants and leads with at least one block on this weekday in the template.
              </CardContent>
            </Card>
            <Card className="bg-card/70 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription>Leads on roster</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {templateRollup.leads}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Student leads with any shift this weekday.</CardContent>
            </Card>
            <Card className="bg-card/70 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription>Peak simultaneous</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{templateSummary.peakTotal}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Max people in any one hour ({templateSummary.peakHourLabel}). Up to {templateSummary.peakLeads} lead
                {templateSummary.peakLeads !== 1 ? "s" : ""} in a single hour.
              </CardContent>
            </Card>
            <Card className="bg-card/70 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription>Hours staffed, no lead</CardDescription>
                <CardTitle className="text-2xl tabular-nums text-amber-700 dark:text-amber-400">
                  {templateSummary.hoursWithoutLead}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                8AM–5PM slots with assistants but zero leads scheduled.
              </CardContent>
            </Card>
          </div>

          <GroupScheduleDayCharts staffData={staffData} weekdayKey={templateWeekdayKey} />
        </>
      )}
    </div>
  )
}
