'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authFetch from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { syncProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Form input validations
  const isLengthValid = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const isFormValid = isLengthValid && hasNumber && hasSpecial && passwordsMatch && currentPassword;

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      const targetRoute = localStorage.getItem('postPasswordChangeRedirect') || '/marketing';
      localStorage.removeItem('postPasswordChangeRedirect');
      router.push(targetRoute);
    }
  }, [success, countdown, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError('');

    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      // Clear the mustChangePassword flag in the cached user so the
      // ProtectedRoute guard releases on the next render.
      await syncProfile?.();
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to change password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ui-page flex items-center justify-center">
      <div className="ui-card relative">
        <div className="mb-8">
          <p className="ui-section-title">Security</p>
          <h1 className="mt-3 ui-text-h2">New password</h1>
          <p className="mt-2 ui-text-body">
            Set a secure personal password to continue.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 py-4 text-center">
            <p className="ui-text-h3">Password updated</p>
            <p className="ui-text-body">
              Redirecting in <span className="font-medium">{countdown}s</span>…
            </p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="ui-label">Current password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Temporary password from email"
                  className="ui-input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-600"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="ui-label">New password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  className="ui-input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="mt-3 space-y-1.5 ui-text-meta">
                <p className={isLengthValid ? 'text-emerald-700' : ''}>At least 8 characters</p>
                <p className={hasNumber ? 'text-emerald-700' : ''}>At least 1 number</p>
                <p className={hasSpecial ? 'text-emerald-700' : ''}>At least 1 special character</p>
              </div>
            </div>

            <div>
              <label className="ui-label">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="ui-input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-[11px] font-semibold text-red-400">Passwords do not match.</p>
              )}
            </div>

            {error && <div className="ui-error">{error}</div>}

            <button type="submit" disabled={loading || !isFormValid} className="ui-btn-primary w-full py-3">
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
