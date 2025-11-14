/**
 * Weekly breakdown component
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { type WeeklyBreakdown } from "./utils/student-calculations"

interface WeeklyBreakdownProps {
  weeklyBreakdown: WeeklyBreakdown
  totalExpected: number
  totalActual: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function WeeklyBreakdown({
  weeklyBreakdown,
  totalExpected,
  totalActual,
  isOpen,
  onOpenChange,
}: WeeklyBreakdownProps) {
  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Hours Breakdown
              </div>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead className="text-right">Expected Hours</TableHead>
                  <TableHead className="text-right">Actual Hours</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead className="text-right">Shifts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyBreakdown.map((week) => {
                  const diff = week.actualHours - week.expectedHours
                  return (
                    <TableRow key={week.weekNum}>
                      <TableCell className="font-medium">Week {week.weekNum}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right font-mono">{week.expectedHours.toFixed(1)}h</TableCell>
                      <TableCell className="text-right font-mono">{week.actualHours.toFixed(1)}h</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono ${diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {diff >= 0 ? '+' : ''}{diff.toFixed(1)}h
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{week.shifts}</TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right font-mono">{totalExpected.toFixed(1)}h</TableCell>
                  <TableCell className="text-right font-mono">{totalActual.toFixed(1)}h</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono ${totalActual >= totalExpected ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {totalActual >= totalExpected ? '+' : ''}{(totalActual - totalExpected).toFixed(1)}h
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{weeklyBreakdown.reduce((sum, w) => sum + w.shifts, 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}


