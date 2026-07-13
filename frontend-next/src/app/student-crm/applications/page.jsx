'use client';

import { Suspense } from 'react';
import ApplicationsList from '@/features/student-crm/pages/ApplicationsList';
import { LogoLoaderPage } from '@/components/LogoLoader';

export default function Page() {
  return (
    <Suspense fallback={<LogoLoaderPage label="Loading applications…" />}>
      <ApplicationsList />
    </Suspense>
  );
}
