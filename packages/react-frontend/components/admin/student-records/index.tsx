/**
 * Individual Records - Main orchestrator component
 */

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUp, Search } from "lucide-react"
import { type Student, type Term } from "@/lib/api"
import { StudentSearch } from "./student-search"
import { StudentHeader } from "./student-header"
import { StudentMetrics } from "./student-metrics"
import { PunctualityBreakdown } from "./punctuality-breakdown"
import { WeeklyBreakdown } from "./weekly-breakdown"
import { DailyBreakdown } from "./daily-breakdown"
import { EditEntryDialog } from "./edit-entry-dialog"
import { DeleteEntryDialog } from "./delete-entry-dialog"
import { useStudentAnalytics } from "./hooks/use-student-analytics"
import { useClockEntries } from "./hooks/use-clock-entries"
import { useScrollBehavior } from "./hooks/use-scroll-behavior"
import { useDailyBreakdownView } from "./hooks/use-daily-breakdown-view"
import { type ActualShift } from "./utils/student-calculations"

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
  // Custom hooks
  const analytics = useStudentAnalytics(selectedStaff, termStartDate, termEndDate, currentTerm)
  const clockEntries = useClockEntries()
  const scrollBehavior = useScrollBehavior(selectedStaff)
  const dailyBreakdownView = useDailyBreakdownView(
    selectedStaff,
    analytics.dailyBreakdownByWeek.length,
    analytics.dailyBreakdownByMonth.length
  )

  // Handle save/edit/delete
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

  // Handle view mode changes
  const handleSetDailyViewMode = (mode: "week" | "month") => {
    dailyBreakdownView.setDailyViewMode(mode)
    if (mode === "week") {
      dailyBreakdownView.setCurrentWeekIndex(0)
    } else {
      dailyBreakdownView.setCurrentMonthIndex(0)
    }
  }

  return (
    <div className="space-y-6">
      {/* Staff Selection - Search Bar */}
      <StudentSearch
        staffData={staffData}
        selectedStaff={selectedStaff}
        onSelectStaff={onSelectStaff}
        searchSectionRef={scrollBehavior.searchSectionRef}
      />

      {/* Empty State - Show when no student is selected */}
      {!selectedStaff && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Student Selected</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Search for a student above to view their records, metrics, and clock history.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedStaff && (
        <>
          {/* Staff Header */}
          <StudentHeader
            selectedStaff={selectedStaff}
            isLoadingStudent={isLoadingStudent}
            studentInfoRef={scrollBehavior.studentInfoRef}
          />

          {isLoadingStudent && !analytics.hasFullStudentData ? (
            <>
              {/* Loading Skeleton for Metrics */}
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

              {/* Loading Skeleton for Punctuality Breakdown */}
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-36 mb-4" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-lg bg-muted/50 p-4">
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-8 w-10 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Loading Skeleton for Weekly Breakdown */}
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-44 mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Loading Skeleton for Daily Breakdown */}
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-32 mb-4" />
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-40 w-full rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Loading Skeleton for Clock History */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : analytics.hasFullStudentData && analytics.punctuality ? (
            <>
              {/* Overall Statistics */}
              <StudentMetrics
                punctuality={analytics.punctuality}
                totalExpected={analytics.totalExpected}
                totalActual={analytics.totalActual}
              />

              {/* Punctuality Breakdown */}
              <PunctualityBreakdown punctuality={analytics.punctuality} />

              {/* Weekly Breakdown */}
              <WeeklyBreakdown
                weeklyBreakdown={analytics.weeklyBreakdown}
                totalExpected={analytics.totalExpected}
                totalActual={analytics.totalActual}
                isOpen={dailyBreakdownView.isWeeklyBreakdownOpen}
                onOpenChange={dailyBreakdownView.setIsWeeklyBreakdownOpen}
              />

              {/* Daily Breakdown - Week/Month View with Edit/Delete capabilities */}
              <DailyBreakdown
                dailyBreakdownByWeek={analytics.dailyBreakdownByWeek}
                dailyBreakdownByMonth={analytics.dailyBreakdownByMonth}
                dailyViewMode={dailyBreakdownView.dailyViewMode}
                termEndDate={termEndDate}
                isOpen={dailyBreakdownView.isDailyBreakdownOpen}
                onOpenChange={dailyBreakdownView.setIsDailyBreakdownOpen}
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
                onEditShift={(shift: ActualShift, type: "in" | "out") => clockEntries.handleShiftEdit(shift, type, selectedStaff)}
                onDeleteShift={(shift: ActualShift) => clockEntries.handleShiftDelete(shift, selectedStaff)}
                onAddEntry={clockEntries.handleAddClick}
              />

              {/* Clock History - Full history view with all entries */}
              {/* <ClockHistory
                selectedStaff={selectedStaff}
                termStartDate={termStartDate}
                termEndDate={termEndDate}
                onAddClick={clockEntries.handleAddClick}
                onEditClick={clockEntries.handleEditClick}
                onDeleteClick={clockEntries.handleDeleteClick}
              /> */}
            </>
          ) : null}

          {/* Edit Dialog */}
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

          {/* Add Dialog */}
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

          {/* Delete Confirmation Dialog */}
          <DeleteEntryDialog
            isOpen={!!clockEntries.deletingEntry}
            onClose={() => clockEntries.setDeletingEntry(null)}
            deletingEntry={clockEntries.deletingEntry}
            isDeleting={clockEntries.isDeleting}
            onConfirm={handleDeleteConfirm}
          />
        </>
      )}

      {/* Scroll to Top Button */}
      {scrollBehavior.showScrollToTop && (
        <Button
          onClick={scrollBehavior.scrollToSearch}
          className="fixed bottom-8 right-8 rounded-full shadow-lg z-50 h-12 w-12 p-0"
          size="icon"
          variant="default"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
}



