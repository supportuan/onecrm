import { Suspense } from 'react';
import StudentManagement from '@/features/student-crm/pages/StudentManagement';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading students…</div>}>
      <StudentManagement />
    </Suspense>
  );
}
