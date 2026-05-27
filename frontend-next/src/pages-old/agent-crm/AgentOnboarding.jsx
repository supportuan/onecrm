'use client';

import { useEffect, useState } from 'react';
import { getContractTiers, listAgents, onboardAgent } from '@/services/agentApi';

const AgentOnboarding = () => {
  const [agents, setAgents] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    contractTier: 'STANDARD',
    studentIds: 'stu_1',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, tRes] = await Promise.all([listAgents(), getContractTiers()]);
        setAgents(aRes.data || []);
        setTiers(tRes.data || []);
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await onboardAgent({
        ...form,
        studentIds: form.studentIds.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setMessage(`Agent onboarded: ${res.data.name} (${res.data.agentCode}). Default password: password`);
      const aRes = await listAgents();
      setAgents(aRes.data || []);
      setForm({ name: '', email: '', phone: '', company: '', contractTier: 'STANDARD', studentIds: 'stu_1' });
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading onboarding...</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Agent onboarding</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create agent profiles and assign contract-based access (admin only).
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Create agent profile</h2>
          {['name', 'email', 'phone', 'company'].map((field) => (
            <div key={field}>
              <label className="text-xs font-semibold text-slate-600 capitalize">{field}</label>
              <input
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={field === 'name' || field === 'email'}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-600">Contract tier</label>
            <select
              value={form.contractTier}
              onChange={(e) => setForm({ ...form, contractTier: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            >
              {tiers.map((t) => (
                <option key={t.tier} value={t.tier}>{t.tier}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Associated student IDs (comma-separated)</label>
            <input
              value={form.studentIds}
              onChange={(e) => setForm({ ...form, studentIds: e.target.value })}
              placeholder="stu_1, stu_2"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            />
          </div>
          <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">
            Onboard agent
          </button>
          {message && <p className="text-xs text-slate-600">{message}</p>}
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Contract permissions</h2>
          <ul className="mt-4 space-y-3">
            {tiers.map((t) => (
              <li key={t.tier} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-indigo-700">{t.tier}</p>
                <p className="mt-1 text-[10px] text-slate-600">{t.permissions.join(' · ')}</p>
              </li>
            ))}
          </ul>

          <h2 className="mt-6 text-sm font-semibold text-slate-900">Existing agents</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-700">
            {agents.map((a) => (
              <li key={a.id} className="rounded-lg border border-slate-100 px-3 py-2">
                {a.name} · {a.email} · {a.contractTier}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AgentOnboarding;
