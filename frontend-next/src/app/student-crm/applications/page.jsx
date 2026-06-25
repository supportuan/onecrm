'use client';

import { Suspense } from 'react';
import ApplicationsList from '@/features/student-crm/pages/ApplicationsList';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading applications…</div>}>
      <ApplicationsList />
    </Suspense>
  );
}
