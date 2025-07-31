'use client';

import { TermManager } from '../../../components/term-manager';
import { useAdminData } from '../admin-data-context';

export default function TermsPage() {
  const { terms, addTerm, editTerm, deleteTerm } = useAdminData();
  return (
    <TermManager
      terms={terms}
      onAddTerm={addTerm}
      onEditTerm={editTerm}
      onDeleteTerm={deleteTerm}
    />
  );
}
