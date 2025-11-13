/**
 * Edit and Add entry dialog component
 */

"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Student, type ClockEntry } from "@/lib/api"

interface EditEntryDialogProps {
  isOpen: boolean
  onClose: () => void
  editingEntry: { entry: ClockEntry; index: number } | null
  editTimestamp: string
  editType: "in" | "out"
  isSaving: boolean
  onTimestampChange: (timestamp: string) => void
  onTypeChange: (type: "in" | "out") => void
  onSave: () => Promise<void>
  isAddMode?: boolean
  selectedStaff?: Student | null
}

export function EditEntryDialog({
  isOpen,
  onClose,
  editingEntry,
  editTimestamp,
  editType,
  isSaving,
  onTimestampChange,
  onTypeChange,
  onSave,
  isAddMode = false,
  selectedStaff,
}: EditEntryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isAddMode ? "Add Clock Entry" : "Edit Clock Entry"}</DialogTitle>
          <DialogDescription>
            {isAddMode
              ? `Add a new clock-in or clock-out entry for ${selectedStaff?.name || "this student"}.`
              : "Update the date, time, or type of this clock entry."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor={isAddMode ? "add-timestamp" : "edit-timestamp"}>Date & Time</Label>
            <Input
              id={isAddMode ? "add-timestamp" : "edit-timestamp"}
              type="datetime-local"
              value={editTimestamp}
              onChange={(e) => onTimestampChange(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={isAddMode ? "add-type" : "edit-type"}>Type</Label>
            <Select value={editType} onValueChange={(value: "in" | "out") => onTypeChange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Clock In</SelectItem>
                <SelectItem value="out">Clock Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (isAddMode ? "Adding..." : "Saving...") : (isAddMode ? "Add Entry" : "Save Changes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
