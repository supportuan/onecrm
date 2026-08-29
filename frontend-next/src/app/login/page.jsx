'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Info, Loader2, Lock, Mail, X } from 'lucide-react';
import { Poppins } from 'next/font/google';
import { useAuth } from '@/lib/auth/AuthContext';
import { getDefaultHrRoute } from '@/features/hr/routing';
import { useAppearanceStore } from '@/lib/stores/appearanceStore';
import { BrandMark, useTenantBrand } from '@/components/AppBrand';
import LoginVideoBackground from '@/components/LoginVideoBackground';

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

const fieldClass =
  'w-full rounded-md border border-white/15 bg-black py-1.5 pl-8 pr-3 text-[12px] text-white outline-none transition placeholder:text-white/35 hover:border-white/30 focus:border-white/45';

function PrivacyInfoButton({ onClick, light = false, size = 'md' }) {
  const small = size === 'sm';
  if (small) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Privacy and data use"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-white ring-1 ring-white/30 transition hover:bg-neutral-900 hover:ring-white/50 active:scale-95"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    );
  }
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

function LoginBrandMark({ light = false, onDark = false, centered = false, large = false }) {
  const { logoSrc, name, tagline } = useTenantBrand();
  return (
    <div className={`flex items-center ${large ? 'gap-3' : 'gap-2'} ${centered ? 'justify-center' : ''}`}>
      <div
        className={`relative shrink-0 overflow-hidden rounded-lg ${
          large ? 'h-12 w-12' : 'h-8 w-8'
        } ${
          light ? 'shadow-sm ring-1 ring-black/10' : 'ring-1 ring-white/15'
        }`}
      >
        <BrandMark
          src={logoSrc}
          alt={name}
          width={large ? 48 : 32}
          height={large ? 48 : 32}
          priority
        />
      </div>
      <div className={`min-w-0 leading-tight ${centered ? 'text-left' : ''}`}>
        <p
          className={`truncate font-semibold tracking-tight ${
            onDark
              ? large
                ? 'text-[22px] text-white'
                : 'text-[13px] text-white'
              : light
                ? 'text-[13px] text-slate-900'
                : 'text-[14px] text-slate-900'
          }`}
        >
          {name}
        </p>
        <p
          className={`${large ? 'mt-0.5 text-[13px]' : 'text-[9px]'} ${
            onDark ? 'text-white/70' : 'text-slate-500'
          }`}
        >
          {tagline}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { loginThemeId: themeId, loginTheme: theme } = useAppearanceStore();
  const brand = useTenantBrand();

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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = window.matchMedia('(pointer: coarse)');

    const sync = () => {
      const mobile = mobileQuery.matches;
      setIsMobile(mobile);
      setPrefersReducedMotion(reduceMotion.matches);
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

  const showVideo = Boolean(brand.loginBackgroundUrl) && !prefersReducedMotion;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login({ email, password });

      let targetRoute = '/';
      const role = data.user?.role;

      if (role === 'SUPER_ADMIN' || role === 'GLOBAL_ADMIN') targetRoute = '/marketing';
      else if (role === 'HR') targetRoute = getDefaultHrRoute(role) || '/hr';
      else if (role === 'COUNSELLOR') targetRoute = '/marketing';
      else if (role === 'AGENT' || role === 'AGENCY_FREELANCER') {
        targetRoute = '/agency-crm/agency-leads';
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
          {showVideo ? (
            <>
              <LoginVideoBackground src={brand.loginBackgroundUrl} />
              <div className="pointer-events-none absolute inset-0 bg-black/20" aria-hidden="true" />
            </>
          ) : enableMobileShader ? (
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

          <div className={`relative z-10 flex min-h-[100dvh] flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] ${showVideo ? 'justify-center' : ''}`}>
            <div className={showVideo ? 'rounded-2xl bg-white/92 px-4 py-5 shadow-xl backdrop-blur-sm' : ''}>
            <div className="login-mobile-reveal login-mobile-reveal-1 flex shrink-0 items-center justify-between">
              <LoginBrandMark light />
              <PrivacyInfoButton onClick={() => setPrivacyOpen(true)} light />
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
              <div className="login-mobile-reveal login-mobile-reveal-2">
                <h1 className="text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-slate-900">
                  Sign in.
                </h1>
                <p className="mt-1.5 max-w-[17.5rem] text-[13px] leading-snug text-slate-600">
                  Continue your journey with {brand.name}.
                </p>
              </div>

              <form className="mt-6 space-y-3.5" onSubmit={handleSubmit} noValidate>
                <label className="login-mobile-reveal login-mobile-reveal-3 block">
                  <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    Email
                  </span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={150}
                    placeholder="Enter your email id"
                    className="login-mobile-field login-mobile-field-light"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-invalid={Boolean(error)}
                  />
                </label>

                <label className="login-mobile-reveal login-mobile-reveal-4 block">
                  <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
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
                    className="rounded-xl border border-red-400/40 bg-red-500/15 px-3.5 py-2 text-[13px] leading-snug text-red-800"
                  >
                    {error}
                  </p>
                )}

                <div className="login-mobile-reveal login-mobile-reveal-6 space-y-3 pt-2">
                  <p className="text-center">
                    <Link
                      href="/forgot-password"
                      className="text-[13px] font-medium text-brand underline-offset-4 transition hover:text-brand-hover hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="app-gradient-action mx-auto flex w-auto min-w-[7.5rem] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                        Signing in…
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </div>
              </form>
            </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-screen w-full items-center justify-center bg-black px-6 py-12">
          {showVideo ? (
            <>
              <LoginVideoBackground src={brand.loginBackgroundUrl} />
              <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden="true" />
            </>
          ) : enableFluid ? (
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

          <div className="absolute right-5 top-5 z-20 sm:right-6 sm:top-6">
            <PrivacyInfoButton onClick={() => setPrivacyOpen(true)} size="sm" />
          </div>

          <div
            className={`relative z-10 mx-auto w-full max-w-[420px] transition duration-700 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
          >
            <div className="mb-4 flex w-full justify-center">
              <LoginBrandMark onDark centered large />
            </div>

            <h1 className="whitespace-nowrap text-center text-[1rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.1rem]">
              {brand.loginHeadline || 'Your journey starts with a quick login'}
            </h1>

            <form className="mx-auto mt-5 w-full max-w-[300px] space-y-3 text-left" onSubmit={handleSubmit} noValidate>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/80">
                  Email
                </span>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/55"
                    strokeWidth={1.75}
                  />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={150}
                    placeholder="Enter your email address"
                    className={fieldClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-invalid={Boolean(error)}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/80">
                  Password
                </span>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/55"
                    strokeWidth={1.75}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    minLength={8}
                    maxLength={64}
                    placeholder="Enter your password"
                    className={`${fieldClass} pr-10`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center text-white/55 transition hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                    ) : (
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </label>

              <div className="pt-0.5 text-center">
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-medium text-white/85 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-red-400/35 bg-red-500/15 px-3 py-2 text-[12px] leading-snug text-white"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mx-auto mt-0.5 flex w-auto min-w-[7.5rem] items-center justify-center gap-2 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-white/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
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
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{brand.privacyCopy}</p>
          </div>
        </div>
      )}
    </main>
  );
}
