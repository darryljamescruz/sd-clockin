/**
 * Custom hook for managing clock entries (editing, deleting, adding)
 */

import { useState } from "react"
import { type Student, type ClockEntry, api } from "@/lib/api"

export interface UseClockEntriesReturn {
  editingEntry: { entry: ClockEntry; index: number } | null
  deletingEntry: { entry: ClockEntry; index: number } | null
  isAddDialogOpen: boolean
  editTimestamp: string
  editType: "in" | "out"
  isSaving: boolean
  isDeleting: boolean
  refreshTrigger: number
  setEditingEntry: (entry: { entry: ClockEntry; index: number } | null) => void
  setDeletingEntry: (entry: { entry: ClockEntry; index: number } | null) => void
  setIsAddDialogOpen: (open: boolean) => void
  setEditTimestamp: (timestamp: string) => void
  setEditType: (type: "in" | "out") => void
  handleEditClick: (entry: ClockEntry, index: number) => void
  handleAddClick: () => void
  handleDeleteClick: (entry: ClockEntry, index: number) => void
  handleDeleteConfirm: (selectedStaff: Student | null, selectedTerm: string, onRefreshStudent?: (studentId: string) => Promise<void>) => Promise<void>
  handleSaveEdit: (selectedStaff: Student | null, selectedTerm: string, onRefreshStudent?: (studentId: string) => Promise<void>) => Promise<void>
  handleSaveAdd: (selectedStaff: Student | null, selectedTerm: string, onRefreshStudent?: (studentId: string) => Promise<void>) => Promise<void>
}

export function useClockEntries(): UseClockEntriesReturn {
  const [editingEntry, setEditingEntry] = useState<{ entry: ClockEntry; index: number } | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<{ entry: ClockEntry; index: number } | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editTimestamp, setEditTimestamp] = useState("")
  const [editType, setEditType] = useState<"in" | "out">("in")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEditClick = (entry: ClockEntry, index: number) => {
    const date = new Date(entry.timestamp)
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setEditTimestamp(localDateTime)
    setEditType(entry.type)
    setEditingEntry({ entry, index })
  }

  const handleAddClick = () => {
    const now = new Date()
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setEditTimestamp(localDateTime)
    setEditType("in")
    setIsAddDialogOpen(true)
  }

  const handleDeleteClick = (entry: ClockEntry, index: number) => {
    setDeletingEntry({ entry, index })
  }

  const handleDeleteConfirm = async (
    selectedStaff: Student | null,
    selectedTerm: string,
    onRefreshStudent?: (studentId: string) => Promise<void>
  ) => {
    if (!selectedStaff || !deletingEntry) return

    setIsDeleting(true)
    try {
      let entryId: string | undefined = deletingEntry.entry.id

      // Ensure entryId is a string if it exists
      if (entryId) {
        entryId = String(entryId)
      }

      // If entry doesn't have an ID, try to find it by timestamp and type
      if (!entryId) {
        // Get current term to query check-ins
        const terms = await api.terms.getAll()
        const currentTerm = terms.find(t => t.name === selectedTerm)
        
        if (currentTerm) {
          // Query check-ins for this student and term
          const checkIns = await api.checkins.getAll({
            studentId: selectedStaff.id,
            termId: currentTerm.id,
          })
          
          // Find matching entry by timestamp (within 1 minute tolerance) and type
          const originalTimestamp = new Date(deletingEntry.entry.timestamp)
          const matchingEntry = checkIns.find(entry => {
            const entryDate = new Date(entry.timestamp)
            const timeDiff = Math.abs(entryDate.getTime() - originalTimestamp.getTime())
            return timeDiff < 60000 && entry.type === deletingEntry.entry.type // Within 1 minute
          })
          
          if (matchingEntry && matchingEntry.id) {
            entryId = String(matchingEntry.id) // Ensure it's a string
          } else {
            alert("Cannot find this entry in the database. It may have been deleted. Please refresh the page.")
            setIsDeleting(false)
            setDeletingEntry(null)
            return
          }
        } else {
          alert("Cannot find current term. Please refresh the page.")
          setIsDeleting(false)
          setDeletingEntry(null)
          return
        }
      }

      // Validate entryId before making the API call
      if (!entryId || entryId.trim() === '') {
        alert("Invalid entry ID. Please refresh the page and try again.")
        setIsDeleting(false)
        setDeletingEntry(null)
        return
      }

      // Delete the check-in
      await api.checkins.delete(entryId)
      
      setDeletingEntry(null)
      setRefreshTrigger(prev => prev + 1)
      
      // Refresh the affected student's data
      if (onRefreshStudent && selectedStaff.id) {
        await onRefreshStudent(selectedStaff.id)
      }
    } catch (error) {
      console.error("Error deleting check-in:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to delete check-in: ${errorMessage}. Please try again.`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveEdit = async (
    selectedStaff: Student | null,
    selectedTerm: string,
    onRefreshStudent?: (studentId: string) => Promise<void>
  ) => {
    if (!selectedStaff || !editingEntry) return

    setIsSaving(true)
    try {
      let entryId: string | undefined = editingEntry.entry.id

      // Ensure entryId is a string if it exists
      if (entryId) {
        entryId = String(entryId)
      }

      // If entry doesn't have an ID, try to find it by timestamp and type
      if (!entryId) {
        // Get current term to query check-ins
        const terms = await api.terms.getAll()
        const currentTerm = terms.find(t => t.name === selectedTerm)
        
        if (currentTerm) {
          // Query check-ins for this student and term
          const checkIns = await api.checkins.getAll({
            studentId: selectedStaff.id,
            termId: currentTerm.id,
          })
          
          // Find matching entry by timestamp (within 1 minute tolerance) and type
          const originalTimestamp = new Date(editingEntry.entry.timestamp)
          const matchingEntry = checkIns.find(entry => {
            const entryDate = new Date(entry.timestamp)
            const timeDiff = Math.abs(entryDate.getTime() - originalTimestamp.getTime())
            return timeDiff < 60000 && entry.type === editingEntry.entry.type // Within 1 minute
          })
          
          if (matchingEntry && matchingEntry.id) {
            entryId = String(matchingEntry.id) // Ensure it's a string
          } else {
            alert("Cannot find this entry in the database. It may have been deleted or the timestamp doesn't match. Please refresh the page.")
            setIsSaving(false)
            return
          }
        } else {
          alert("Cannot find current term. Please refresh the page.")
          setIsSaving(false)
          return
        }
      }

      // Validate entryId before making the API call
      if (!entryId || entryId.trim() === '') {
        alert("Invalid entry ID. Please refresh the page and try again.")
        setIsSaving(false)
        return
      }

      // Update the check-in
      await api.checkins.update(entryId, {
        timestamp: new Date(editTimestamp).toISOString(),
        type: editType,
      })
      
      setEditingEntry(null)
      setRefreshTrigger(prev => prev + 1)
      
      // Refresh the affected student's data
      if (onRefreshStudent && selectedStaff.id) {
        await onRefreshStudent(selectedStaff.id)
      }
    } catch (error) {
      console.error("Error updating check-in:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to update check-in: ${errorMessage}. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAdd = async (
    selectedStaff: Student | null,
    selectedTerm: string,
    onRefreshStudent?: (studentId: string) => Promise<void>
  ) => {
    if (!selectedStaff) return

    setIsSaving(true)
    try {
      // Get current term ID - we'll need to get this from props or context
      // For now, we'll need to pass it or get it from the selected term
      const terms = await api.terms.getAll()
      const currentTerm = terms.find(t => t.name === selectedTerm)
      
      if (!currentTerm) {
        alert("Could not find current term")
        return
      }

      await api.checkins.create({
        studentId: selectedStaff.id,
        termId: currentTerm.id,
        type: editType,
        timestamp: new Date(editTimestamp).toISOString(),
        isManual: true,
      })

      setIsAddDialogOpen(false)
      setRefreshTrigger(prev => prev + 1)
      
      // Refresh the affected student's data
      if (onRefreshStudent && selectedStaff.id) {
        await onRefreshStudent(selectedStaff.id)
      }
    } catch (error) {
      console.error("Error creating check-in:", error)
      alert("Failed to create check-in. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return {
    editingEntry,
    deletingEntry,
    isAddDialogOpen,
    editTimestamp,
    editType,
    isSaving,
    isDeleting,
    refreshTrigger,
    setEditingEntry,
    setDeletingEntry,
    setIsAddDialogOpen,
    setEditTimestamp,
    setEditType,
    handleEditClick,
    handleAddClick,
    handleDeleteClick,
    handleDeleteConfirm,
    handleSaveEdit,
    handleSaveAdd,
  }
}


