"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, X } from "lucide-react"
import { useState, useEffect } from "react"

interface AdminLoginProps {
  isOpen: boolean
  onToggle: () => void
  onLogin: (username: string, password: string) => boolean
}

export function AdminLogin({ isOpen, onToggle, onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // Disable card swipe when modal is open
  useEffect(() => {
    if (isOpen) {
      // Add event listener to prevent card swipe interference
      const handleKeyDown = (e: KeyboardEvent) => {
        e.stopPropagation()
      }
      document.addEventListener("keydown", handleKeyDown, true)
      document.addEventListener("keypress", handleKeyDown, true)

      return () => {
        document.removeEventListener("keydown", handleKeyDown, true)
        document.removeEventListener("keypress", handleKeyDown, true)
      }
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const success = onLogin(username, password)
    if (!success) {
      setError("Invalid credentials")
      setPassword("")
    } else {
      setUsername("")
      setPassword("")
      setError("")
    }
  }

  const handleClose = () => {
    setUsername("")
    setPassword("")
    setError("")
    onToggle()
  }

  return (
    <>
      {/* Always render the button */}
      <Button onClick={onToggle} variant="ghost">
        <Shield className="w-4 h-4 mr-2" />
        Admin Login
      </Button>

      {/* Render modal when open */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 shadow-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Login
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Login
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Demo:</strong> Username: admin, Password: admin123
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
