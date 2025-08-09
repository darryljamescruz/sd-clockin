'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, UserCheck, BarChart3 } from 'lucide-react';

interface ClockEntry {
  timestamp: string;
  type: 'in' | 'out';
  isManual?: boolean;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  iso: string;
  clockEntries: ClockEntry[];
  weeklySchedule?: {
    monday?: string[];
    tuesday?: string[];
    wednesday?: string[];
    thursday?: string[];
    friday?: string[];
    saturday?: string[];
    sunday?: string[];
  };
}

interface IndividualRecordsProps {
  staffData: Staff[];
  selectedStaff: Staff | null;
  onSelectStaff: (staff: Staff | null) => void;
  selectedTerm: string;
  termStartDate?: string;
  termEndDate?: string;
}

export function IndividualRecords({
  staffData,
  selectedStaff,
  onSelectStaff,
  selectedTerm,
  termStartDate,
  termEndDate,
}: IndividualRecordsProps) {
  const getRoleBadge = (role: string) => {
    if (role === 'Student Lead') {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Shield className="w-3 h-3 mr-1" />
          Student Lead
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">
          <UserCheck className="w-3 h-3 mr-1" />
          Assistant
        </Badge>
      );
    }
  };

  const getEntryTypeBadge = (entry: {
    type: 'in' | 'out';
    isManual?: boolean;
  }) => {
    const baseClass =
      entry.type === 'in'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';
    const label = entry.type === 'in' ? 'Clock In' : 'Clock Out';

    return (
      <div className="flex items-center gap-1">
        <Badge className={baseClass}>{label}</Badge>
        {entry.isManual && (
          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
            Manual
          </Badge>
        )}
      </div>
    );
  };

  // Group entries by day with in/out pairing
  const groupedDayEntries = (() => {
    if (!selectedStaff) return [] as Array<{ dateKey: string; dateObj: Date; clockIn?: ClockEntry; clockOut?: ClockEntry; }>; 
    const map = new Map<string, { dateObj: Date; clockIn?: ClockEntry; clockOut?: ClockEntry }>();
    for (const entry of selectedStaff.clockEntries) {
      const d = new Date(entry.timestamp);
      const dayOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const key = dayOnly.toISOString();
      const rec = map.get(key) || { dateObj: dayOnly };
      if (entry.type === 'in') {
        if (!rec.clockIn || new Date(entry.timestamp) < new Date(rec.clockIn.timestamp)) rec.clockIn = entry;
      } else {
        if (!rec.clockOut || new Date(entry.timestamp) > new Date(rec.clockOut.timestamp)) rec.clockOut = entry;
      }
      map.set(key, rec);
    }
    return Array.from(map.entries())
      .map(([dateKey, value]) => ({ dateKey, ...value }))
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  })();

  const analytics = (() => {
    if (!selectedStaff || !termStartDate || !termEndDate) return null;
    const start = new Date(termStartDate);
    const end = new Date(termEndDate);
    const entriesInTerm = selectedStaff.clockEntries.filter((e) => {
      const t = new Date(e.timestamp);
      return t >= start && t <= end;
    });
    const ins = entriesInTerm.filter((e) => e.type === 'in');
    const manual = entriesInTerm.filter((e) => e.isManual).length;
    const days = new Set(ins.map((e) => new Date(e.timestamp).toDateString())).size;
    const mins = ins.map((e) => {
      const d = new Date(e.timestamp);
      return d.getHours() * 60 + d.getMinutes();
    });
    const avgMin = mins.length ? mins.reduce((a, b) => a + b, 0) / mins.length : 0;
    const avgArr = mins.length ? formatMinutesToTime(avgMin) : 'N/A';
    let onTime = 0;
    for (const e of ins) {
      const expected = getExpectedStartTimeForDate(selectedStaff, new Date(e.timestamp));
      if (expected) {
        const expectedMin = timeToMinutes(expected);
        const d = new Date(e.timestamp);
        const actual = d.getHours() * 60 + d.getMinutes();
        if (actual <= expectedMin + 5) onTime++;
      } else {
        onTime++;
      }
    }
    const punctuality = ins.length ? (onTime / ins.length) * 100 : 0;
    return { attendanceDays: days, totalClockIns: ins.length, manualEntries: manual, avgArrival: avgArr, punctuality };
  })();

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Select Staff Member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant={selectedStaff === null ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => onSelectStaff(null)}
            >
              View All Students
            </Button>
            {staffData.map((staff) => (
              <Button
                key={staff.id}
                variant={selectedStaff?.id === staff.id ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => onSelectStaff(staff)}
              >
                {staff.role === 'Student Lead' ? (
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
        <Card className="lg:col-span-2 bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                {selectedStaff.role === 'Student Lead' ? (
                  <Shield className="w-6 h-6 text-blue-600" />
                ) : (
                  <UserCheck className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <div>
                <div className="text-slate-900">{selectedStaff.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge(selectedStaff.role)}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  ISO: {selectedStaff.iso} • Term: {selectedTerm}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analytics && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Performance Analytics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 rounded-md border bg-white">
                      <div className="text-slate-500">Attendance Days</div>
                      <div className="text-slate-900 font-semibold">{analytics.attendanceDays}</div>
                    </div>
                    <div className="p-3 rounded-md border bg-white">
                      <div className="text-slate-500">Total Clock-ins</div>
                      <div className="text-slate-900 font-semibold">{analytics.totalClockIns}</div>
                    </div>
                    <div className="p-3 rounded-md border bg-white">
                      <div className="text-slate-500">Avg Arrival</div>
                      <div className="text-slate-900 font-mono">{analytics.avgArrival}</div>
                    </div>
                    <div className="p-3 rounded-md border bg-white">
                      <div className="text-slate-500">Punctuality</div>
                      <div className="text-slate-900 font-semibold">{analytics.punctuality.toFixed(1)}%</div>
                    </div>
                    <div className="p-3 rounded-md border bg-white">
                      <div className="text-slate-500">Manual Entries</div>
                      <div className="text-slate-900 font-semibold">{analytics.manualEntries}</div>
                    </div>
                  </div>
                </div>
              )}
              <h4 className="font-semibold text-slate-900">
                Clock In/Out History
              </h4>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-700">Date</TableHead>
                    <TableHead className="text-slate-700">Clock In</TableHead>
                    <TableHead className="text-slate-700">Clock Out</TableHead>
                    <TableHead className="text-slate-700">Day</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedDayEntries.length > 0 ? (
                    groupedDayEntries.map((row, index) => {
                      const date = row.dateObj;
                      return (
                        <TableRow key={row.dateKey + index} className="border-slate-100">
                          <TableCell className="font-mono text-slate-900">
                            {date.toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-mono text-slate-900">
                            {row.clockIn ? new Date(row.clockIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </TableCell>
                          <TableCell className="font-mono text-slate-900">
                            {row.clockOut ? new Date(row.clockOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {date.toLocaleDateString('en-US', { weekday: 'long' })}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-slate-500"
                      >
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
  );
}

function timeToMinutes(timeStr: string) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [time, period] = timeStr.split(' ');
  if (!time) return 0;
  const timeParts = time.split(':');
  const hours = Number(timeParts[0]);
  const minutes = Number(timeParts[1] || 0);
  let total = hours * 60 + minutes;
  if (period === 'PM' && hours !== 12) total += 12 * 60;
  if (period === 'AM' && hours === 12) total -= 12 * 60;
  return total;
}

function formatMinutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

function getExpectedStartTimeForDate(staff: Staff, date: Date) {
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const;
  const dayName = dayNames[date.getDay()];
  const daySchedule = staff.weeklySchedule?.[dayName] || [];
  if (!daySchedule || daySchedule.length === 0) return null;
  const firstBlock = daySchedule[0];
  const startTime = firstBlock.split('-')[0].trim();
  if (startTime.includes(':')) {
    return startTime.includes('AM') || startTime.includes('PM') ? startTime : `${startTime} AM`;
  } else {
    const hour = Number.parseInt(startTime);
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  }
}
