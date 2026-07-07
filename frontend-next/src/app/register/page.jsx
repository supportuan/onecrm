'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerUser } from '@/services/userApi';
import { UserPlus, Eye, EyeOff, Sparkles, GraduationCap, Briefcase, CheckCircle, Clock } from 'lucide-react';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'STUDENT' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && typeof window !== 'undefined') {
      localStorage.setItem('agencyReferralCode', ref.toUpperCase());
    }
  }, [searchParams]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await registerUser({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
      });
      if (res.success) {
        setSuccess(form.role);
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-900 px-4 py-12">
        <div className="w-auto rounded-lg border border-neutral-200 bg-white p-10 shadow-sm text-center">
          <div className="flex justify-center mb-6">
            <div className={`flex h-20 w-20 items-center justify-center rounded-lg ${success === 'STUDENT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {success === 'STUDENT' ? <CheckCircle className="h-10 w-10" /> : <Clock className="h-10 w-10" />}
            </div>
          </div>
          {success === 'STUDENT' ? (
            <>
              <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Registration Successful!</h1>
              <p className="text-neutral-500 text-sm mb-6">Your student account has been created. A welcome email has been sent to <strong className="text-neutral-700">{form.email}</strong>.</p>
              <button onClick={() => router.push('/login')} className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-emerald-400 transition">
                Go to Login
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Registration Received!</h1>
              <p className="text-neutral-500 text-sm mb-2">Your Agent registration has been submitted.</p>
              <p className="text-neutral-500 text-sm mb-6">An administrator will review your account and you'll receive an email at <strong className="text-neutral-700">{form.email}</strong> once approved.</p>
              <button onClick={() => router.push('/login')} className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-amber-400 transition">
                Back to Login
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-900 px-4 py-12">
      <div className="w-auto">
        <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-neutral-50 border border-neutral-700/20 text-neutral-500">
                <UserPlus className="h-7 w-7" />
              </div>
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-500 mb-2">OneCRM Portal</p>
            <h1 className="text-2xl font-semibold text-neutral-900">Create an Account</h1>
            <p className="mt-1 text-sm text-neutral-500">Register as a Student or Agent</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'STUDENT', label: 'Student', icon: GraduationCap, color: 'emerald' },
              { value: 'AGENT', label: 'Agent', icon: Briefcase, color: 'amber' },
            ].map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, role: value }))}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${form.role === value
                    ? 'border-neutral-900 bg-neutral-100 text-neutral-900'
                    : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400'
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>

          {form.role === 'AGENT' && (
            <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
              ⚠️ Agent accounts require <strong>admin approval</strong> before you can log in.
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-600">Full Name</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-600">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-600">Phone <span className="text-neutral-500">(optional)</span></label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                placeholder="+91 99999 99999"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-600">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 pr-11 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3.5 top-3.5 text-neutral-500 hover:text-neutral-600 transition">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-600">Confirm Password</label>
              <input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                placeholder="Repeat your password"
              />
            </div>

            {error && <div className="rounded-lg bg-red-50 border border-red-500/20 p-3 text-sm text-red-700">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full justify-center items-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 mt-2"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? 'Creating Account...' : `Register as ${form.role === 'STUDENT' ? 'Student' : 'Agent'}`}
            </button>

            <div className="text-center text-sm text-neutral-500 pt-1">
              Already have an account?{' '}
              <button type="button" onClick={() => router.push('/login')} className="text-neutral-700 hover:text-neutral-900 font-semibold">
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-neutral-500">Loading…</main>}>
      <RegisterPageContent />
    </Suspense>
  );
}
