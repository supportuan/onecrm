'use client';

import Users from '@/pages-old/admin-settings/Users';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';

export default function Page() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
        <Users />
      </RoleGuard>
    </ProtectedRoute>
  );
}
