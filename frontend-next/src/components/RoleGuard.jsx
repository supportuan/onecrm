'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth/AuthContext';
import LogoLoader from './LogoLoader';

const RoleGuard = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.role)) {
      router.push('/');
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) {
    return <LogoLoader fullscreen label="Checking access…" size="lg" />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-page px-6 text-center">
        <h2 className="text-xl font-semibold text-brand">Access denied</h2>
        <p className="mt-2 text-sm text-brand-muted">
          Your role does not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
