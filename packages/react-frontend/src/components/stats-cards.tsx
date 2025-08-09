'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, AlertCircle, Shield, Calendar } from 'lucide-react';

interface StatsCardsProps {
  totalStaff: number;
  presentStaff: number;
  studentLeads: number;
  lateToday: number;
  currentTerm: string;
}

export function StatsCards({
  totalStaff,
  presentStaff,
  studentLeads,
  lateToday,
  currentTerm,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {totalStaff}
              </div>
              <div className="text-slate-600">Total Staff</div>
            </div>
            <Users className="w-8 h-8 text-slate-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">
                {presentStaff}
              </div>
              <div className="text-slate-600">Present Today</div>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">●</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">
                {studentLeads}
              </div>
              <div className="text-slate-600">Student Leads</div>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-700">{lateToday}</div>
              <div className="text-slate-600">Late Today</div>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">{currentTerm}</div>
              <div className="text-slate-600">Current Term</div>
            </div>
            <Calendar className="w-8 h-8 text-slate-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
