/**
 * Server-side API functions for fetching data in Server Components
 * These functions are meant to be used in Next.js Server Components for SSR
 */

import { type Student, type Term } from "./api"

// Use environment variable for API URL with fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function fetchServerAPI<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    // Revalidate every 60 seconds for ISR-like behavior
    next: { revalidate: 60 },
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
export async function getStudents(termId?: string): Promise<Student[]> {
  try {
    const query = termId ? `?termId=${termId}` : ""
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
