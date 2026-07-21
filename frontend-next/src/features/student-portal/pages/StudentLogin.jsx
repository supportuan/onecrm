'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { login as loginRequest } from '@/lib/apiService';
import AuthPageShell from '@/components/AuthPageShell';

const fieldClass =
  'w-full rounded-xl border border-white/80 bg-white/65 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-md transition duration-200 placeholder:text-slate-400 hover:bg-white/80 focus:border-blue-400 focus:bg-white/90 focus:ring-2 focus:ring-blue-500/15';

export default function StudentLoginPage() {
  const router = useRouter();
  const { saveSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      router.push('/applicant/applications');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <div className="w-full rounded-[24px] border border-white/70 bg-white/[0.86] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-black/[0.04] backdrop-blur-2xl backdrop-saturate-150 transition-shadow duration-500 hover:shadow-[0_34px_110px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,1)] sm:p-10">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8eef8] p-1.5 ring-1 ring-white/20">
            <Image
              src="/images/applyUniNow.png"
              alt="Apply UniNow"
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
              priority
              unoptimized
            />
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-slate-900">Apply UniNow</p>
            <p className="text-[11px] text-slate-500">Student portal</p>
          </div>
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Your counsellor creates your account when your application is set up.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              maxLength={150}
              placeholder="you@example.com"
              className={fieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Password</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                minLength={8}
                maxLength={64}
                placeholder="••••••••"
                className={`${fieldClass} pr-11`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </label>
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-45"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link href="/forgot-password" className="text-[13px] font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-slate-500">
          Staff member?{' '}
          <Link href="/login" className="font-medium text-blue-700 hover:text-blue-900">
            Use staff login
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
