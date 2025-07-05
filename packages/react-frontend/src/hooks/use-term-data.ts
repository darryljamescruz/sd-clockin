import { useState, useCallback, useEffect } from "react"

export interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

// TODO: Replace with actual data from your backend
const initialTerms: Term[] = [
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
  {
    id: "4",
    name: "Thanksgiving Break 2025",
    startDate: "2025-11-25",
    endDate: "2025-11-29",
    isActive: false,
  },
]

export function useTermData() {
  const [terms, setTerms] = useState<Term[]>(initialTerms)
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Function to determine the default term based on current date
  const getDefaultTerm = useCallback(() => {
    const today = new Date()
    
    // First, try to find a term that contains today's date
    const currentTerm = terms.find(term => {
      const start = new Date(term.startDate)
      const end = new Date(term.endDate)
      return today >= start && today <= end
    })
    
    if (currentTerm) {
      return currentTerm.name
    }
    
    // If no current term, find the closest future term
    const futureTerms = terms.filter(term => {
      const start = new Date(term.startDate)
      return today < start
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    
    if (futureTerms.length > 0) {
      return futureTerms[0].name
    }
    
    // If no future terms, find the most recent past term
    const pastTerms = terms.filter(term => {
      const end = new Date(term.endDate)
      return today > end
    }).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    
    if (pastTerms.length > 0) {
      return pastTerms[0].name
    }
    
    // Fallback to first term
    return terms.length > 0 ? terms[0].name : ""
  }, [terms])

  // Set default term when component mounts or terms change
  useEffect(() => {
    if (terms.length > 0 && !selectedTerm) {
      const defaultTerm = getDefaultTerm()
      setSelectedTerm(defaultTerm)
    }
  }, [terms, selectedTerm, getDefaultTerm])

  // Get current term data
  const getCurrentTerm = useCallback(() => {
    return terms.find((term) => term.name === selectedTerm) || terms[0]
  }, [terms, selectedTerm])

  // Get all weekdays in the current term
  const getTermWeekdays = useCallback(() => {
    const weekdays: Date[] = []
    const currentTerm = getCurrentTerm()
    if (!currentTerm) return weekdays
    
    const start = new Date(currentTerm.startDate)
    const end = new Date(currentTerm.endDate)
    const current = new Date(start)

    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        weekdays.push(new Date(current))
      }
      current.setDate(current.getDate() + 1)
    }
    return weekdays
  }, [getCurrentTerm])

  // Get default date for the selected term
  const getDefaultDateForTerm = useCallback(() => {
    const today = new Date()
    const currentTerm = getCurrentTerm()
    if (!currentTerm) return today
    
    const termStart = new Date(currentTerm.startDate)
    const termEnd = new Date(currentTerm.endDate)
    
    // If today is within the term, use today
    if (today >= termStart && today <= termEnd) {
      return today
    }
    
    // If term is in the future, use first day of term
    if (today < termStart) {
      return termStart
    }
    
    // If term is in the past, use last day of term
    return termEnd
  }, [getCurrentTerm])

  // Update selected date when term changes
  useEffect(() => {
    if (selectedTerm) {
      const defaultDate = getDefaultDateForTerm()
      setSelectedDate(defaultDate)
    }
  }, [selectedTerm, getDefaultDateForTerm])

  // Term management functions
  const addTerm = useCallback((term: Omit<Term, "id">) => {
    const newTerm: Term = {
      ...term,
      id: Date.now().toString(),
    }
    setTerms((prev) => [...prev, newTerm])
  }, [])

  const editTerm = useCallback((id: string, updatedTerm: Omit<Term, "id">) => {
    setTerms((prev) => prev.map((term) => (term.id === id ? { ...updatedTerm, id } : term)))
  }, [])

  const deleteTerm = useCallback((id: string) => {
    setTerms((prev) => prev.filter((term) => term.id !== id))
  }, [])

  // Navigation functions
  const goToPreviousDay = useCallback(() => {
    const termWeekdays = getTermWeekdays()
    const currentDateIndex = termWeekdays.findIndex((date) => date.toDateString() === selectedDate.toDateString())
    if (currentDateIndex > 0) {
      setSelectedDate(termWeekdays[currentDateIndex - 1])
    }
  }, [selectedDate, getTermWeekdays])

  const goToNextDay = useCallback(() => {
    const termWeekdays = getTermWeekdays()
    const currentDateIndex = termWeekdays.findIndex((date) => date.toDateString() === selectedDate.toDateString())
    if (currentDateIndex < termWeekdays.length - 1) {
      setSelectedDate(termWeekdays[currentDateIndex + 1])
    }
  }, [selectedDate, getTermWeekdays])

  const goToToday = useCallback(() => {
    const today = new Date()
    const currentTerm = getCurrentTerm()
    if (!currentTerm) return { success: false, message: "No term selected" }
    
    const termStart = new Date(currentTerm.startDate)
    const termEnd = new Date(currentTerm.endDate)
    
    if (today >= termStart && today <= termEnd) {
      // Today is within the term
      const termWeekdays = getTermWeekdays()
      const todayInTerm = termWeekdays.find((date) => date.toDateString() === today.toDateString())
      if (todayInTerm) {
        setSelectedDate(todayInTerm)
        return { success: true, message: "" }
      } else {
        return { success: false, message: "Today is not a scheduled weekday." }
      }
    } else if (today < termStart) {
      return { success: false, message: "Today is before the selected term starts." }
    } else {
      return { success: false, message: "Today is after the selected term ends." }
    }
  }, [getCurrentTerm, getTermWeekdays])

  const termWeekdays = getTermWeekdays()
  const currentDateIndex = termWeekdays.findIndex((date) => date.toDateString() === selectedDate.toDateString())

  return {
    terms,
    selectedTerm,
    setSelectedTerm,
    selectedDate,
    setSelectedDate,
    getCurrentTerm,
    getTermWeekdays,
    addTerm,
    editTerm,
    deleteTerm,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    termWeekdays,
    currentDateIndex,
  }
} 