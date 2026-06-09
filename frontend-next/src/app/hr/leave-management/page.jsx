'use client';

import { Suspense } from 'react';
import PageGuard from '@/components/PageGuard';
import { LeaveManagement } from '@/features/hr';

export default function Page() {
  return (
    <PageGuard permissions={['VIEW_LEAVE', 'MANAGE_LEAVE']}>
      <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading leave…</div>}>
        <LeaveManagement />
      </Suspense>
    </PageGuard>
  );
}
