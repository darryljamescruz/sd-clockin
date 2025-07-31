"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Clock, Settings, LogOut, User, Calendar, Users, MapPin } from "lucide-react"

interface NavbarProps {
  currentTime: Date
  onLogout: () => void
  onManageTerms: () => void
  onManageStudents: () => void
  onManageLocations?: () => void
}

export function Navbar({ currentTime, onLogout, onManageTerms, onManageStudents, onManageLocations }: NavbarProps) {
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
    <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm mb-8">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">TimeSync Admin</h1>
              <p className="text-slate-600 text-sm">IT Service Desk Attendance Management</p>
            </div>
          </div>

          {/* Center - Current Time */}
          <div className="hidden md:block text-center">
            <div className="text-lg font-mono font-bold text-slate-900">{formatTime(currentTime)}</div>
            <div className="text-sm text-slate-600">{formatDate(currentTime)}</div>
          </div>

          {/* Right - Admin Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onManageTerms}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Terms
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onManageStudents}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Students
                </DropdownMenuItem>
                {onManageLocations && (
                  <DropdownMenuItem onClick={onManageLocations}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Manage Locations
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
