/**
 * Edit and Add entry dialog component
 */

"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogIn, LogOut, Loader2, Calendar, Clock } from "lucide-react"
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAddMode ? (
              <>
                <Clock className="w-5 h-5" />
                Add Clock Entry
              </>
            ) : (
              <>
                <Clock className="w-5 h-5" />
                Edit Clock Entry
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isAddMode
              ? `Add a new clock entry for ${selectedStaff?.name || "this student"}.`
              : "Update the date, time, or type of this clock entry."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={isAddMode ? "add-timestamp" : "edit-timestamp"} className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Date & Time
            </Label>
            <Input
              id={isAddMode ? "add-timestamp" : "edit-timestamp"}
              type="datetime-local"
              value={editTimestamp}
              onChange={(e) => onTimestampChange(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={isAddMode ? "add-type" : "edit-type"}>Entry Type</Label>
            <Select value={editType} onValueChange={(value: "in" | "out") => onTypeChange(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-green-600" />
                    Clock In
                  </div>
                </SelectItem>
                <SelectItem value="out">
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-muted-foreground" />
                    Clock Out
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isAddMode ? "Adding..." : "Saving..."}
              </>
            ) : (
              isAddMode ? "Add Entry" : "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


