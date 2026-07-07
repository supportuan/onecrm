
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getDefaultHrRoute } from '@/features/hr/routing';

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
        targetRoute = '/student-crm/applications';
      } else if (role === 'STUDENT') {
        targetRoute = '/applicant/profile/view';
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

  const inputClass =
    'h-11 sm:h-12 w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

  const labelClass =
    'mb-2 block text-sm font-semibold text-slate-600';

  return (
    <main className="min-h-screen overflow-y-auto bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-center">
      <div
        className={`mx-auto w-full rounded-2xl border border-slate-200 bg-white shadow-sm ${isRegister
          ? 'max-w-6xl p-5 sm:p-8 lg:p-10'
          : 'max-w-md p-6 sm:p-8'
          }`}
      >
        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            OneCRM
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">
            {isRegister ? 'Create account' : 'Sign in'}
          </h1>
        </div>

        {!isRegister ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm font-semibold text-slate-600 hover:text-slate-950"
                onClick={() => router.push('/forgot-password')}
              >
                Forgot password?
              </button>
            </div>

            <div className="text-center text-sm text-slate-500">
              No account?{' '}
              <button
                type="button"
                className="font-semibold text-slate-700 hover:text-slate-950"
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setIsRegister(true);
                }}
              >
                Register
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleRegisterSubmit}
            className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
              <h2 className="mb-5 text-xl font-bold text-slate-800">
                Personal Details
              </h2>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Register As</label>
                  <select
                    name="role"
                    value={registerForm.role}
                    onChange={handleRegisterChange}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="AGENT">Agent</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                      name="fullName"
                      value={registerForm.fullName}
                      onChange={handleRegisterChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      name="phone"
                      value={registerForm.phone}
                      onChange={handleRegisterChange}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
              <h2 className="mb-5 text-xl font-bold text-slate-800">
                {registerForm.role === 'AGENT'
                  ? 'Agency Details'
                  : 'Student Registration'}
              </h2>

              {registerForm.role === 'AGENT' ? (
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Agency Name</label>
                    <input
                      name="agencyName"
                      value={registerForm.agencyName}
                      onChange={handleRegisterChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Agency Address</label>
                    <input
                      name="agencyAddress"
                      value={registerForm.agencyAddress}
                      onChange={handleRegisterChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div>
                      <label className={labelClass}>City</label>
                      <input
                        name="agencyCity"
                        value={registerForm.agencyCity}
                        onChange={handleRegisterChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Country</label>
                      <input
                        name="agencyCountry"
                        value={registerForm.agencyCountry}
                        onChange={handleRegisterChange}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <p className="text-base font-bold text-slate-900">
                    Student account registration
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Student users can register using their personal details.
                    After login, they will be redirected to the Student CRM
                    module.
                  </p>
                </div>
              )}
            </section>

            <div className="lg:col-span-2">
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>

              <div className="mt-5 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  className="font-semibold text-slate-700 hover:text-slate-950"
                  onClick={() => {
                    setError('');
                    setSuccess('');
                    setIsRegister(false);
                  }}
                >
                  Login
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}