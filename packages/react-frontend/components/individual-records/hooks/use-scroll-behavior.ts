/**
 * Custom hook for managing scroll behavior
 */

import { useState, useEffect, useRef } from "react"
import { type Student } from "@/lib/api"

export interface UseScrollBehaviorReturn {
  showScrollToTop: boolean
  studentInfoRef: React.RefObject<HTMLDivElement>
  searchSectionRef: React.RefObject<HTMLDivElement>
  scrollToSearch: () => void
}

export function useScrollBehavior(selectedStaff: Student | null): UseScrollBehaviorReturn {
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const studentInfoRef = useRef<HTMLDivElement>(null)
  const searchSectionRef = useRef<HTMLDivElement>(null)

  // Scroll to student info when a student is selected
  useEffect(() => {
    if (selectedStaff && studentInfoRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // Scroll to position the student header at the top of the viewport
        const elementTop = studentInfoRef.current?.offsetTop || 0
        const offset = 20 // Small offset from top
        window.scrollTo({
          top: elementTop - offset,
          behavior: "smooth",
        })
      }, 150)
    }
  }, [selectedStaff?.id])

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 400)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return {
    showScrollToTop,
    studentInfoRef,
    searchSectionRef,
    scrollToSearch,
  }
}



