'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import authFetch from '@/lib/api';

export default function TenantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([
        authFetch(`/api/super-admin/tenants/${id}`),
        authFetch('/api/super-admin/catalog/modules'),
      ]);
      const [tJson, cJson] = await Promise.all([tRes.json(), cRes.json()]);
      if (!tRes.ok || !tJson.success) throw new Error(tJson.message || 'Failed to load');
      setTenant(tJson.data);
      if (cJson.success) setCatalog(cJson.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const enabledSet = new Set(
    (tenant?.modules || []).filter((m) => m.enabled).map((m) => m.moduleKey),
  );

  const toggle = async (key) => {
    setSaving(true);
    setMsg(null);
    try {
      const next = new Set(enabledSet);
      next.has(key) ? next.delete(key) : next.add(key);
      const res = await authFetch(`/api/super-admin/tenants/${id}/modules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: Array.from(next) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed');
      setTenant(json.data);
      setMsg('Saved');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const resetAdminPassword = async () => {
    if (!confirm('Generate a new password for the primary admin? Their current password stops working immediately.')) return;
    setResetting(true);
    setError(null);
    try {
      const res = await authFetch(`/api/super-admin/tenants/${id}/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed');
      setResetResult(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setResetting(false);
    }
  };

  const updateStatus = async (status) => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/super-admin/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed');
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-neutral-500">Loading…</div>;
  if (error) return <div className="p-8 text-sm text-red-600">{error}</div>;
  if (!tenant) return null;

  return (
    <div className="p-8 max-w-3xl">
      <button
        onClick={() => router.push('/super-admin')}
        className="text-sm text-neutral-500 hover:text-neutral-800 mb-4"
      >
        ← Back to tenants
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{tenant.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            slug: <code>{tenant.slug}</code> · {tenant.userCount} user{tenant.userCount === 1 ? '' : 's'}
          </p>
        </div>
        <select
          value={tenant.status}
          onChange={(e) => updateStatus(e.target.value)}
          disabled={saving}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </div>

      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="font-medium text-neutral-900 mb-3">Primary admin</h2>
        {tenant.primaryAdmin ? (
          <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
            <div>
              <div className="text-xs text-neutral-500">Name</div>
              <div className="text-neutral-900">{tenant.primaryAdmin.fullName}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Login email</div>
              <div className="text-neutral-900 font-mono">{tenant.primaryAdmin.email}</div>
            </div>
            {tenant.primaryAdmin.phone && (
              <div>
                <div className="text-xs text-neutral-500">Phone</div>
                <div className="text-neutral-900">{tenant.primaryAdmin.phone}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-neutral-500">Last login</div>
              <div className="text-neutral-900">
                {tenant.primaryAdmin.lastLogin
                  ? new Date(tenant.primaryAdmin.lastLogin).toLocaleString()
                  : 'Never'}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No primary admin found for this tenant.</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={resetAdminPassword}
            disabled={resetting || !tenant.primaryAdmin}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {resetting ? 'Resetting…' : 'Reset password'}
          </button>
          <span className="text-xs text-neutral-500">
            Generates a new password. Shown once — copy it before closing.
          </span>
        </div>

        {resetResult && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-800">
              New credentials (shown once)
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <span className="text-amber-700">Email</span>
              <code className="text-amber-900">{resetResult.email}</code>
              <span className="text-amber-700">Password</span>
              <div className="flex items-center gap-2">
                <code className="text-amber-900 font-mono">{resetResult.password}</code>
                <button
                  onClick={() => navigator.clipboard?.writeText(resetResult.password)}
                  className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => setResetResult(null)}
              className="mt-3 text-xs font-medium text-amber-800 hover:text-amber-900"
            >
              Dismiss
            </button>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-neutral-900">Modules</h2>
          {msg && <span className="text-xs text-emerald-600">{msg}</span>}
        </div>
        <p className="text-xs text-neutral-500 mb-4">
          Toggle a module to enable or disable it for every user in this tenant. Takes effect immediately.
        </p>
        <div className="space-y-2">
          {catalog.map((m) => {
            const on = enabledSet.has(m.key);
            return (
              <div
                key={m.key}
                className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900">{m.label}</span>
                    {m.beta && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        Beta
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">{m.key}</div>
                </div>
                <button
                  onClick={() => toggle(m.key)}
                  disabled={saving}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    on
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {on ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
