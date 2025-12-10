"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, Calendar, CreditCard, AlertTriangle } from "lucide-react"
import { ClockInForm } from "@/components/clock-in-form"
import { AdminLogin } from "@/components/admin/layout/admin-login"
import { ClockedInTable } from "@/components/clocked-in-table"
import { ExpectedArrivalsTable } from "@/components/expected-arrivals-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api, type Student, type Term } from "@/lib/api"
import { getUpcomingShifts, isCurrentlyClockedIn, timeToMinutes } from "@/lib/shift-utils"

export default function HomePage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isClosed, setIsClosed] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isClockOutOpen, setIsClockOutOpen] = useState(false)
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false)
  const [cardSwipeData, setCardSwipeData] = useState("")
  const [isCardSwipeDisabled, setIsCardSwipeDisabled] = useState(false)

  // Data state
  const [staffData, setStaffData] = useState<Student[]>([])
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch initial data (terms and students)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError("")
        
        // Fetch terms
        const terms = await api.terms.getAll()
        const activeTerm = terms.find((t) => t.isActive) || terms[0]
        
        if (!activeTerm) {
          setError("No term found. Please contact administrator.")
          setIsLoading(false)
          return
        }
        
        setCurrentTerm(activeTerm)
        
        // Fetch students for the active term
        const students = await api.students.getAll(activeTerm.id)
        setStaffData(students)
        
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Detect 5:00 PM PST on weekdays, refresh once per day, and show closed state
  useEffect(() => {
    const refreshKey = "service-desk-closed-refresh-date"

    const checkClosedState = () => {
      const pstNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }))
      const isWeekday = pstNow.getDay() >= 1 && pstNow.getDay() <= 5
      const atOrAfterClose = pstNow.getHours() > 17 || (pstNow.getHours() === 17 && pstNow.getMinutes() >= 0)
      const closedNow = isWeekday && atOrAfterClose

      setIsClosed(closedNow)

      if (closedNow) {
        const dateKey = pstNow.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })
        const lastRefresh = typeof window !== "undefined" ? localStorage.getItem(refreshKey) : null

        if (lastRefresh !== dateKey) {
          localStorage.setItem(refreshKey, dateKey)
          window.location.reload()
        }
      } else {
        localStorage.removeItem(refreshKey)
      }
    }

    checkClosedState()
    const interval = setInterval(checkClosedState, 15000)

    return () => clearInterval(interval)
  }, [])

  // Disable swipe/manual interactions when closed
  useEffect(() => {
    if (isClosed) {
      setIsCardSwipeDisabled(true)
      setIsLoginOpen(false)
      setIsClockOutOpen(false)
      setIsAdminLoginOpen(false)
    }
  }, [isClosed])

  // Card swiper simulation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isCardSwipeDisabled && !isLoginOpen && !isAdminLoginOpen) {
        if (event.key === "Enter" && cardSwipeData.length > 0) {
          handleCardSwipe(cardSwipeData)
          setCardSwipeData("")
        } else if (event.key.length === 1) {
          setCardSwipeData((prev) => prev + event.key)

          // Clear the buffer after 2 seconds of inactivity
          setTimeout(() => {
            setCardSwipeData("")
          }, 2000)
        }
      }
    }

    window.addEventListener("keypress", handleKeyPress)
    return () => window.removeEventListener("keypress", handleKeyPress)
  }, [cardSwipeData, isCardSwipeDisabled, isLoginOpen, isAdminLoginOpen])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleAdminLogin = (username: string, password: string) => {
    if (username === "admin" && password === "admin123") {
      setIsAdminLoginOpen(false)
      router.push("/admin")
      return true
    }
    return false
  }

  const addClockEntry = async (staffId: string, type: "in" | "out", isManual = false) => {
    if (!currentTerm) return
    if (isClosed) {
      toast.error("Service Desk is closed. Clock-ins resume next business day.")
      return
    }

    try {
      // Create check-in via API
      await api.checkins.create({
        studentId: staffId,
        termId: currentTerm.id,
        type,
        isManual,
      })

      // Re-fetch all students to get accurate computed status from backend
      const students = await api.students.getAll(currentTerm.id)
      setStaffData(students)
    } catch (err) {
      console.error("Error recording clock entry:", err)
      toast.error("Failed to record check-in. Please try again.")
    }
  }

  const handleCardSwipe = async (cardData: string) => {
    // Parse the magnetic stripe data - ISO number is the second number after semicolon
    // Format: %FIRST_NUMBER^NAME?;ISO_NUMBER?
    let isoNumber = cardData

    if (cardData.includes(';')) {
      // Extract ISO number after the semicolon
      const match = cardData.match(/;(\d+)/)
      if (match && match[1]) {
        isoNumber = match[1]
      }
    }

    const staff = staffData.find((s) => s.cardId?.toUpperCase() === isoNumber.toUpperCase())

    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"

      await addClockEntry(staff.id, action, false)

      toast.success(`${staff.name} clocked ${action} successfully at ${formatTime(new Date())}`)
    } else {
      toast.error("Card not recognized. Please try again or contact admin.")
    }
  }

  const handleManualClockIn = async (staffId: string, isManual: boolean) => {
    const staff = staffData.find((s) => s.id === staffId)

    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"

      await addClockEntry(staff.id, action, isManual)

      toast.success(`${staff.name} clocked ${action} successfully at ${formatTime(new Date())}`)
      setIsLoginOpen(false)
    }
  }

  const handleManualClockOut = async (staffId: string, isManual: boolean) => {
    const staff = staffData.find((s) => s.id === staffId)

    if (staff) {
      await addClockEntry(staff.id, "out", isManual)

      toast.success(`${staff.name} clocked out successfully at ${formatTime(new Date())}`)
      setIsClockOutOpen(false)
    }
  }

  const handleClockInFromTable = async (staff: Student) => {
    await addClockEntry(staff.id, "in", true)
    toast.success(`${staff.name} clocked in successfully at ${formatTime(new Date())}`)
  }

  const handleClockOutFromTable = async (staff: Student) => {
    await addClockEntry(staff.id, "out", true)
    toast.success(`${staff.name} clocked out successfully at ${formatTime(new Date())}`)
  }

  // Sort clocked in users: chronological (clock-in time), then alphabetical, non-scheduled at bottom
  // Uses shared logic to check if actually clocked in (handles multiple shifts)
  const clockedInUsers = staffData
    .filter((staff) => isCurrentlyClockedIn(staff, currentTime))
    .sort((a, b) => {
      // First, separate scheduled from non-scheduled
      const aHasSchedule = a.expectedEndShift && a.expectedEndShift !== "No schedule"
      const bHasSchedule = b.expectedEndShift && b.expectedEndShift !== "No schedule"
      
      if (aHasSchedule && !bHasSchedule) return -1
      if (!aHasSchedule && bHasSchedule) return 1
      
      // Then sort by clock-in time (chronological)
      if (a.todayActual && b.todayActual) {
        const timeA = new Date(a.todayActual).getTime()
        const timeB = new Date(b.todayActual).getTime()
        if (timeA !== timeB) return timeA - timeB
      }
      
      // Finally, sort alphabetically by name
      return a.name.localeCompare(b.name)
    })

  // Filter expected arrivals: people with upcoming shifts who are not currently clocked in
  // Uses shared logic to handle multiple shifts per day
  const expectedArrivals = staffData
    .filter((staff) => {
      // Must not be currently clocked in (check all shifts, not just one)
      if (isCurrentlyClockedIn(staff, currentTime)) return false
      
      // Must have at least one upcoming shift within 2 hours or within 10 minutes after start
      const upcomingShifts = getUpcomingShifts(staff, currentTime, 2, 10)
      return upcomingShifts.length > 0
    })
    .sort((a, b) => {
      // Get earliest upcoming shift for each person
      const aShifts = getUpcomingShifts(a, currentTime, 2, 10)
      const bShifts = getUpcomingShifts(b, currentTime, 2, 10)
      
      // First, separate scheduled from non-scheduled
      if (aShifts.length > 0 && bShifts.length === 0) return -1
      if (aShifts.length === 0 && bShifts.length > 0) return 1
      
      // Then sort by earliest shift start time (chronological)
      if (aShifts.length > 0 && bShifts.length > 0) {
        const aEarliest = timeToMinutes(aShifts[0].start)
        const bEarliest = timeToMinutes(bShifts[0].start)
        if (aEarliest !== bEarliest) return aEarliest - bEarliest
      }
      
      // Finally, sort by first name alphabetically
      const aFirstName = a.name.split(" ")[0]
      const bFirstName = b.name.split(" ")[0]
      return aFirstName.localeCompare(bFirstName)
    })

  const currentTimeCard = (
    <Card className="mb-6 sm:mb-8 bg-card/70 backdrop-blur-sm shadow-lg">
      <CardContent className="p-4 sm:p-8 text-center">
        <div className="space-y-2">
          <div className="text-3xl sm:text-5xl lg:text-6xl font-mono font-bold text-foreground tracking-tight">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm sm:text-lg lg:text-xl text-muted-foreground flex items-center justify-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="break-words">{formatDate(currentTime)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const manualClockForms = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-3xl w-full mx-auto">
      <div className="flex justify-center">
        <ClockInForm
          isOpen={isLoginOpen}
          onToggle={() => {
            setIsLoginOpen(!isLoginOpen)
            setIsCardSwipeDisabled(!isLoginOpen)
          }}
          onClockIn={handleManualClockIn}
          staffData={staffData}
          mode="in"
          title="Manual Clock In"
          buttonText="Manual Clock In"
        />
      </div>

      <div className="flex justify-center">
        <ClockInForm
          isOpen={isClockOutOpen}
          onToggle={() => {
            setIsClockOutOpen(!isClockOutOpen)
            setIsCardSwipeDisabled(!isClockOutOpen)
          }}
          onClockIn={handleManualClockOut}
          staffData={staffData}
          mode="out"
          title="Manual Clock Out"
          buttonText="Manual Clock Out"
        />
      </div>
    </div>
  )

  const cardSwiperInstructions = (
    <Card className="mb-6 sm:mb-8 bg-card/70 backdrop-blur-sm shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">Quick Clock In/Out</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Swipe your ID card to clock in or out automatically</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Or manually clock in</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 sm:p-6">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">ClockedIN</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">Service Desk Clock-In System</p>
            </div>
          </div>

          {/* Login Area */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            <AdminLogin
              isOpen={isAdminLoginOpen}
              onToggle={() => {
                setIsAdminLoginOpen(!isAdminLoginOpen)
                setIsCardSwipeDisabled(!isAdminLoginOpen)
              }}
              onLogin={handleAdminLogin}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-4 sm:mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-lg">
            <CardContent className="p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
              <span className="text-sm sm:text-base text-red-800 dark:text-red-300 font-medium break-words">{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Closed Notice */}
        {isClosed && !error && (
          <Card className="mb-4 sm:mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 shadow-lg">
            <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-300 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-semibold text-foreground">Service Desk is Closed</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  All staff are auto clocked out at 5:00 PM PT. Clock-ins are disabled until the next business day.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 sm:mb-10 space-y-6 sm:space-y-8">
            {cardSwiperInstructions}
            {currentTimeCard}
            {!isClosed && manualClockForms}
            <div>
              <span className="sr-only">Loading attendance data...</span>
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                {[0, 1].map((table) => (
                  <div key={table} className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm p-4 sm:p-6 animate-pulse">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="h-5 w-32 bg-muted/60 rounded" />
                      <div className="h-4 w-16 bg-muted/50 rounded" />
                    </div>
                    <div className="grid grid-cols-[auto,1fr,auto] gap-3 text-sm text-muted-foreground">
                      {[...Array(5)].map((_, rowIndex) => (
                        <div key={rowIndex} className="col-span-3 grid grid-cols-[auto,1fr,auto] gap-3 items-center">
                          <div className="h-8 w-8 rounded-full bg-muted/50" />
                          <div className="space-y-2 py-1">
                            <div className="h-4 w-32 bg-muted/70 rounded" />
                            <div className="h-3 w-24 bg-muted/50 rounded" />
                          </div>
                          <div className="h-4 w-20 bg-muted/40 rounded justify-self-end" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Card Swiper Instructions */}
            {cardSwiperInstructions}

            {/* Current Time Display */}
            {currentTimeCard}

            {/* Manual Clock In/Out Buttons */}
            {!isClosed && manualClockForms}

            {/* Tables Grid */}
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
              <ClockedInTable clockedInUsers={clockedInUsers} onClockOutClick={handleClockOutFromTable} />
              <ExpectedArrivalsTable
                expectedArrivals={expectedArrivals}
                currentTime={currentTime}
                onClockInClick={handleClockInFromTable}
              />
            </div>
          </>
        )}
      </div>
      <Toaster />
    </div>
  )
}
