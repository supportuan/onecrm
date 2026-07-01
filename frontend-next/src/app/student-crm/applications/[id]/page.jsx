'use client';

import { Suspense, use } from 'react';
import ApplicationDetail from '@/features/student-crm/pages/ApplicationDetail';

export default function Page({ params }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading application…</div>}>
      <ApplicationDetail applicationId={id} />
    </Suspense>
  );
}
