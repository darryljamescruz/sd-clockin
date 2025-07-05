"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Edit, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"

interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface TermManagerProps {
  terms: Term[]
  onAddTerm: (term: Omit<Term, "id">) => void
  onEditTerm: (id: string, term: Omit<Term, "id">) => void
  onDeleteTerm: (id: string) => void
  onClose: () => void
}

export function TermManager({ terms, onAddTerm, onEditTerm, onDeleteTerm, onClose }: TermManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isActive: false,
  })

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      onEditTerm(editingId, formData)
      setEditingId(null)
    } else {
      onAddTerm(formData)
      setIsAdding(false)
    }
    setFormData({ name: "", startDate: "", endDate: "", isActive: false })
  }

  const handleEdit = (term: Term) => {
    setFormData({
      name: term.name,
      startDate: term.startDate,
      endDate: term.endDate,
      isActive: term.isActive,
    })
    setEditingId(term.id)
    setIsAdding(true)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: "", startDate: "", endDate: "", isActive: false })
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Manage Work Schedule Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add/Edit Form */}
          {isAdding && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">{editingId ? "Edit Term" : "Add New Term"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Term Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Fall 2025"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isActive">Active Term</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                      {editingId ? "Update Term" : "Add Term"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Add Button */}
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add New Term
            </Button>
          )}

          {/* Terms Table */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Terms</CardTitle>
            </CardHeader>
            <CardContent>
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
