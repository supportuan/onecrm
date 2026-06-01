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
    return null;
  }

  return <>{children}</>;
};

export default RoleGuard;
