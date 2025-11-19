"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SchedulesPage } from "@/components/admin/students/schedules-page"
import { api, type Student, type Term } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"

export default function SchedulesManagement() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch students and terms on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [fetchedStudents, fetchedTerms] = await Promise.all([
          api.students.getAll(),
          api.terms.getAll(),
        ])
        setStudents(fetchedStudents)
        setTerms(fetchedTerms)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleBack = () => {
    router.push("/admin")
  }

  if (isLoading) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-blue-800 font-medium">Loading schedules...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">{error}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <SchedulesPage
      students={students}
      terms={terms}
      onBack={handleBack}
    />
  )
}

