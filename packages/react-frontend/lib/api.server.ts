/**
 * Server-side API functions for fetching data in Server Components
 * These functions are meant to be used in Next.js Server Components for SSR
 */

import { type Student, type Term } from "./api"
import { cookies } from "next/headers"

// Use environment variable for API URL with fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function fetchServerAPI<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  // Get session token from cookies
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("admin_session")?.value

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch all terms (server-side)
 */
export async function getTerms(): Promise<Term[]> {
  try {
    return await fetchServerAPI<Term[]>("/terms")
  } catch (error) {
    console.error("Failed to fetch terms:", error)
    return []
  }
}

/**
 * Fetch all students for a term (server-side)
 */
export async function getStudents(termId?: string, includeHistory = false): Promise<Student[]> {
  try {
    const params = new URLSearchParams()
    if (termId) params.append("termId", termId)
    if (includeHistory) params.append("includeHistory", "true")
    
    const query = params.toString() ? `?${params.toString()}` : ""
    return await fetchServerAPI<Student[]>(`/students${query}`)
  } catch (error) {
    console.error("Failed to fetch students:", error)
    return []
  }
}

/**
 * Get the active term or first term
 */
export function getActiveTerm(terms: Term[]): Term | undefined {
  return terms.find((t) => t.isActive) || terms[0]
}
