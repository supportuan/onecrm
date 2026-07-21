'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Briefcase,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import AuthPageShell from '@/components/AuthPageShell';
import { registerUser } from '@/services/userApi';

const inputClass =
  'w-full rounded-xl border border-white/80 bg-white/65 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-md transition duration-200 placeholder:text-slate-400 hover:bg-white/80 focus:border-blue-400 focus:bg-white/90 focus:ring-2 focus:ring-blue-500/15';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = (searchParams.get('role') || '').toUpperCase();
  const initialRole = requestedRole === 'AGENT' ? 'AGENT' : 'STUDENT';
  const asSchool = (searchParams.get('as') || '').toLowerCase() === 'school';
  const partnerLabel = asSchool ? 'School' : 'Agent';

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
    agencyName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (!ref) return;
    localStorage.setItem('agencyReferralCode', ref.toUpperCase());
  }, [searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const referralCode =
        localStorage.getItem('agencyReferralCode') || searchParams.get('ref') || undefined;
      const response = await registerUser({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
        referralCode,
        ...(form.role === 'AGENT'
          ? {
              agencyDetails: {
                agencyName: form.agencyName || form.fullName,
                agencyCode: referralCode,
              },
            }
          : {}),
      });

      if (!response.success) {
        throw new Error(response.message || 'Registration failed. Please try again.');
      }

      localStorage.removeItem('agencyReferralCode');
      setSuccess(form.role);
    } catch (registrationError) {
      setError(registrationError.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const isStudent = success === 'STUDENT';
    return (
      <AuthPageShell>
        <div className="w-full rounded-[24px] border border-white/70 bg-white/[0.86] p-9 text-center shadow-[0_30px_100px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-black/[0.04] backdrop-blur-2xl backdrop-saturate-150 sm:p-10">
          <div
            className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${
              isStudent
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isStudent ? <CheckCircle className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {isStudent ? 'Registration successful' : 'Registration received'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            {isStudent
              ? 'Your student account is ready. You can now continue to the login screen.'
              : `Your ${partnerLabel.toLowerCase()} account is awaiting administrator approval.`}
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="mt-7 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Continue to login
          </button>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <div className="w-full rounded-[24px] border border-white/70 bg-white/[0.86] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-black/[0.04] backdrop-blur-2xl backdrop-saturate-150 sm:p-10">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8eef8] p-1.5 ring-1 ring-white/60">
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
            <p className="text-[11px] text-slate-500">Account registration</p>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Choose your account type and enter your details.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {[
            { value: 'STUDENT', label: 'Student', icon: GraduationCap },
            { value: 'AGENT', label: partnerLabel, icon: Briefcase },
          ].map(({ value, label, icon: Icon }) => {
            const selected = form.role === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setForm((current) => ({ ...current, role: value }))}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                  selected
                    ? 'border-blue-300 bg-blue-50 text-blue-800 ring-2 ring-blue-500/10'
                    : 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {form.role === 'AGENT' && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs leading-relaxed text-amber-800">
            {partnerLabel} accounts require administrator approval before login.
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Full name</span>
            <input
              name="fullName"
              autoComplete="name"
              value={form.fullName}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="Jane Smith"
            />
          </label>

          {form.role === 'AGENT' && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">
                {partnerLabel} name
              </span>
              <input
                name="agencyName"
                value={form.agencyName}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder={asSchool ? 'School name' : 'Agency name'}
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={form.email}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="jane@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Phone <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
              placeholder="+91 99999 99999"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Password</span>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className={`${inputClass} pr-11`}
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Confirm password
            </span>
            <input
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              className={inputClass}
              placeholder="Repeat your password"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading
              ? 'Creating account…'
              : `Register as ${form.role === 'STUDENT' ? 'Student' : partnerLabel}`}
          </button>

          <p className="pt-1 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </AuthPageShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthPageShell>
          <div className="flex min-h-48 items-center justify-center rounded-[24px] bg-white/90">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        </AuthPageShell>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
