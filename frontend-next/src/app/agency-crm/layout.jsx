'use client';

import ModuleGuard from '@/components/ModuleGuard';

export default function AgencyCrmLayout({ children }) {
  return (
    <ModuleGuard permissions={['VIEW_AGENCY_CRM', 'MANAGE_AGENCY_CRM']}>
      {children}
    </ModuleGuard>
  );
}
