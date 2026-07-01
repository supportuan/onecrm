'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export default function StudentPortalGuard({ children, skipPolicyCheck = false }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/student-login');
      return;
    }
    if (user?.role !== 'STUDENT') {
      router.replace('/login');
      return;
    }
    if (user?.mustChangePassword && pathname !== '/change-password') {
      router.replace('/change-password?forced=1');
      return;
    }
    if (
      !skipPolicyCheck &&
      !user?.policyAcceptedAt &&
      pathname !== '/applicant/accept-policy' &&
      pathname !== '/change-password'
    ) {
      router.replace('/applicant/accept-policy');
    }
  }, [isAuthenticated, loading, user, pathname, router, skipPolicyCheck]);

  if (loading || !isAuthenticated || user?.role !== 'STUDENT') {
    return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">Loading…</div>;
  }

  return children;
}
