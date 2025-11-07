"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, Calendar, CreditCard, CheckCircle, AlertTriangle } from "lucide-react"
import { ClockInForm } from "@/components/clock-in-form"
import { AdminLogin } from "@/components/admin-login"
import { ClockedInTable } from "@/components/clocked-in-table"
import { ExpectedArrivalsTable } from "@/components/expected-arrivals-table"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api, type Student, type Term } from "@/lib/api"

export default function HomePage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isClockOutOpen, setIsClockOutOpen] = useState(false)
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false)
  const [isCardSwiping, setIsCardSwiping] = useState(false)
  const [clockInMessage, setClockInMessage] = useState("")
  const [showClockInSuccess, setShowClockInSuccess] = useState(false)
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

  // Card swiper simulation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!isCardSwipeDisabled && !isLoginOpen && !isAdminLoginOpen) {
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

    try {
      // Create check-in via API
      await api.checkins.create({
        studentId: staffId,
        termId: currentTerm.id,
        type,
        isManual,
      })

      // Update local state
      setStaffData((prev) =>
        prev.map((staff) => {
          if (staff.id === staffId) {
            const newEntry = {
              timestamp: new Date().toISOString(),
              type,
              isManual,
            }
            return {
              ...staff,
              clockEntries: [...(staff.clockEntries || []), newEntry],
              currentStatus: type === "in" ? "present" : "absent",
            }
          }
          return staff
        }),
      )
    } catch (err) {
      console.error("Error recording clock entry:", err)
      setClockInMessage("Failed to record check-in. Please try again.")
      setShowClockInSuccess(true)
      
      setTimeout(() => {
        setShowClockInSuccess(false)
        setClockInMessage("")
      }, 3000)
    }
  }

  const handleCardSwipe = async (cardData: string) => {
    const staff = staffData.find((s) => s.cardId === cardData.toUpperCase())

    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"

      await addClockEntry(staff.id, action, false)

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

  const handleManualClockIn = async (staffId: string, isManual: boolean) => {
    const staff = staffData.find((s) => s.id === staffId)

    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"

      await addClockEntry(staff.id, action, isManual)

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

  const handleManualClockOut = async (staffId: string, isManual: boolean) => {
    const staff = staffData.find((s) => s.id === staffId)

    if (staff) {
      await addClockEntry(staff.id, "out", isManual)

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

  const clockedInUsers = staffData.filter((staff) => staff.currentStatus === "present")
  const expectedArrivals = staffData.filter((staff) => staff.currentStatus === "expected")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">TimeSync</h1>
              <p className="text-slate-600 text-sm">IT Service Desk Clock-In System</p>
            </div>
          </div>

          {/* Login Area */}
          <div className="flex items-center gap-4">
            {!isLoading && (
              <>
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
              </>
            )}

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
          <Card className="mb-6 bg-red-50 border-red-200 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="mb-6 bg-blue-50 border-blue-200 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-800 font-medium">Loading data...</span>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && (
          <>
            {/* Card Swiper Status */}
            {isCardSwiping && (
              <Card className="mb-6 bg-blue-50 border-blue-200 shadow-lg">
                <CardContent className="p-4 flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600 animate-pulse" />
                  <span className="text-blue-800 font-medium">Card detected... Please wait</span>
                </CardContent>
              </Card>
            )}

            {/* Clock In Success Message */}
            {showClockInSuccess && (
              <Card className="mb-6 bg-green-50 border-green-200 shadow-lg">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">{clockInMessage}</span>
                </CardContent>
              </Card>
            )}

            {/* Card Swiper Instructions */}
            <Card className="mb-8 bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Quick Clock In/Out</h3>
                    <p className="text-slate-600">Swipe your ID card to clock in or out automatically</p>
                    <p className="text-sm text-slate-500 mt-1">Or use manual clock in for backup</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Time Display */}
            <Card className="mb-8 bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="space-y-2">
                  <div className="text-6xl font-mono font-bold text-slate-900 tracking-tight">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-xl text-slate-600 flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {formatDate(currentTime)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tables Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              <ClockedInTable clockedInUsers={clockedInUsers} />
              <ExpectedArrivalsTable expectedArrivals={expectedArrivals} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
