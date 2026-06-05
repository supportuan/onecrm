'use client';

import ModuleGuard from '@/components/ModuleGuard';

export default function StudentCrmLayout({ children }) {
  return (
    <ModuleGuard permissions={['VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM']}>
      {children}
    </ModuleGuard>
  );
}
