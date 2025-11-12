"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Clock, Settings, LogOut, User, Calendar, Users } from "lucide-react"

interface AdminHeaderProps {
  currentTime: Date
  onLogout: () => void
  onManageTerms: () => void
  onManageStudents: () => void
}

export function AdminHeader({ currentTime, onLogout, onManageTerms, onManageStudents }: AdminHeaderProps) {
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
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Clock className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">IT Service Desk Attendance Management</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-lg font-mono font-bold text-foreground">{formatTime(currentTime)}</div>
          <div className="text-sm text-muted-foreground">{formatDate(currentTime)}</div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Admin Settings
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageTerms}>
              <Calendar className="w-4 h-4 mr-2" />
              Manage Terms
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageStudents}>
              <Users className="w-4 h-4 mr-2" />
              Manage Students
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
  )
}
