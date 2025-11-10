"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Edit, ArrowLeft, Users, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { StudentScheduleManager } from "./student-schedule-manager"
import { CSVImport } from "./csv-import"
import type { Term, Student, Schedule } from "@/lib/api"
import { api } from "@/lib/api"

interface SchedulesPageProps {
  students: Student[]
  terms: Term[]
  onBack: () => void
}

export function SchedulesPage({ students, terms, onBack }: SchedulesPageProps) {
  const [selectedTermId, setSelectedTermId] = useState<string>("")
  const [schedules, setSchedules] = useState<Record<string, Schedule>>({})
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Set default term to active term or first term
  useEffect(() => {
    const activeTerm = terms.find((t) => t.isActive)
    if (activeTerm) {
      setSelectedTermId(activeTerm.id)
    } else if (terms.length > 0) {
      setSelectedTermId(terms[0].id)
    }
  }, [terms])

  // Fetch all schedules for the selected term
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!selectedTermId) return

      setIsLoading(true)
      const schedulesData: Record<string, Schedule> = {}

      // Fetch schedules for all students in parallel
      await Promise.all(
        students.map(async (student) => {
          try {
            const schedule = await api.schedules.get(student.id, selectedTermId)
            if (schedule) {
              schedulesData[student.id] = schedule
            }
          } catch (error) {
            // Student might not have a schedule for this term, that's okay
            console.log(`No schedule found for ${student.name} in selected term`)
          }
        })
      )

      setSchedules(schedulesData)
      setIsLoading(false)
    }

    fetchSchedules()
  }, [selectedTermId, students])

  const handleEditSchedule = (student: Student) => {
    setEditingStudent(student)
  }

  const handleCloseModal = () => {
    setEditingStudent(null)
  }

  const handleSaveSchedule = async () => {
    // Refetch schedules after saving
    if (!selectedTermId) return

    setIsLoading(true)
    const schedulesData: Record<string, Schedule> = {}

    await Promise.all(
      students.map(async (student) => {
        try {
          const schedule = await api.schedules.get(student.id, selectedTermId)
          if (schedule) {
            schedulesData[student.id] = schedule
          }
        } catch (error) {
          console.log(`No schedule found for ${student.name} in selected term`)
        }
      })
    )

    setSchedules(schedulesData)
    setIsLoading(false)
  }

  const selectedTerm = terms.find((t) => t.id === selectedTermId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Manage Schedules</h2>
            <p className="text-muted-foreground">Set student availability for each term</p>
          </div>
        </div>
      </div>

      {/* Term Selector */}
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <Label className="text-sm font-medium text-foreground mb-2 block">Select Term</Label>
              <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                <SelectTrigger className="w-full max-w-md">
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
            {selectedTerm && (
              <div className="text-sm text-muted-foreground">
                {new Date(selectedTerm.startDate).toLocaleDateString()} -{" "}
                {new Date(selectedTerm.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">{students.length}</div>
              <div className="text-muted-foreground">Total Students</div>
            </div>
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* CSV Import */}
      {selectedTermId && (
        <CSVImport termId={selectedTermId} onImportComplete={handleSaveSchedule} />
      )}

      {/* Students Table */}
      {!selectedTermId ? (
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Select a Term</h3>
            <p className="text-muted-foreground">Choose a term to view and manage student schedules</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading schedules...</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>
              Student Schedules for {selectedTerm?.name} ({students.length} students)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="min-w-[200px]">Weekly Availability</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const schedule = schedules[student.id]

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        {student.role === "Student Lead" ? (
                          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-100">Student Lead</Badge>
                        ) : (
                          <Badge className="bg-secondary text-secondary-foreground hover:bg-slate-100">Assistant</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {schedule?.availability ? (
                          <div className="space-y-1">
                            {Object.entries(schedule.availability).map(([day, blocks]) => 
                              blocks.length > 0 ? (
                                <div key={day}>
                                  <span className="font-medium capitalize">{day}:</span> {blocks.join(", ")}
                                </div>
                              ) : null
                            )}
                            {Object.values(schedule.availability).every(blocks => blocks.length === 0) && (
                              <span className="text-muted-foreground italic">No schedule set</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">No schedule set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSchedule(student)}
                            className=""
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Schedule Manager Modal */}
      {editingStudent && (
        <StudentScheduleManager
          student={editingStudent}
          terms={terms}
          onClose={handleCloseModal}
          onSave={handleSaveSchedule}
        />
      )}
    </div>
  )
}

function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  )
}

