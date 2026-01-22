/**
 * Weekly breakdown component
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react"
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
  const totalDiff = totalActual - totalExpected
  
  return (
    <Card className="h-full">
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-base font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Weekly Hours Breakdown
              </div>
              <div className="flex items-center gap-2">
                {!isOpen && (
                  <Badge variant="secondary" className="font-normal">
                    {weeklyBreakdown.length} weeks
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Week</TableHead>
                    <TableHead className="font-semibold">Date Range</TableHead>
                    <TableHead className="text-right font-semibold">Expected</TableHead>
                    <TableHead className="text-right font-semibold">Actual</TableHead>
                    <TableHead className="text-right font-semibold">Diff</TableHead>
                    <TableHead className="text-right font-semibold">Shifts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyBreakdown.map((week) => {
                    const diff = week.actualHours - week.expectedHours
                    const isPositive = diff > 0.1
                    const isNegative = diff < -0.1
                    return (
                      <TableRow key={week.weekNum}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {week.weekNum}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{week.expectedHours.toFixed(1)}h</TableCell>
                        <TableCell className="text-right font-mono text-sm">{week.actualHours.toFixed(1)}h</TableCell>
                        <TableCell className="text-right">
                          <div className={`inline-flex items-center gap-1 font-mono text-sm ${
                            isPositive ? 'text-green-600 dark:text-green-400' : 
                            isNegative ? 'text-orange-600 dark:text-orange-400' : 
                            'text-muted-foreground'
                          }`}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : 
                             isNegative ? <TrendingDown className="w-3 h-3" /> : 
                             <Minus className="w-3 h-3" />}
                            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}h
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm text-muted-foreground">{week.shifts}</span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="bg-muted/30 font-medium border-t-2">
                    <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-mono text-sm">{totalExpected.toFixed(1)}h</TableCell>
                    <TableCell className="text-right font-mono text-sm">{totalActual.toFixed(1)}h</TableCell>
                    <TableCell className="text-right">
                      <div className={`inline-flex items-center gap-1 font-mono text-sm font-semibold ${
                        totalDiff > 0.1 ? 'text-green-600 dark:text-green-400' : 
                        totalDiff < -0.1 ? 'text-orange-600 dark:text-orange-400' : 
                        'text-muted-foreground'
                      }`}>
                        {totalDiff > 0.1 ? <TrendingUp className="w-3 h-3" /> : 
                         totalDiff < -0.1 ? <TrendingDown className="w-3 h-3" /> : 
                         <Minus className="w-3 h-3" />}
                        {totalDiff >= 0 ? '+' : ''}{totalDiff.toFixed(1)}h
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{weeklyBreakdown.reduce((sum, w) => sum + w.shifts, 0)}</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}




