"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Trash2 } from "lucide-react"
import { useEffect } from "react"

interface DeleteConfirmationModalProps {
  isOpen: boolean
  title: string
  itemName: string
  description: string
  details?: string[]
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmationModal({ 
  isOpen, 
  title, 
  itemName, 
  description, 
  details = [], 
  onConfirm, 
  onCancel 
}: DeleteConfirmationModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <Card className="w-full max-w-md shadow-xl border-slate-200" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-red-800 font-medium">
                  Are you sure you want to delete <strong>{itemName}</strong>?
                </p>
                <div className="text-sm text-red-700 space-y-1">
                  <p>• {description}</p>
                  <p>• This action cannot be undone</p>
                  {details.map((detail, index) => (
                    <p key={index}>• {detail}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button onClick={onCancel} variant="outline" className="flex-1 border-slate-200 hover:bg-slate-50">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 