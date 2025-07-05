"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"

import { StatsCards } from "@/components/stats-cards"
import { TermSelector } from "@/components/term-selector"
import { TermOverview } from "@/components/term-overview"
import { TermAnalytics } from "@/components/term-analytics"
import { IndividualRecords } from "@/components/individual-records"

// Import our custom hooks
import { useStaffData, Staff as HookStaff } from "@/hooks/use-staff-data"
import { useTermData } from "@/hooks/use-term-data"

// Individual Records expects this interface
interface IndividualRecordsStaff {
  id: number
  name: string
  role: string
  iso: string
  clockEntries: Array<{
    timestamp: string
    type: "in" | "out"
    isManual?: boolean
  }>
}

// TODO: Move this to a shared data file or fetch from backend
const initialTerms = [
  {
    id: "1",
    name: "Fall 2025",
    startDate: "2025-08-25",
    endDate: "2025-12-15",
    isActive: true,
  },
  {
    id: "2",
    name: "Summer 2025",
    startDate: "2025-05-15",
    endDate: "2025-08-15",
    isActive: false,
  },
  {
    id: "3",
    name: "Spring 2025",
    startDate: "2025-01-15",
    endDate: "2025-05-10",
    isActive: false,
  },
  {
    id: "4",
    name: "Thanksgiving Break 2025",
    startDate: "2025-11-25",
    endDate: "2025-11-29",
    isActive: false,
  },
]



export default function AdminDashboard() {
  const [selectedStaff, setSelectedStaff] = useState<IndividualRecordsStaff | null>(null)
  const [dateError, setDateError] = useState("")

  // Use custom hooks for data management
  const { 
    staffData, 
    addStudent, 
    editStudent, 
    deleteStudent, 
    getWeeklyStats 
  } = useStaffData()

  const {
    terms,
    selectedTerm,
    setSelectedTerm,
    selectedDate,
    getCurrentTerm,
    addTerm,
    editTerm,
    deleteTerm,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    currentDateIndex,
    termWeekdays
  } = useTermData()

  // Convert hook staff data to what IndividualRecords expects
  const mapToIndividualRecordsStaff = (staff: HookStaff): IndividualRecordsStaff => ({
    id: staff.id,
    name: staff.name,
    role: staff.role,
    iso: staff.iso,
    clockEntries: staff.clockEntries,
  })

  const individualRecordsStaffData = staffData.map(mapToIndividualRecordsStaff)

  const handleGoToToday = () => {
    const result = goToToday()
    if (!result.success) {
      setDateError(result.message)
      setTimeout(() => setDateError(""), 5000)
    } else {
      setDateError("")
    }
  }

  const handleDeleteStudent = (id: number) => {
    deleteStudent(id)
    if (selectedStaff?.id === id) {
      setSelectedStaff(null)
    }
  }

  const handleSelectStaff = (staff: IndividualRecordsStaff) => {
    setSelectedStaff(staff)
  }

  const stats = getWeeklyStats()

  // Don't render until we have a selected term
  if (!selectedTerm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <StatsCards
        totalStaff={stats.totalStaff}
        presentStaff={stats.presentStaff}
        studentLeads={stats.studentLeads}
        lateToday={stats.lateToday}
      />

      {/* Error Message */}
      {dateError && (
        <Card className="mb-6 bg-red-50 border-red-200 shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{dateError}</span>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Attendance Dashboard</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <TermSelector terms={terms} selectedTerm={selectedTerm} onTermChange={setSelectedTerm} />

          {/* Day Navigation */}
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousDay}
              disabled={currentDateIndex <= 0}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-sm font-medium text-slate-900 min-w-[120px] text-center">
              {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextDay}
              disabled={currentDateIndex >= termWeekdays.length - 1}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleGoToToday} className="ml-2 h-7 text-xs">
              Today
            </Button>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/70 backdrop-blur-sm border-slate-200">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Term Analytics</TabsTrigger>
          <TabsTrigger value="individual">Individual Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TermOverview
            staffData={staffData as any}
            selectedTerm={selectedTerm}
            currentTerm={getCurrentTerm()}
            selectedDate={selectedDate}
            onDateChange={() => {}} // Handle via the navigation above
          />
        </TabsContent>

        <TabsContent value="analytics">
          <TermAnalytics
            staffData={staffData as any}
            selectedTerm={selectedTerm}
            termStartDate={getCurrentTerm().startDate}
            termEndDate={getCurrentTerm().endDate}
          />
        </TabsContent>

        <TabsContent value="individual">
          <IndividualRecords
            staffData={individualRecordsStaffData}
            selectedStaff={selectedStaff}
            onSelectStaff={handleSelectStaff}
            selectedTerm={selectedTerm}
          />
        </TabsContent>
      </Tabs>


    </>
  )
}
