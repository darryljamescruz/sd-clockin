'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';

interface ClockEntry {
  timestamp: string;
  type: 'in' | 'out';
  isManual?: boolean;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  todayExpected: string;
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

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface TermOverviewProps {
  staffData: Staff[];
  selectedTerm: string;
  currentTerm: Term;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TermOverview({
  staffData,
  selectedTerm,
  currentTerm,
  selectedDate,
  onDateChange,
}: TermOverviewProps) {
  // Check if selected term is current, past, or future
  const getTermStatus = () => {
    const today = new Date();
    const termStart = new Date(currentTerm.startDate);
    const termEnd = new Date(currentTerm.endDate);

    if (today >= termStart && today <= termEnd) {
      return {
        status: 'current',
        label: 'Current Term',
        color: 'bg-green-100 text-green-800',
      };
    } else if (today > termEnd) {
      return {
        status: 'past',
        label: 'Past Term',
        color: 'bg-gray-100 text-gray-800',
      };
    } else {
      return {
        status: 'future',
        label: 'Future Term',
        color: 'bg-blue-100 text-blue-800',
      };
    }
  };

  // Get all weekdays in the term
  const getTermWeekdays = () => {
    const weekdays = [];
    const start = new Date(currentTerm.startDate);
    const end = new Date(currentTerm.endDate);
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday (0) or Saturday (6)
        weekdays.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return weekdays;
  };

  // Get attendance data for a specific date - now creates separate entries for each shift
  const getDayAttendance = (date: Date) => {
    const dateStr = date.toDateString();
    const dayData = [];

    staffData.forEach((staff) => {
      const expectedSchedule = getTodayScheduleForDate(staff, date);

      if (expectedSchedule.length === 0) {
        // No schedule for this day - create one entry showing not scheduled
        dayData.push({
          ...staff,
          status: 'not-scheduled',
          actualTime: null,
          isManual: false,
          currentShift: null,
          shiftNumber: 0,
        });
      } else {
        // Create separate entry for each shift
        expectedSchedule.forEach((shift, shiftIndex) => {
          const shiftStartTime = getExpectedStartTimeFromSchedule(shift);
          const shiftEndTime = getExpectedEndTimeFromSchedule(shift);

          // Find clock entries for this specific shift
          const shiftClockIns = staff.clockEntries.filter((entry) => {
            const entryDate = new Date(entry.timestamp);
            if (entryDate.toDateString() !== dateStr || entry.type !== 'in')
              return false;

            // Check if this clock-in falls within this shift's time window
            const entryMinutes =
              entryDate.getHours() * 60 + entryDate.getMinutes();
            const shiftStartMinutes = shiftStartTime
              ? timeToMinutes(shiftStartTime)
              : 0;
            const shiftEndMinutes = shiftEndTime
              ? timeToMinutes(shiftEndTime)
              : 1440; // End of day

            // Allow clock-ins up to 30 minutes before shift start and up to shift end
            return (
              entryMinutes >= shiftStartMinutes - 30 &&
              entryMinutes <= shiftEndMinutes
            );
          });

          const clockInEntry = shiftClockIns[0]; // First relevant clock-in for this shift
          let status = 'absent';
          let actualTime = null;
          let isManual = false;

          if (clockInEntry) {
            actualTime = new Date(clockInEntry.timestamp).toLocaleTimeString(
              'en-US',
              {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }
            );
            isManual = clockInEntry.isManual || false;

            // Calculate if early, on-time, or late for this specific shift
            if (shiftStartTime) {
              const expectedMinutes = timeToMinutes(shiftStartTime);
              const actualMinutes =
                new Date(clockInEntry.timestamp).getHours() * 60 +
                new Date(clockInEntry.timestamp).getMinutes();
              const diffMinutes = actualMinutes - expectedMinutes;

              if (diffMinutes < -5) status = 'early';
              else if (diffMinutes <= 5) status = 'on-time';
              else status = 'late';
            } else {
              status = 'on-time'; // If no expected time, consider present as on-time
            }
          }

          dayData.push({
            ...staff,
            status,
            actualTime,
            isManual,
            currentShift: shift,
            shiftNumber: shiftIndex + 1,
            totalShifts: expectedSchedule.length,
          });
        });
      }
    });

    // Sort by start time first, then alphabetically by first name, then by shift number
    dayData.sort((a, b) => {
      // Get expected start times
      const aStartTime = a.currentShift
        ? getExpectedStartTimeFromSchedule(a.currentShift)
        : null;
      const bStartTime = b.currentShift
        ? getExpectedStartTimeFromSchedule(b.currentShift)
        : null;

      // Convert times to minutes for comparison
      const aMinutes = aStartTime ? timeToMinutes(aStartTime) : 9999; // Put no-schedule items at end
      const bMinutes = bStartTime ? timeToMinutes(bStartTime) : 9999;

      // First sort by start time
      if (aMinutes !== bMinutes) {
        return aMinutes - bMinutes;
      }

      // If start times are equal, sort alphabetically by first name
      const aFirstName = a.name.split(' ')[0];
      const bFirstName = b.name.split(' ')[0];
      const nameComparison = aFirstName.localeCompare(bFirstName);

      if (nameComparison !== 0) {
        return nameComparison;
      }

      // If same person, sort by shift number
      return (a.shiftNumber || 0) - (b.shiftNumber || 0);
    });

    return dayData;
  };

  const timeToMinutes = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }

    return totalMinutes;
  };

  const getTodayScheduleForDate = (staff, date) => {
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayName = dayNames[date.getDay()];
    return staff.weeklySchedule?.[dayName] || [];
  };

  const getExpectedStartTimeFromSchedule = (scheduleBlock) => {
    if (!scheduleBlock) return null;
    const startTime = scheduleBlock.split('-')[0].trim();

    // Convert to standard format if needed
    if (startTime.includes(':')) {
      return startTime.includes('AM') || startTime.includes('PM')
        ? startTime
        : startTime + ' AM';
    } else {
      // Convert 24-hour to 12-hour format
      const hour = Number.parseInt(startTime);
      if (hour === 0) return '12:00 AM';
      if (hour < 12) return `${hour}:00 AM`;
      if (hour === 12) return '12:00 PM';
      return `${hour - 12}:00 PM`;
    }
  };

  const getExpectedEndTimeFromSchedule = (scheduleBlock) => {
    if (!scheduleBlock) return null;
    const endTime = scheduleBlock.split('-')[1]?.trim();
    if (!endTime) return null;

    // Convert to standard format if needed
    if (endTime.includes(':')) {
      return endTime.includes('AM') || endTime.includes('PM')
        ? endTime
        : endTime + ' PM';
    } else {
      // Convert 24-hour to 12-hour format
      const hour = Number.parseInt(endTime);
      if (hour === 0) return '12:00 AM';
      if (hour < 12) return `${hour}:00 AM`;
      if (hour === 12) return '12:00 PM';
      return `${hour - 12}:00 PM`;
    }
  };

  // Navigation functions
  const termWeekdays = useMemo(() => getTermWeekdays(), [currentTerm]);
  const currentDateIndex = termWeekdays.findIndex(
    (date) => date.toDateString() === selectedDate.toDateString()
  );

  const goToPreviousDay = () => {
    if (currentDateIndex > 0) {
      onDateChange(termWeekdays[currentDateIndex - 1]);
    }
  };

  const goToNextDay = () => {
    if (currentDateIndex < termWeekdays.length - 1) {
      onDateChange(termWeekdays[currentDateIndex + 1]);
    }
  };

  const goToToday = () => {
    const today = new Date();
    const termStatus = getTermStatus();

    if (termStatus.status === 'future') {
      // Don't change date for future terms, let parent handle error
      return false;
    }

    const todayInTerm = termWeekdays.find(
      (date) => date.toDateString() === today.toDateString()
    );
    if (todayInTerm) {
      onDateChange(todayInTerm);
      return true;
    } else {
      // If today is not in term, go to the most recent day for past terms
      if (termStatus.status === 'past') {
        onDateChange(termWeekdays[termWeekdays.length - 1]);
        return true;
      }
      return false;
    }
  };

  // Get day statistics - now counts shifts, not just people
  const dayAttendance = getDayAttendance(selectedDate);
  const dayStats = {
    present: dayAttendance.filter(
      (s) => s.status !== 'absent' && s.status !== 'not-scheduled'
    ).length,
    absent: dayAttendance.filter((s) => s.status === 'absent').length,
    late: dayAttendance.filter((s) => s.status === 'late').length,
    manual: dayAttendance.filter((s) => s.isManual).length,
  };

  const termStatus = getTermStatus();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      early: { color: 'bg-blue-100 text-blue-800', label: 'Early' },
      'on-time': { color: 'bg-green-100 text-green-800', label: 'On Time' },
      late: { color: 'bg-red-100 text-red-800', label: 'Late' },
      absent: { color: 'bg-gray-100 text-gray-800', label: 'Absent' },
      'not-scheduled': {
        color: 'bg-slate-100 text-slate-600',
        label: 'Not Scheduled',
      },
    };

    const config = statusConfig[status] || statusConfig['absent'];
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    if (role === 'Student Lead') {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Student Lead
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">
          Assistant
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Term Status Header */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-slate-600" />
              <div>
                <CardTitle className="text-xl text-slate-900">
                  {selectedTerm}
                </CardTitle>
                <p className="text-sm text-slate-600">
                  {new Date(currentTerm.startDate).toLocaleDateString()} -{' '}
                  {new Date(currentTerm.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge className={termStatus.color}>{termStatus.label}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Daily Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {dayStats.present}
                </div>
                <div className="text-slate-600">Present Shifts</div>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-700">
                  {dayStats.absent}
                </div>
                <div className="text-slate-600">Absent Shifts</div>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-bold">×</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-700">
                  {dayStats.late}
                </div>
                <div className="text-slate-600">Late Arrivals</div>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-700">
                  {dayStats.manual}
                </div>
                <div className="text-slate-600">Manual Entries</div>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Attendance Table */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Users className="w-5 h-5" />
            Daily Attendance by Shift -{' '}
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-700">Name</TableHead>
                <TableHead className="text-slate-700">Role</TableHead>
                <TableHead className="text-slate-700">Shift</TableHead>
                <TableHead className="text-slate-700">
                  Actual Clock-In
                </TableHead>
                <TableHead className="text-slate-700">Status</TableHead>
                <TableHead className="text-slate-700">Entry Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dayAttendance.map((staff, index) => (
                <TableRow
                  key={`${staff.id}-${staff.shiftNumber || 0}-${index}`}
                  className="border-slate-100"
                >
                  <TableCell className="font-medium text-slate-900">
                    {staff.name}
                    {staff.totalShifts > 1 && (
                      <span className="text-xs text-slate-500 ml-2">
                        (Shift {staff.shiftNumber}/{staff.totalShifts})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{getRoleBadge(staff.role)}</TableCell>
                  <TableCell className="font-mono text-slate-900">
                    {staff.currentShift ? (
                      <div className="text-xs bg-white border border-slate-200 px-2 py-1 rounded shadow-sm inline-block">
                        {staff.currentShift}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">
                        Not scheduled
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-slate-900">
                    {staff.actualTime || '—'}
                  </TableCell>
                  <TableCell>{getStatusBadge(staff.status)}</TableCell>
                  <TableCell>
                    {staff.isManual ? (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Manual
                      </Badge>
                    ) : staff.actualTime ? (
                      <Badge className="bg-green-100 text-green-800">
                        Card Swipe
                      </Badge>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">
                Quick Navigation
              </h4>
              <p className="text-sm text-slate-600">
                Use the arrow buttons to navigate day by day through the{' '}
                {selectedTerm} term. Each shift is tracked separately.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>{termWeekdays.length} weekdays in term</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              disabled={getTermStatus().status === 'future'}
              className="ml-2 h-7 text-xs"
            >
              Today
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
