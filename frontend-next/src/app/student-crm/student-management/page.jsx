import { Suspense } from 'react';
import StudentManagement from '@/features/student-crm/pages/StudentManagement';
import { LogoLoaderPage } from '@/components/LogoLoader';

export default function Page() {
  return (
    <Suspense fallback={<LogoLoaderPage label="Loading students…" />}>
      <StudentManagement />
    </Suspense>
  );
}
