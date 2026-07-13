'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import authFetch from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AcceptPolicyPage() {
  const router = useRouter();
  const { syncProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accept = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/auth/accept-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to accept policy');
      await syncProfile?.();
      router.push('/applicant/profile/view');
    } catch (e) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="ui-card w-full max-w-lg">
        <h1 className="text-xl font-semibold text-brand">Terms &amp; conditions</h1>
        <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
          By continuing you agree to our privacy policy, data processing terms, and student portal usage guidelines.
          Your assigned counsellor may access your application data to support your study abroad journey.
        </p>
        {error && <p className="mt-4 ui-error">{error}</p>}
        <button type="button" disabled={loading} onClick={accept} className="ui-btn-primary mt-6 w-full">
          {loading ? 'Saving…' : 'I accept'}
        </button>
      </div>
    </main>
  );
}
