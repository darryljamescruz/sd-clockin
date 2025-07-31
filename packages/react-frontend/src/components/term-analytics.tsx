'use client';

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
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Clock, Calendar } from 'lucide-react';

interface ClockEntry {
  timestamp: string;
  type: 'in' | 'out';
  isManual?: boolean;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  clockEntries: ClockEntry[];
  todayExpected?: string;
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

interface TermAnalyticsProps {
  staffData: Staff[];
  selectedTerm: string;
  termStartDate: string;
  termEndDate: string;
}

export function TermAnalytics({
  staffData,
  selectedTerm,
  termStartDate,
  termEndDate,
}: TermAnalyticsProps) {
  // Filter clock entries by term date range
  const getTermClockEntries = (staff: Staff) => {
    const startDate = new Date(termStartDate);
    const endDate = new Date(termEndDate);

    return staff.clockEntries.filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  };

  const getExpectedStartTimeForDate = (staff: Staff, date: Date) => {
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
    const daySchedule = staff.weeklySchedule?.[dayName] || [];

    if (daySchedule.length === 0) return null;

    // Get the first time block's start time
    const firstBlock = daySchedule[0];
    const startTime = firstBlock.split('-')[0].trim();

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

  // Calculate analytics for each staff member
  const getStaffAnalytics = (staff: Staff) => {
    const termEntries = getTermClockEntries(staff);
    const clockInEntries = termEntries.filter((entry) => entry.type === 'in');
    const manualEntries = termEntries.filter((entry) => entry.isManual);

    // Calculate attendance days (unique days with clock-in)
    const attendanceDays = new Set(
      clockInEntries.map((entry) => new Date(entry.timestamp).toDateString())
    ).size;

    // Calculate total days in term (weekdays only)
    const totalWeekdays = getWeekdaysInRange(
      new Date(termStartDate),
      new Date(termEndDate)
    );

    // Calculate average arrival time
    const arrivalTimes = clockInEntries.map((entry) => {
      const date = new Date(entry.timestamp);
      return date.getHours() * 60 + date.getMinutes(); // Convert to minutes
    });

    const avgArrivalMinutes =
      arrivalTimes.length > 0
        ? arrivalTimes.reduce((sum, time) => sum + time, 0) /
          arrivalTimes.length
        : 0;

    const avgArrivalTime =
      arrivalTimes.length > 0 ? formatMinutesToTime(avgArrivalMinutes) : 'N/A';

    // Calculate punctuality (on-time arrivals) using weekly schedule
    let onTimeArrivals = 0;
    clockInEntries.forEach((entry) => {
      const entryDate = new Date(entry.timestamp);
      const expectedStartTime = getExpectedStartTimeForDate(staff, entryDate);

      if (expectedStartTime) {
        const expectedMinutes = timeToMinutes(expectedStartTime);
        const actualMinutes =
          entryDate.getHours() * 60 + entryDate.getMinutes();

        if (actualMinutes <= expectedMinutes + 5) {
          // 5 min grace period
          onTimeArrivals++;
        }
      } else {
        // If no expected time, consider it on-time
        onTimeArrivals++;
      }
    });

    const punctualityRate =
      clockInEntries.length > 0
        ? (onTimeArrivals / clockInEntries.length) * 100
        : 0;

    return {
      attendanceDays,
      totalWeekdays,
      attendanceRate:
        totalWeekdays > 0 ? (attendanceDays / totalWeekdays) * 100 : 0,
      totalClockIns: clockInEntries.length,
      manualEntries: manualEntries.length,
      avgArrivalTime,
      punctualityRate,
    };
  };

  const getWeekdaysInRange = (startDate: Date, endDate: Date) => {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday (0) or Saturday (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;

    const [time, period] = timeStr.split(' ');
    if (!time) return 0;

    const timeParts = time.split(':');
    if (timeParts.length < 2) return 0;

    const [hours, minutes] = timeParts.map(Number);
    let totalMinutes = hours * 60 + (minutes || 0);

    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }

    return totalMinutes;
  };

  const formatMinutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPunctualityColor = (rate: number) => {
    if (rate >= 85) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate term overview stats
  const termStats = {
    totalStaff: staffData.length,
    avgAttendance:
      staffData.length > 0
        ? staffData.reduce(
            (sum, staff) => sum + getStaffAnalytics(staff).attendanceRate,
            0
          ) / staffData.length
        : 0,
    totalManualEntries: staffData.reduce(
      (sum, staff) => sum + getStaffAnalytics(staff).manualEntries,
      0
    ),
    avgPunctuality:
      staffData.length > 0
        ? staffData.reduce(
            (sum, staff) => sum + getStaffAnalytics(staff).punctualityRate,
            0
          ) / staffData.length
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* Term Overview Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {termStats.totalStaff}
                </div>
                <div className="text-slate-600">Total Staff</div>
              </div>
              <BarChart3 className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`text-2xl font-bold ${getAttendanceColor(termStats.avgAttendance)}`}
                >
                  {termStats.avgAttendance.toFixed(1)}%
                </div>
                <div className="text-slate-600">Avg Attendance</div>
              </div>
              <TrendingUp className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`text-2xl font-bold ${getPunctualityColor(termStats.avgPunctuality)}`}
                >
                  {termStats.avgPunctuality.toFixed(1)}%
                </div>
                <div className="text-slate-600">Avg Punctuality</div>
              </div>
              <Clock className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-700">
                  {termStats.totalManualEntries}
                </div>
                <div className="text-slate-600">Manual Entries</div>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Analytics */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5" />
            Individual Performance Analytics - {selectedTerm}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-700">Name</TableHead>
                <TableHead className="text-slate-700">Role</TableHead>
                <TableHead className="text-slate-700">Attendance</TableHead>
                <TableHead className="text-slate-700">Punctuality</TableHead>
                <TableHead className="text-slate-700">Avg Arrival</TableHead>
                <TableHead className="text-slate-700">Manual Entries</TableHead>
                <TableHead className="text-slate-700">
                  Total Clock-ins
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffData.map((staff) => {
                const analytics = getStaffAnalytics(staff);
                return (
                  <TableRow key={staff.id} className="border-slate-100">
                    <TableCell className="font-medium text-slate-900">
                      {staff.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          staff.role === 'Student Lead'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }
                      >
                        {staff.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div
                          className={`font-medium ${getAttendanceColor(analytics.attendanceRate)}`}
                        >
                          {analytics.attendanceRate.toFixed(1)}%
                        </div>
                        <Progress
                          value={analytics.attendanceRate}
                          className="h-2"
                        />
                        <div className="text-xs text-slate-500">
                          {analytics.attendanceDays}/{analytics.totalWeekdays}{' '}
                          days
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div
                          className={`font-medium ${getPunctualityColor(analytics.punctualityRate)}`}
                        >
                          {analytics.punctualityRate.toFixed(1)}%
                        </div>
                        <Progress
                          value={analytics.punctualityRate}
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-slate-900">
                      {analytics.avgArrivalTime}
                    </TableCell>
                    <TableCell>
                      {analytics.manualEntries > 0 ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {analytics.manualEntries}
                        </Badge>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {analytics.totalClockIns}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
