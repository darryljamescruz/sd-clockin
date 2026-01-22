/**
 * Student search and selection component
 */

"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Shield, UserCheck } from "lucide-react"
import { type Student } from "@/lib/api"

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
    <Card ref={searchSectionRef} className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardContent className="pt-6">
        <div className="space-y-4">
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
        </div>
        {/* Show search results only when user is searching */}
        {searchQuery && filteredStaff.length > 0 && (
          <div className="mt-4">
            {/* List layout for search results */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredStaff.map((staff) => (
                <Button
                  key={staff.id}
                  variant={selectedStaff?.id === staff.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => {
                    onSelectStaff(staff)
                    setSearchQuery("")
                  }}
                >
                  {staff.role === "Student Lead" ? (
                    <Shield className="w-4 h-4 mr-2" />
                  ) : (
                    <UserCheck className="w-4 h-4 mr-2" />
                  )}
                  <span className="truncate">{staff.name}</span>
                  {selectedStaff?.id === staff.id && (
                    <Badge className="ml-auto bg-green-100 text-green-800">Selected</Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
        {searchQuery && filteredStaff.length === 0 && (
          <div className="mt-4 text-center text-muted-foreground text-sm">
            No staff members found matching "{searchQuery}"
          </div>
        )}
        {!searchQuery && (
          <div className="mt-4 text-center text-muted-foreground text-sm">
            Start typing to search for a student assistant...
          </div>
        )}
      </CardContent>
    </Card>
  )
}




