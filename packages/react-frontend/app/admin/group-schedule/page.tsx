"use client"

import { useState, useEffect, type ReactNode } from "react"
import { ServiceDeskGroupSchedule } from "@/components/admin/group-schedule/service-desk-group-schedule"
import { api, type Student, type Term } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { AnalyticsSkeleton } from "@/components/admin/loading-skeletons"

export default function GroupSchedulePage() {
  const [staffData, setStaffData] = useState<Student[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true)
        const fetchedTerms = await api.terms.getAll()
        setTerms(fetchedTerms)
        const activeTerm = fetchedTerms.find((t) => t.isActive)
        if (activeTerm) setSelectedTerm(activeTerm.name)
        else if (fetchedTerms.length > 0) setSelectedTerm(fetchedTerms[0].name)
      } catch (err) {
        console.error("Error fetching terms:", err)
        setError("Failed to load terms. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchTerms()
  }, [])

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedTerm) return
      try {
        setIsLoading(true)
        const currentTerm = terms.find((t) => t.name === selectedTerm)
        if (currentTerm) {
          const fetchedStudents = await api.students.getAll(currentTerm.id)
          setStaffData(fetchedStudents)
        }
      } catch (err) {
        console.error("Error fetching students:", err)
        setError("Failed to load student data. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchStudents()
  }, [selectedTerm, terms])

  if (error && !isLoading) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="font-medium text-red-800">{error}</span>
        </CardContent>
      </Card>
    )
  }

  const currentTerm = terms.find((t) => t.name === selectedTerm)
  if (!currentTerm && !isLoading) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">No terms available. Create a term first.</span>
        </CardContent>
      </Card>
    )
  }

  let body: ReactNode = null
  if (isLoading) {
    body = <AnalyticsSkeleton showHeader={false} />
  } else if (currentTerm) {
    body = (
      <ServiceDeskGroupSchedule
        staffData={staffData}
        terms={terms}
        selectedTerm={selectedTerm}
        onTermChange={setSelectedTerm}
      />
    )
  }

  return <div className="space-y-6">{body}</div>
}
