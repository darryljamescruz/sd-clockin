"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TermsPage } from "@/components/terms-page"
import { api, type Term } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"

export default function TermsManagement() {
  const router = useRouter()
  const [terms, setTerms] = useState<Term[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch terms on mount
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true)
        const fetchedTerms = await api.terms.getAll()
        setTerms(fetchedTerms)
      } catch (err) {
        console.error("Error fetching terms:", err)
        setError("Failed to load terms. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTerms()
  }, [])

  const handleAddTerm = async (term: any) => {
    try {
      const newTerm = await api.terms.create({
        name: term.name,
        startDate: term.startDate,
        endDate: term.endDate,
        isActive: term.isActive,
      })
      setTerms((prev) => [...prev, newTerm])
    } catch (err) {
      console.error("Error adding term:", err)
      setError("Failed to add term. Please try again.")
      throw err
    }
  }

  const handleEditTerm = async (id: string, updatedTerm: any) => {
    try {
      const editedTerm = await api.terms.update(id, {
        name: updatedTerm.name,
        startDate: updatedTerm.startDate,
        endDate: updatedTerm.endDate,
        isActive: updatedTerm.isActive,
      })
      setTerms((prev) => prev.map((term) => (term.id === id ? editedTerm : term)))
    } catch (err) {
      console.error("Error editing term:", err)
      setError("Failed to update term. Please try again.")
      throw err
    }
  }

  const handleDeleteTerm = async (id: string) => {
    try {
      await api.terms.delete(id)
      setTerms((prev) => prev.filter((term) => term.id !== id))
    } catch (err) {
      console.error("Error deleting term:", err)
      setError("Failed to delete term. Please try again.")
      throw err
    }
  }

  const handleBack = () => {
    router.push("/admin")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="max-w-7xl mx-auto bg-blue-50 border-blue-200 shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800 font-medium">Loading terms...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="max-w-7xl mx-auto bg-red-50 border-red-200 shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <TermsPage
          terms={terms}
          onAddTerm={handleAddTerm}
          onEditTerm={handleEditTerm}
          onDeleteTerm={handleDeleteTerm}
          onBack={handleBack}
        />
      </div>
    </div>
  )
}
