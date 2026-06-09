'use client';

import PageGuard from '@/components/PageGuard';
import { EmployeeSelfService } from '@/features/hr';

export default function Page() {
  return (
    <PageGuard permissions={['VIEW_HR']}>
      <EmployeeSelfService />
    </PageGuard>
  );
}
