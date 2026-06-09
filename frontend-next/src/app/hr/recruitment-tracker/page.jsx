'use client';

import { Suspense } from 'react';
import PageGuard from '@/components/PageGuard';
import { RecruitmentPipeline } from '@/features/hr';

export default function Page() {
  return (
    <PageGuard permissions={['MANAGE_EMPLOYEES']}>
      <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading recruitment…</div>}>
        <RecruitmentPipeline />
      </Suspense>
    </PageGuard>
  );
}
