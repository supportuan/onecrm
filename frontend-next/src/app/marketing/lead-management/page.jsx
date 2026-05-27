'use client';
import { Suspense } from 'react';
import LeadManagement from '@/pages-old/marketing/LeadManagement';
import { Loader2 } from 'lucide-react';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <LeadManagement />
    </Suspense>
  );
}
