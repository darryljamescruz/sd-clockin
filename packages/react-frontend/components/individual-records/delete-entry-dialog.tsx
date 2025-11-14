/**
 * Delete entry confirmation dialog component
 */

"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { type ClockEntry } from "@/lib/api"

interface DeleteEntryDialogProps {
  isOpen: boolean
  onClose: () => void
  deletingEntry: { entry: ClockEntry; index: number } | null
  isDeleting: boolean
  onConfirm: () => Promise<void>
}

export function DeleteEntryDialog({
  isOpen,
  onClose,
  deletingEntry,
  isDeleting,
  onConfirm,
}: DeleteEntryDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this clock entry from the system. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deletingEntry && (
          <div className="p-3 bg-muted rounded-md text-sm space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">Type:</span>
              <Badge variant={deletingEntry.entry.type === "in" ? "default" : "secondary"}>
                {deletingEntry.entry.type === "in" ? "Clock In" : "Clock Out"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">Date & Time:</span>
              <span className="font-mono text-xs">{new Date(deletingEntry.entry.timestamp).toLocaleString()}</span>
            </div>
            {deletingEntry.entry.isManual && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Manual Entry</Badge>
              </div>
            )}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}


