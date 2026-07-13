'use client';
import { LogoLoaderPage } from '@/components/LogoLoader';

import { Suspense } from 'react';
import PageGuard from '@/components/PageGuard';
import { Payroll } from '@/features/hr';

export default function Page() {
  return (
    <PageGuard permissions={['MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP']}>
      <Suspense fallback={<LogoLoaderPage />}>
        <Payroll />
      </Suspense>
    </PageGuard>
  );
}
