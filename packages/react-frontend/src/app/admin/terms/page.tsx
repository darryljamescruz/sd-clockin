'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/navbar';
import { TermManager } from '../../../components/term-manager';
import { useAdminData } from '../admin-data-context';

export default function ManageTermsPage() {
  const router = useRouter();
  const { terms, addTerm, editTerm, deleteTerm } = useAdminData();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentTime={currentTime} onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-6">
        <TermManager
          terms={terms}
          onAddTerm={addTerm}
          onEditTerm={editTerm}
          onDeleteTerm={deleteTerm}
          mode="page"
        />
      </div>
    </div>
  );
}
