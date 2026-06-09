// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/lib/auth/AuthContext';

// export default function LoginPage() {
//   const router = useRouter();
//   const { login } = useAuth();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const data = await login({ email, password });

//       let targetRoute = '/';
//       const role = data.user?.role;
//       if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
//         targetRoute = '/marketing';
//       } else if (role === 'HR') {
//         targetRoute = '/hr/employee-directory';
//       } else if (role === 'COUNSELLOR') {
//         targetRoute = '/marketing';
//       } else if (role === 'AGENT') {
//         targetRoute = '/agency-crm/agency-management';
//       } else if (role === 'STUDENT') {
//         targetRoute = '/student-crm/student-management';
//       }

//       if (data.isFirstLogin) {
//         localStorage.setItem('postPasswordChangeRedirect', targetRoute);
//         router.push('/change-password');
//       } else {
//         router.push(targetRoute);
//       }
//     } catch (err) {
//       setError(err.message || 'Login failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-900 px-4 py-12">
//       <div className="w-auto rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
//         <div className="mb-6 text-center">
//           <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">OneCRM Secure Login</p>
//           <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Sign in to your account</h1>
//         </div>

//         <form className="space-y-5" onSubmit={handleSubmit}>
//           <div>
//             <label className="mb-2 block text-sm font-medium text-neutral-600">Email</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
//               required
//             />
//           </div>

//           <div>
//             <label className="mb-2 block text-sm font-medium text-neutral-600">Password</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
//               required
//             />
//           </div>

//           {error && <div className="rounded-lg bg-red-50 border border-red-500/20 p-3 text-sm text-red-700">{error}</div>}

//           <button
//             type="submit"
//             disabled={loading}
//             className="inline-flex w-full justify-center rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
//           >
//             {loading ? 'Signing in...' : 'Sign in'}
//           </button>

//           <div className="text-center text-sm text-neutral-500">
//             <button type="button" className="text-neutral-700 hover:text-neutral-900" onClick={() => router.push('/forgot-password')}>
//               Forgot your password?
//             </button>
//           </div>
//         </form>
//       </div>
//     </main>
//   );
// }


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

      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        targetRoute = '/marketing';
      } else if (role === 'HR') {
        targetRoute = getDefaultHrRoute(role) || '/hr';
      } else if (role === 'COUNSELLOR') {
        targetRoute = '/marketing';
      } else if (role === 'AGENT' || role === 'AGENCY_FREELANCER') {
        targetRoute = '/student-crm/applications';
      } else if (role === 'STUDENT') {
        targetRoute = '/student-crm/applications';
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
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-900 px-4 py-8">
      <div
        className="ui-card w-auto"
      >
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">
            OneCRM Secure Login
          </p>

          <h1 className="mt-4 text-2xl font-semibold text-neutral-900">
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </h1>
        </div>

        {!isRegister ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-600">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-600">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-500/20 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-500/20 p-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full justify-center rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="text-center text-sm text-neutral-500">
              <button
                type="button"
                className="text-neutral-700 hover:text-neutral-900"
                onClick={() => router.push('/forgot-password')}
              >
                Forgot your password?
              </button>
            </div>

            <div className="text-center text-sm text-neutral-500">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="text-neutral-700 hover:text-neutral-900 font-semibold"
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
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            onSubmit={handleRegisterSubmit}
          >
            <section className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
              <h2 className="text-lg font-bold text-neutral-700">
                Personal Details
              </h2>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-600">
                  Register As
                </label>
                <select
                  name="role"
                  value={registerForm.role}
                  onChange={handleRegisterChange}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                >
                  <option value="STUDENT">Student</option>
                  <option value="AGENT">Agent</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-600">
                    Full Name
                  </label>
                  <input
                    name="fullName"
                    value={registerForm.fullName}
                    onChange={handleRegisterChange}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-600">
                    Phone
                  </label>
                  <input
                    name="phone"
                    value={registerForm.phone}
                    onChange={handleRegisterChange}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-600">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-600">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-600">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
              <h2 className="text-lg font-bold text-neutral-700">
                {registerForm.role === 'AGENT'
                  ? 'Agency Details'
                  : 'Student Registration'}
              </h2>

              {registerForm.role === 'AGENT' ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-600">
                      Agency Name
                    </label>
                    <input
                      name="agencyName"
                      value={registerForm.agencyName}
                      onChange={handleRegisterChange}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-600">
                      Agency Code
                    </label>
                    <input
                      name="agencyCode"
                      value={registerForm.agencyCode}
                      onChange={handleRegisterChange}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-600">
                      Agency Address
                    </label>
                    <input
                      name="agencyAddress"
                      value={registerForm.agencyAddress}
                      onChange={handleRegisterChange}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-600">
                        City
                      </label>
                      <input
                        name="agencyCity"
                        value={registerForm.agencyCity}
                        onChange={handleRegisterChange}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-600">
                        Country
                      </label>
                      <input
                        name="agencyCountry"
                        value={registerForm.agencyCountry}
                        onChange={handleRegisterChange}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-sm leading-6 text-neutral-600">
                  <p className="font-semibold text-neutral-800">
                    Student account registration
                  </p>
                  <p className="mt-2">
                    Student users can register using their personal details.
                    After login, they will be redirected to the Student CRM
                    module.
                  </p>
                </div>
              )}
            </section>

            <div className="lg:col-span-2">
              {error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>

              <div className="mt-4 text-center text-sm text-neutral-500">
                Already have an account?{' '}
                <button
                  type="button"
                  className="font-semibold text-neutral-700 hover:text-neutral-900"
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