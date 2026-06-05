'use client';

import ModuleGuard from '@/components/ModuleGuard';

export default function MarketingLayout({ children }) {
  return (
    <ModuleGuard permissions={['VIEW_MARKETING', 'MANAGE_MARKETING']}>
      {children}
    </ModuleGuard>
  );
}
