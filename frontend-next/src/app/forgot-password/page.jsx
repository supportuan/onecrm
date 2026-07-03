'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { forgotPassword } from '@/lib/apiService';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError('');

    try {
      const data = await forgotPassword(email);
      setMessage(data.message || 'Password reset link sent if the email exists.');
    } catch (err) {
      setError(err.message || 'Unable to request reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-900 px-4 py-12">
      <div className="w-auto rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">OneCRM Account Recovery</p>
          <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Forgot password?</h1>
          <p className="mt-2 text-sm text-neutral-500">Enter your email and we will send reset instructions.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
              required
            />
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-500/20 p-3 text-sm text-red-700">{error}</div>}
          {message && <div className="rounded-lg bg-emerald-50 border border-emerald-500/20 p-3 text-sm text-emerald-700">{message}</div>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full justify-center rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
          <div className="text-center text-sm text-neutral-500">
            <button type="button" className="text-neutral-700 hover:text-neutral-900 cursor-pointer" onClick={() => router.push('/login')}>
              Back to sign in
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
