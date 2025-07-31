'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTime: Date;
  onLogout: () => void;
}

export function Navbar({ currentTime, onLogout }: NavbarProps) {
  const pathname = usePathname();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/students', label: 'Manage Students' },
    { href: '/admin/terms', label: 'Manage Terms' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm mb-8">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">TimeSync Admin</h1>
              <p className="text-slate-600 text-sm">IT Service Desk Attendance Management</p>
            </div>
          </div>

          {/* Center - Current Time */}
          <div className="hidden md:block text-center">
            <div className="text-lg font-mono font-bold text-slate-900">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-slate-600">{formatDate(currentTime)}</div>
          </div>

          {/* Right - Navigation */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium hover:text-slate-900 ${
                    pathname === item.href
                      ? 'text-slate-900 border-b-2 border-slate-900 pb-1'
                      : 'text-slate-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              className="bg-white border-slate-200 hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
