'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/services/userApi';
import { UserPlus, Eye, EyeOff, Sparkles, GraduationCap, Briefcase, CheckCircle, Clock } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'STUDENT' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

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
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-10 shadow-2xl text-center">
          <div className="flex justify-center mb-6">
            <div className={`flex h-20 w-20 items-center justify-center rounded-3xl ${success === 'STUDENT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {success === 'STUDENT' ? <CheckCircle className="h-10 w-10" /> : <Clock className="h-10 w-10" />}
            </div>
          </div>
          {success === 'STUDENT' ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-3">Registration Successful!</h1>
              <p className="text-slate-400 text-sm mb-6">Your student account has been created. A welcome email has been sent to <strong className="text-slate-200">{form.email}</strong>.</p>
              <button onClick={() => router.push('/login')} className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition">
                Go to Login
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-3">Registration Received!</h1>
              <p className="text-slate-400 text-sm mb-2">Your Agent registration has been submitted.</p>
              <p className="text-slate-400 text-sm mb-6">An administrator will review your account and you'll receive an email at <strong className="text-slate-200">{form.email}</strong> once approved.</p>
              <button onClick={() => router.push('/login')} className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition">
                Back to Login
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 py-12">
      {/* Background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/8 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/8 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/40">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <UserPlus className="h-7 w-7" />
              </div>
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-400 mb-2">OneCRM Portal</p>
            <h1 className="text-2xl font-bold text-white">Create an Account</h1>
            <p className="mt-1 text-sm text-slate-400">Register as a Student or Agent</p>
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
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all duration-200 ${form.role === value
                    ? color === 'emerald'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                    : 'border-slate-700 bg-slate-950/50 text-slate-400 hover:border-slate-600'
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>

          {form.role === 'AGENT' && (
            <div className="mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-200">
              ⚠️ Agent accounts require <strong>admin approval</strong> before you can log in.
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Full Name</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Phone <span className="text-slate-500">(optional)</span></label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="+91 99999 99999"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Confirm Password</label>
              <input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Repeat your password"
              />
            </div>

            {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-200">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full justify-center items-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70 mt-2"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? 'Creating Account...' : `Register as ${form.role === 'STUDENT' ? 'Student' : 'Agent'}`}
            </button>

            <div className="text-center text-sm text-slate-400 pt-1">
              Already have an account?{' '}
              <button type="button" onClick={() => router.push('/login')} className="text-indigo-300 hover:text-indigo-100 font-semibold">
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
