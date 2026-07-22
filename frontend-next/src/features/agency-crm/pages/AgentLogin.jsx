'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import AuthPageShell from '@/components/AuthPageShell';

const darkFieldClass =
  'w-full rounded-xl border border-white/80 bg-white/65 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-md transition duration-200 placeholder:text-slate-400 hover:bg-white/80 focus:border-blue-400 focus:bg-white/90 focus:ring-2 focus:ring-blue-500/15';

const emptyRegister = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agencyName: '',
  agencyCode: '',
  agencyAddress: '',
  agencyCity: '',
  agencyCountry: '',
};

export default function AgentLogin() {
  const router = useRouter();
  const { login, logout } = useAuth();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await login({ email, password });
      const role = data.user?.role;
      if (role !== 'AGENT' && role !== 'AGENCY_FREELANCER') {
        await logout?.();
        setError('This portal is for agency agents only. Use staff or student login instead.');
        return;
      }
      const target = '/agency-crm/agency-leads';
      if (data.isFirstLogin || data.mustChangePassword) {
        localStorage.setItem('postPasswordChangeRedirect', target);
        router.push('/change-password');
      } else {
        router.push(target);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (registerForm.password !== registerForm.confirmPassword) {
        setError('Password and confirm password do not match');
        setLoading(false);
        return;
      }
      if (!registerForm.agencyName.trim()) {
        setError('Agency name is required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: registerForm.fullName,
          email: registerForm.email,
          phone: registerForm.phone || undefined,
          password: registerForm.password,
          role: 'AGENT',
          agencyDetails: {
            agencyName: registerForm.agencyName,
            agencyCode: registerForm.agencyCode || undefined,
            agencyAddress: registerForm.agencyAddress || undefined,
            agencyCity: registerForm.agencyCity || undefined,
            agencyCountry: registerForm.agencyCountry || undefined,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
      }

      setSuccess('Registration received. An admin will approve your account before you can sign in.');
      setRegisterForm(emptyRegister);
      setMode('login');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell wide={mode === 'register'}>
      <div
        className={`w-full rounded-[24px] border border-white/70 bg-white/[0.86] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-black/[0.04] backdrop-blur-2xl backdrop-saturate-150 transition-shadow duration-500 hover:shadow-[0_34px_110px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,1)] sm:p-10 ${
          mode === 'register' ? 'max-w-none' : ''
        }`}
      >
        <div className="mb-8">
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
              <p className="text-[11px] text-slate-500">Agency portal</p>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {mode === 'register' ? 'Create agent account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {mode === 'register'
              ? 'Register as an agency partner. Admin approval is required before login.'
              : 'Access your profile, referred students, documents, and commissions.'}
          </p>
        </div>

        {mode === 'login' ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                maxLength={150}
                placeholder="you@agency.com"
                className={darkFieldClass}
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
                  className={`${darkFieldClass} pr-11`}
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
            {success && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13px] text-emerald-700">
                {success}
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
                'Sign in as agent'
              )}
            </button>

            <p className="mt-2 text-center">
              <Link href="/forgot-password" className="text-[13px] font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline">
                Forgot password?
              </Link>
            </p>

            <p className="text-center text-xs text-slate-500">
              New agent?{' '}
              <button type="button" className="font-medium text-blue-700 hover:text-blue-900" onClick={() => switchMode('register')}>
                Register here
              </button>
            </p>

            <p className="text-center text-xs text-slate-500">
              Staff?{' '}
              <Link href="/login" className="font-medium text-blue-700 hover:text-blue-900">
                Staff login
              </Link>
              {' · '}
              Student?{' '}
              <Link href="/login" className="font-medium text-blue-700 hover:text-blue-900">
                Login
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-brand-soft/40 p-4 sm:p-6 space-y-4">
              <h2 className="ui-text-h3">Personal details</h2>

              <label className="block">
                <span className="ui-label">Full name *</span>
                <input
                  name="fullName"
                  className="ui-input"
                  value={registerForm.fullName}
                  onChange={handleRegisterChange}
                  required
                />
              </label>

              <label className="block">
                <span className="ui-label">Email *</span>
                <input
                  type="email"
                  name="email"
                  className="ui-input"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  required
                />
              </label>

              <label className="block">
                <span className="ui-label">Phone</span>
                <input
                  name="phone"
                  className="ui-input"
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                />
              </label>

              <label className="block">
                <span className="ui-label">Password *</span>
                <input
                  type="password"
                  name="password"
                  minLength={8}
                  className="ui-input"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  required
                />
              </label>

              <label className="block">
                <span className="ui-label">Confirm password *</span>
                <input
                  type="password"
                  name="confirmPassword"
                  minLength={8}
                  className="ui-input"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                />
              </label>
            </section>

            <section className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-brand-soft/40 p-4 sm:p-6 space-y-4">
              <h2 className="ui-text-h3">Agency details</h2>

              <label className="block">
                <span className="ui-label">Agency name *</span>
                <input
                  name="agencyName"
                  className="ui-input"
                  value={registerForm.agencyName}
                  onChange={handleRegisterChange}
                  required
                />
              </label>

              <label className="block">
                <span className="ui-label">Agency / referral code</span>
                <input
                  name="agencyCode"
                  className="ui-input"
                  value={registerForm.agencyCode}
                  onChange={handleRegisterChange}
                  placeholder="Optional — assigned if empty"
                />
              </label>

              <label className="block">
                <span className="ui-label">Address</span>
                <input
                  name="agencyAddress"
                  className="ui-input"
                  value={registerForm.agencyAddress}
                  onChange={handleRegisterChange}
                />
              </label>

              <label className="block">
                <span className="ui-label">City</span>
                <input
                  name="agencyCity"
                  className="ui-input"
                  value={registerForm.agencyCity}
                  onChange={handleRegisterChange}
                />
              </label>

              <label className="block">
                <span className="ui-label">Country</span>
                <input
                  name="agencyCountry"
                  className="ui-input"
                  value={registerForm.agencyCountry}
                  onChange={handleRegisterChange}
                />
              </label>
            </section>

            <div className="lg:col-span-2 space-y-3">
              {error && <p className="ui-error">{error}</p>}
              {success && <p className="ui-success">{success}</p>}

              <button type="submit" disabled={loading} className="ui-btn-primary w-full sm:w-auto min-w-[200px]">
                {loading ? 'Submitting…' : 'Register as agent'}
              </button>

              <p className="text-center text-xs text-brand-muted sm:text-left">
                Already registered?{' '}
                <button type="button" className="ui-link" onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </AuthPageShell>
  );
}
