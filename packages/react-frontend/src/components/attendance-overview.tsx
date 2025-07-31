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
import { Users, Shield, UserCheck } from 'lucide-react';

interface ClockEntry {
  timestamp: string;
  type: 'in' | 'out';
}

interface Staff {
  id: number;
  name: string;
  role: string;
  currentStatus: string;
  todayExpected: string;
  todayActual: string | null;
  clockEntries: ClockEntry[];
  weeklySchedule?: {
    sunday?: string[];
    monday?: string[];
    tuesday?: string[];
    wednesday?: string[];
    thursday?: string[];
    friday?: string[];
    saturday?: string[];
  };
}

interface AttendanceOverviewProps {
  staffData: Staff[];
  selectedTerm: string;
}

export function AttendanceOverview({
  staffData,
  selectedTerm,
}: AttendanceOverviewProps) {
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      early: { color: 'bg-blue-100 text-blue-800', label: 'Early' },
      'on-time': { color: 'bg-green-100 text-green-800', label: 'On Time' },
      late: { color: 'bg-red-100 text-red-800', label: 'Late' },
      absent: { color: 'bg-gray-100 text-gray-800', label: 'Absent' },
      expected: { color: 'bg-yellow-100 text-yellow-800', label: 'Expected' },
    };

    const config = statusConfig[status] || statusConfig['expected'];
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const getCurrentStatusBadge = (status: string) => {
    const statusConfig = {
      present: {
        color: 'bg-green-100 text-green-800',
        label: 'Present',
        icon: '●',
      },
      expected: {
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Expected',
        icon: '○',
      },
      absent: { color: 'bg-red-100 text-red-800', label: 'Absent', icon: '×' },
    };

    const config = statusConfig[status] || statusConfig['expected'];
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const getTodayStatus = (staff: Staff) => {
    // Calculate status based on expected vs actual time
    if (!staff.todayActual) return 'expected';

    const expected = new Date(`2000-01-01 ${staff.todayExpected}`);
    const actual = new Date(`2000-01-01 ${staff.todayActual}`);
    const diffMinutes = (actual.getTime() - expected.getTime()) / (1000 * 60);

    if (diffMinutes < -5) return 'early';
    if (diffMinutes <= 5) return 'on-time';
    return 'late';
  };

  const getTodaySchedule = (staff: Staff, date = new Date()) => {
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

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Users className="w-5 h-5" />
          Today's Attendance Overview - {selectedTerm}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200">
              <TableHead className="text-slate-700">Name</TableHead>
              <TableHead className="text-slate-700">Role</TableHead>
              <TableHead className="text-slate-700">Today's Schedule</TableHead>
              <TableHead className="text-slate-700">Actual</TableHead>
              <TableHead className="text-slate-700">Status</TableHead>
              <TableHead className="text-slate-700">Current</TableHead>
              <TableHead className="text-slate-700">Last Entry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffData.map((staff) => (
              <TableRow key={staff.id} className="border-slate-100">
                <TableCell className="font-medium text-slate-900">
                  {staff.name}
                </TableCell>
                <TableCell>{getRoleBadge(staff.role)}</TableCell>
                <TableCell className="font-mono text-slate-900">
                  {getTodaySchedule(staff).length > 0 ? (
                    <div className="space-y-1">
                      {getTodaySchedule(staff).map((block, index) => (
                        <div
                          key={index}
                          className="text-xs bg-white border border-slate-200 px-2 py-1 rounded shadow-sm"
                        >
                          {block}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">
                      Not scheduled
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-slate-900">
                  {staff.todayActual || '—'}
                </TableCell>
                <TableCell>{getStatusBadge(getTodayStatus(staff))}</TableCell>
                <TableCell>
                  {getCurrentStatusBadge(staff.currentStatus)}
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {staff.clockEntries.length > 0
                    ? new Date(
                        staff.clockEntries[
                          staff.clockEntries.length - 1
                        ].timestamp
                      ).toLocaleString()
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
