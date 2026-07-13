'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import authFetch from '@/lib/api';

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/super-admin/tenants');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load');
      setTenants(json.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Tenants</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Onboard organizations and control which modules they can access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/super-admin/audit"
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Audit log
          </Link>
          <Link
            href="/super-admin/tenants/new"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            + Onboard tenant
          </Link>
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Primary admin</th>
                <th className="px-4 py-3 text-left">Users</th>
                <th className="px-4 py-3 text-left">Enabled modules</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    No tenants yet. Click <em>Onboard tenant</em> to create one.
                  </td>
                </tr>
              )}
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium text-brand">{t.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{t.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : t.status === 'SUSPENDED'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {t.primaryAdmin ? (
                      <div className="flex flex-col">
                        <span className="text-brand">{t.primaryAdmin.fullName}</span>
                        <span className="text-xs text-neutral-500">{t.primaryAdmin.email}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{t.userCount}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {t.enabledModules?.join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/super-admin/tenants/${t.id}`}
                      className="text-sm font-medium text-neutral-700 hover:text-brand"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
