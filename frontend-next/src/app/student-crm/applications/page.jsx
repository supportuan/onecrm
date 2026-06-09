import { Suspense } from 'react';
import Applications from '@/pages-old/student-crm/Applications';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading applications…</div>}>
      <Applications />
    </Suspense>
  );
}
