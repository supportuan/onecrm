'use client';

import { Suspense } from 'react';
import PageGuard from '@/components/PageGuard';
import { Payroll } from '@/features/hr';

export default function Page() {
  return (
    <PageGuard permissions={['MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP']}>
      <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading payroll…</div>}>
        <Payroll />
      </Suspense>
    </PageGuard>
  );
}
