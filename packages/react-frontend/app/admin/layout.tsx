"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { AdminLogin } from "@/components/admin-login"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [user, setUser] = useState<{ id: string; name: string; email: string; isAdmin: boolean } | null>(null)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check if we're coming from a successful login (query parameter)
      const urlParams = new URLSearchParams(window.location.search)
      const justLoggedIn = urlParams.get('loggedIn') === 'true'
      
      // If coming from login, wait a bit longer for cookie to be set
      const initialDelay = justLoggedIn ? 300 : 100
      await new Promise(resolve => setTimeout(resolve, initialDelay))
      
      // Remove the query parameter from URL
      if (justLoggedIn) {
        window.history.replaceState({}, '', window.location.pathname)
      }
      
      try {
        const result = await api.auth.verify()
        if (result.authenticated && result.user) {
          setIsAuthenticated(true)
          setUser({
            id: result.user.id,
            name: result.user.username,
            email: result.user.username,
            isAdmin: result.user.isAdmin,
          })
        } else {
          // If not authenticated and we just logged in, retry once more
          if (justLoggedIn) {
            await new Promise(resolve => setTimeout(resolve, 200))
            const retryResult = await api.auth.verify()
            if (retryResult.authenticated && retryResult.user) {
              setIsAuthenticated(true)
              setUser({
                id: retryResult.user.id,
                name: retryResult.user.username,
                email: retryResult.user.username,
                isAdmin: retryResult.user.isAdmin,
              })
            } else {
              setIsAuthenticated(false)
              setIsLoginOpen(true)
            }
          } else {
            setIsAuthenticated(false)
            setIsLoginOpen(true)
          }
        }
      } catch (error) {
        // If error and we just logged in, retry once
        if (justLoggedIn) {
          try {
            await new Promise(resolve => setTimeout(resolve, 200))
            const retryResult = await api.auth.verify()
            if (retryResult.authenticated && retryResult.user) {
              setIsAuthenticated(true)
              setUser({
                id: retryResult.user.id,
                name: retryResult.user.username,
                email: retryResult.user.username,
                isAdmin: retryResult.user.isAdmin,
              })
            } else {
              setIsAuthenticated(false)
              setIsLoginOpen(true)
            }
          } catch (retryError) {
            setIsAuthenticated(false)
            setIsLoginOpen(true)
          }
        } else {
          setIsAuthenticated(false)
          setIsLoginOpen(true)
        }
      }
    }

    checkAuth()
  }, [])

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLogin = async (loggedInUser: { id: string; name: string; email: string; isAdmin: boolean }) => {
    // Verify session was created before proceeding
    let verified = false
    let attempts = 0
    const maxAttempts = 5
    
    while (!verified && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100))
      try {
        const result = await api.auth.verify()
        if (result.authenticated && result.user) {
          verified = true
          setIsAuthenticated(true)
          setUser({
            id: result.user.id,
            name: result.user.username || loggedInUser.name,
            email: result.user.username || loggedInUser.email,
            isAdmin: result.user.isAdmin,
          })
          setIsLoginOpen(false)
        }
      } catch (error) {
        // Continue trying
      }
      attempts++
    }
    
    // If verification failed after all attempts, still set the user (fallback)
    if (!verified) {
      setIsAuthenticated(true)
      setUser(loggedInUser)
      setIsLoginOpen(false)
    }
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-6">
          <AdminLogin
            isOpen={isLoginOpen}
            onToggle={() => {
              setIsLoginOpen(!isLoginOpen)
              if (!isLoginOpen) {
                router.push("/")
              }
            }}
            onLogin={handleLogin}
          />
          {!isLoginOpen && (
            <div className="text-center mt-4">
              <p className="text-muted-foreground mb-4">Please log in to access the admin panel.</p>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="text-primary hover:underline"
              >
                Open Login
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }
  
  // Generate breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean)
    
    if (pathname === "/admin") {
      return (
        <>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      )
    }
    
    return (
      <>
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        {paths.slice(1).map((path, index) => {
          const isLast = index === paths.length - 2
          const href = "/" + paths.slice(0, index + 2).join("/")
          const title = path.charAt(0).toUpperCase() + path.slice(1)
          
          return (
            <div key={path} className="flex items-center gap-2">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          )
        })}
      </>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="overflow-x-hidden">
        <header className="flex h-auto sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4 py-2 sm:py-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-hidden">
          <SidebarTrigger className="-ml-1 flex-shrink-0" />
          <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
          <Breadcrumb className="flex-1 min-w-0 overflow-x-hidden">
            <BreadcrumbList className="flex-wrap">
              {getBreadcrumbs()}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium tabular-nums">{formatTime(currentTime)}</div>
              <div className="text-xs text-muted-foreground">{formatDate(currentTime)}</div>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <div className="relative flex flex-1 flex-col gap-4 p-3 sm:p-4 md:gap-6 md:p-6 lg:p-8 overflow-x-hidden w-full max-w-full">
          <div className="w-full max-w-full overflow-x-hidden min-w-0">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

