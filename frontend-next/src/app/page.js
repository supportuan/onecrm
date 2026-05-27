'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/stores/authStore';
import { useWorkspace } from '../lib/workspaceContext';

export default function Home() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { loginToWorkspace } = useWorkspace();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const demoUsers = [
    { email: 'jane.admin@onecrm.com', label: 'Super Admin' },
    { email: 'raju.kalla@onecrm.com', label: 'Counsellor' },
    { email: 'alice.smith@onecrm.com', label: 'HR Manager' },
    { email: 'aarav.sharma@aun.edu', label: 'Student' },
    { email: 'priya.agent@applyuninow.com', label: 'Agent' },
  ];

  const roleToWorkspace = (user = {}) => {
    if (user.workspace) return user.workspace;
    const role = String(user.role || '').toUpperCase();
    if (role === 'STUDENT') return 'student';
    if (role === 'AGENT') return 'agent';
    if (role.includes('MARKETING')) return 'marketing';
    return 'hr';
  };

  const handleQuickSelect = (user) => {
    setEmail(user.email);
    setPassword('password');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }

      setSuccess(true);
      await login(data.user, data.token);
      const targetWorkspace = roleToWorkspace(data.user);
      const routeByWorkspace = {
        hr: '/hr/employee-directory',
        marketing: '/marketing/lead-management',
        student: '/student-crm',
        agent: '/agent-crm',
      };

      setTimeout(async () => {
        await loginToWorkspace(targetWorkspace);
        router.push(routeByWorkspace[targetWorkspace] || '/hr/employee-directory');
      }, 800);

    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 text-slate-800 font-sans p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-md space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">AUN Log In</h1>
          <p className="text-slate-555 text-xs mt-1">Please enter your credentials to access your workspace</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Email Address</label>
            <input
              type="text"
              required
              placeholder="e.g., jane.admin@onecrm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white outline-none transition-all"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
              {errorMsg}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs font-medium rounded-xl">
              Login successful! Redirecting...
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Demo profiles selection */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Quick test profiles</p>
          <div className="flex gap-2">
            {demoUsers.map((user) => (
              <button
                key={user.email}
                onClick={() => handleQuickSelect(user)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold rounded-lg transition-all"
              >
                {user.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
