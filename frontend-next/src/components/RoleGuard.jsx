'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth/AuthContext';

const RoleGuard = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.role)) {
      router.push('/');
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Checking permissions...</div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-6 text-center">
        <h2 className="text-xl font-semibold text-neutral-800">Access denied</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Your role does not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
