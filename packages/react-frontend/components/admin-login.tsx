"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, X } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

interface AdminLoginProps {
  isOpen: boolean
  onToggle: () => void
  onLogin: (user: { id: string; name: string; email: string; isAdmin: boolean }) => void
}

export function AdminLogin({ isOpen, onToggle, onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await api.auth.login(username, password, rememberMe)
      if (result.success) {
        setUsername("")
        setPassword("")
        setError("")
        onLogin(result.user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials")
      setPassword("")
    } finally {
      setIsLoading(false)
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember this device
                  </Label>
                </div>
                {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
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
