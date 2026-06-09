'use client';
import { Suspense } from 'react';
import Campaigns from '@/pages-old/marketing/Campaigns';
import { Loader2 } from 'lucide-react';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-600" />
      </div>
    }>
      <Campaigns />
    </Suspense>
  );
}
