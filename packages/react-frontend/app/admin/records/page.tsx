"use client"

import { useState, useEffect } from "react"
import { IndividualRecords } from "@/components/individual-records"
import { api, type Student, type Term } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"
import { TermSelector } from "@/components/term-selector"

export default function RecordsPage() {
  const [staffData, setStaffData] = useState<Student[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStudent, setIsLoadingStudent] = useState(false)
  const [error, setError] = useState("")

  // Fetch terms on component mount
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true)
        const fetchedTerms = await api.terms.getAll()
        setTerms(fetchedTerms)

        // Set the first active term or the first term as selected
        const activeTerm = fetchedTerms.find((t) => t.isActive)
        if (activeTerm) {
          setSelectedTerm(activeTerm.name)
        } else if (fetchedTerms.length > 0) {
          setSelectedTerm(fetchedTerms[0].name)
        }
      } catch (err) {
        console.error("Error fetching terms:", err)
        setError("Failed to load terms. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTerms()
  }, [])

  // Fetch basic student list for selection UI (without term-specific data)
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true)
        // Fetch basic student list without termId for selection UI
        const fetchedStudents = await api.students.getAll()
        setStaffData(fetchedStudents)
      } catch (err) {
        console.error("Error fetching students:", err)
        setError("Failed to load student data. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [])

  // Clear selected staff when term changes
  useEffect(() => {
    setSelectedStaff(null)
  }, [selectedTerm])

  // Fetch a specific student with term-specific data when selected
  useEffect(() => {
    const fetchSelectedStudent = async () => {
      if (!selectedStaff || !selectedTerm) return

      try {
        setIsLoadingStudent(true)
        const currentTerm = terms.find((t) => t.name === selectedTerm)
        if (currentTerm) {
          // Fetch only the selected student with term-specific data
          const fetchedStudent = await api.students.getById(selectedStaff.id, currentTerm.id)
          setSelectedStaff(fetchedStudent)
        }
      } catch (err) {
        console.error("Error fetching student data:", err)
        setError("Failed to load student data. Please refresh the page.")
      } finally {
        setIsLoadingStudent(false)
      }
    }

    fetchSelectedStudent()
  }, [selectedStaff?.id, selectedTerm, terms])

  // Refresh a specific student's data
  const handleRefreshStudent = async (studentId: string) => {
    if (!selectedTerm) return

    try {
      const currentTerm = terms.find((t) => t.name === selectedTerm)
      if (currentTerm) {
        // Fetch only the specific student with term-specific data
        const updatedStaff = await api.students.getById(studentId, currentTerm.id)
        if (selectedStaff?.id === studentId) {
          setSelectedStaff(updatedStaff)
        }
      }
    } catch (err) {
      console.error("Error refreshing student data:", err)
    }
  }

  const getCurrentTerm = () => {
    return terms.find((term) => term.name === selectedTerm) || terms[0]
  }

  if (isLoading && terms.length === 0) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-blue-800 font-medium">Loading records...</span>
        </CardContent>
      </Card>
    )
  }

  if (error && !isLoading) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">{error}</span>
        </CardContent>
      </Card>
    )
  }

  const currentTerm = getCurrentTerm()
  if (!currentTerm) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 font-medium">No terms available. Please create a term first.</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <TermSelector
        terms={terms}
        selectedTerm={selectedTerm}
        onTermChange={setSelectedTerm}
      />
      
      {isLoading ? (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800 font-medium">Loading records...</span>
          </CardContent>
        </Card>
      ) : (
        <IndividualRecords
          staffData={staffData}
          selectedStaff={selectedStaff}
          onSelectStaff={setSelectedStaff}
          selectedTerm={selectedTerm}
          termStartDate={currentTerm.startDate}
          termEndDate={currentTerm.endDate}
          currentTerm={currentTerm}
          onRefreshStudent={handleRefreshStudent}
          isLoadingStudent={isLoadingStudent}
        />
      )}
    </div>
  )
}

