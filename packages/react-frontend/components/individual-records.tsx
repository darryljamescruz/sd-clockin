"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Shield, UserCheck } from "lucide-react"
import { type Student } from "@/lib/api"

interface IndividualRecordsProps {
  staffData: Student[]
  selectedStaff: Student | null
  onSelectStaff: (staff: Student) => void
  selectedTerm: string
}

export function IndividualRecords({ staffData, selectedStaff, onSelectStaff, selectedTerm }: IndividualRecordsProps) {
  const getRoleBadge = (role: string) => {
    if (role === "Student Lead") {
      return (
        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-100">
          <Shield className="w-3 h-3 mr-1" />
          Student Lead
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-secondary text-secondary-foreground hover:bg-slate-100">
          <UserCheck className="w-3 h-3 mr-1" />
          Assistant
        </Badge>
      )
    }
  }

  const getEntryTypeBadge = (entry: { type: "in" | "out"; isManual?: boolean }) => {
    const baseClass = entry.type === "in" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    const label = entry.type === "in" ? "Clock In" : "Clock Out"
    const manualFlag = entry.isManual ? " (Manual)" : ""

    return (
      <div className="flex items-center gap-1">
        <Badge className={baseClass}>{label}</Badge>
        {entry.isManual && <Badge className="bg-yellow-100 text-yellow-800 text-xs">Manual</Badge>}
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground">Select Staff Member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {staffData.map((staff) => (
              <Button
                key={staff.id}
                variant={selectedStaff?.id === staff.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => onSelectStaff(staff)}
              >
                {staff.role === "Student Lead" ? (
                  <Shield className="w-4 h-4 mr-2" />
                ) : (
                  <UserCheck className="w-4 h-4 mr-2" />
                )}
                {staff.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedStaff && (
        <Card className="lg:col-span-2 bg-card/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                {selectedStaff.role === "Student Lead" ? (
                  <Shield className="w-6 h-6 text-blue-600" />
                ) : (
                  <UserCheck className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="text-foreground">{selectedStaff.name}</div>
                <div className="flex items-center gap-2 mt-1">{getRoleBadge(selectedStaff.role)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Card ID: {selectedStaff.cardId} • Term: {selectedTerm}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Clock In/Out History</h4>
              <Table>
                <TableHeader>
                  <TableRow className="">
                    <TableHead className="text-foreground">Date & Time</TableHead>
                    <TableHead className="text-foreground">Type</TableHead>
                    <TableHead className="text-foreground">Day</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedStaff.clockEntries.length > 0 ? (
                    selectedStaff.clockEntries
                      .slice()
                      .reverse()
                      .map((entry, index) => {
                        const date = new Date(entry.timestamp)
                        return (
                          <TableRow key={index} className="border-slate-100">
                            <TableCell className="font-mono text-foreground">{date.toLocaleString()}</TableCell>
                            <TableCell>{getEntryTypeBadge(entry)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {date.toLocaleDateString("en-US", { weekday: "long" })}
                            </TableCell>
                          </TableRow>
                        )
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No clock entries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
