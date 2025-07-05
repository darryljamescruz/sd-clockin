// packages/react-frontend/src/app/admin/layout.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date()) // Add this line

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const isLoggedIn = sessionStorage.getItem('isAdminLoggedIn')
      if (!isLoggedIn) {
        router.push('/') // Redirect to public page
      } else {
        setIsAuthenticated(true)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  // Add this useEffect for the live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminLoggedIn')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // This will be handled by the redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-6">
      <div className="max-w-[1600px] mx-auto">
        <AdminHeader 
          currentTime={currentTime} // Now using the live updating time
          onLogout={handleLogout}
          onManageTerms={() => router.push('/admin/terms')}
          onManageStudents={() => router.push('/admin/students')}
        />
        {children}
      </div>
    </div>
  )
}