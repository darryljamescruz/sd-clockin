/**
 * Delete entry confirmation dialog component
 */

"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trash2, LogIn, LogOut, Calendar, Pencil, Zap } from "lucide-react"
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
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Delete Clock Entry
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this clock entry. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deletingEntry && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              {deletingEntry.entry.type === "in" ? (
                <Badge variant="default" className="bg-green-600">
                  <LogIn className="w-3 h-3 mr-1" />
                  Clock In
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <LogOut className="w-3 h-3 mr-1" />
                  Clock Out
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date & Time</span>
              <div className="flex items-center gap-1.5 text-sm">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-mono text-xs">
                  {new Date(deletingEntry.entry.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
            {(deletingEntry.entry.isManual || deletingEntry.entry.isAutoClockOut) && (
              <div className="flex items-center gap-2 pt-2 border-t">
                {deletingEntry.entry.isManual && (
                  <Badge variant="outline" className="text-xs">
                    <Pencil className="w-2.5 h-2.5 mr-1" />
                    Manual Entry
                  </Badge>
                )}
                {deletingEntry.entry.isAutoClockOut && (
                  <Badge variant="outline" className="text-xs">
                    <Zap className="w-2.5 h-2.5 mr-1" />
                    Auto Clock Out
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Entry
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}




