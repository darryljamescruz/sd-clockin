"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, ChevronDown } from "lucide-react"
import { formatDateString } from "@/lib/utils"

interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface TermSelectorProps {
  terms: Term[]
  selectedTerm: string
  onTermChange: (termName: string) => void
}

export function TermSelector({ terms, selectedTerm, onTermChange }: TermSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          {selectedTerm}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {terms.map((term) => (
          <DropdownMenuItem
            key={term.id}
            onClick={() => onTermChange(term.name)}
            className={selectedTerm === term.name ? "bg-accent" : ""}
          >
            <div className="flex flex-col">
              <span className="font-medium">{term.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDateString(term.startDate)} - {formatDateString(term.endDate)}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
