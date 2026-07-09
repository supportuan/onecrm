'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import ModuleGuard from '@/components/ModuleGuard';

export default function StudentCrmLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === 'STUDENT') {
      router.replace('/applicant/profile/view');
    }
  }, [loading, user, router]);

  if (loading || user?.role === 'STUDENT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        Redirecting…
      </div>
    );
  }

  return (
    <ModuleGuard permissions={['VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM']}>
      {children}
    </ModuleGuard>
  );
}
