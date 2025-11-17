/**
 * Helper functions for daily breakdown components
 */

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type DailyBreakdownDay } from "../utils/student-calculations"

export function getStatusBadge(status: string) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return { badge: <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs">✓</Badge>, tooltip: "Completed: All shifts completed with clock-ins and clock-outs" }
      case "absent":
        return { badge: <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs">✗</Badge>, tooltip: "Absent: No clock-in recorded for scheduled shift" }
      case "no-clock-out":
        return { badge: <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs">!</Badge>, tooltip: "Missing Clock-Out: Clock-in recorded but no matching clock-out" }
      case "day-off":
        return { badge: <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs">Day Off</Badge>, tooltip: "Day Off: No work scheduled for this day" }
      case "not-scheduled":
        return { badge: <Badge className="bg-muted text-muted-foreground text-xs">—</Badge>, tooltip: "Not Scheduled: No schedule assigned for this day" }
      case "unscheduled-work":
        return { badge: <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs">*</Badge>, tooltip: "Unscheduled Work: Work performed outside of scheduled shift times" }
      default:
        return { badge: <Badge variant="outline" className="text-xs">{status}</Badge>, tooltip: status }
    }
  }
  
  const { badge, tooltip } = getStatusInfo(status)
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function getHoursStatus(expectedHours: number, actualHours: number) {
  const diff = actualHours - expectedHours
  const threshold = 0.1 // 0.1 hour (6 minutes) threshold
  
  if (actualHours === 0) {
    return null
  }
  
  if (Math.abs(diff) <= threshold) {
    return {
      text: "Hours Met",
      color: "text-green-600 dark:text-green-400",
      tooltip: `Hours Met: Actual (${actualHours.toFixed(1)}h) matches expected (${expectedHours.toFixed(1)}h)`
    }
  } else if (diff < -threshold) {
    return {
      text: "Under Hours",
      color: "text-orange-600 dark:text-orange-400",
      tooltip: `Under Hours: Actual (${actualHours.toFixed(1)}h) is ${Math.abs(diff).toFixed(1)}h less than expected (${expectedHours.toFixed(1)}h)`
    }
  } else {
    return {
      text: "Over Hours",
      color: "text-blue-600 dark:text-blue-400",
      tooltip: `Over Hours: Actual (${actualHours.toFixed(1)}h) is ${diff.toFixed(1)}h more than expected (${expectedHours.toFixed(1)}h)`
    }
  }
}

export function renderHoursIndicator(day: DailyBreakdownDay) {
  const hoursStatus = getHoursStatus(day.expectedHours, day.actualHours)
  if (!hoursStatus) return null
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`text-xs font-medium cursor-help ${hoursStatus.color}`}>
            {hoursStatus.text === "Hours Met" ? "✓" : hoursStatus.text === "Under Hours" ? "↓" : "↑"}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hoursStatus.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}



