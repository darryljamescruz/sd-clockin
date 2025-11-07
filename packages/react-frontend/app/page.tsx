"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, Calendar, CreditCard, CheckCircle } from "lucide-react"
import { ClockInForm } from "@/components/clock-in-form"
import { AdminLogin } from "@/components/admin-login"
import { ClockedInTable } from "@/components/clocked-in-table"
import { ExpectedArrivalsTable } from "@/components/expected-arrivals-table"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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

  // Sample staff data - removed assignedLocation
  const [staffData, setStaffData] = useState([
    {
      id: 1,
      name: "Alex Chen",
      cardId: "CARD001",
      role: "Student Lead",
      currentStatus: "present",
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
  ])

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

  const addClockEntry = (staffId: number, type: "in" | "out", isManual = false) => {
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
            clockEntries: [...staff.clockEntries, newEntry],
            currentStatus: type === "in" ? "present" : "absent",
            todayActual: type === "in" ? formatTime(new Date()) : staff.todayActual,
          }
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

  const handleManualClockOut = (staffId: number, isManual: boolean) => {
    const staff = staffData.find((s) => s.id === staffId)

    if (staff) {
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

        {/* Demo Instructions */}
        <Card className="mt-8 bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-900 mb-2">Demo Instructions:</h4>
            <div className="text-sm text-slate-600 space-y-1">
              <p>
                • Type "CARD001", "CARD002", "CARD003", "CARD004", "CARD005", or "CARD006" and press Enter to simulate
                card swipe
              </p>
              <p>• Use Manual Clock In for backup entry</p>
              <p>• Admin Login: username "admin", password "admin123"</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
