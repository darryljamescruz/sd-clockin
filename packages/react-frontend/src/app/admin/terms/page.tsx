'use client';

import { TermManager } from '../../../components/term-manager';
import { useAdminData } from '../admin-data-context';

export default function ManageTermsPage() {
  const { terms, addTerm, editTerm, deleteTerm } = useAdminData();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <TermManager
        terms={terms}
        onAddTerm={addTerm}
        onEditTerm={editTerm}
        onDeleteTerm={deleteTerm}
        mode="page"
      />
    </div>
  );
}
