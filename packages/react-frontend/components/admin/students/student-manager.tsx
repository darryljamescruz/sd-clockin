"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Users, Trash2, Shield, UserCheck, X, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"

interface Staff {
  id: string
  name: string
  cardId: string
  role: string
  currentStatus: string
  clockEntries: any[]
}

interface StudentManagerProps {
  staffData: Staff[]
  onAddStudent: (student: Omit<Staff, "id" | "clockEntries" | "currentStatus">) => void
  onEditStudent: (id: string, student: Omit<Staff, "id" | "clockEntries" | "currentStatus">) => void
  onDeleteStudent: (id: string) => void
  onClose: () => void
  editingStudent?: Staff | null
  isAddMode?: boolean
}


export function StudentManager({
  staffData,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onClose,
  editingStudent,
  isAddMode,
}: StudentManagerProps) {
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; student: Staff | null }>({
    isOpen: false,
    student: null,
  })
  const [formData, setFormData] = useState({
    name: editingStudent?.name || "",
    cardId: editingStudent?.cardId || "",
    role: editingStudent?.role || "Student Assistant",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editingStudent) {
      setFormData({
        name: editingStudent.name,
        cardId: editingStudent.cardId,
        role: editingStudent.role,
      })
    }
  }, [editingStudent])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.cardId.trim()) {
      newErrors.cardId = "Card ID is required"
    } else {
      // Check for duplicate card ID (excluding current editing item)
      const existingCard = staffData.find(
        (staff) => staff.cardId.toUpperCase() === formData.cardId.toUpperCase() && staff.id !== editingStudent?.id,
      )
      if (existingCard) {
        newErrors.cardId = "Card ID already exists"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const studentData = {
      name: formData.name.trim(),
      cardId: formData.cardId.toUpperCase().trim(),
      role: formData.role,
    }

    if (editingStudent) {
      onEditStudent(editingStudent.id, studentData)
    } else {
      onAddStudent(studentData)
    }
  }

  const handleDeleteClick = (staff: Staff) => {
    setDeleteModal({ isOpen: true, student: staff })
  }

  const handleDeleteConfirm = () => {
    if (deleteModal.student) {
      onDeleteStudent(deleteModal.student.id)
      setDeleteModal({ isOpen: false, student: null })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, student: null })
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
      present: { color: "bg-green-100 text-green-800", label: "Present", icon: "●" },
      expected: { color: "bg-yellow-100 text-yellow-800", label: "Expected", icon: "○" },
      absent: { color: "bg-red-100 text-red-800", label: "Absent", icon: "×" },
    }

    const config = statusConfig[status] || statusConfig["expected"]
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    )
  }

  return (
      <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <Card 
          className="w-full max-w-4xl max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {editingStudent ? "Edit Student/Staff" : "Add New Student/Staff"}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Form content remains the same but simplified for modal use */}
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
                  <Label htmlFor="cardId">Card ID</Label>
                  <Input
                    id="cardId"
                    value={formData.cardId}
                    onChange={(e) => setFormData({ ...formData, cardId: e.target.value.toUpperCase() })}
                    placeholder="e.g., CARD007"
                    className={errors.cardId ? "border-red-500" : ""}
                  />
                  {errors.cardId && <p className="text-sm text-red-600 mt-1">{errors.cardId}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value: string) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student Assistant">Student Assistant</SelectItem>
                    <SelectItem value="Student Lead">Student Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="">
                  {editingStudent ? "Update" : "Add"} Student/Staff
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteModal.isOpen} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {deleteModal.student && (
                <div className="space-y-4 mt-2">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <div className="font-medium text-foreground">
                          Are you sure you want to delete <strong>{deleteModal.student.name}</strong>?
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>• All clock-in history will be permanently removed</div>
                          <div>• This action cannot be undone</div>
                          <div>• Card ID: {deleteModal.student.cardId}</div>
                          <div>• Role: {deleteModal.student.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {deleteModal.student.clockEntries && deleteModal.student.clockEntries.length > 0 && (
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">
                        <strong>Clock-in History:</strong> {deleteModal.student.clockEntries.length} entries will be deleted
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
