/**
 * Student search and selection component
 */

"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Shield, UserCheck, Check } from "lucide-react"
import { type Student } from "@/lib/api"
import { cn } from "@/lib/utils"

interface StudentSearchProps {
  staffData: Student[]
  selectedStaff: Student | null
  onSelectStaff: (staff: Student) => void
  searchSectionRef: React.RefObject<HTMLDivElement>
}

export function StudentSearch({ staffData, selectedStaff, onSelectStaff, searchSectionRef }: StudentSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter staff based on search query
  // Always only show Student Lead and Student Assistant roles
  const filteredStaff = useMemo(() => {
    // First, filter to only include Student Lead and Student Assistant
    const eligibleStaff = staffData.filter(staff => 
      staff.role === "Student Assistant" || staff.role === "Student Lead"
    )
    
    // If no search query, show all eligible staff
    if (!searchQuery) {
      return eligibleStaff
    }
    
    // Otherwise, apply search filter on eligible staff
    return eligibleStaff.filter(staff => 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.cardId.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [staffData, searchQuery])

  return (
    <Card ref={searchSectionRef}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Search className="w-4 h-4" />
          Search Student
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by name or card ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Show search results only when user is searching */}
        {searchQuery && filteredStaff.length > 0 && (
          <ScrollArea className="mt-3 max-h-64">
            <div className="space-y-1">
              {filteredStaff.map((staff) => {
                const isSelected = selectedStaff?.id === staff.id
                return (
                  <button
                    key={staff.id}
                    onClick={() => {
                      onSelectStaff(staff)
                      setSearchQuery("")
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
                      staff.role === "Student Lead"
                        ? isSelected ? "bg-primary-foreground/20" : "bg-blue-100 dark:bg-blue-900/30"
                        : isSelected ? "bg-primary-foreground/20" : "bg-muted"
                    )}>
                      {staff.role === "Student Lead" ? (
                        <Shield className={cn("w-4 h-4", isSelected ? "text-primary-foreground" : "text-blue-600 dark:text-blue-400")} />
                      ) : (
                        <UserCheck className={cn("w-4 h-4", isSelected ? "text-primary-foreground" : "text-muted-foreground")} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("font-medium truncate", isSelected ? "text-primary-foreground" : "text-foreground")}>
                        {staff.name}
                      </div>
                      <div className={cn("text-xs truncate", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {staff.cardId} · {staff.role}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
        
        {searchQuery && filteredStaff.length === 0 && (
          <div className="mt-4 py-6 text-center">
            <div className="text-muted-foreground text-sm">
              No students found matching "<span className="font-medium">{searchQuery}</span>"
            </div>
          </div>
        )}
        
        {!searchQuery && (
          <div className="mt-3 py-4 text-center border border-dashed rounded-md">
            <Search className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <div className="text-muted-foreground text-sm">
              Type to search for a student
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}




