'use client';
import { Suspense } from 'react';
import LeadManagement from '@/pages-old/marketing/LeadManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import { LogoLoaderPage } from '@/components/LogoLoader';

export default function Page() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["SUPER_ADMIN", "GLOBAL_ADMIN", "COUNSELLOR", "MARKETING_MANAGER", "TELECALLER"]}>
        <Suspense fallback={<LogoLoaderPage label="Loading leads…" />}>
          <LeadManagement />
        </Suspense>
      </RoleGuard>
    </ProtectedRoute>
  );
}
