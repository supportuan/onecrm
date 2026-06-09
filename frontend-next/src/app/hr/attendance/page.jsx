'use client';

import PageGuard from '@/components/PageGuard';
import { Attendance } from '@/features/hr';

export default function Page() {
  return (
    <PageGuard permissions={['VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE']}>
      <Attendance />
    </PageGuard>
  );
}
