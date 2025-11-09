"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "lucide-react"
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
  editingTerm?: Term | null
  isAddMode?: boolean
}

export function TermManager({
  terms,
  onAddTerm,
  onEditTerm,
  onDeleteTerm,
  onClose,
  editingTerm,
  isAddMode,
}: TermManagerProps) {
  const [formData, setFormData] = useState({
    name: editingTerm?.name || "",
    startDate: editingTerm?.startDate || "",
    endDate: editingTerm?.endDate || "",
    isActive: editingTerm?.isActive || false,
  })

  useEffect(() => {
    if (editingTerm) {
      setFormData({
        name: editingTerm.name,
        startDate: editingTerm.startDate,
        endDate: editingTerm.endDate,
        isActive: editingTerm.isActive,
      })
    }
  }, [editingTerm])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTerm) {
      onEditTerm(editingTerm.id, formData)
    } else {
      onAddTerm(formData)
    }
  }

  return (
    <div 
      className="absolute inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {editingTerm ? "Edit Term" : "Add New Term"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form content remains the same */}
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
                {editingTerm ? "Update Term" : "Add Term"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
