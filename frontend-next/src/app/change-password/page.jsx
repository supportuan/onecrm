'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authFetch from '@/lib/api';
import { ShieldCheck, Eye, EyeOff, Lock, Check } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
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

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to change password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/40 relative overflow-hidden">
        {/* Decorative dynamic ambient glow */}
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl"></div>

        <div className="mb-6 text-center relative z-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4 border border-cyan-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Security Update Required</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Create a new password</h1>
          <p className="mt-2 text-sm text-slate-400">
            Since this is your first time logging in with a temporary password, you must configure a secure personal password.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center py-6 relative z-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-bounce">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Password Updated Successfully!</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your credentials are secure now. Redirecting you to your workspace in <span className="font-bold text-cyan-400">{countdown}s</span>...
              </p>
            </div>
          </div>
        ) : (
          <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Current Temporary Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter the password sent to your email"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 pl-11 pr-12 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">New Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 pl-11 pr-12 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Quality Checker Checklist */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] font-semibold">
                <div className={`flex items-center gap-1.5 ${isLengthValid ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isLengthValid ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                  Min 8 Characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${hasNumber ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                  At least 1 Number
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${hasSpecial ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                  1 Special Char
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Confirm New Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className={`w-full rounded-2xl border bg-slate-950 pl-11 pr-12 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${
                    confirmPassword
                      ? passwordsMatch
                        ? 'border-emerald-600 focus:border-emerald-500'
                        : 'border-red-600 focus:border-red-500'
                      : 'border-slate-700 focus:border-cyan-400'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-[11px] font-semibold text-red-400">Passwords do not match.</p>
              )}
            </div>

            {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-200">{error}</div>}

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="inline-flex w-full justify-center rounded-2xl bg-cyan-500 px-4 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40 shadow-lg shadow-cyan-500/15"
            >
              {loading ? 'Securing your account...' : 'Change Password & Continue'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
