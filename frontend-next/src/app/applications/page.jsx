'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import LogoLoader from '@/components/LogoLoader';

/** Legacy /applications → staff ATS or student portal. */
export default function ApplicationsAliasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user?.role === 'STUDENT') {
      router.replace('/applicant/applications');
      return;
    }
    router.replace('/student-crm/applications');
  }, [loading, router, user]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LogoLoader label="Opening applications…" />
    </div>
  );
}
