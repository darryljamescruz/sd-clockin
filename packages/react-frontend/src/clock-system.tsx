"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"

import { Navbar } from "./components/navbar"
import { DashboardHeader } from "./components/dashboard-header"
import { TermManager } from "./components/term-manager"
import { StatsCards } from "./components/stats-cards"
import { IndividualRecords } from "./components/individual-records"
import { StudentManager } from "./components/student-manager"
import { TermAnalytics } from "./components/term-analytics"
import { TermOverview } from "./components/term-overview"
import { PublicDashboard } from "./components/public-dashboard"

export default function Component() {
  // Add new state variables
  const [showStudentManager, setShowStudentManager] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateError, setDateError] = useState("")
  const [isClockOutOpen, setIsClockOutOpen] = useState(false)

  // Sample locations for assignment
  const availableLocations = [
    "Help Desk - Main",
    "Help Desk - Library",
    "Lab Support - A",
    "Lab Support - B",
    "Remote Support",
    "Hardware Repair",
    "Software Support",
    "Network Operations",
  ]

  // Add sample terms for better demo
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

  // Sample staff data with location assignments
  const initialStaffData = [
    {
      id: 1,
      name: "Alex Chen",
      cardId: "CARD001",
      role: "Student Lead",
      currentStatus: "present",
      assignedLocation: "Help Desk - Main", // Assigned location
      weeklySchedule: {
        monday: ["8:30-12:00", "1:00-5:00"],
        tuesday: ["9:00-1:00"],
        wednesday: ["8:30-12:00", "1:00-5:00"],
        thursday: ["9:00-1:00"],
        friday: ["8:30-12:00"],
        saturday: [],
        sunday: [],
      },
      todayActual: "08:25 AM",
      clockEntries: [
        { timestamp: "2025-01-20T08:25:00", type: "in" },
        { timestamp: "2025-01-20T12:30:00", type: "out" },
        { timestamp: "2025-01-20T13:15:00", type: "in" },
        { timestamp: "2025-01-20T17:05:00", type: "out" },
      ],
    },
    {
      id: 2,
      name: "Sarah Johnson",
      cardId: "CARD002",
      role: "Assistant",
      currentStatus: "present",
      assignedLocation: "Lab Support - A", // Assigned location
      weeklySchedule: {
        monday: ["9:15-5:00"],
        tuesday: ["9:15-5:00"],
        wednesday: ["9:15-5:00"],
        thursday: ["9:15-5:00"],
        friday: ["9:15-1:00"],
        saturday: [],
        sunday: [],
      },
      todayActual: "09:10 AM",
      clockEntries: [{ timestamp: "2025-01-20T09:10:00", type: "in" }],
    },
    {
      id: 3,
      name: "Mike Rodriguez",
      cardId: "CARD003",
      role: "Student Lead",
      currentStatus: "present",
      assignedLocation: undefined, // Pending assignment
      weeklySchedule: {
        monday: ["8:45-12:00", "1:00-4:00"],
        tuesday: ["10:00-2:00"],
        wednesday: ["8:45-12:00", "1:00-4:00"],
        thursday: ["10:00-2:00"],
        friday: ["8:45-12:00"],
        saturday: [],
        sunday: [],
      },
      todayActual: "08:45 AM",
      clockEntries: [
        { timestamp: "2025-01-20T08:45:00", type: "in" },
        { timestamp: "2025-01-20T12:15:00", type: "out" },
        { timestamp: "2025-01-20T13:10:00", type: "in" },
      ],
    },
    {
      id: 4,
      name: "Emma Wilson",
      cardId: "CARD004",
      role: "Assistant",
      currentStatus: "expected",
      assignedLocation: undefined, // Not clocked in yet
      weeklySchedule: {
        monday: ["9:00-5:00"],
        tuesday: ["9:00-5:00"],
        wednesday: ["9:00-1:00"],
        thursday: ["9:00-5:00"],
        friday: ["9:00-5:00"],
        saturday: [],
        sunday: [],
      },
      todayActual: null,
      clockEntries: [],
    },
    {
      id: 5,
      name: "David Park",
      cardId: "CARD005",
      role: "Assistant",
      currentStatus: "expected",
      assignedLocation: undefined, // Not clocked in yet
      weeklySchedule: {
        monday: [],
        tuesday: ["10:30-2:30"],
        wednesday: ["10:30-2:30"],
        thursday: ["10:30-2:30"],
        friday: [],
        saturday: [],
        sunday: [],
      },
      todayActual: null,
      clockEntries: [],
    },
    {
      id: 6,
      name: "Lisa Zhang",
      cardId: "CARD006",
      role: "Student Lead",
      currentStatus: "present",
      assignedLocation: "Network Operations", // Assigned location
      weeklySchedule: {
        monday: ["8:00-12:00", "1:00-5:00"],
        tuesday: ["8:00-12:00", "1:00-5:00"],
        wednesday: ["8:00-12:00", "1:00-5:00"],
        thursday: ["8:00-12:00", "1:00-5:00"],
        friday: ["8:00-12:00"],
        saturday: [],
        sunday: [],
      },
      todayActual: "07:58 AM",
      clockEntries: [
        { timestamp: "2025-01-20T07:58:00", type: "in" },
        { timestamp: "2025-01-20T12:05:00", type: "out" },
      ],
    },
  ]

  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [cardSwipeData, setCardSwipeData] = useState("")
  const [isCardSwiping, setIsCardSwiping] = useState(false)
  const [clockInMessage, setClockInMessage] = useState("")
  const [showClockInSuccess, setShowClockInSuccess] = useState(false)
  const [showTermManager, setShowTermManager] = useState(false)
  const [terms, setTerms] = useState(initialTerms)
  const [staffData, setStaffData] = useState(initialStaffData)
  const [selectedTerm, setSelectedTerm] = useState("Fall 2025")
  const [isCardSwipeDisabled, setIsCardSwipeDisabled] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Simulate location assignment after clock-in
  const assignLocationToStaff = (staffId: number) => {
    setTimeout(() => {
      setStaffData((prev) =>
        prev.map((staff) => {
          if (staff.id === staffId && !staff.assignedLocation) {
            // Simulate backend assignment logic
            const randomLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)]
            return {
              ...staff,
              assignedLocation: randomLocation,
            }
          }
          return staff
        }),
      )
    }, 2000) // Simulate 2-second delay for backend processing
  }

  // Card swiper simulation
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only process card swipes if not logged in and card swipe is not disabled
      if (!isLoggedIn && !isCardSwipeDisabled && !isLoginOpen && !isAdminLoginOpen) {
        if (event.key === "Enter" && cardSwipeData.length > 0) {
          handleCardSwipe(cardSwipeData)
          setCardSwipeData("")
        } else if (event.key.length === 1) {
          setCardSwipeData((prev) => prev + event.key)
          setIsCardSwiping(true)

          setTimeout(() => {
            setIsCardSwiping(false)
            setCardSwipeData("")
          }, 2000)
        }
      }
    }

    window.addEventListener("keypress", handleKeyPress)
    return () => window.removeEventListener("keypress", handleKeyPress)
  }, [cardSwipeData, isLoggedIn, isCardSwipeDisabled, isLoginOpen, isAdminLoginOpen])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const handleAdminLogin = (username: string, password: string) => {
    // Simple admin check - in real app, this would be secure
    if (username === "admin" && password === "admin123") {
      setIsLoggedIn(true)
      setIsAdminLoginOpen(false)
      return true
    }
    return false
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setSelectedStaff(null)
  }

  const addClockEntry = (staffId: number, type: "in" | "out", isManual = false) => {
    setStaffData((prev) =>
      prev.map((staff) => {
        if (staff.id === staffId) {
          const newEntry = {
            timestamp: new Date().toISOString(),
            type,
            isManual,
          }
          const updatedStaff = {
            ...staff,
            clockEntries: [...staff.clockEntries, newEntry],
            currentStatus: type === "in" ? "present" : "absent",
            todayActual: type === "in" ? formatTime(new Date()) : staff.todayActual,
          }

          // If clocking in and no location assigned, trigger location assignment
          if (type === "in" && !staff.assignedLocation) {
            assignLocationToStaff(staffId)
          }

          // If clocking out, clear location assignment
          if (type === "out") {
            updatedStaff.assignedLocation = undefined
          }

          return updatedStaff
        }
        return staff
      }),
    )
  }

  const handleCardSwipe = (cardData) => {
    const staff = staffData.find((s) => s.cardId === cardData.toUpperCase())

    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"

      addClockEntry(staff.id, action)

      setClockInMessage(`${staff.name} clocked ${action} at ${formatTime(new Date())}`)
      setShowClockInSuccess(true)

      setTimeout(() => {
        setShowClockInSuccess(false)
        setClockInMessage("")
      }, 5000)
    } else {
      setClockInMessage("Card not recognized. Please try again or contact admin.")
      setShowClockInSuccess(true)

      setTimeout(() => {
        setShowClockInSuccess(false)
        setClockInMessage("")
      }, 3000)
    }
  }

  const handleManualClockIn = (staffId: number, isManual: boolean) => {
    const staff = staffData.find((s) => s.id === staffId)

    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"

      addClockEntry(staff.id, action, isManual)

      const manualFlag = isManual ? " (Manual Entry)" : ""
      setClockInMessage(`${staff.name} clocked ${action} at ${formatTime(new Date())}${manualFlag}`)
      setShowClockInSuccess(true)
      setIsLoginOpen(false)

      setTimeout(() => {
        setShowClockInSuccess(false)
        setClockInMessage("")
      }, 5000)
    }
  }

  // Add manual clock out handler
  const handleManualClockOut = (staffId: number, isManual: boolean) => {
    const staff = staffData.find((s) => s.id === staffId)

    if (staff) {
      // Force clock out
      addClockEntry(staff.id, "out", isManual)

      const manualFlag = isManual ? " (Manual Entry)" : ""
      setClockInMessage(`${staff.name} clocked out at ${formatTime(new Date())}${manualFlag}`)
      setShowClockInSuccess(true)
      setIsClockOutOpen(false)

      setTimeout(() => {
        setShowClockInSuccess(false)
        setClockInMessage("")
      }, 5000)
    }
  }

  const handleAddTerm = (term) => {
    const newTerm = {
      ...term,
      id: Date.now().toString(),
    }
    setTerms((prev) => [...prev, newTerm])
  }

  const handleEditTerm = (id: string, updatedTerm) => {
    setTerms((prev) => prev.map((term) => (term.id === id ? { ...updatedTerm, id } : term)))
  }

  const handleDeleteTerm = (id: string) => {
    setTerms((prev) => prev.filter((term) => term.id !== id))
  }

  const getWeeklyStats = () => {
    const totalStaff = staffData.length
    const presentStaff = staffData.filter((s) => s.currentStatus === "present").length
    const lateToday = staffData.filter((s) => {
      if (!s.todayActual) return false
      const expected = new Date(`2000-01-01 ${getExpectedStartTime(s)}`)
      const actual = new Date(`2000-01-01 ${s.todayActual}`)
      return actual > expected
    }).length
    const studentLeads = staffData.filter((s) => s.role === "Student Lead").length

    return { totalStaff, presentStaff, lateToday, studentLeads }
  }

  // Add student management functions
  const handleAddStudent = (studentData) => {
    const newStudent = {
      ...studentData,
      id: Math.max(...staffData.map((s) => s.id)) + 1,
      currentStatus: "expected",
      todayActual: null,
      clockEntries: [],
      assignedLocation: undefined,
    }
    setStaffData((prev) => [...prev, newStudent])
  }

  const handleEditStudent = (id: number, studentData) => {
    setStaffData((prev) => prev.map((staff) => (staff.id === id ? { ...staff, ...studentData } : staff)))
  }

  const handleDeleteStudent = (id: number) => {
    setStaffData((prev) => prev.filter((staff) => staff.id !== id))
    if (selectedStaff?.id === id) {
      setSelectedStaff(null)
    }
  }

  // Get current term data
  const getCurrentTerm = () => {
    return terms.find((term) => term.name === selectedTerm) || terms[0]
  }

  const getTodaySchedule = (staff, date = new Date()) => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = dayNames[date.getDay()]
    return staff.weeklySchedule?.[dayName] || []
  }

  const getExpectedStartTime = (staff, date = new Date()) => {
    const todaySchedule = getTodaySchedule(staff, date)
    if (todaySchedule.length === 0) return null

    // Get the first time block's start time
    const firstBlock = todaySchedule[0]
    const startTime = firstBlock.split("-")[0].trim()

    // Convert to standard format if needed
    if (startTime.includes(":")) {
      return startTime.includes("AM") || startTime.includes("PM") ? startTime : startTime + " AM"
    } else {
      // Convert 24-hour to 12-hour format
      const hour = Number.parseInt(startTime)
      if (hour === 0) return "12:00 AM"
      if (hour < 12) return `${hour}:00 AM`
      if (hour === 12) return "12:00 PM"
      return `${hour - 12}:00 PM`
    }
  }

  // Get all weekdays in the current term
  const getTermWeekdays = () => {
    const weekdays = []
    const currentTerm = getCurrentTerm()
    const start = new Date(currentTerm.startDate)
    const end = new Date(currentTerm.endDate)
    const current = new Date(start)

    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        weekdays.push(new Date(current))
      }
      current.setDate(current.getDate() + 1)
    }
    return weekdays
  }

  const termWeekdays = getTermWeekdays()
  const currentDateIndex = termWeekdays.findIndex((date) => date.toDateString() === selectedDate.toDateString())

  const goToPreviousDay = () => {
    if (currentDateIndex > 0) {
      setSelectedDate(termWeekdays[currentDateIndex - 1])
    }
  }

  const goToNextDay = () => {
    if (currentDateIndex < termWeekdays.length - 1) {
      setSelectedDate(termWeekdays[currentDateIndex + 1])
    }
  }

  const goToToday = () => {
    const today = new Date()
    const termStatus = getTermStatus()

    if (termStatus.status === "future") {
      setDateError("Cannot view today's attendance for a future term. This term hasn't started yet.")
      setTimeout(() => setDateError(""), 5000)
      return
    }

    const todayInTerm = termWeekdays.find((date) => date.toDateString() === today.toDateString())
    if (todayInTerm) {
      setSelectedDate(todayInTerm)
      setDateError("")
    } else {
      // If today is not in term, go to the most recent day for past terms
      if (termStatus.status === "past") {
        setSelectedDate(termWeekdays[termWeekdays.length - 1])
        setDateError("")
      } else {
        setDateError("Today is not within the selected term period.")
        setTimeout(() => setDateError(""), 5000)
      }
    }
  }

  const getTermStatus = () => {
    const today = new Date()
    const currentTerm = getCurrentTerm()
    const startDate = new Date(currentTerm.startDate)
    const endDate = new Date(currentTerm.endDate)

    if (today < startDate) {
      return { status: "future" }
    } else if (today > endDate) {
      return { status: "past" }
    } else {
      return { status: "current" }
    }
  }

  const getDefaultDateForTerm = () => {
    const today = new Date()
    const termStatus = getTermStatus()

    if (termStatus.status === "current") {
      // For current term, default to today if it's a weekday in the term
      const todayInTerm = termWeekdays.find((date) => date.toDateString() === today.toDateString())
      return todayInTerm || termWeekdays[0]
    } else if (termStatus.status === "past") {
      // For past terms, default to the last day
      return termWeekdays[termWeekdays.length - 1]
    } else {
      // For future terms, default to the first day
      return termWeekdays[0]
    }
  }

  useEffect(() => {
    if (termWeekdays.length > 0) {
      setSelectedDate(getDefaultDateForTerm())
      setDateError("")
    }
  }, [selectedTerm])

  const stats = getWeeklyStats()

  // Public dashboard for non-logged in users
  if (!isLoggedIn) {
    return (
      <PublicDashboard
        currentTime={currentTime}
        staffData={staffData}
        isLoginOpen={isLoginOpen}
        isClockOutOpen={isClockOutOpen}
        isAdminLoginOpen={isAdminLoginOpen}
        isCardSwiping={isCardSwiping}
        showClockInSuccess={showClockInSuccess}
        clockInMessage={clockInMessage}
        onToggleLogin={() => {
          setIsLoginOpen(!isLoginOpen)
          setIsCardSwipeDisabled(!isLoginOpen)
        }}
        onToggleClockOut={() => {
          setIsClockOutOpen(!isClockOutOpen)
          setIsCardSwipeDisabled(!isClockOutOpen)
        }}
        onToggleAdminLogin={() => {
          setIsAdminLoginOpen(!isAdminLoginOpen)
          setIsCardSwipeDisabled(!isAdminLoginOpen)
        }}
        onManualClockIn={handleManualClockIn}
        onManualClockOut={handleManualClockOut}
        onAdminLogin={handleAdminLogin}
      />
    )
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar
        currentTime={currentTime}
        onLogout={handleLogout}
        onManageTerms={() => setShowTermManager(true)}
        onManageStudents={() => setShowStudentManager(true)}
      />

      <div className="max-w-7xl mx-auto px-6">
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

        <DashboardHeader
          terms={terms}
          selectedTerm={selectedTerm}
          onTermChange={setSelectedTerm}
          selectedDate={selectedDate}
          currentDateIndex={currentDateIndex}
          termWeekdays={termWeekdays}
          onPreviousDay={goToPreviousDay}
          onNextDay={goToNextDay}
          onToday={goToToday}
          getTermStatus={getTermStatus}
        />

        {/* Main Dashboard */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/70 backdrop-blur-sm border-slate-200">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Term Analytics</TabsTrigger>
            <TabsTrigger value="individual">Individual Records</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <TermOverview
              staffData={staffData}
              selectedTerm={selectedTerm}
              currentTerm={getCurrentTerm()}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <TermAnalytics
              staffData={staffData}
              selectedTerm={selectedTerm}
              termStartDate={getCurrentTerm().startDate}
              termEndDate={getCurrentTerm().endDate}
            />
          </TabsContent>

          <TabsContent value="individual">
            <IndividualRecords
              staffData={staffData}
              selectedStaff={selectedStaff}
              onSelectStaff={setSelectedStaff}
              selectedTerm={selectedTerm}
            />
          </TabsContent>
        </Tabs>

        {/* Term Manager Modal */}
        {showTermManager && (
          <TermManager
            terms={terms}
            onAddTerm={handleAddTerm}
            onEditTerm={handleEditTerm}
            onDeleteTerm={handleDeleteTerm}
            onClose={() => setShowTermManager(false)}
          />
        )}

        {showStudentManager && (
          <StudentManager
            staffData={staffData}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onClose={() => setShowStudentManager(false)}
          />
        )}
      </div>
    </div>
  )
}
