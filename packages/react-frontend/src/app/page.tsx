// packages/react-frontend/src/app/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

import { ClockInForm } from "@/components/clock-in-form"
import { AdminLogin } from "@/components/admin-login"
import { ClockDisplay } from "@/components/clock-display"
import { CardSwiper } from "@/components/card-swiper"
import { AttendanceTables } from "../components/attendance-tables"
import { useStaffData } from "@/hooks/use-staff-data"

export default function ClockInPage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false)
  const [isCardSwiping, setIsCardSwiping] = useState(false)
  const [clockInMessage, setClockInMessage] = useState("")
  const [showClockInSuccess, setShowClockInSuccess] = useState(false)
  const [isCardSwipeDisabled, setIsCardSwipeDisabled] = useState(false)

  // Use custom hook for staff data management
  const { staffData, handleCardSwipe, handleManualClockIn } = useStaffData()

  // Timer for current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleAdminLogin = (username: string, password: string) => {
    if (username === "admin" && password === "admin123") {
      sessionStorage.setItem('isAdminLoggedIn', 'true')
      router.push('/admin')
      return true
    }
    return false
  }

  const onCardSwipe = (cardData: string) => {
    setIsCardSwiping(true)
    const result = handleCardSwipe(cardData)
    
    setClockInMessage(result.message)
    setShowClockInSuccess(true)
    
    setTimeout(() => {
      setShowClockInSuccess(false)
      setClockInMessage("")
      setIsCardSwiping(false)
    }, result.success ? 5000 : 3000)
  }

  const onManualClockIn = (staffId: number, isManual: boolean) => {
    const result = handleManualClockIn(staffId, isManual)
    
    setClockInMessage(result.message)
    setShowClockInSuccess(true)
    setIsLoginOpen(false)

    setTimeout(() => {
      setShowClockInSuccess(false)
      setClockInMessage("")
    }, 5000)
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
              onClockIn={onManualClockIn}
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
          onCardSwipe={onCardSwipe}
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