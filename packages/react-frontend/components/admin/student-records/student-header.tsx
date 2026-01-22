/**
 * Student header component displaying student information
 */

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Shield, UserCheck, Loader2, CreditCard } from "lucide-react"
import { type Student } from "@/lib/api"

interface StudentHeaderProps {
  selectedStaff: Student
  isLoadingStudent?: boolean
  studentInfoRef: React.RefObject<HTMLDivElement>
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getRoleBadge(role: string) {
  if (role === "Student Lead") {
    return (
      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
        <Shield className="w-3 h-3 mr-1.5" />
        Student Lead
      </Badge>
    )
  } else {
    return (
      <Badge variant="secondary">
        <UserCheck className="w-3 h-3 mr-1.5" />
        Student Assistant
      </Badge>
    )
  }
}

export function StudentHeader({ selectedStaff, isLoadingStudent = false, studentInfoRef }: StudentHeaderProps) {
  return (
    <Card ref={studentInfoRef} className="scroll-mt-4">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className={`text-lg font-semibold ${
              selectedStaff.role === "Student Lead" 
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" 
                : "bg-muted"
            }`}>
              {getInitials(selectedStaff.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold text-foreground truncate">{selectedStaff.name}</h2>
              {isLoadingStudent && (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {getRoleBadge(selectedStaff.role)}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CreditCard className="w-3.5 h-3.5" />
                <span className="font-mono">{selectedStaff.cardId}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}




