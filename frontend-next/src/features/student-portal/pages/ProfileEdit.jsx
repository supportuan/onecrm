'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileEditPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/applicant/profile/view');
  }, [router]);

  return <p className="text-sm text-neutral-500">Redirecting…</p>;
}
