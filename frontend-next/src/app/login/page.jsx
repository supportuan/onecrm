'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { Poppins } from 'next/font/google';
import { useAuth } from '@/lib/auth/AuthContext';
import { getDefaultHrRoute } from '@/features/hr/routing';

const LuminaFluidBackground = dynamic(() => import('@/components/LuminaFluidBackground'), {
  ssr: false,
});

const loginFont = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-login-sans',
});

const PRIVACY_COPY =
  'ApplyUniNow uses your information to provide and personalize our services. We protect your data and do not share it with third parties for marketing without your consent. Please review our Privacy and Cookie Policies for more information.';

const fieldClass =
  'w-full rounded-xl border border-white/80 bg-white/65 px-3.5 py-3 text-[14px] text-slate-900 shadow-sm outline-none backdrop-blur-md transition duration-200 placeholder:text-slate-400 hover:bg-white/80 focus:border-blue-400 focus:bg-white/90 focus:ring-2 focus:ring-blue-500/15';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [enableFluid, setEnableFluid] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      setEnableFluid(!reduceMotion && !coarse);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!privacyOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setPrivacyOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [privacyOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login({ email, password });

      let targetRoute = '/';
      const role = data.user?.role;

      if (role === 'SUPER_ADMIN') targetRoute = '/super-admin';
      else if (role === 'GLOBAL_ADMIN') targetRoute = '/marketing';
      else if (role === 'HR') targetRoute = getDefaultHrRoute(role) || '/hr';
      else if (role === 'COUNSELLOR') targetRoute = '/marketing';
      else if (role === 'AGENT' || role === 'AGENCY_FREELANCER') {
        targetRoute = '/agency-crm/dashboard';
      } else if (role === 'STUDENT') {
        targetRoute =
          data.showPolicyModal || !data.user?.policyAcceptedAt
            ? '/applicant/accept-policy'
            : '/applicant/applications';
      }

      if (data.isFirstLogin || data.mustChangePassword) {
        localStorage.setItem('postPasswordChangeRedirect', targetRoute);
        router.push('/change-password?forced=1');
      } else {
        router.push(targetRoute);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`${loginFont.variable} relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-12 text-white sm:px-6`}
      style={{ fontFamily: 'var(--font-login-sans), Poppins, sans-serif' }}
    >
      {enableFluid ? (
        <LuminaFluidBackground />
      ) : (
        <div
          aria-hidden="true"
          className="login-dark-ambient pointer-events-none absolute inset-0"
        />
      )}

      <div
        className={`relative z-10 mx-auto w-full max-w-[480px] transition duration-700 ease-out ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <div className="app-glass-card w-full rounded-[24px] p-8 ring-1 ring-white/50 backdrop-saturate-150 transition-shadow duration-500 sm:p-10">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
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
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[13px] font-semibold tracking-tight text-slate-900">
                  ApplyUniNow
                </p>
                <p className="text-[11px] text-slate-500">Intelligence Connecting Seamlessly</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              aria-label="Privacy and data use"
              className="app-gradient-icon h-9 w-9 shrink-0 transition hover:scale-105 active:scale-95"
            >
              <span className="text-[13px] font-semibold leading-none">i</span>
            </button>
          </div>

          <h1
            className="app-title-gradient mx-auto whitespace-nowrap text-center"
            style={{
              fontSize: 'clamp(13px, 3.8vw, 18px)',
              lineHeight: '26px',
              fontFamily: 'var(--font-login-sans), Poppins, sans-serif',
              fontStyle: 'normal',
              fontWeight: 400,
            }}
          >
            Your journey starts with a quick login
          </h1>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-slate-600">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                maxLength={150}
                placeholder="you@company.com"
                className={fieldClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={Boolean(error)}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-slate-600">Password</span>
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
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] leading-snug text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="app-gradient-action mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>

            <p className="pt-0.5 text-center">
              <Link
                href="/forgot-password"
                className="text-[13px] font-medium text-blue-700 underline-offset-4 transition hover:text-blue-900 hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </form>

        </div>
      </div>

      {privacyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-privacy-title"
          onClick={() => setPrivacyOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-[20px] border border-white/10 bg-neutral-950 p-6 shadow-2xl sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPrivacyOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>

            <div className="app-gradient-icon mb-4">
              <span className="text-sm font-semibold">i</span>
            </div>
            <h2
              id="login-privacy-title"
              className="pr-8 text-[17px] font-semibold tracking-tight text-white"
            >
              Privacy &amp; data use
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/55">{PRIVACY_COPY}</p>
          </div>
        </div>
      )}
    </main>
  );
}
