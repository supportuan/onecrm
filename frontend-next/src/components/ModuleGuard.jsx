'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import LogoLoader from '@/components/LogoLoader';

/**
 * Permission-based page guard. Renders children only if the current user's
 * role has any of `permissions` in the live RBAC map. Editing roles in
 * Admin Settings > Roles & Permissions changes access here immediately.
 */
const ModuleGuard = ({ permissions, children, redirectTo = '/login' }) => {
  const { user, loading: authLoading } = useAuth();
  const { can, loading: permsLoading } = usePermissions();
  const router = useRouter();

  const required = Array.isArray(permissions) ? permissions : [permissions];
  const allowed = Boolean(user) && can(required);
  const loading = authLoading || permsLoading;

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  if (loading) {
    return <LogoLoader fullscreen label="Checking permissions…" size="lg" />;
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-page px-6 text-center">
        <h2 className="text-xl font-semibold text-brand">Access denied</h2>
        <p className="mt-2 text-sm text-brand-muted">
          Your role does not have permission to view this module.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ModuleGuard;
