'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { getDefaultHrRoute } from '@/features/hr/routing';
import AuthPageShell from '@/components/AuthPageShell';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    agencyName: '',
    agencyCode: '',
    agencyAddress: '',
    agencyCity: '',
    agencyCountry: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
        targetRoute = '/applicant/applications';
      }

      if (data.isFirstLogin) {
        localStorage.setItem('postPasswordChangeRedirect', targetRoute);
        router.push('/change-password');
      } else {
        router.push(targetRoute);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetRegisterForm = () => {
    setRegisterForm({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'STUDENT',
      agencyName: '',
      agencyCode: '',
      agencyAddress: '',
      agencyCity: '',
      agencyCountry: '',
    });
  };

  const handleRegisterSubmit = async (event) => {
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

      const payload = {
        fullName: registerForm.fullName,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
        role: registerForm.role,
      };

      if (registerForm.role === 'AGENT') {
        payload.agencyDetails = {
          agencyName: registerForm.agencyName,
          agencyCode: registerForm.agencyCode,
          agencyAddress: registerForm.agencyAddress,
          agencyCity: registerForm.agencyCity,
          agencyCountry: registerForm.agencyCountry,
        };
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
      }

      setSuccess('Registration successful. Please login.');
      setIsRegister(false);
      resetRegisterForm();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell wide={isRegister}>
      <div className={`ui-card ${isRegister ? 'max-w-none w-full' : ''}`}>
        <div className="mb-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8eef7] text-[#0b2a5b]">
            <UserRound className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <p className="ui-section-title">Staff portal</p>
          <h1 className="mt-3 ui-text-h2">{isRegister ? 'Create account' : 'Sign in'}</h1>
          <p className="mt-2 ui-text-body">
            {isRegister
              ? 'Register as a student or agency partner to get started.'
              : 'Sign in with your staff credentials to continue.'}
          </p>
        </div>

        {!isRegister ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="mt-2 text-center">
              <Link href="/forgot-password" className="ui-link">
                Forgot password?
              </Link>
            </p>

            <p className="text-center text-xs text-brand-muted">
              No account?{' '}
              <button
                type="button"
                className="ui-link"
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setIsRegister(true);
                }}
              >
                Register
              </button>
            </p>

            <p className="text-center text-xs text-brand-muted">
              Student?{' '}
              <Link href="/student-login" className="ui-link">
                Use student login
              </Link>
            </p>

            <p className="text-center text-xs text-brand-muted">
              Agency agent?{' '}
              <Link href="/agent-login" className="ui-link">
                Agent login
              </Link>
            </p>
          </form>
        ) : (
          <form
            onSubmit={handleRegisterSubmit}
            className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <section className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-brand-soft/40 p-4 sm:p-6">
              <h2 className="mb-5 ui-text-h3">Personal details</h2>

              <div className="space-y-4">
                <label className="block">
                  <span className="ui-label">Register as</span>
                  <select
                    name="role"
                    value={registerForm.role}
                    onChange={handleRegisterChange}
                    className="ui-input ui-select"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="AGENT">Agent</option>
                  </select>
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="ui-label">Full name</span>
                    <input
                      name="fullName"
                      value={registerForm.fullName}
                      onChange={handleRegisterChange}
                      className="ui-input"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="ui-label">Phone</span>
                    <input
                      name="phone"
                      value={registerForm.phone}
                      onChange={handleRegisterChange}
                      className="ui-input"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="ui-label">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    className="ui-input"
                    required
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="ui-label">Password</span>
                    <input
                      type="password"
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      className="ui-input"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="ui-label">Confirm password</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      className="ui-input"
                      required
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-brand-soft/40 p-4 sm:p-6">
              <h2 className="mb-5 ui-text-h3">
                {registerForm.role === 'AGENT' ? 'Agency details' : 'Student registration'}
              </h2>

              {registerForm.role === 'AGENT' ? (
                <div className="space-y-4">
                  <label className="block">
                    <span className="ui-label">Agency name</span>
                    <input
                      name="agencyName"
                      value={registerForm.agencyName}
                      onChange={handleRegisterChange}
                      className="ui-input"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="ui-label">Agency address</span>
                    <input
                      name="agencyAddress"
                      value={registerForm.agencyAddress}
                      onChange={handleRegisterChange}
                      className="ui-input"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="ui-label">City</span>
                      <input
                        name="agencyCity"
                        value={registerForm.agencyCity}
                        onChange={handleRegisterChange}
                        className="ui-input"
                      />
                    </label>

                    <label className="block">
                      <span className="ui-label">Country</span>
                      <input
                        name="agencyCountry"
                        value={registerForm.agencyCountry}
                        onChange={handleRegisterChange}
                        className="ui-input"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-white p-5">
                  <p className="ui-text-strong">Student account registration</p>
                  <p className="mt-3 ui-text-body">
                    Students can register with personal details. After approval and login, they
                    continue in the student portal.
                  </p>
                </div>
              )}
            </section>

            <div className="lg:col-span-2">
              {error && <p className="mb-4 ui-error">{error}</p>}
              {success && <p className="mb-4 ui-success">{success}</p>}

              <button type="submit" disabled={loading} className="ui-btn-primary w-full">
                {loading ? 'Creating account…' : 'Register'}
              </button>

              <p className="mt-5 text-center text-xs text-brand-muted">
                Already have an account?{' '}
                <button
                  type="button"
                  className="ui-link"
                  onClick={() => {
                    setError('');
                    setSuccess('');
                    setIsRegister(false);
                  }}
                >
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
