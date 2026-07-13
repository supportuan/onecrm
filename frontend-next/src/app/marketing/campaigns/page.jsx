'use client';
import { Suspense } from 'react';
import Campaigns from '@/pages-old/marketing/Campaigns';
import { LogoLoaderPage } from '@/components/LogoLoader';

export default function Page() {
  return (
    <Suspense fallback={<LogoLoaderPage label="Loading campaigns…" />}>
      <Campaigns />
    </Suspense>
  );
}
