"use client"

import { Button } from "@/components/ui/button"
import { Clock, User, Settings, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface PublicHeaderProps {
  currentTime: Date
  onManualClockIn: () => void
  onAdminLogin: () => void
}

export function PublicHeader({ currentTime, onManualClockIn, onAdminLogin }: PublicHeaderProps) {
  const { theme, setTheme } = useTheme()
  
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

  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8 p-6 bg-background/70 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center shadow-md">
          <Clock className="w-7 h-7 text-white" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            TimeSync
          </h1>
          <p className="text-slate-600 text-sm font-medium">IT Service Desk Clock-In System</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="text-center sm:text-right">
          <div className="text-2xl font-mono font-bold text-slate-900 tracking-tight">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-slate-600 font-medium">{formatDate(currentTime)}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="bg-white/50 border-slate-300 hover:bg-white/80 hover:text-slate-900 hover:border-slate-400 transition-all"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button> */}

          <Button
            variant="outline"
            onClick={onManualClockIn}
            className="bg-white/50 border-slate-300 hover:bg-white/80 hover:text-slate-900 hover:border-slate-400 transition-all"
          >
            <User className="w-4 h-4 mr-2" />
            Manual Clock In
          </Button>

          <Button
            variant="outline"
            onClick={onAdminLogin}
            className="bg-white/50 border-slate-300 hover:bg-white/80 hover:text-slate-900 hover:border-slate-400 transition-all"
          >
            <Settings className="w-4 h-4 mr-2" />
            Admin Login
          </Button>
        </div>
      </div>
    </div>
  )
} 