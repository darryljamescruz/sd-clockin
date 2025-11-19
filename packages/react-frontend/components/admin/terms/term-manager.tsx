"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, X, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import type { DayOffRange, Term } from "@/lib/api"

interface TermManagerProps {
  terms: Term[]
  onAddTerm: (term: Omit<Term, "id">) => void
  onEditTerm: (id: string, term: Omit<Term, "id">) => void
  onDeleteTerm: (id: string) => void
  onClose: () => void
  editingTerm?: Term | null
  isAddMode?: boolean
}

// Helper function to convert date string to local date string for date input
// This prevents timezone issues when displaying dates
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return ""
  // If it's already in YYYY-MM-DD format, use it directly (no timezone conversion needed)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }
  // If it's an ISO string with time, parse the date part directly to avoid timezone shifts
  // Extract YYYY-MM-DD from ISO string (e.g., "2025-11-10T00:00:00.000Z" -> "2025-11-10")
  const isoMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) {
    return isoMatch[1]
  }
  // Fallback: parse as local date components
  const date = new Date(dateString)
  // Use UTC methods to avoid timezone shifts, or parse the string directly
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function TermManager({
  terms,
  onAddTerm,
  onEditTerm,
  onDeleteTerm,
  onClose,
  editingTerm,
  isAddMode,
}: TermManagerProps) {
  const [formData, setFormData] = useState({
    name: editingTerm?.name || "",
    startDate: editingTerm?.startDate ? formatDateForInput(editingTerm.startDate) : "",
    endDate: editingTerm?.endDate ? formatDateForInput(editingTerm.endDate) : "",
    isActive: editingTerm?.isActive || false,
  })
  const [daysOff, setDaysOff] = useState<DayOffRange[]>(
    editingTerm?.daysOff?.map(range => ({
      startDate: formatDateForInput(range.startDate),
      endDate: formatDateForInput(range.endDate),
      notes: range.notes || '',
    })) || []
  )

  useEffect(() => {
    if (editingTerm) {
      setFormData({
        name: editingTerm.name,
        startDate: formatDateForInput(editingTerm.startDate),
        endDate: formatDateForInput(editingTerm.endDate),
        isActive: editingTerm.isActive,
      })
      setDaysOff(
        editingTerm.daysOff?.map(range => ({
          startDate: formatDateForInput(range.startDate),
          endDate: formatDateForInput(range.endDate),
          notes: range.notes || '',
        })) || []
      )
    }
  }, [editingTerm])

  const addDayOff = () => {
    const termStart = formData.startDate || ""
    const termEnd = formData.endDate || ""
    setDaysOff([...daysOff, { startDate: termStart, endDate: termEnd, notes: '' }])
  }

  const removeDayOff = (index: number) => {
    setDaysOff(daysOff.filter((_, i) => i !== index))
  }

  const updateDayOff = (index: number, field: "startDate" | "endDate" | "notes", value: string) => {
    const updated = [...daysOff]
    updated[index] = { ...updated[index], [field]: value }
    setDaysOff(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...formData,
      daysOff: daysOff.filter(range => range.startDate && range.endDate),
    }
    if (editingTerm) {
      onEditTerm(editingTerm.id, submitData)
    } else {
      onAddTerm(submitData)
    }
  }

  return (
    <div 
      className="absolute inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {editingTerm ? "Edit Term" : "Add New Term"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form content remains the same */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Term Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fall 2025"
                  required
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active Term</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Days Off Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Days Off / Weeks Off</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDayOff}
                  disabled={!formData.startDate || !formData.endDate}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Day Off
                </Button>
              </div>
              {daysOff.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No days off configured. Click "Add Day Off" to add holidays or breaks.
                </p>
              ) : (
                <div className="space-y-2">
                  {daysOff.map((range, index) => (
                    <div key={index} className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/30">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Start Date</Label>
                            <Input
                              type="date"
                              value={range.startDate}
                              onChange={(e) => updateDayOff(index, "startDate", e.target.value)}
                              min={formData.startDate}
                              max={formData.endDate}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">End Date</Label>
                            <Input
                              type="date"
                              value={range.endDate}
                              onChange={(e) => updateDayOff(index, "endDate", e.target.value)}
                              min={range.startDate || formData.startDate}
                              max={formData.endDate}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDayOff(index)}
                          className="shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-xs">Notes (e.g., Holiday name)</Label>
                        <Input
                          type="text"
                          value={range.notes || ''}
                          onChange={(e) => updateDayOff(index, "notes", e.target.value)}
                          placeholder="e.g., Thanksgiving Break, Winter Holiday..."
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingTerm ? "Update Term" : "Add Term"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
