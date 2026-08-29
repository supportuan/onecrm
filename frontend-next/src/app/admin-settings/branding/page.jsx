'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import Branding from '@/pages-old/admin-settings/Branding';

export default function Page() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['SUPER_ADMIN', 'GLOBAL_ADMIN']}>
        <Branding />
      </RoleGuard>
    </ProtectedRoute>
  );
}
