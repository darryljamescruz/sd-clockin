'use client';

import { Button } from '@/components/ui/button';
import { TermSelector } from './term-selector';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Term } from '@/types';

interface DashboardHeaderProps {
  terms: Term[];
  selectedTerm: string;
  onTermChange: (termName: string) => void;
  selectedDate: Date;
  currentDateIndex: number;
  termWeekdays: Date[];
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  getTermStatus: () => { status: string };
}

export function DashboardHeader({
  terms,
  selectedTerm,
  onTermChange,
  selectedDate,
  currentDateIndex,
  termWeekdays,
  onPreviousDay,
  onNextDay,
  onToday,
  getTermStatus,
}: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-slate-900">
        Attendance Dashboard
      </h2>
      <div className="flex items-center gap-4">
        <TermSelector
          terms={terms}
          selectedTerm={selectedTerm}
          onTermChange={onTermChange}
        />

        {/* Day Navigation */}
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousDay}
            disabled={currentDateIndex <= 0}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-sm font-medium text-slate-900 min-w-[120px] text-center">
            {selectedDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onNextDay}
            disabled={currentDateIndex >= termWeekdays.length - 1}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            disabled={getTermStatus().status === 'future'}
            className="ml-2 h-7 text-xs bg-transparent"
          >
            Today
          </Button>
        </div>
      </div>
    </div>
  );
}
