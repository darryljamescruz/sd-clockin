'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, ChevronDown } from 'lucide-react';

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface TermSelectorProps {
  terms: Term[];
  selectedTerm: string;
  onTermChange: (termName: string) => void;
}

export function TermSelector({
  terms,
  selectedTerm,
  onTermChange,
}: TermSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-white border-slate-200 hover:bg-slate-50"
        >
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
            className={selectedTerm === term.name ? 'bg-slate-100' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium">{term.name}</span>
              <span className="text-xs text-slate-500">
                {new Date(term.startDate).toLocaleDateString()} -{' '}
                {new Date(term.endDate).toLocaleDateString()}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
