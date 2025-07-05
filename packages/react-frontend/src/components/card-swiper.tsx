"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"

interface CardSwiperProps {
  onCardSwipe: (cardData: string) => void
  isDisabled: boolean
  isCardSwiping: boolean
  showClockInSuccess: boolean
  clockInMessage: string
}

export function CardSwiper({ 
  onCardSwipe, 
  isDisabled, 
  isCardSwiping, 
  showClockInSuccess, 
  clockInMessage 
}: CardSwiperProps) {
  const [cardSwipeData, setCardSwipeData] = useState("")

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isDisabled) {
        if (event.key === "Enter" && cardSwipeData.length > 0) {
          onCardSwipe(cardSwipeData)
          setCardSwipeData("")
        } else if (event.key.length === 1) {
          setCardSwipeData((prev) => prev + event.key)
        }
      }
    }

    window.addEventListener("keypress", handleKeyPress)
    return () => window.removeEventListener("keypress", handleKeyPress)
  }, [cardSwipeData, isDisabled, onCardSwipe])

  // Clear card data after timeout
  useEffect(() => {
    if (cardSwipeData.length > 0) {
      const timeout = setTimeout(() => {
        setCardSwipeData("")
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [cardSwipeData])

  return (
    <>
      {/* Card Swiper Status */}
      {isCardSwiping && (
        <Card className="mb-6 status-info shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-blue-600 animate-pulse" />
            <span className="text-blue-800 font-medium">Card detected... Please wait</span>
          </CardContent>
        </Card>
      )}

      {/* Clock In Success Message */}
      {showClockInSuccess && (
        <Card className="mb-6 status-success shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{clockInMessage}</span>
          </CardContent>
        </Card>
      )}

      {/* Card Swiper Instructions */}
      <Card className="mb-8 bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Quick Clock In/Out</h3>
              <p className="text-slate-600">Swipe your ID card to clock in or out automatically</p>
              <p className="text-sm text-slate-500 mt-1">Or use manual clock in for backup</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
} 