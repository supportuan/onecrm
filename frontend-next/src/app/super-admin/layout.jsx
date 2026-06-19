'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';

export default function SuperAdminLayout({ children }) {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['SUPER_ADMIN']}>{children}</RoleGuard>
    </ProtectedRoute>
  );
}
