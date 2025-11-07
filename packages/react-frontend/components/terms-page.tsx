"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Edit, Trash2, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { TermManager } from "./term-manager"

interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface TermsPageProps {
  terms: Term[]
  onAddTerm: (term: Omit<Term, "id">) => void
  onEditTerm: (id: string, term: Omit<Term, "id">) => void
  onDeleteTerm: (id: string) => void
  onBack: () => void
}

export function TermsPage({ terms, onAddTerm, onEditTerm, onDeleteTerm, onBack }: TermsPageProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTerm, setEditingTerm] = useState<Term | null>(null)

  const handleEdit = (term: Term) => {
    setEditingTerm(term)
  }

  const handleAddTerm = (termData: Omit<Term, "id">) => {
    onAddTerm(termData)
    setShowAddModal(false)
  }

  const handleEditTerm = (id: string, termData: Omit<Term, "id">) => {
    onEditTerm(id, termData)
    setEditingTerm(null)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingTerm(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Manage Terms</h2>
            <p className="text-slate-600">Create and manage academic terms and work periods</p>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-2" />
          Add New Term
        </Button>
      </div>

      {/* Terms Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{terms.length}</div>
                <div className="text-slate-600">Total Terms</div>
              </div>
              <Calendar className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-700">{terms.filter((t) => t.isActive).length}</div>
                <div className="text-slate-600">Active Terms</div>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">●</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {terms.filter((t) => new Date(t.startDate) > new Date()).length}
                </div>
                <div className="text-slate-600">Upcoming Terms</div>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">→</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terms Table */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle>All Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => {
                const startDate = new Date(term.startDate)
                const endDate = new Date(term.endDate)
                const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <TableRow key={term.id}>
                    <TableCell className="font-medium">{term.name}</TableCell>
                    <TableCell>{startDate.toLocaleDateString()}</TableCell>
                    <TableCell>{endDate.toLocaleDateString()}</TableCell>
                    <TableCell>{duration} days</TableCell>
                    <TableCell>
                      {term.isActive ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(term)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteTerm(term.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* Add/Edit Modal */}
      {(showAddModal || editingTerm) && (
        <TermManager
          terms={terms}
          onAddTerm={handleAddTerm}
          onEditTerm={handleEditTerm}
          onDeleteTerm={onDeleteTerm}
          onClose={handleCloseModal}
          editingTerm={editingTerm}
          isAddMode={showAddModal}
        />
      )}
    </div>
  )
}
