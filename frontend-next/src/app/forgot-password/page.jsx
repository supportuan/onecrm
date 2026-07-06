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
    <main className="ui-page flex items-center justify-center">
      <div className="ui-card">
        <div className="mb-8">
          <p className="ui-section-title">Account recovery</p>
          <h1 className="mt-3 ui-text-h2">Forgot password</h1>
          <p className="mt-2 ui-text-body">We&apos;ll email reset instructions if the account exists.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="ui-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ui-input"
              placeholder="you@company.com"
              required
            />
          </div>
          {error && <div className="ui-error">{error}</div>}
          {message && <div className="ui-success">{message}</div>}
          <button
            type="submit"
            disabled={loading}
            className="ui-btn-primary w-full py-3"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
          <div className="text-center">
            <button type="button" className="ui-link" onClick={() => router.push('/login')}>
              Back to sign in
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
