'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { login as loginRequest } from '@/lib/apiService';

export default function StudentLoginPage() {
  const router = useRouter();
  const { saveSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginRequest({ email, password, type: 'student' });
      const data = res.data;
      saveSession(data.user, data.accessToken, data.refreshToken);

      if (data.mustChangePassword || data.isFirstLogin) {
        localStorage.setItem('postPasswordChangeRedirect', '/applicant/accept-policy');
        router.push('/change-password?forced=1');
        return;
      }
      if (data.showPolicyModal || !data.user?.policyAcceptedAt) {
        router.push('/applicant/accept-policy');
        return;
      }
      router.push('/applicant/profile/view');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ui-page flex items-center justify-center">
      <div className="ui-card">
        <div className="mb-8">
          <p className="ui-section-title">Student portal</p>
          <h1 className="mt-3 ui-text-h2">Sign in</h1>
          <p className="mt-2 ui-text-body">
            Your counsellor creates your account when your application is set up.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="ui-label">Email</span>
            <input type="email" maxLength={150} className="ui-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <span className="ui-label">Password</span>
            <input type="password" minLength={8} maxLength={15} className="ui-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="ui-error">{error}</p>}
          <button type="submit" disabled={loading} className="ui-btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link href="/forgot-password" className="ui-link">Forgot password?</Link>
        </p>
        <p className="mt-3 text-center text-xs text-neutral-400">
          Staff member? <Link href="/login" className="ui-link">Use staff login</Link>
        </p>
      </div>
    </main>
  );
}
