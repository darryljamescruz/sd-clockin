"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Calendar, Plus, Edit, Trash2, ArrowLeft, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { TermManager } from "./term-manager"
import { formatDateString, parseDateString } from "@/lib/utils"

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
  const [deletingTerm, setDeletingTerm] = useState<Term | null>(null)

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

  const handleDeleteClick = (term: Term) => {
    setDeletingTerm(term)
  }

  const handleDeleteConfirm = () => {
    if (deletingTerm) {
      onDeleteTerm(deletingTerm.id)
      setDeletingTerm(null)
    }
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
            <h2 className="text-2xl font-bold">Manage Terms</h2>
            <p className="text-muted-foreground">Create and manage academic terms and work periods</p>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Term
        </Button>
      </div>

      {/* Terms Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{terms.length}</div>
                <div className="text-muted-foreground">Total Terms</div>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{terms.filter((t) => t.isActive).length}</div>
                <div className="text-muted-foreground">Active Terms</div>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 font-bold">●</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {terms.filter((t) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const termStart = parseDateString(t.startDate)
                    termStart.setHours(0, 0, 0, 0)
                    return termStart > today
                  }).length}
                </div>
                <div className="text-muted-foreground">Upcoming Terms</div>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">→</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terms Table */}
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
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
                const startDate = parseDateString(term.startDate)
                const endDate = parseDateString(term.endDate)
                const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <TableRow key={term.id}>
                    <TableCell className="font-medium">{term.name}</TableCell>
                    <TableCell>{formatDateString(term.startDate)}</TableCell>
                    <TableCell>{formatDateString(term.endDate)}</TableCell>
                    <TableCell>{duration} days</TableCell>
                    <TableCell>
                      {term.isActive ? (
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">Active</Badge>
                      ) : (
                        <Badge className="bg-secondary text-secondary-foreground">Inactive</Badge>
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
                          onClick={() => handleDeleteClick(term)}
                          className="text-destructive hover:text-destructive"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTerm} onOpenChange={(open) => !open && setDeletingTerm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {deletingTerm && (
                <div className="space-y-4 mt-2">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <div className="font-medium text-foreground">
                          Are you sure you want to delete <strong>{deletingTerm.name}</strong>?
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>• All schedules and check-ins for this term will be permanently removed</div>
                          <div>• This action cannot be undone</div>
                          <div>• Start Date: {formatDateString(deletingTerm.startDate)}</div>
                          <div>• End Date: {formatDateString(deletingTerm.endDate)}</div>
                          {deletingTerm.isActive && (
                            <div className="text-destructive font-medium">• This is currently an active term</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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
              Delete Term
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
