// packages/react-frontend/src/app/components/clock-display.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"

interface ClockDisplayProps {
  currentTime: Date
}

export function ClockDisplay({ currentTime }: ClockDisplayProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card className="mb-8 bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardContent className="p-8 text-center">
        <div className="space-y-2">
          <div className="text-6xl font-mono font-bold text-slate-900 tracking-tight">
            {formatTime(currentTime)}
          </div>
          <div className="text-xl text-slate-600 flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5" />
            {formatDate(currentTime)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}