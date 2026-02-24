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
import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { api, type Student, type Term } from "@/lib/api"
import { getUpcomingShifts, isCurrentlyClockedIn, timeToMinutes } from "@/lib/shift-utils"

function HomePageContent() {
  const searchParams = useSearchParams()
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
        
        if (activeTerm) {
          setCurrentTerm(activeTerm)

          // Fetch students for the active term
          const students = await api.students.getAll(activeTerm.id)
          setStaffData(students)
        } else {
          setError("No term found. Please contact administrator.")
          setIsLoading(false)
          return
        }
        
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
        const lastRefresh = localStorage.getItem(refreshKey)

        if (lastRefresh !== dateKey) {
          localStorage.setItem(refreshKey, dateKey)
          globalThis.window.location.reload()
        }
      } else {
        localStorage.removeItem(refreshKey)
      }
    }

    checkClosedState()
    const interval = setInterval(checkClosedState, 15000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const authRequired = searchParams.get("authRequired")
    const authError = searchParams.get("authError")
    const hasAuthMessage = Boolean(authRequired || authError)

    if (hasAuthMessage) {
      if (authRequired) {
        toast.error("Admin login required.")
      }

      if (authError) {
        const authErrorMessages: Record<string, string> = {
          auth_config: "Microsoft auth is not configured correctly.",
          microsoft_error: "Microsoft sign-in was cancelled or failed.",
          invalid_state: "Sign-in session expired. Please try again.",
          invalid_nonce: "Sign-in validation failed. Please try again.",
          missing_code: "Microsoft did not return an authorization code.",
          missing_id_token: "Microsoft login did not return an ID token.",
          invalid_token: "Microsoft ID token validation failed.",
          not_allowed: "This account is not authorized for admin access.",
          not_allowed_admin: "This account is not in the admin access list.",
          admin_api_unreachable: "Admin access service is unreachable. Check API URL configuration.",
          missing_subject: "Unable to identify signed-in account.",
          callback_failed: "Microsoft authentication failed.",
          session_invalid: "Admin session is invalid or expired.",
        }

        toast.error(authErrorMessages[authError] || "Authentication failed.")
      }

      const url = new URL(globalThis.window.location.href)
      url.searchParams.delete("authRequired")
      url.searchParams.delete("authError")
      globalThis.window.history.replaceState({}, "", `${url.pathname}${url.search}`)
    }
  }, [searchParams])

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
      const canProcessSwipe = !isCardSwipeDisabled && !isLoginOpen && !isAdminLoginOpen
      if (canProcessSwipe) {
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

    globalThis.window.addEventListener("keypress", handleKeyPress)
    return () => globalThis.window.removeEventListener("keypress", handleKeyPress)
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

  const addClockEntry = async (staffId: string, type: "in" | "out", isManual = false) => {
    if (currentTerm) {
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
  }

  const handleCardSwipe = async (cardData: string) => {
    // Parse the magnetic stripe data - ISO number is the second number after semicolon
    // Format: %FIRST_NUMBER^NAME?;ISO_NUMBER?
    let isoNumber = cardData

    // Extract ISO number after the semicolon.
    const extractedIso = /;(\d+)/.exec(cardData)?.[1]
    if (extractedIso) {
      isoNumber = extractedIso
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
      
      if (aHasSchedule !== bHasSchedule) return aHasSchedule ? -1 : 1
      
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
    <Card className="mb-6 sm:mb-8 bg-gradient-to-br from-card via-card to-card/90 backdrop-blur-md shadow-xl border-border/50 ring-1 ring-border/20">
      <CardContent className="p-6 sm:p-10 text-center">
        <div className="space-y-3">
          <div className="text-4xl sm:text-6xl lg:text-7xl font-mono font-bold text-foreground tracking-tight tabular-nums">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm sm:text-lg lg:text-xl text-muted-foreground flex items-center justify-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary/70" />
            <span className="break-words font-medium">{formatDate(currentTime)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const manualClockForms = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10 max-w-3xl w-full mx-auto">
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
    <Card className="mb-6 sm:mb-8 bg-card/80 backdrop-blur-md shadow-lg border-border/50 ring-1 ring-border/20 overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0 border border-border/30">
            <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Quick Clock In/Out</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Swipe your ID card to clock in or out automatically</p>
            <p className="text-xs sm:text-sm text-muted-foreground/80">Or use the manual clock in buttons below</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const loadingTableKeys = ["clocked-in", "expected-arrivals"]
  const loadingRowKeys = new Array(4).fill(null).map((_, index) => `row-${index + 1}`)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 sm:p-8 lg:p-10">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sm:mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">ClockedIN</h1>
              <p className="text-muted-foreground text-xs sm:text-sm font-medium">Service Desk Clock-In System</p>
            </div>
          </div>

          {/* Login Area */}
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />

            <AdminLogin
              isOpen={isAdminLoginOpen}
              onToggle={() => {
                setIsAdminLoginOpen(!isAdminLoginOpen)
                setIsCardSwipeDisabled(!isAdminLoginOpen)
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-900/20 dark:to-red-900/10 border-red-200/80 dark:border-red-800/50 shadow-lg ring-1 ring-red-200/50 dark:ring-red-800/30">
            <CardContent className="p-4 sm:p-5 flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm sm:text-base text-red-800 dark:text-red-300 font-medium break-words">{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Closed Notice */}
        {isClosed && error === "" && (
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-900/20 dark:to-amber-900/10 border-amber-200/80 dark:border-amber-700/50 shadow-lg ring-1 ring-amber-200/50 dark:ring-amber-700/30">
            <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm sm:text-base font-semibold text-foreground">Service Desk is Closed</p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  All staff are auto clocked out at 5:00 PM PT. Clock-ins are disabled until the next business day.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-8 sm:mb-12 space-y-6 sm:space-y-8">
            {cardSwiperInstructions}
            {currentTimeCard}
            {isClosed ? null : manualClockForms}
            <div>
              <span className="sr-only">Loading attendance data...</span>
              <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                {loadingTableKeys.map((tableKey) => (
                  <div key={tableKey} className="rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-card/90 backdrop-blur-md p-5 sm:p-6 animate-pulse shadow-lg ring-1 ring-border/20">
                    <div className="flex items-center justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 bg-muted/60 rounded-full" />
                        <div className="h-5 w-36 bg-muted/50 rounded-md" />
                      </div>
                      <div className="h-6 w-20 bg-muted/40 rounded-full" />
                    </div>
                    <div className="space-y-4">
                      {loadingRowKeys.map((rowKey) => (
                        <div key={rowKey} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
                          <div className="h-10 w-10 rounded-full bg-muted/40" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-muted/50 rounded-md" />
                            <div className="h-3 w-20 bg-muted/30 rounded-md" />
                          </div>
                          <div className="h-8 w-8 bg-muted/30 rounded-md" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading || error ? null : (
          <>
            {/* Card Swiper Instructions */}
            {cardSwiperInstructions}

            {/* Current Time Display */}
            {currentTimeCard}

            {/* Manual Clock In/Out Buttons */}
            {isClosed ? null : manualClockForms}

            {/* Tables Grid */}
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
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

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  )
}
