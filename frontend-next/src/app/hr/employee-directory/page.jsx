'use client';

import PageGuard from '@/components/PageGuard';
import { EmployeeDirectory } from '@/features/hr';

export default function Page() {
  return (
    <PageGuard permissions={['VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES']}>
      <EmployeeDirectory />
    </PageGuard>
  );
}
