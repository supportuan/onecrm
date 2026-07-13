'use client';
import { LogoLoaderPage } from '@/components/LogoLoader';

import { Suspense } from 'react';
import PageGuard from '@/components/PageGuard';
import { Performance } from '@/features/hr';

export default function Page() {
  return (
    <PageGuard permissions={['VIEW_REPORTS', 'MANAGE_EMPLOYEES']}>
      <Suspense fallback={<LogoLoaderPage />}>
        <Performance />
      </Suspense>
    </PageGuard>
  );
}
