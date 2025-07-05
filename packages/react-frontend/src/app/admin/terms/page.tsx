"use client"

import { TermFormModal } from "@/components/term-form-modal"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Calendar, Plus, Clock, CheckCircle, Edit, Trash2, Home } from "lucide-react"
import { useTermData } from "@/hooks/use-term-data"
import { useState } from "react"
import Link from "next/link"

interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export default function TermsPage() {
  const [showTermModal, setShowTermModal] = useState(false)
  const [editingTerm, setEditingTerm] = useState<Term | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; term: Term | null }>({
    isOpen: false,
    term: null,
  })
  
  const {
    terms,
    selectedTerm,
    setSelectedTerm,
    getCurrentTerm,
    addTerm,
    editTerm,
    deleteTerm,
  } = useTermData()

  const currentTerm = getCurrentTerm()
  const activeTerms = terms.filter(term => term.isActive)
  const upcomingTerms = terms.filter(term => {
    const startDate = new Date(term.startDate)
    const today = new Date()
    return startDate > today && !term.isActive
  })

  const handleAddTerm = () => {
    setEditingTerm(null)
    setShowTermModal(true)
  }

  const handleEditTerm = (term: Term) => {
    setEditingTerm(term)
    setShowTermModal(true)
  }

  const handleDeleteClick = (term: Term) => {
    setDeleteModal({ isOpen: true, term })
  }

  const handleDeleteConfirm = () => {
    if (deleteModal.term) {
      deleteTerm(deleteModal.term.id)
      setDeleteModal({ isOpen: false, term: null })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, term: null })
  }

  const handleFormSubmit = (termData: Omit<Term, "id">) => {
    if (editingTerm) {
      editTerm(editingTerm.id, termData)
    } else {
      addTerm(termData)
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
                <BreadcrumbLink href="/admin" className="text-slate-600 hover:text-slate-900">
                  <Home className="w-4 h-4 mr-1" />
                  Admin Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-slate-900 font-medium">Term Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-3xl font-bold text-slate-900">Term Management</h1>
          <p className="text-slate-600">Manage academic terms and schedules</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Total Terms</CardTitle>
            <Calendar className="w-8 h-8 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{terms.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Active Terms</CardTitle>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{activeTerms.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Upcoming Terms</CardTitle>
            <Clock className="w-8 h-8 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{upcomingTerms.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Term */}
      {currentTerm && (
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">Current Term</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-slate-900">{currentTerm.name}</div>
              <div className="text-sm text-slate-600">
                {new Date(currentTerm.startDate).toLocaleDateString()} - {new Date(currentTerm.endDate).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terms Table */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Terms ({terms.length})</CardTitle>
            <Button onClick={handleAddTerm} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add New Term
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">{term.name}</TableCell>
                  <TableCell>{new Date(term.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(term.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {term.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditTerm(term)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(term)}
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
        </CardContent>
      </Card>

      {/* Term Form Modal */}
      <TermFormModal
        isOpen={showTermModal}
        editingTerm={editingTerm}
        onSubmit={handleFormSubmit}
        onClose={() => setShowTermModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Confirm Term Deletion"
        itemName={deleteModal.term?.name || ""}
        description="All associated data will be permanently removed"
        details={[
          `Start Date: ${deleteModal.term?.startDate ? new Date(deleteModal.term.startDate).toLocaleDateString() : ""}`,
          `End Date: ${deleteModal.term?.endDate ? new Date(deleteModal.term.endDate).toLocaleDateString() : ""}`,
          `Status: ${deleteModal.term?.isActive ? "Active" : "Inactive"}`
        ]}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}
