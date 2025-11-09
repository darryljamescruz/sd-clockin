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
    <nav className="bg-background/80 backdrop-blur-sm border-b shadow-sm mb-8">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center mb-3">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Clock className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">TimeSync Admin</h1>
              <p className="text-muted-foreground text-base">IT Service Desk Attendance Management</p>
            </div>
          </div>

          {/* Current Time Display */}
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-foreground">{formatTime(currentTime)}</div>
            <div className="text-sm text-muted-foreground">{formatDate(currentTime)}</div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
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
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
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
          >
            <Calendar className="w-4 h-4 mr-2" />
            Manage Terms
          </Button>

          <Button
            onClick={onManageStudents}
            variant="ghost"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Students
          </Button>

          {onManageLocations && (
            <Button
              onClick={onManageLocations}
              variant="ghost"
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
