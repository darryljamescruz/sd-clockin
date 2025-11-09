"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LogIn, User, Search, AlertTriangle, X } from "lucide-react"
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

  return (
    <>
      {/* Always render the button */}
      <Button onClick={onToggle} variant="outline">
        <LogIn className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>

      {/* Render modal when open */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 shadow-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                {title}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning Banner */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Manual Entry:</strong> This clock-{mode} will be flagged as manually entered for audit
                  purposes.
                </div>
              </div>

              {/* Staff Search */}
              <div className="relative">
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
                    autoFocus
                  />
                </div>

                {/* Dropdown */}
                {showDropdown && searchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredStaff.length > 0 ? (
                      filteredStaff.map((staff) => (
                        <button
                          key={staff.id}
                          className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between border-b last:border-b-0"
                          onClick={() => handleStaffSelect(staff)}
                        >
                          <div>
                            <div className="font-medium text-foreground">{staff.name}</div>
                            <div className="text-sm text-muted-foreground">{staff.role}</div>
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
                      <div className="text-sm text-green-700 dark:text-green-300">{selectedStaff.role}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={!selectedStaff}
                >
                  Clock {mode === "in" ? "In" : "Out"} {selectedStaff?.name || ""}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <strong>Tip:</strong> Start typing a name or role to search. Select from the dropdown to proceed.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
