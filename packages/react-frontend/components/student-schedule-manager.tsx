"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Calendar, Save, Loader2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { api, type Student, type Term, type Schedule } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface StudentScheduleManagerProps {
  student: Student
  terms: Term[]
  onClose: () => void
  onSave?: () => void
}

export function StudentScheduleManager({ student, terms, onClose, onSave }: StudentScheduleManagerProps) {
  const [selectedTermId, setSelectedTermId] = useState<string>("")
  const [availability, setAvailability] = useState<{
    monday: string[]
    tuesday: string[]
    wednesday: string[]
    thursday: string[]
    friday: string[]
  }>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Set default term to active term or first term
  useEffect(() => {
    const activeTerm = terms.find((t) => t.isActive)
    if (activeTerm) {
      setSelectedTermId(activeTerm.id)
    } else if (terms.length > 0) {
      setSelectedTermId(terms[0].id)
    }
  }, [terms])

  // Fetch schedule when term changes
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedTermId || !student.id) return

      try {
        setIsLoading(true)
        setError("")
        const schedule = await api.schedules.get(student.id, selectedTermId)
        if (schedule.availability) {
          setAvailability(schedule.availability)
        } else {
          // Reset to empty if no schedule exists
          setAvailability({
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
          })
        }
      } catch (err) {
        console.error("Error fetching schedule:", err)
        // If schedule doesn't exist, that's okay - we'll create a new one
        setAvailability({
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchedule()
  }, [selectedTermId, student.id])

  const parseScheduleInput = (input: string): string[] => {
    // Parse formats like "8-11, 12-5" or "9:00 AM - 5:00 PM"
    return input
      .split(",")
      .map((block) => block.trim())
      .filter((block) => block.length > 0)
  }

  const addScheduleBlock = (day: keyof typeof availability, timeBlock: string) => {
    if (timeBlock.trim()) {
      setAvailability((prev) => ({
        ...prev,
        [day]: [...prev[day], timeBlock.trim()],
      }))
    }
  }

  const removeScheduleBlock = (day: keyof typeof availability, index: number) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTermId) {
      setError("Please select a term")
      return
    }

    try {
      setIsSaving(true)
      setError("")
      setSuccessMessage("")

      await api.schedules.createOrUpdate({
        studentId: student.id,
        termId: selectedTermId,
        availability,
      })

      setSuccessMessage("Schedule saved successfully!")
      
      // Call onSave callback if provided
      if (onSave) {
        onSave()
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    } catch (err) {
      console.error("Error saving schedule:", err)
      setError(err instanceof Error ? err.message : "Failed to save schedule. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const selectedTermName = terms.find((t) => t.id === selectedTermId)?.name || ""
  const days: (keyof typeof availability)[] = ["monday", "tuesday", "wednesday", "thursday", "friday"]

  return (
    <div 
      className="absolute inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-3xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <div>
                <div>Manage Schedule: {student.name}</div>
                <div className="text-sm font-normal text-slate-600 mt-1">
                  Set availability for specific term
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Term Selection */}
            <div>
              <Label htmlFor="term">Select Term</Label>
              <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} {term.isActive && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
              </Alert>
            )}

            {/* Schedule Input */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-600">Loading schedule...</span>
              </div>
            ) : (
              <div>
                <Label className="text-base font-semibold">Weekly Availability</Label>
                <p className="text-sm text-slate-600 mb-4">
                  Enter time blocks for each day. Examples: "8-11, 12-5" or "9:00 AM - 5:00 PM"
                </p>

                <div className="space-y-4 max-h-[400px] overflow-y-auto border rounded-lg p-4">
                  {days.map((day) => (
                    <div key={day} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <Label className="capitalize font-medium min-w-[100px]">{day}</Label>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            placeholder="e.g., 8-11, 12-5"
                            className="text-sm"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                const input = e.currentTarget
                                const timeBlocks = parseScheduleInput(input.value)
                                timeBlocks.forEach((block) => addScheduleBlock(day, block))
                                input.value = ""
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement
                              if (input) {
                                const timeBlocks = parseScheduleInput(input.value)
                                timeBlocks.forEach((block) => addScheduleBlock(day, block))
                                input.value = ""
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 min-h-[2rem] ml-[100px]">
                        {availability[day].length > 0 ? (
                          availability[day].map((block, index) => (
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

                <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded">
                  <strong>Tips:</strong> Enter multiple time blocks separated by commas (e.g., "8-11, 12-5") •
                  Use 24-hour format (8-17) or 12-hour format (8 AM - 5 PM) • Click on time blocks to remove them •
                  Press Enter or click Add to save time blocks
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800"
                disabled={isSaving || isLoading}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Schedule
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

