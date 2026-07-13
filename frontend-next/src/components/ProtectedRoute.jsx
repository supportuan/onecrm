'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth/AuthContext';
import LogoLoader from './LogoLoader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    // Forced password change overrides every page until they rotate.
    if (user?.mustChangePassword && pathname !== '/change-password') {
      router.push('/change-password?forced=1');
    }
  }, [isAuthenticated, loading, user, pathname, router]);

  if (loading || !isAuthenticated) {
    return <LogoLoader fullscreen label="Signing you in…" size="lg" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
