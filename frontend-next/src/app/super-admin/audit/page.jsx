'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import authFetch from '@/lib/api';

const ACTION_LABEL = {
  'tenant.create': 'Created tenant',
  'tenant.update': 'Updated tenant',
  'tenant.setModules': 'Set modules',
  'tenant.resetAdminPassword': 'Reset admin password',
};

export default function AuditPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    authFetch('/api/super-admin/audit')
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message || 'Failed');
        setRows(j.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Super-admin audit</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Append-only log of every super-admin write action.
          </p>
        </div>
        <Link href="/super-admin" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Tenants
        </Link>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Tenant</th>
                <th className="px-4 py-3 text-left">Actor</th>
                <th className="px-4 py-3 text-left">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    No audit entries yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-brand">
                    {ACTION_LABEL[r.action] || r.action}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {r.tenant ? (
                      <Link
                        href={`/super-admin/tenants/${r.tenant.id}`}
                        className="text-brand hover:underline"
                      >
                        {r.tenant.name}
                      </Link>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">user #{r.actorId}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500 font-mono">
                    {r.payload ? JSON.stringify(r.payload) : '—'}
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
