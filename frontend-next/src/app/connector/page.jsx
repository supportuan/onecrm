'use client';

import ConnectorHub from '@/features/connector/pages/ConnectorHub';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';

export default function ConnectorPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['SUPER_ADMIN', 'GLOBAL_ADMIN', 'COUNSELLOR', 'MARKETING_MANAGER', 'TELECALLER']}>
        <ConnectorHub />
      </RoleGuard>
    </ProtectedRoute>
  );
}
