'use client';

import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import { HR_ACCESS_ROLES } from '@/lib/hrAccess';

const HRPageGuard = ({ children, allowedRoles = HR_ACCESS_ROLES }) => (
  <ProtectedRoute>
    <RoleGuard allowedRoles={allowedRoles}>{children}</RoleGuard>
  </ProtectedRoute>
);

export default HRPageGuard;
