"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { PublicDashboard } from "./components/public-dashboard"
import { availableLocations, initialStaffData } from "./data/initialData"
import { formatTime } from "./utils/clockUtils"
import { parsePolycardNumber } from "./utils/polycard"

export default function PublicClockSystem() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isClockOutOpen, setIsClockOutOpen] = useState(false)
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false)
  const [staffData, setStaffData] = useState(initialStaffData)
  const [cardSwipeData, setCardSwipeData] = useState("")
  const [isCardSwiping, setIsCardSwiping] = useState(false)
  const [clockInMessage, setClockInMessage] = useState("")
  const [showClockInSuccess, setShowClockInSuccess] = useState(false)
  const [isCardSwipeDisabled, setIsCardSwipeDisabled] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Simulate location assignment after clock-in
  const assignLocationToStaff = (staffId: number) => {
    setTimeout(() => {
      setStaffData((prev) =>
        prev.map((staff) => {
          if (staff.id === staffId && !staff.assignedLocation) {
            const randomLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)]
            return {
              ...staff,
              assignedLocation: randomLocation,
            }
          }
          return staff
        }),
      )
    }, 2000)
  }

  const addClockEntry = (staffId: number, type: "in" | "out", isManual = false) => {
    setStaffData((prev) =>
      prev.map((staff) => {
        if (staff.id === staffId) {
          const newEntry = {
            timestamp: new Date().toISOString(),
            type,
            isManual,
          }
          const updatedStaff: any = {
            ...staff,
            clockEntries: [...staff.clockEntries, newEntry],
            currentStatus: type === "in" ? "present" : "absent",
            todayActual: type === "in" ? formatTime(new Date()) : staff.todayActual,
          }

          if (type === "in" && !staff.assignedLocation) {
            assignLocationToStaff(staffId)
          }

          if (type === "out") {
            updatedStaff.assignedLocation = undefined
          }

          return updatedStaff
        }
        return staff
      }),
    )
  }

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isCardSwipeDisabled && !isLoginOpen && !isAdminLoginOpen) {
        if (event.key === "Enter" && cardSwipeData.length > 0) {
          handleCardSwipe(cardSwipeData)
          setCardSwipeData("")
        } else if (event.key.length === 1) {
          setCardSwipeData((prev) => prev + event.key)
          setIsCardSwiping(true)

          setTimeout(() => {
            setIsCardSwiping(false)
            setCardSwipeData("")
          }, 2000)
        }
      }
    }

    window.addEventListener("keypress", handleKeyPress)
    return () => window.removeEventListener("keypress", handleKeyPress)
  }, [cardSwipeData, isCardSwipeDisabled, isLoginOpen, isAdminLoginOpen])

  const handleCardSwipe = (cardData: string) => {
    const cardNumber = parsePolycardNumber(cardData) || cardData.toUpperCase()
    const staff = staffData.find((s) => s.cardId === cardNumber)

    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"

      addClockEntry(staff.id, action)

      setClockInMessage(`${staff.name} clocked ${action} at ${formatTime(new Date())}`)
      setShowClockInSuccess(true)

      setTimeout(() => {
        setShowClockInSuccess(false)
        setClockInMessage("")
      }, 5000)
    } else {
      setClockInMessage("Card not recognized. Please swipe your card again or manually clock in.")
      setShowClockInSuccess(true)

      setTimeout(() => {
        setShowClockInSuccess(false)
        setClockInMessage("")
      }, 3000)
    }
  }

  const handleManualClockIn = (staffId: number, isManual: boolean) => {
    const staff = staffData.find((s) => s.id === staffId)

    if (staff) {
      const isCurrentlyPresent = staff.currentStatus === "present"
      const action = isCurrentlyPresent ? "out" : "in"

      addClockEntry(staff.id, action, isManual)

      const manualFlag = isManual ? " (Manual Entry)" : ""
      setClockInMessage(`${staff.name} clocked ${action} at ${formatTime(new Date())}${manualFlag}`)
      setShowClockInSuccess(true)
      setIsLoginOpen(false)

      setTimeout(() => {
        setShowClockInSuccess(false)
        setClockInMessage("")
      }, 5000)
    }
  }

  const handleManualClockOut = (staffId: number, isManual: boolean) => {
    const staff = staffData.find((s) => s.id === staffId)

    if (staff) {
      addClockEntry(staff.id, "out", isManual)

      const manualFlag = isManual ? " (Manual Entry)" : ""
      setClockInMessage(`${staff.name} clocked out at ${formatTime(new Date())}${manualFlag}`)
      setShowClockInSuccess(true)
      setIsClockOutOpen(false)

      setTimeout(() => {
        setShowClockInSuccess(false)
        setClockInMessage("")
      }, 5000)
    }
  }

  const handleAdminLogin = (username: string, password: string) => {
    if (username === "admin" && password === "admin123") {
      setIsAdminLoginOpen(false)
      router.push("/admin")
      return true
    }
    return false
  }

  return (
    <PublicDashboard
      currentTime={currentTime}
      staffData={staffData}
      isLoginOpen={isLoginOpen}
      isClockOutOpen={isClockOutOpen}
      isAdminLoginOpen={isAdminLoginOpen}
      isCardSwiping={isCardSwiping}
      showClockInSuccess={showClockInSuccess}
      clockInMessage={clockInMessage}
      onToggleLogin={() => {
        setIsLoginOpen(!isLoginOpen)
        setIsCardSwipeDisabled(!isLoginOpen)
      }}
      onToggleClockOut={() => {
        setIsClockOutOpen(!isClockOutOpen)
        setIsCardSwipeDisabled(!isClockOutOpen)
      }}
      onToggleAdminLogin={() => {
        setIsAdminLoginOpen(!isAdminLoginOpen)
        setIsCardSwipeDisabled(!isAdminLoginOpen)
      }}
      onManualClockIn={handleManualClockIn}
      onManualClockOut={handleManualClockOut}
      onAdminLogin={handleAdminLogin}
    />
  )
}

