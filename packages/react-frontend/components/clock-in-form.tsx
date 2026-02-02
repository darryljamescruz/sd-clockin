"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LogIn, User, Search } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { type Student } from "@/lib/api"

interface ClockInFormProps {
  isOpen: boolean
  onToggle: () => void
  onClockIn: (staffId: string, isManual: boolean) => void
  staffData: Student[]
  mode: "in" | "out"
  title: string
  buttonText: string
}

export function ClockInForm({ isOpen, onToggle, onClockIn, staffData, mode, title, buttonText }: ClockInFormProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<Student | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Disable card swipe when modal is open
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        e.stopPropagation()
      }
      document.addEventListener("keydown", handleKeyDown, true)
      document.addEventListener("keypress", handleKeyDown, true)

      return () => {
        document.removeEventListener("keydown", handleKeyDown, true)
        document.removeEventListener("keypress", handleKeyDown, true)
      }
    }
  }, [isOpen])

  const filteredStaff = useMemo(() => {
    let availableStaff = staffData

    // For clock out, only show currently present staff
    if (mode === "out") {
      availableStaff = staffData.filter((staff) => staff.currentStatus === "present")
    }

    return availableStaff.filter(
      (staff) =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [staffData, searchTerm, mode])

  const handleSubmit = () => {
    if (selectedStaff) {
      onClockIn(selectedStaff.id, true) // true indicates manual clock-in
      setSearchTerm("")
      setSelectedStaff(null)
      setShowDropdown(false)
    }
  }

  const handleClose = () => {
    setSearchTerm("")
    setSelectedStaff(null)
    setShowDropdown(false)
    onToggle()
  }

  const handleStaffSelect = (staff: Student) => {
    setSelectedStaff(staff)
    setSearchTerm(staff.name)
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && selectedStaff) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === "Escape") {
      handleClose()
    }
  }

  // Format role for display - convert "Assistant" to "Student Assistant"
  const formatRoleForDisplay = (role: string) => {
    if (role === "Assistant") {
      return "Student Assistant"
    }
    return role
  }

  return (
    <>
      {/* Always render the button */}
      <Button onClick={onToggle} variant="outline" className="w-full sm:w-full sm:min-w-[200px] h-11 shadow-sm hover:shadow-md transition-all duration-200 border-border/60 hover:border-border hover:bg-accent/50">
        <LogIn className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline font-medium">{buttonText}</span>
        <span className="sm:hidden font-medium">{mode === "in" ? "Clock In" : "Clock Out"}</span>
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            handleClose()
          }
        }}
      >
        <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden flex flex-col max-h-[85vh] shadow-2xl border-border/50">
          <DialogHeader className="border-b border-border/50 px-6 py-5 flex flex-row items-center gap-4 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary border border-primary/20 shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {mode === "in" ? "Select a staff member to clock in." : "Select a staff member to clock out."}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5 overflow-y-auto max-h-[60vh]">
            {/* Staff Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search staff by name or role..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowDropdown(true)
                    setSelectedStaff(null)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>

              {/* Inline dropdown (no absolute positioning) */}
              {showDropdown && searchTerm && (
                <div className="bg-popover border border-border/50 rounded-xl shadow-lg max-h-64 overflow-y-auto ring-1 ring-border/20">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((staff) => (
                      <button
                        key={staff.id}
                        className="w-full text-left px-4 py-3 hover:bg-accent/70 flex items-center justify-between border-b border-border/30 last:border-b-0 transition-colors duration-150"
                        onClick={() => handleStaffSelect(staff)}
                      >
                        <div>
                          <div className="font-medium text-foreground">{staff.name}</div>
                          <div className="text-sm text-muted-foreground">{formatRoleForDisplay(staff.role)}</div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-muted-foreground text-sm">No staff found</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Staff Display */}
            {selectedStaff && (
              <div className="bg-gradient-to-r from-green-50 to-green-50/50 dark:from-green-900/20 dark:to-green-900/10 border border-green-200/80 dark:border-green-800/50 rounded-xl p-4 ring-1 ring-green-200/50 dark:ring-green-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-900 dark:text-green-200">{selectedStaff.name}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">{formatRoleForDisplay(selectedStaff.role)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
              <strong className="text-foreground/80">Tip:</strong> Start typing a name or role to search. Select from the dropdown to proceed.
            </div>
          </div>

          <DialogFooter className="border-t border-border/50 px-6 py-5 bg-muted/10">
            <div className="flex w-full flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSubmit}
                className="flex-1 h-11 shadow-sm hover:shadow-md transition-all duration-200"
                disabled={!selectedStaff}
              >
                <span className="truncate font-medium">Clock {mode === "in" ? "In" : "Out"} {selectedStaff?.name || ""}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="sm:w-auto h-11 border-border/60 hover:border-border"
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
