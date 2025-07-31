import React from 'react';
import { AdminDataProvider } from './admin-data-context';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminTopbar } from '@/components/admin-topbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDataProvider>
      <AdminSidebar>
        <div className="flex flex-col min-h-svh">
          <AdminTopbar />
          <main className="flex-1 p-6 bg-muted/40">{children}</main>
        </div>
      </AdminSidebar>
    </AdminDataProvider>
  );
}
