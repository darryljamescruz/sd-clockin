"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useState, useEffect } from "react"

interface Staff {
  id: number
  name: string
  iso: string
  role: string
  currentStatus: string
  todayActual: string | null
  todayExpected: string
  weeklySchedule: {
    monday?: string[]
    tuesday?: string[]
    wednesday?: string[]
    thursday?: string[]
    friday?: string[]
  }
  clockEntries: Array<{
    timestamp: string
    type: "in" | "out"
    isManual?: boolean
  }>
}

interface StudentFormModalProps {
  isOpen: boolean
  editingStudent: Staff | null
  staffData: Staff[]
  onSubmit: (student: Omit<Staff, "id" | "clockEntries" | "currentStatus" | "todayActual" | "todayExpected">) => void
  onClose: () => void
}

export function StudentFormModal({ isOpen, editingStudent, staffData, onSubmit, onClose }: StudentFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    iso: "",
    role: "Assistant",
    weeklySchedule: {
      monday: [] as string[],
      tuesday: [] as string[],
      wednesday: [] as string[],
      thursday: [] as string[],
      friday: [] as string[],
    },
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when editing student changes
  useEffect(() => {
    if (editingStudent) {
      setFormData({
        name: editingStudent.name,
        iso: editingStudent.iso,
        role: editingStudent.role,
        weeklySchedule: {
          monday: editingStudent.weeklySchedule.monday || [],
          tuesday: editingStudent.weeklySchedule.tuesday || [],
          wednesday: editingStudent.weeklySchedule.wednesday || [],
          thursday: editingStudent.weeklySchedule.thursday || [],
          friday: editingStudent.weeklySchedule.friday || [],
        },
      })
    } else {
      setFormData({
        name: "",
        iso: "",
        role: "Assistant",
        weeklySchedule: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        },
      })
    }
    setErrors({})
  }, [editingStudent])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.iso.trim()) {
      newErrors.iso = "ISO is required"
    } else {
      // Check for duplicate ISO (excluding current editing item)
      const existingIso = staffData.find(
        (staff) => staff.iso.toUpperCase() === formData.iso.toUpperCase() && staff.id !== editingStudent?.id,
      )
      if (existingIso) {
        newErrors.iso = "ISO already exists"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addScheduleBlock = (day: string, timeBlock: string) => {
    if (timeBlock.trim()) {
      setFormData((prev) => ({
        ...prev,
        weeklySchedule: {
          ...prev.weeklySchedule,
          [day]: [...(prev.weeklySchedule as any)[day], timeBlock.trim()],
        },
      }))
    }
  }

  const removeScheduleBlock = (day: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: (prev.weeklySchedule as any)[day].filter((_: any, i: number) => i !== index),
      },
    }))
  }

  const parseScheduleInput = (input: string) => {
    // Parse formats like "8-11, 12-5" or "9:00 AM - 5:00 PM"
    return input
      .split(",")
      .map((block) => block.trim())
      .filter((block) => block.length > 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    onSubmit(formData)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{editingStudent ? "Edit Student/Staff" : "Add New Student/Staff"}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="iso">ISO</Label>
                <Input
                  id="iso"
                  value={formData.iso}
                  onChange={(e) => setFormData({ ...formData, iso: e.target.value.toUpperCase() })}
                  placeholder="e.g., CARD007"
                  className={errors.iso ? "border-red-500" : ""}
                />
                {errors.iso && <p className="text-sm text-red-600 mt-1">{errors.iso}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Assistant">Student Assistant</SelectItem>
                  <SelectItem value="Student Lead">Student Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Weekly Schedule Section */}
            <div>
              <Label className="text-base font-semibold">Weekly Schedule</Label>
              <p className="text-sm text-slate-600 mb-4">
                Enter time blocks for each day. Examples: "8-11, 12-5" or "9:00 AM - 5:00 PM"
              </p>

              <div className="space-y-4 max-h-64 overflow-y-auto border rounded-lg p-4">
                {Object.entries(formData.weeklySchedule).map(([day, blocks]) => (
                  <div key={day} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="capitalize font-medium">{day}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="e.g., 8-11, 12-5"
                          className="w-48 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              const target = e.target as HTMLInputElement
                              const input = target.value
                              const timeBlocks = parseScheduleInput(input)
                              timeBlocks.forEach((block) => addScheduleBlock(day, block))
                              target.value = ""
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            const target = e.target as HTMLButtonElement
                            const input = target.previousElementSibling as HTMLInputElement
                            const timeBlocks = parseScheduleInput(input.value)
                            timeBlocks.forEach((block) => addScheduleBlock(day, block))
                            input.value = ""
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[2rem]">
                      {blocks.length > 0 ? (
                        blocks.map((block, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                            onClick={() => removeScheduleBlock(day, index)}
                          >
                            {block} ×
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400 italic">No schedule set</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                <strong>Tips:</strong> • Enter multiple time blocks separated by commas (e.g., "8-11, 12-5") •
                Use 24-hour format (8-17) or 12-hour format (8 AM - 5 PM) • Click on time blocks to remove
                them • Press Enter or click Add to save time blocks
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                {editingStudent ? "Update" : "Add"} Student/Staff
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