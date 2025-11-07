"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TermsPage } from "@/components/terms-page"

export default function TermsManagement() {
  const router = useRouter()

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
    {
      id: "3",
      name: "Spring 2025",
      startDate: "2025-01-15",
      endDate: "2025-05-10",
      isActive: false,
    },
  ]

  const [terms, setTerms] = useState(initialTerms)

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

  const handleBack = () => {
    router.push("/admin")
  }

  return (
    <TermsPage
      terms={terms}
      onAddTerm={handleAddTerm}
      onEditTerm={handleEditTerm}
      onDeleteTerm={handleDeleteTerm}
      onBack={handleBack}
    />
  )
}
