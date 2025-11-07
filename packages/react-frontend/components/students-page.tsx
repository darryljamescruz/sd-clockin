"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Edit, Trash2, ArrowLeft, Shield, UserCheck } from "lucide-react"
import { useState } from "react"
import { StudentManager } from "./student-manager"

interface Staff {
  id: number
  name: string
  cardId: string
  role: string
  currentStatus: string
  weeklySchedule: {
    monday: string[]
    tuesday: string[]
    wednesday: string[]
    thursday: string[]
    friday: string[]
    saturday: string[]
    sunday: string[]
  }
  clockEntries: any[]
}

interface StudentsPageProps {
  staffData: Staff[]
  onAddStudent: (student: Omit<Staff, "id" | "clockEntries" | "currentStatus">) => void
  onEditStudent: (id: number, student: Omit<Staff, "id" | "clockEntries" | "currentStatus">) => void
  onDeleteStudent: (id: number) => void
  onBack: () => void
}

export function StudentsPage({ staffData, onAddStudent, onEditStudent, onDeleteStudent, onBack }: StudentsPageProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Staff | null>(null)

  const handleEdit = (student: Staff) => {
    setEditingStudent(student)
  }

  const handleAddStudent = (studentData: Omit<Staff, "id" | "clockEntries" | "currentStatus">) => {
    onAddStudent(studentData)
    setShowAddModal(false)
  }

  const handleEditStudent = (id: number, studentData: Omit<Staff, "id" | "clockEntries" | "currentStatus">) => {
    onEditStudent(id, studentData)
    setEditingStudent(null)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingStudent(null)
  }

  const getRoleBadge = (role: string) => {
    if (role === "Student Lead") {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Shield className="w-3 h-3 mr-1" />
          Student Lead
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">
          <UserCheck className="w-3 h-3 mr-1" />
          Assistant
        </Badge>
      )
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
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

  const studentLeads = staffData.filter((s) => s.role === "Student Lead").length
  const assistants = staffData.filter((s) => s.role === "Assistant").length
  const presentToday = staffData.filter((s) => s.currentStatus === "present").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Manage Students & Staff</h2>
            <p className="text-slate-600">Add, edit, and manage student assistants and leads</p>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-2" />
          Add New Student/Staff
        </Button>
      </div>

      {/* Staff Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{staffData.length}</div>
                <div className="text-slate-600">Total Staff</div>
              </div>
              <Users className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-700">{studentLeads}</div>
                <div className="text-slate-600">Student Leads</div>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-700">{assistants}</div>
                <div className="text-slate-600">Assistants</div>
              </div>
              <UserCheck className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-700">{presentToday}</div>
                <div className="text-slate-600">Present Today</div>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">●</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
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
                <TableHead>Current Status</TableHead>
                <TableHead>Total Clock-ins</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffData.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell className="font-mono text-sm">{staff.cardId}</TableCell>
                  <TableCell>{getRoleBadge(staff.role)}</TableCell>
                  <TableCell>{getStatusBadge(staff.currentStatus)}</TableCell>
                  <TableCell>{staff.clockEntries.length}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(staff)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteStudent(staff.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  )
}
