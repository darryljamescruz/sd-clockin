"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ScheduleVisualization } from "@/components/admin/dashboard/schedule-visualization"
import { api, type Student, type Term, type Schedule } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"

export default function ScheduleViewPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [schedules, setSchedules] = useState<Record<string, Schedule>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch students, terms, and schedules on mount
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

        // Fetch schedules for active term (or first term if no active term)
        // The ScheduleVisualization component will handle term selection
        const activeTerm = fetchedTerms.find((t) => t.isActive) || fetchedTerms[0]
        if (activeTerm) {
          const schedulesData: Record<string, Schedule> = {}
          await Promise.all(
            fetchedStudents.map(async (student) => {
              try {
                const schedule = await api.schedules.get(student.id, activeTerm.id)
                if (schedule) {
                  schedulesData[student.id] = schedule
                }
              } catch (error) {
                // Student might not have a schedule, that's okay
              }
            })
          )
          setSchedules(schedulesData)
        }
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
          <span className="text-blue-800 font-medium">Loading schedule view...</span>
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
    <ScheduleVisualization
      students={students}
      terms={terms}
      schedules={schedules}
      onBack={handleBack}
    />
  )
}



