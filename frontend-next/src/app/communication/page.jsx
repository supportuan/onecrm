'use client';

import { Suspense } from 'react';
import CommunicationCenter from '@/features/communication/pages/CommunicationCenter';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import ModuleGuard from '@/components/ModuleGuard';
import { LogoLoaderPage } from '@/components/LogoLoader';

export default function CommunicationPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['SUPER_ADMIN', 'GLOBAL_ADMIN', 'COUNSELLOR', 'MARKETING_MANAGER', 'TELECALLER', 'HR']}>
        <ModuleGuard permissions={['VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM']}>
          <Suspense fallback={<LogoLoaderPage label="Loading messages…" />}>
            <CommunicationCenter />
          </Suspense>
        </ModuleGuard>
      </RoleGuard>
    </ProtectedRoute>
  );
}
