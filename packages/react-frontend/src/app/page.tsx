// packages/react-frontend/src/app/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

import { ClockInForm } from "@/components/clock-in-form"
import { AdminLogin } from "@/components/admin-login"
import { ClockDisplay } from "@/components/clock-display"
import { CardSwiper } from "@/components/card-swiper"
import { AttendanceTables } from "../components/attendance-tables"
import { PublicHeader } from "@/components/public-header"
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
      setIsAdminLoginOpen(false)
      setIsCardSwipeDisabled(false)
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
    setIsCardSwipeDisabled(false)

    setTimeout(() => {
      setShowClockInSuccess(false)
      setClockInMessage("")
    }, 5000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <PublicHeader
          currentTime={currentTime}
          onManualClockIn={() => {
            setIsLoginOpen(true)
            setIsCardSwipeDisabled(true)
          }}
          onAdminLogin={() => {
            setIsAdminLoginOpen(true)
            setIsCardSwipeDisabled(true)
          }}
        />

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
        <Card className="mt-8 bg-card border-border">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Demo Instructions:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Type "CARD001", "CARD002", "CARD003", "CARD004", "CARD005", or "CARD006" and press Enter to simulate card swipe</p>
              <p>• Use Manual Clock In for backup entry</p>
              <p>• Admin Login: username "admin", password "admin123"</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals - rendered at page level to avoid containment issues */}
      {isLoginOpen && (
        <ClockInForm
          isOpen={isLoginOpen}
          onToggle={() => {
            setIsLoginOpen(false)
            setIsCardSwipeDisabled(false)
          }}
          onClockIn={onManualClockIn}
          staffData={staffData}
        />
      )}

      {isAdminLoginOpen && (
        <AdminLogin
          isOpen={isAdminLoginOpen}
          onToggle={() => {
            setIsAdminLoginOpen(false)
            setIsCardSwipeDisabled(false)
          }}
          onLogin={handleAdminLogin}
        />
      )}
    </div>
  )
}