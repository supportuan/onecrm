'use client';

import ModuleGuard from '@/components/ModuleGuard';

export default function AdminSettingsLayout({ children }) {
  return (
    <ModuleGuard permissions={['VIEW_ADMIN', 'MANAGE_SYSTEM', 'MANAGE_ADMINS']}>
      {children}
    </ModuleGuard>
  );
}
