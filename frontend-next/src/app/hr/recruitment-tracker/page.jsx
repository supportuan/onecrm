'use client';
import { LogoLoaderPage } from '@/components/LogoLoader';

import { Suspense } from 'react';
import PageGuard from '@/components/PageGuard';
import { RecruitmentPipeline } from '@/features/hr';

export default function Page() {
  return (
    <PageGuard permissions={['MANAGE_EMPLOYEES']}>
      <Suspense fallback={<LogoLoaderPage />}>
        <RecruitmentPipeline />
      </Suspense>
    </PageGuard>
  );
}
