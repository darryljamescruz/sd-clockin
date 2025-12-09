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
      <Button onClick={onToggle} variant="outline" className="w-full sm:w-full sm:min-w-[180px]">
        <LogIn className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">{buttonText}</span>
        <span className="sm:hidden">{mode === "in" ? "Clock In" : "Clock Out"}</span>
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleClose()
          }
        }}
      >
        <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="border-b px-6 py-4 flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <DialogDescription className="text-sm">
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
                <div className="bg-popover border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((staff) => (
                      <button
                        key={staff.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between border-b last:border-b-0"
                        onClick={() => handleStaffSelect(staff)}
                      >
                        <div>
                          <div className="font-medium text-foreground">{staff.name}</div>
                          <div className="text-sm text-muted-foreground">{formatRoleForDisplay(staff.role)}</div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-muted-foreground text-sm">No staff found</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Staff Display */}
            {selectedStaff && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="font-medium text-green-900 dark:text-green-200">{selectedStaff.name}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">{formatRoleForDisplay(selectedStaff.role)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded border border-muted/40">
              <strong>Tip:</strong> Start typing a name or role to search. Select from the dropdown to proceed.
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <div className="flex w-full flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={!selectedStaff}
              >
                <span className="truncate">Clock {mode === "in" ? "In" : "Out"} {selectedStaff?.name || ""}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="sm:w-auto"
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
