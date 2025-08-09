'use client';

import { useEffect, useState } from 'react';
import { IndividualRecords } from '../../../components/individual-records';
import { TermAnalytics } from '../../../components/term-analytics';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TermSelector } from '../../../components/term-selector';
import { useAdminData } from '../admin-data-context';

export default function IndividualRecordsPage() {
  const { terms, staffData } = useAdminData();
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [activeView, setActiveView] = useState<'all' | 'individual'>('all');

  useEffect(() => {
    if (terms && terms.length > 0) {
      const defaultTerm = terms.find((t) => t.isActive)?.name ?? terms[0].name;
      setSelectedTerm(defaultTerm);
    }
  }, [terms]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Records & Analytics</h2>
        <TermSelector terms={terms} selectedTerm={selectedTerm} onTermChange={setSelectedTerm} />
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'all' | 'individual')} className="space-y-6">
        <TabsList className="bg-white/70 backdrop-blur-sm border-slate-200">
          <TabsTrigger value="all">All Students Performance</TabsTrigger>
          <TabsTrigger value="individual">Individual Records</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TermAnalytics
            staffData={staffData}
            selectedTerm={selectedTerm}
            termStartDate={terms.find((t) => t.name === selectedTerm)?.startDate || terms[0]?.startDate || ''}
            termEndDate={terms.find((t) => t.name === selectedTerm)?.endDate || terms[0]?.endDate || ''}
          />
        </TabsContent>

        <TabsContent value="individual">
          <IndividualRecords
            staffData={staffData}
            selectedStaff={selectedStaff}
            onSelectStaff={(s) => {
              setSelectedStaff(s);
              setActiveView(s ? 'individual' : 'all');
            }}
            selectedTerm={selectedTerm}
            termStartDate={terms.find((t) => t.name === selectedTerm)?.startDate}
            termEndDate={terms.find((t) => t.name === selectedTerm)?.endDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


