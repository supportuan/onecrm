'use client';

import LinkedInPlugin from '@/features/connector/pages/LinkedInPlugin';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';

export default function LinkedInPluginPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['SUPER_ADMIN', 'GLOBAL_ADMIN', 'COUNSELLOR', 'MARKETING_MANAGER', 'TELECALLER']}>
        <LinkedInPlugin />
      </RoleGuard>
    </ProtectedRoute>
  );
}
