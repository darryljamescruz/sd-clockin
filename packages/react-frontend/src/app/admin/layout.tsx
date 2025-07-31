import React from 'react';
import { AdminDataProvider } from './admin-data-context';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminDataProvider>
      <div className="min-h-screen bg-slate-50">{children}</div>
    </AdminDataProvider>
  );
}
