'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAgentDashboard } from '@/services/agentApi';

const AgentDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAgentDashboard();
        setData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading agent workspace...</p>;
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm">
        {error}
      </section>
    );
  }

  const { agent, summary, contractTier, permissions } = data || {};

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">ApplyUniNow · Agent CRM</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Welcome, {agent?.name}</h1>
        <p className="mt-2 text-slate-600 text-sm">
          Contract tier: <span className="font-semibold">{contractTier}</span> · Code {agent?.agentCode}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Associated students</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.associatedStudents ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Documents on file</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.documentsOnFile ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">Pending tuition payments</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.pendingPayments ?? 0}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/agent-crm/profile" className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
            My profile
          </Link>
          <Link href="/agent-crm/students" className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
            My students
          </Link>
          <Link href="/agent-crm/university-poc" className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
            University POC
          </Link>
          <Link href="/agent-crm/payments" className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
            Tuition payments
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-sm font-semibold text-slate-900">Contract permissions</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(permissions || []).map((perm) => (
            <li key={perm} className="rounded-lg bg-white border border-slate-200 px-3 py-1 text-[10px] font-semibold text-slate-600">
              {perm.replace(/_/g, ' ')}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AgentDashboard;
