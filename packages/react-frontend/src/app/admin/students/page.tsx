// packages/react-frontend/src/app/admin/students/page.tsx
"use client"

import { StudentFormModal } from "@/components/student-form-modal"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination"
import { Users, Plus, UserCheck, Shield, Edit, Trash2, Home } from "lucide-react"
import { useStaffData, Staff } from "@/hooks/use-staff-data"
import { useState } from "react"
import Link from "next/link"

export default function StudentsPage() {
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Staff | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; student: Staff | null }>({
    isOpen: false,
    student: null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const studentsPerPage = 10
  
  const { 
    staffData, 
    addStudent, 
    editStudent, 
    deleteStudent, 
    getWeeklyStats 
  } = useStaffData()

  const stats = getWeeklyStats()

  // Pagination logic
  const totalPages = Math.ceil(staffData.length / studentsPerPage)
  const startIndex = (currentPage - 1) * studentsPerPage
  const endIndex = startIndex + studentsPerPage
  const paginatedStudents = staffData.slice(startIndex, endIndex)

  const handleAddStudent = () => {
    setEditingStudent(null)
    setShowStudentModal(true)
  }

  const handleEditStudent = (student: Staff) => {
    setEditingStudent(student)
    setShowStudentModal(true)
  }

  const handleDeleteClick = (student: Staff) => {
    setDeleteModal({ isOpen: true, student })
  }

  const handleDeleteConfirm = () => {
    if (deleteModal.student) {
      deleteStudent(deleteModal.student.id)
      setDeleteModal({ isOpen: false, student: null })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, student: null })
  }

  const handleFormSubmit = (studentData: Omit<Staff, "id" | "clockEntries" | "currentStatus" | "todayActual" | "todayExpected">) => {
    if (editingStudent) {
      editStudent(editingStudent.id, studentData)
    } else {
      addStudent(studentData)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Student Lead":
        return <Badge className="bg-blue-100 text-blue-800">Student Lead</Badge>
      case "Assistant":
        return <Badge className="bg-green-100 text-green-800">Student Assistant</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Present":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>
      case "Absent":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>
      case "Late":
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Navigation */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin" className="text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium">Student Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
          <p className="text-muted-foreground">Manage student assistants and student leads</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="bg-card backdrop-blur-sm border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="w-8 h-8 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalStaff}</div>
          </CardContent>
        </Card>

        <Card className="bg-card backdrop-blur-sm border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present Today</CardTitle>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.presentStaff}</div>
          </CardContent>
        </Card>

        <Card className="bg-card backdrop-blur-sm border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Student Leads</CardTitle>
            <Shield className="w-8 h-8 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.studentLeads}</div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="bg-card backdrop-blur-sm border-border shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Current Students & Staff ({staffData.length})</CardTitle>
            <Button onClick={handleAddStudent} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Student/Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, staffData.length)} of {staffData.length} students
              </span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ISO</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Current Week Schedule</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {paginatedStudents.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell className="font-mono text-sm">{staff.iso}</TableCell>
                  <TableCell>{getRoleBadge(staff.role)}</TableCell>
                  <TableCell>
                    <div className="space-y-1 max-w-xs">
                      {Object.entries(staff.weeklySchedule || {}).map(
                        ([day, blocks]) =>
                          blocks && blocks.length > 0 && (
                            <div key={day} className="text-xs">
                              <span className="font-medium capitalize">{day.slice(0, 3)}:</span>
                              <span className="ml-1">{blocks.join(", ")}</span>
                            </div>
                          ),
                      )}
                      {Object.values(staff.weeklySchedule || {}).every((blocks) => !blocks || blocks.length === 0) && (
                        <span className="text-muted-foreground italic text-xs">No schedule set</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(staff.currentStatus)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditStudent(staff)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(staff)}
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
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(prev => Math.max(1, prev - 1))
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(page)
                        }}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(prev => Math.min(totalPages, prev + 1))
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
        </CardContent>
      </Card>

      {/* Student Form Modal */}
      <StudentFormModal
        isOpen={showStudentModal}
        editingStudent={editingStudent}
        staffData={staffData}
        onSubmit={handleFormSubmit}
        onClose={() => setShowStudentModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Confirm Student Deletion"
        itemName={deleteModal.student?.name || ""}
        description="All clock-in history will be permanently removed"
        details={[
          `ISO: ${deleteModal.student?.iso || ""}`,
          `Role: ${deleteModal.student?.role || ""}`,
          `Clock-in History: ${deleteModal.student?.clockEntries?.length || 0} entries will be deleted`
        ]}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}