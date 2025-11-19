/**
 * Student header component displaying student information
 */

"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, UserCheck, Loader2 } from "lucide-react"
import { type Student } from "@/lib/api"

interface StudentHeaderProps {
  selectedStaff: Student
  selectedTerm: string
  isLoadingStudent?: boolean
  studentInfoRef: React.RefObject<HTMLDivElement>
}

function getRoleBadge(role: string) {
  if (role === "Student Lead") {
    return (
      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-100">
        <Shield className="w-3 h-3 mr-1" />
        Student Lead
      </Badge>
    )
  } else {
    return (
      <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
        <UserCheck className="w-3 h-3 mr-1" />
        Student Assistant
      </Badge>
    )
  }
}

export function StudentHeader({ selectedStaff, selectedTerm, isLoadingStudent = false, studentInfoRef }: StudentHeaderProps) {
  return (
    <Card ref={studentInfoRef} className="bg-card/70 backdrop-blur-sm shadow-lg scroll-mt-4">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            {selectedStaff.role === "Student Lead" ? (
              <Shield className="w-7 h-7 text-blue-600" />
            ) : (
              <UserCheck className="w-7 h-7 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-foreground">{selectedStaff.name}</CardTitle>
              {isLoadingStudent && (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">{getRoleBadge(selectedStaff.role)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Card ID: {selectedStaff.cardId} • Term: {selectedTerm}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}




