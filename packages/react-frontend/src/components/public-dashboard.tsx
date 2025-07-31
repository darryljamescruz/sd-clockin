"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, Calendar, CreditCard, CheckCircle } from "lucide-react"
import { ClockInForm } from "./clock-in-form"
import { AdminLogin } from "./admin-login"
import { ClockedInTable } from "./clocked-in-table"
import { ExpectedArrivalsTable } from "./expected-arrivals-table"

interface Staff {
  id: number
  name: string
  role: string
  currentStatus: string
  todayActual: string | null
  assignedLocation?: string
  weeklySchedule?: {
    monday?: string[]
    tuesday?: string[]
    wednesday?: string[]
    thursday?: string[]
    friday?: string[]
    saturday?: string[]
    sunday?: string[]
  }
}

interface PublicDashboardProps {
  currentTime: Date
  staffData: Staff[]
  isLoginOpen: boolean
  isClockOutOpen: boolean
  isAdminLoginOpen: boolean
  isCardSwiping: boolean
  showClockInSuccess: boolean
  clockInMessage: string
  onToggleLogin: () => void
  onToggleClockOut: () => void
  onToggleAdminLogin: () => void
  onManualClockIn: (staffId: number, isManual: boolean) => void
  onManualClockOut: (staffId: number, isManual: boolean) => void
  onAdminLogin: (username: string, password: string) => boolean
}

export function PublicDashboard({
  currentTime,
  staffData,
  isLoginOpen,
  isClockOutOpen,
  isAdminLoginOpen,
  isCardSwiping,
  showClockInSuccess,
  clockInMessage,
  onToggleLogin,
  onToggleClockOut,
  onToggleAdminLogin,
  onManualClockIn,
  onManualClockOut,
  onAdminLogin,
}: PublicDashboardProps) {
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
              onToggle={onToggleLogin}
              onClockIn={onManualClockIn}
              staffData={staffData}
              mode="in"
              title="Manual Clock In"
              buttonText="Manual Clock In"
            />

            <ClockInForm
              isOpen={isClockOutOpen}
              onToggle={onToggleClockOut}
              onClockIn={onManualClockOut}
              staffData={staffData}
              mode="out"
              title="Manual Clock Out"
              buttonText="Manual Clock Out"
            />

            <AdminLogin isOpen={isAdminLoginOpen} onToggle={onToggleAdminLogin} onLogin={onAdminLogin} />
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
              <p>• Location assignment happens automatically after clock-in (simulated by backend)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
