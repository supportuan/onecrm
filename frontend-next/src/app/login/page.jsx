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
import { useAppearanceStore } from '@/lib/stores/appearanceStore';
import { BRAND_NAME, BRAND_TAGLINE } from '@/components/AppBrand';

const LuminaFluidBackground = dynamic(() => import('@/components/LuminaFluidBackground'), {
  ssr: false,
});

const LiquidMetalBackground = dynamic(() => import('@/components/LiquidMetalBackground'), {
  ssr: false,
});

const AuroraBackground = dynamic(() => import('@/components/AuroraBackground'), {
  ssr: false,
});

const loginFont = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-login-sans',
});

const PRIVACY_COPY = `${BRAND_NAME} uses your information to provide and personalize our services. We protect your data and do not share it with third parties for marketing without your consent. Please review our Privacy and Cookie Policies for more information.`;

const fieldClass =
  'w-full rounded-xl border border-white/80 bg-white/65 px-3 py-2.5 text-[13px] text-slate-900 shadow-sm outline-none backdrop-blur-md transition duration-200 placeholder:text-slate-400 hover:bg-white/80 focus:border-brand focus:bg-white/90 focus:ring-2 focus:ring-brand/15';

function PrivacyInfoButton({ onClick, light = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Privacy and data use"
      className={
        light
          ? 'inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-90 active:scale-95'
          : 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:scale-105 active:scale-95'
      }
    >
      <Image
        src="/images/information-logo.png"
        alt=""
        width={light ? 40 : 36}
        height={light ? 40 : 36}
        className={light ? 'h-10 w-10 object-contain' : 'h-9 w-9 object-contain'}
        unoptimized
      />
    </button>
  );
}

function LoginBrandMark({ theme, light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-950 ${
          light ? 'shadow-sm ring-1 ring-black/10' : 'ring-1 ring-white/15'
        }`}
      >
        <Image
          src="/images/favicon-star-gold.png"
          alt={BRAND_NAME}
          width={36}
          height={36}
          className="h-[78%] w-[78%] object-contain"
          priority
          unoptimized
        />
      </div>
      <div className="min-w-0 leading-tight">
        <p
          className={`truncate font-semibold tracking-tight text-slate-900 ${
            light ? 'text-[13px]' : 'text-[14px]'
          }`}
        >
          {BRAND_NAME}
        </p>
        <p className="text-[10px] text-slate-500">{BRAND_TAGLINE}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { loginThemeId: themeId, loginTheme: theme } = useAppearanceStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(null);
  const [enableFluid, setEnableFluid] = useState(false);
  const [enableMobileShader, setEnableMobileShader] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = window.matchMedia('(pointer: coarse)');

    const sync = () => {
      const mobile = mobileQuery.matches;
      setIsMobile(mobile);
      setEnableFluid(!reduceMotion.matches && !mobile && !coarse.matches);
      setEnableMobileShader(mobile && !reduceMotion.matches);
    };

    const frame = requestAnimationFrame(() => {
      sync();
      setMounted(true);
    });

    mobileQuery.addEventListener('change', sync);
    reduceMotion.addEventListener('change', sync);
    coarse.addEventListener('change', sync);
    return () => {
      cancelAnimationFrame(frame);
      mobileQuery.removeEventListener('change', sync);
      reduceMotion.removeEventListener('change', sync);
      coarse.removeEventListener('change', sync);
    };
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
      className={`${loginFont.variable} relative flex min-h-screen overflow-hidden text-white`}
      style={{
        fontFamily: 'var(--font-login-sans), Poppins, sans-serif',
        background: isMobile ? theme.base : '#000000',
        ['--ui-accent-gradient']: theme.accentGradient,
      }}
    >
      {isMobile === null ? (
        <div className="min-h-screen w-full bg-black" aria-hidden="true" />
      ) : isMobile ? (
        <div className="relative flex min-h-screen w-full flex-col">
          {enableMobileShader ? (
            themeId === 'aurora' ? (
              <AuroraBackground />
            ) : (
              <LiquidMetalBackground themeId={themeId} />
            )
          ) : (
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{ background: theme.fallbackGradient }}
            />
          )}

          <div className="relative z-10 flex min-h-screen flex-col px-6 pb-10 pt-8">
            <div className="login-mobile-reveal login-mobile-reveal-1 mb-8 flex items-center justify-between">
              <LoginBrandMark theme={theme} light />
              <PrivacyInfoButton onClick={() => setPrivacyOpen(true)} light />
            </div>

            <div className="login-mobile-reveal login-mobile-reveal-2 mb-8">
              <h1 className="text-[2.35rem] font-semibold leading-[1.1] tracking-tight text-slate-900">
                Sign in.
              </h1>
              <p className="mt-3 max-w-[20rem] text-[14px] leading-relaxed text-slate-600">
                Ready for the next step? Continue your journey with {BRAND_NAME}.
              </p>
            </div>

            <form className="mt-auto space-y-7" onSubmit={handleSubmit} noValidate>
              <label className="login-mobile-reveal login-mobile-reveal-3 block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  Email
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={150}
                  placeholder="you@company.com"
                  className="login-mobile-field login-mobile-field-light"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-invalid={Boolean(error)}
                />
              </label>

              <label className="login-mobile-reveal login-mobile-reveal-4 block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    minLength={8}
                    maxLength={64}
                    placeholder="••••••••"
                    className="login-mobile-field login-mobile-field-light pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-800"
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
                  className="rounded-xl border border-red-400/40 bg-red-500/15 px-3.5 py-2.5 text-[13px] leading-snug text-red-800"
                >
                  {error}
                </p>
              )}

              <div className="login-mobile-reveal login-mobile-reveal-6 space-y-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="app-gradient-action flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-[15px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
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

                <p className="text-center">
                  <Link
                    href="/forgot-password"
                    className="text-[13px] font-medium text-brand underline-offset-4 transition hover:text-brand-hover hover:underline"
                  >
                    Forgot password?
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-screen w-full items-center justify-center px-6 py-12">
          {enableFluid ? (
            <LuminaFluidBackground fluidColor={theme.fluidColor} rainbow />
          ) : (
            <div
              aria-hidden="true"
              className={`login-dark-ambient pointer-events-none absolute inset-0 ${
                themeId === 'aurora'
                  ? 'login-dark-ambient-aurora'
                  : themeId === 'mist'
                    ? 'login-dark-ambient-mist'
                    : 'login-dark-ambient-brand'
              }`}
            />
          )}

          <div
            className={`relative z-10 mx-auto w-full max-w-[380px] transition duration-700 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
          >
            <div className="app-glass-card w-full rounded-[20px] p-6 ring-1 ring-white/50 backdrop-saturate-150 transition-shadow duration-500 sm:p-7">
              <div className="mb-4 flex items-start justify-between gap-3">
                <LoginBrandMark theme={theme} />

                <PrivacyInfoButton onClick={() => setPrivacyOpen(true)} />
              </div>

              <h1 className="text-[1.2rem] font-semibold leading-snug tracking-tight text-slate-900 sm:text-[1.3rem]">
                Your journey starts with a quick login
              </h1>

              <form className="mt-5 space-y-3.5" onSubmit={handleSubmit} noValidate>
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
                      className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-soft hover:text-brand"
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
                  className="app-gradient-action mt-0.5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
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
                    className="text-[13px] font-medium text-brand underline-offset-4 transition hover:text-brand-hover hover:underline"
                  >
                    Forgot password?
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {privacyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-privacy-title"
          onClick={() => setPrivacyOpen(false)}
        >
          <div
            className="app-glass-card relative w-full max-w-md rounded-[20px] p-6 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPrivacyOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-brand-soft hover:text-brand"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>

            <div className="mb-4 h-10 w-10">
              <Image
                src="/images/information-logo.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                unoptimized
              />
            </div>
            <h2
              id="login-privacy-title"
              className="pr-8 text-[17px] font-semibold tracking-tight text-slate-900"
            >
              Privacy &amp; data use
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{PRIVACY_COPY}</p>
          </div>
        </div>
      )}
    </main>
  );
}
