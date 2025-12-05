"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Users, Plus, Edit, Trash2, Shield, UserCheck, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { StudentManager } from "./student-manager"

interface Staff {
  id: string
  name: string
  cardId: string
  role: string
  currentStatus: string
  clockEntries: any[]
}

interface StudentsPageProps {
  staffData: Staff[]
  onAddStudent: (student: Omit<Staff, "id" | "clockEntries" | "currentStatus">) => void
  onEditStudent: (id: string, student: Omit<Staff, "id" | "clockEntries" | "currentStatus">) => void
  onDeleteStudent: (id: string) => void
}

export function StudentsPage({ staffData, onAddStudent, onEditStudent, onDeleteStudent }: StudentsPageProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Staff | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Staff | null>(null)

  const handleEdit = (student: Staff) => {
    setEditingStudent(student)
  }

  const handleAddStudent = (studentData: Omit<Staff, "id" | "clockEntries" | "currentStatus">) => {
    onAddStudent(studentData)
    setShowAddModal(false)
  }

  const handleEditStudent = (id: string, studentData: Omit<Staff, "id" | "clockEntries" | "currentStatus">) => {
    onEditStudent(id, studentData)
    setEditingStudent(null)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingStudent(null)
  }

  const handleDeleteClick = (staff: Staff) => {
    setDeletingStudent(staff)
  }

  const handleDeleteConfirm = () => {
    if (deletingStudent) {
      onDeleteStudent(deletingStudent.id)
      setDeletingStudent(null)
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === "Student Lead") {
      return (
        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-100">
          <Shield className="w-3 h-3 mr-1" />
          Student Lead
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <UserCheck className="w-3 h-3 mr-1" />
          Student Assistant
        </Badge>
      )
    }
  }

  const studentLeads = staffData.filter((s) => s.role === "Student Lead").length
  const assistants = staffData.filter((s) => s.role === "Student Assistant").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Manage Student Assistants</h2>
          <p className="text-muted-foreground">Add, edit, and manage student assistant information</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="">
          <Plus className="w-4 h-4 mr-2" />
          Add New Student/Staff
        </Button>
      </div>

      {/* Staff Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{staffData.length}</div>
                <div className="text-muted-foreground">Total Staff</div>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{studentLeads}</div>
                <div className="text-muted-foreground">Student Leads</div>
              </div>
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{assistants}</div>
                <div className="text-muted-foreground">Student Assistants</div>
              </div>
              <UserCheck className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle>All Students & Staff ({staffData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Card ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffData.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell className="font-mono text-sm">{staff.cardId}</TableCell>
                  <TableCell>{getRoleBadge(staff.role)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(staff)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(staff)}
                        className="text-red-600 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {(showAddModal || editingStudent) && (
        <StudentManager
          staffData={staffData}
          onAddStudent={handleAddStudent}
          onEditStudent={handleEditStudent}
          onDeleteStudent={onDeleteStudent}
          onClose={handleCloseModal}
          editingStudent={editingStudent}
          isAddMode={showAddModal}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingStudent} onOpenChange={(open) => !open && setDeletingStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {deletingStudent && (
                <div className="space-y-4 mt-2">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <div className="font-medium text-foreground">
                          Are you sure you want to delete <strong>{deletingStudent.name}</strong>?
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>• All clock-in history will be permanently removed</div>
                          <div>• This action cannot be undone</div>
                          <div>• Card ID: {deletingStudent.cardId}</div>
                          <div>• Role: {deletingStudent.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {deletingStudent.clockEntries && deletingStudent.clockEntries.length > 0 && (
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">
                        <strong>Clock-in History:</strong> {deletingStudent.clockEntries.length} entries will be deleted
                      </div>
                    </div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
