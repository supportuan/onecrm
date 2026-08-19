'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function SuperAdminLayout() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/marketing');
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Redirecting…
      </div>
    </ProtectedRoute>
  );
}
