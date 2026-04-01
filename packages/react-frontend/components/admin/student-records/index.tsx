/**
 * Individual Records - Main orchestrator component
 */

"use client"

import { useState, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Search, Check, Users } from "lucide-react"
import { type Student, type Term, type ClockEntry } from "@/lib/api"
import { cn } from "@/lib/utils"
import { StudentHeader } from "./student-header"
import { StudentMetrics } from "./student-metrics"
import { PunctualityBreakdown } from "./punctuality-breakdown"
import { DailyBreakdown } from "./daily-breakdown"
import { ClockInLogs } from "./clock-in-logs"
import { EditEntryDialog } from "./edit-entry-dialog"
import { DeleteEntryDialog } from "./delete-entry-dialog"
import { useStudentAnalytics } from "./hooks/use-student-analytics"
import { useClockEntries } from "./hooks/use-clock-entries"
import { useDailyBreakdownView } from "./hooks/use-daily-breakdown-view"
import { type ActualShift } from "./utils/student-calculations"

function countMissingClockOuts(entries: ClockEntry[]) {
  const clockIns = entries.filter((e) => e.type === "in")
  const clockOuts = entries.filter((e) => e.type === "out")
  let missing = 0
  clockIns.forEach((clockIn) => {
    const inDate = new Date(clockIn.timestamp)
    const hasOut = clockOuts.some((clockOut) => {
      const outDate = new Date(clockOut.timestamp)
      return outDate > inDate && outDate.toDateString() === inDate.toDateString()
    })
    if (!hasOut) missing += 1
  })
  return missing
}

interface IndividualRecordsProps {
  staffData: Student[]
  selectedStaff: Student | null
  onSelectStaff: (staff: Student) => void
  selectedTerm: string
  termStartDate: string
  termEndDate: string
  currentTerm?: Term
  onRefreshStudent?: (studentId: string) => Promise<void>
  isLoadingStudent?: boolean
}

export function IndividualRecords({
  staffData,
  selectedStaff,
  onSelectStaff,
  selectedTerm,
  termStartDate,
  termEndDate,
  currentTerm,
  onRefreshStudent,
  isLoadingStudent = false,
}: IndividualRecordsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "lead" | "assistant">("all")
  const studentInfoRef = useRef<HTMLDivElement>(null)

  const analytics = useStudentAnalytics(selectedStaff, termStartDate, termEndDate, currentTerm)
  const clockEntries = useClockEntries()
  const dailyBreakdownView = useDailyBreakdownView(
    selectedStaff,
    analytics.dailyBreakdownByWeek.length,
    analytics.dailyBreakdownByMonth.length
  )

  // Filtered student list for sidebar
  const filteredStaff = useMemo(() => {
    let eligible = staffData.filter(
      (s) => s.role === "Student Assistant" || s.role === "Student Lead"
    )
    if (roleFilter === "lead") eligible = eligible.filter((s) => s.role === "Student Lead")
    if (roleFilter === "assistant") eligible = eligible.filter((s) => s.role === "Student Assistant")
    if (!searchQuery) return eligible
    return eligible.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.cardId.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [staffData, searchQuery, roleFilter])

  const handleSaveEdit = async () => {
    await clockEntries.handleSaveEdit(selectedStaff, selectedTerm, onRefreshStudent)
  }

  const handleSaveAdd = async () => {
    await clockEntries.handleSaveAdd(selectedStaff, selectedTerm, onRefreshStudent)
    clockEntries.setIsAddDialogOpen(false)
  }

  const handleDeleteConfirm = async () => {
    await clockEntries.handleDeleteConfirm(selectedStaff, selectedTerm, onRefreshStudent)
  }

  const handleSetDailyViewMode = (mode: "week" | "month") => {
    dailyBreakdownView.setDailyViewMode(mode)
    if (mode === "week") {
      dailyBreakdownView.setCurrentWeekIndex(0)
    } else {
      dailyBreakdownView.setCurrentMonthIndex(0)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[600px]">
      {/* ── Left panel: student list ── */}
      <Card className="lg:col-span-1 h-fit lg:sticky lg:top-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Students
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Search */}
          <Input
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Role filter */}
          <div className="flex gap-1">
            {(["all", "lead", "assistant"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={roleFilter === f ? "default" : "outline"}
                className="h-7 text-xs px-2 flex-1"
                onClick={() => setRoleFilter(f)}
              >
                {f === "all" ? "All" : f === "lead" ? "Lead" : "Assistant"}
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredStaff.length} student{filteredStaff.length !== 1 ? "s" : ""}
          </p>

          {/* List */}
          <ScrollArea className="h-[calc(100vh-340px)] min-h-[300px]">
            <div className="space-y-0.5 pr-2">
              {filteredStaff.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No students found
                </div>
              ) : (
                filteredStaff.map((staff) => {
                  const isSelected = selectedStaff?.id === staff.id
                  return (
                    <button
                      key={staff.id}
                      onClick={() => onSelectStaff(staff)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "font-medium truncate text-sm",
                            isSelected ? "text-primary-foreground" : "text-foreground"
                          )}
                        >
                          {staff.name}
                        </div>
                        <div
                          className={cn(
                            "text-xs truncate",
                            isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {staff.role === "Student Lead" ? "Lead" : "Assistant"}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 flex-shrink-0 text-primary-foreground" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ── Right panel: student detail ── */}
      <div className="lg:col-span-1 space-y-4">
        {!selectedStaff ? (
          <Card>
            <CardContent className="py-24 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No Student Selected</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Select a student from the list to view their records, metrics, and clock history.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <StudentHeader
              selectedStaff={selectedStaff}
              isLoadingStudent={isLoadingStudent}
              studentInfoRef={studentInfoRef}
            />

            {isLoadingStudent && !analytics.hasFullStudentData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                          <Skeleton className="h-9 w-9 rounded-full" />
                        </div>
                        <Skeleton className="h-1.5 w-full mt-3" />
                        <Skeleton className="h-3 w-28 mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-8 w-64 mb-4" />
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </div>
            ) : analytics.hasFullStudentData && analytics.punctuality ? (
              <>
                {/* Summary metrics */}
                <StudentMetrics
                  punctuality={analytics.punctuality}
                  totalExpected={analytics.totalExpected}
                  totalActual={analytics.totalActual}
                />

                {/* Section tabs */}
                <Tabs defaultValue="arrival" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="arrival">Arrival Breakdown</TabsTrigger>
                    <TabsTrigger value="timesheet">Time Sheet</TabsTrigger>
                    <TabsTrigger value="clocklogs">Clock In Logs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="arrival">
                    <PunctualityBreakdown
                      punctuality={analytics.punctuality}
                      dailyBreakdownByWeek={analytics.dailyBreakdownByWeek}
                    />
                  </TabsContent>

                  <TabsContent value="timesheet">
                    <DailyBreakdown
                      dailyBreakdownByWeek={analytics.dailyBreakdownByWeek}
                      dailyBreakdownByMonth={analytics.dailyBreakdownByMonth}
                      dailyViewMode={dailyBreakdownView.dailyViewMode}
                      termEndDate={termEndDate}
                      currentWeekIndex={dailyBreakdownView.currentWeekIndex}
                      currentMonthIndex={dailyBreakdownView.currentMonthIndex}
                      onSetDailyViewMode={handleSetDailyViewMode}
                      onPreviousWeek={dailyBreakdownView.goToPreviousWeek}
                      onNextWeek={dailyBreakdownView.goToNextWeek}
                      onPreviousMonth={dailyBreakdownView.goToPreviousMonth}
                      onNextMonth={dailyBreakdownView.goToNextMonth}
                      canGoToPreviousWeek={dailyBreakdownView.canGoToPreviousWeek}
                      canGoToNextWeek={dailyBreakdownView.canGoToNextWeek}
                      canGoToPreviousMonth={dailyBreakdownView.canGoToPreviousMonth}
                      canGoToNextMonth={dailyBreakdownView.canGoToNextMonth}
                      onEditShift={(shift: ActualShift, type: "in" | "out") =>
                        clockEntries.handleShiftEdit(shift, type, selectedStaff)
                      }
                      onDeleteShift={(shift: ActualShift) =>
                        clockEntries.handleShiftDelete(shift, selectedStaff)
                      }
                      onAddEntry={clockEntries.handleAddClick}
                      missingClockOuts={countMissingClockOuts(selectedStaff.clockEntries || [])}
                      autoClockOuts={(selectedStaff.clockEntries || []).filter((e) => e.isAutoClockOut).length}
                    />
                  </TabsContent>

                  <TabsContent value="clocklogs">
                    <ClockInLogs
                      dailyBreakdownByWeek={analytics.dailyBreakdownByWeek}
                      clockEntries={selectedStaff.clockEntries || []}
                      onEditShift={(shift: ActualShift, type: "in" | "out") =>
                        clockEntries.handleShiftEdit(shift, type, selectedStaff)
                      }
                      onDeleteShift={(shift: ActualShift) =>
                        clockEntries.handleShiftDelete(shift, selectedStaff)
                      }
                      onAddEntry={clockEntries.handleAddClick}
                    />
                  </TabsContent>

                </Tabs>
              </>
            ) : null}
          </>
        )}
      </div>

      {/* Dialogs */}
      {selectedStaff && (
        <>
          <EditEntryDialog
            isOpen={!!clockEntries.editingEntry}
            onClose={() => clockEntries.setEditingEntry(null)}
            editingEntry={clockEntries.editingEntry}
            editTimestamp={clockEntries.editTimestamp}
            editType={clockEntries.editType}
            isSaving={clockEntries.isSaving}
            onTimestampChange={clockEntries.setEditTimestamp}
            onTypeChange={clockEntries.setEditType}
            onSave={handleSaveEdit}
            selectedStaff={selectedStaff}
          />

          <EditEntryDialog
            isOpen={clockEntries.isAddDialogOpen}
            onClose={() => clockEntries.setIsAddDialogOpen(false)}
            editingEntry={null}
            editTimestamp={clockEntries.editTimestamp}
            editType={clockEntries.editType}
            isSaving={clockEntries.isSaving}
            onTimestampChange={clockEntries.setEditTimestamp}
            onTypeChange={clockEntries.setEditType}
            onSave={handleSaveAdd}
            isAddMode={true}
            selectedStaff={selectedStaff}
          />

          <DeleteEntryDialog
            isOpen={!!clockEntries.deletingEntry}
            onClose={() => clockEntries.setDeletingEntry(null)}
            deletingEntry={clockEntries.deletingEntry}
            isDeleting={clockEntries.isDeleting}
            onConfirm={handleDeleteConfirm}
          />
        </>
      )}
    </div>
  )
}
