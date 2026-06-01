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
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/40">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">OneCRM Account Recovery</p>
          <h1 className="mt-4 text-3xl font-bold text-white">Forgot password?</h1>
          <p className="mt-2 text-sm text-slate-400">Enter your email and we will send reset instructions.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              required
            />
          </div>
          {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-200">{error}</div>}
          {message && <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-200">{message}</div>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
          <div className="text-center text-sm text-slate-400">
            <button type="button" className="text-cyan-300 hover:text-cyan-100" onClick={() => router.push('/login')}>
              Back to sign in
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
