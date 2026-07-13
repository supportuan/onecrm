'use client';
import { LogoLoaderPage } from '@/components/LogoLoader';

import { Suspense } from 'react';
import PageGuard from '@/components/PageGuard';
import { LeaveManagement } from '@/features/hr';

export default function Page() {
  return (
    <PageGuard permissions={['VIEW_LEAVE', 'MANAGE_LEAVE']}>
      <Suspense fallback={<LogoLoaderPage />}>
        <LeaveManagement />
      </Suspense>
    </PageGuard>
  );
}
