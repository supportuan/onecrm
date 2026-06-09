'use client';

import { Suspense } from 'react';
import PageGuard from '@/components/PageGuard';
import { Performance } from '@/features/hr';

export default function Page() {
  return (
    <PageGuard permissions={['VIEW_REPORTS', 'MANAGE_EMPLOYEES']}>
      <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading performance…</div>}>
        <Performance />
      </Suspense>
    </PageGuard>
  );
}
