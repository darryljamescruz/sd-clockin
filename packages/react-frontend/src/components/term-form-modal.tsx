"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useState, useEffect } from "react"

interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface TermFormModalProps {
  isOpen: boolean
  editingTerm: Term | null
  onSubmit: (term: Omit<Term, "id">) => void
  onClose: () => void
}

export function TermFormModal({ isOpen, editingTerm, onSubmit, onClose }: TermFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isActive: false,
  })

  // Update form data when editing term changes
  useEffect(() => {
    if (editingTerm) {
      setFormData({
        name: editingTerm.name,
        startDate: editingTerm.startDate,
        endDate: editingTerm.endDate,
        isActive: editingTerm.isActive,
      })
    } else {
      setFormData({
        name: "",
        startDate: "",
        endDate: "",
        isActive: false,
      })
    }
  }, [editingTerm])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-lg max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{editingTerm ? "Edit Term" : "Add New Term"}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
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