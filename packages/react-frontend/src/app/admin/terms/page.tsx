"use client"

import { useState } from "react"
import { TermManager } from "@/components/term-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus } from "lucide-react"

// TODO: This should come from your backend or shared state
const initialTerms = [
  {
    id: "1",
    name: "Fall 2025",
    startDate: "2025-08-25",
    endDate: "2025-12-15",
    isActive: true,
  },
  {
    id: "2",
    name: "Summer 2025",
    startDate: "2025-05-15",
    endDate: "2025-08-15",
    isActive: false,
  },
]

export default function TermsPage() {
  const [terms, setTerms] = useState(initialTerms)
  const [showTermManager, setShowTermManager] = useState(false)

  const handleAddTerm = (term) => {
    const newTerm = {
      ...term,
      id: Date.now().toString(),
    }
    setTerms((prev) => [...prev, newTerm])
  }

  const handleEditTerm = (id: string, updatedTerm) => {
    setTerms((prev) => prev.map((term) => (term.id === id ? { ...updatedTerm, id } : term)))
  }

  const handleDeleteTerm = (id: string) => {
    setTerms((prev) => prev.filter((term) => term.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-slate-600" />
          <h2 className="text-2xl font-semibold text-slate-900">Term Management</h2>
        </div>
        <Button onClick={() => setShowTermManager(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Term
        </Button>
      </div>

      <div className="grid gap-4">
        {terms.map((term) => (
          <Card key={term.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{term.name}</span>
                {term.isActive && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                <p>Start: {new Date(term.startDate).toLocaleDateString()}</p>
                <p>End: {new Date(term.endDate).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showTermManager && (
        <TermManager
          terms={terms}
          onAddTerm={handleAddTerm}
          onEditTerm={handleEditTerm}
          onDeleteTerm={handleDeleteTerm}
          onClose={() => setShowTermManager(false)}
        />
      )}
    </div>
  )
}
