"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, LogIn } from "lucide-react"
import { useEffect } from "react"

interface AdminLoginProps {
  isOpen: boolean
  onToggle: () => void
}

export function AdminLogin({ isOpen, onToggle }: AdminLoginProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      event.stopPropagation()
    }

    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("keypress", handleKeyDown, true)

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("keypress", handleKeyDown, true)
    }
  }, [isOpen])

  return (
    <>
      <Button onClick={onToggle} variant="ghost">
        <Shield className="w-4 h-4 mr-2" />
        Admin Login
      </Button>

      <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onToggle()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Sign In
            </DialogTitle>
            <DialogDescription>
              Sign in with your Microsoft account to access the admin dashboard.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onToggle}>
              Cancel
            </Button>
            <Button asChild className="sm:min-w-40">
              <a href="/api/auth/login">
                <LogIn className="w-4 h-4 mr-2" />
                Continue with Microsoft
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
