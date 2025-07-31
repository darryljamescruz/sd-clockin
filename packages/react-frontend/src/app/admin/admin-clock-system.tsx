'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '../../components/dashboard-header';
import { StatsCards } from '../../components/stats-cards';
import { IndividualRecords } from '../../components/individual-records';
import { TermAnalytics } from '../../components/term-analytics';
import { TermOverview } from '../../components/term-overview';
import {
  getCurrentTerm,
  getTermStatus,
  getTermWeekdays,
  getWeeklyStats,
} from '../../utils/clockUtils';
import { useAdminData } from './admin-data-context';

export default function AdminClockSystem() {
  const { terms, staffData } = useAdminData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateError, setDateError] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Fall 2025');
  const [selectedStaff, setSelectedStaff] = useState(null);


  const currentTerm = getCurrentTerm(terms, selectedTerm);
  const termWeekdays = getTermWeekdays(currentTerm);
  const currentDateIndex = termWeekdays.findIndex(
    (date) => date.toDateString() === selectedDate.toDateString()
  );

  const goToPreviousDay = () => {
    if (currentDateIndex > 0) {
      setSelectedDate(termWeekdays[currentDateIndex - 1]);
    }
  };

  const goToNextDay = () => {
    if (currentDateIndex < termWeekdays.length - 1) {
      setSelectedDate(termWeekdays[currentDateIndex + 1]);
    }
  };

  const goToToday = () => {
    const today = new Date();
    const termStatus = getTermStatus(currentTerm);

    if (termStatus.status === 'future') {
      setDateError(
        "Cannot view today's attendance for a future term. This term hasn't started yet."
      );
      setTimeout(() => setDateError(''), 5000);
      return;
    }

    const todayInTerm = termWeekdays.find(
      (date) => date.toDateString() === today.toDateString()
    );
    if (todayInTerm) {
      setSelectedDate(todayInTerm);
      setDateError('');
    } else {
      if (termStatus.status === 'past') {
        setSelectedDate(termWeekdays[termWeekdays.length - 1]);
        setDateError('');
      } else {
        setDateError('Today is not within the selected term period.');
        setTimeout(() => setDateError(''), 5000);
      }
    }
  };

  const getDefaultDateForTerm = () => {
    const today = new Date();
    const termStatus = getTermStatus(currentTerm);

    if (termStatus.status === 'current') {
      const todayInTerm = termWeekdays.find(
        (date) => date.toDateString() === today.toDateString()
      );
      return todayInTerm || termWeekdays[0];
    } else if (termStatus.status === 'past') {
      return termWeekdays[termWeekdays.length - 1];
    } else {
      return termWeekdays[0];
    }
  };

  useEffect(() => {
    if (termWeekdays.length > 0) {
      setSelectedDate(getDefaultDateForTerm());
      setDateError('');
    }
  }, [selectedTerm]);

  const stats = getWeeklyStats(staffData);

  return (
      <div className="max-w-7xl mx-auto px-6">
        <StatsCards
          totalStaff={stats.totalStaff}
          presentStaff={stats.presentStaff}
          studentLeads={stats.studentLeads}
          lateToday={stats.lateToday}
        />

        {dateError && (
          <Card className="mb-6 bg-red-50 border-red-200 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{dateError}</span>
            </CardContent>
          </Card>
        )}

        <DashboardHeader
          terms={terms}
          selectedTerm={selectedTerm}
          onTermChange={setSelectedTerm}
          selectedDate={selectedDate}
          currentDateIndex={currentDateIndex}
          termWeekdays={termWeekdays}
          onPreviousDay={goToPreviousDay}
          onNextDay={goToNextDay}
          onToday={goToToday}
          getTermStatus={() => getTermStatus(currentTerm)}
        />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/70 backdrop-blur-sm border-slate-200">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Term Analytics</TabsTrigger>
            <TabsTrigger value="individual">Individual Records</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <TermOverview
              staffData={staffData}
              selectedTerm={selectedTerm}
              currentTerm={currentTerm}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <TermAnalytics
              staffData={staffData}
              selectedTerm={selectedTerm}
              termStartDate={currentTerm.startDate}
              termEndDate={currentTerm.endDate}
            />
          </TabsContent>

          <TabsContent value="individual">
            <IndividualRecords
              staffData={staffData}
              selectedStaff={selectedStaff}
              onSelectStaff={setSelectedStaff}
              selectedTerm={selectedTerm}
            />
          </TabsContent>
        </Tabs>

      </div>
  );
}
