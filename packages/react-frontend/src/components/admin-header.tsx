"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Clock, Settings, LogOut, User, Calendar, Users, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface AdminHeaderProps {
  currentTime: Date
  onLogout: () => void
  onManageTerms: () => void
  onManageStudents: () => void
}

export function AdminHeader({ currentTime, onLogout, onManageTerms, onManageStudents }: AdminHeaderProps) {
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
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8 p-6 bg-card backdrop-blur-sm border border-border rounded-xl shadow-lg">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-md">
          <Clock className="w-7 h-7 text-white" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm font-medium">IT Service Desk Attendance Management</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="text-center sm:text-right">
          <div className="text-2xl font-mono font-bold text-foreground tracking-tight">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-muted-foreground font-medium">{formatDate(currentTime)}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="bg-card border-border hover:bg-card/90 hover:text-foreground hover:border-border transition-all"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button> */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-card border-border hover:bg-card/90 hover:text-foreground hover:border-border transition-all">
                <Settings className="w-4 h-4 mr-2" />
                Admin Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile Settings
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
