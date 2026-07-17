'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import AuthPageShell from '@/components/AuthPageShell';

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
      const target = '/agency-crm/dashboard';
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
      <div className={`ui-card ${mode === 'register' ? 'max-w-none w-full' : ''}`}>
        <div className="mb-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8eef7] text-[#0b2a5b]">
            <Briefcase className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <p className="ui-section-title">Agency portal</p>
          <h1 className="mt-3 ui-text-h2">{mode === 'register' ? 'Create agent account' : 'Agent sign in'}</h1>
          <p className="mt-2 ui-text-body">
            {mode === 'register'
              ? 'Register as an agency partner. Admin approval is required before login.'
              : 'Access your profile, referred students, documents, and commissions.'}
          </p>
        </div>

        {mode === 'login' ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <label className="block">
              <span className="ui-label">Email</span>
              <input
                type="email"
                maxLength={150}
                className="ui-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="ui-label">Password</span>
              <input
                type="password"
                minLength={8}
                maxLength={64}
                className="ui-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className="ui-error">{error}</p>}
            {success && <p className="ui-success">{success}</p>}

            <button type="submit" disabled={loading} className="ui-btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in as agent'}
            </button>

            <p className="mt-2 text-center">
              <Link href="/forgot-password" className="ui-link">
                Forgot password?
              </Link>
            </p>

            <p className="text-center text-xs text-brand-muted">
              New agent?{' '}
              <button type="button" className="ui-link" onClick={() => switchMode('register')}>
                Register here
              </button>
            </p>

            <p className="text-center text-xs text-brand-muted">
              Staff?{' '}
              <Link href="/login" className="ui-link">
                Staff login
              </Link>
              {' · '}
              Student?{' '}
              <Link href="/student-login" className="ui-link">
                Student login
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
