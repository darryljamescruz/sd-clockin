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
        <div className="flex justify-between items-center mb-3">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">TimeSync Admin</h1>
              <p className="text-slate-600 text-base">IT Service Desk Attendance Management</p>
            </div>
          </div>

          {/* Current Time Display */}
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-slate-900">{formatTime(currentTime)}</div>
            <div className="text-sm text-slate-600">{formatDate(currentTime)}</div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50">
                  <User className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onManageTerms}
            variant="ghost"
            className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-4 py-2"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Manage Terms
          </Button>

          <Button
            onClick={onManageStudents}
            variant="ghost"
            className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-4 py-2"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Students
          </Button>

          {onManageLocations && (
            <Button
              onClick={onManageLocations}
              variant="ghost"
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-4 py-2"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Manage Locations
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
