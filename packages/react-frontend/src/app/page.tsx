// packages/react-frontend/src/app/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, Calendar, CreditCard as CardIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

import { ClockInForm } from "@/components/clock-in-form"
import { AdminLogin } from "@/components/admin-login"
import { ClockDisplay } from "./components/clock-display"
import { CardSwiper } from "./components/card-swiper"
import { AttendanceTables } from "./components/attendance-tables"

// Move your initial staff data here (we'll extract this to a separate file later)
const initialStaffData = [
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
]

export default function ClockInPage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false)
  const [isCardSwiping, setIsCardSwiping] = useState(false)
  const [clockInMessage, setClockInMessage] = useState("")
  const [showClockInSuccess, setShowClockInSuccess] = useState(false)
  const [isCardSwipeDisabled, setIsCardSwipeDisabled] = useState(false)
  const [staffData, setStaffData] = useState(initialStaffData)

  // Timer for current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const handleAdminLogin = (username: string, password: string) => {
    if (username === "admin" && password === "admin123") {
      // TODO: Set up proper auth and redirect to admin
      sessionStorage.setItem('isAdminLoggedIn', 'true')
      router.push('/admin')
      return true
    }
    return false
  }

  const handleCardSwipe = (cardData: string) => {
    setIsCardSwiping(true)
    const staff = staffData.find((s) => s.cardId === cardData.toUpperCase())

    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"

      // Update staff data
      setStaffData(prev => prev.map(s => 
        s.id === staff.id 
          ? {
              ...s,
              currentStatus: action === "in" ? "present" : "absent",
              todayActual: action === "in" ? formatTime(new Date()) : s.todayActual,
              clockEntries: [...s.clockEntries, {
                timestamp: new Date().toISOString(),
                type: action,
              }]
            }
          : s
      ))

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

    setTimeout(() => {
      setIsCardSwiping(false)
    }, 1000)
  }

  const handleManualClockIn = (staffId: number, isManual: boolean) => {
    const staff = staffData.find((s) => s.id === staffId)
    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"

      setStaffData(prev => prev.map(s => 
        s.id === staff.id 
          ? {
              ...s,
              currentStatus: action === "in" ? "present" : "absent",
              todayActual: action === "in" ? formatTime(new Date()) : s.todayActual,
              clockEntries: [...s.clockEntries, {
                timestamp: new Date().toISOString(),
                type: action,
                isManual,
              }]
            }
          : s
      ))

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

        {/* Card Swiper */}
        <CardSwiper
          onCardSwipe={handleCardSwipe}
          isDisabled={isCardSwipeDisabled || isLoginOpen || isAdminLoginOpen}
          isCardSwiping={isCardSwiping}
          showClockInSuccess={showClockInSuccess}
          clockInMessage={clockInMessage}
        />

        {/* Clock Display */}
        <ClockDisplay currentTime={currentTime} />

        {/* Attendance Tables */}
        <AttendanceTables staffData={staffData} />

        {/* Demo Instructions */}
        <Card className="mt-8 bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-900 mb-2">Demo Instructions:</h4>
            <div className="text-sm text-slate-600 space-y-1">
              <p>• Type "CARD001", "CARD002", "CARD003", "CARD004", "CARD005", or "CARD006" and press Enter to simulate card swipe</p>
              <p>• Use Manual Clock In for backup entry</p>
              <p>• Admin Login: username "admin", password "admin123"</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}