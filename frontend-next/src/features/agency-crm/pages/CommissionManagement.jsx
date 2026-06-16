'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Percent, Plus } from 'lucide-react';
import {
  listCommissions,
  createCommission,
  updateCommission,
  listPartners,
} from '@/services/agencyCrmApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { COMMISSION_STATUS_LABELS, commissionStatusClass } from '../constants';

const INPUT =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 focus:border-neutral-400 outline-none';
const PAGE_SIZE = 50;

const emptyForm = () => ({
  agencyPartnerId: '',
  amount: '',
  currency: 'GBP',
  period: '',
  description: '',
  status: 'PENDING',
});

export default function CommissionManagement() {
  const { can } = usePermissions();
  const canManage = can('MANAGE_AGENCY_CRM');

  const [partners, setPartners] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, from: 0, to: 0 });
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [msg, setMsg] = useState('');

  useEffect(() => {
    listPartners()
      .then((r) => setPartners(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setPartners([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCommissions({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        agencyPartnerId: agencyFilter || undefined,
      });
      const data = res?.data || {};
      setRows(data.items || []);
      setMeta({
        total: data.total ?? 0,
        page: data.page ?? 1,
        totalPages: data.totalPages ?? 1,
        from: data.from ?? 0,
        to: data.to ?? 0,
      });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, agencyFilter]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, agencyFilter]);

  const addCommission = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      await createCommission({
        agencyPartnerId: Number(form.agencyPartnerId),
        amount: Number(form.amount),
        currency: form.currency,
        period: form.period || undefined,
        description: form.description || undefined,
        status: form.status,
      });
      setShowNew(false);
      setForm(emptyForm());
      setMsg('Commission created');
      await load();
    } catch (err) {
      setMsg(err?.message || 'Failed');
    }
  };

  const setStatus = async (id, status) => {
    if (!canManage) return;
    try {
      await updateCommission(id, { status });
      await load();
    } catch (err) {
      setMsg(err?.message || 'Update failed');
    }
  };

  const totals = rows.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + r.amount;
      return acc;
    },
    {}
  );

  return (
    <div className="ui-page">
      <div className="ui-container space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Commission management</h1>
            <p className="text-sm text-neutral-500 mt-1">Track agency earnings, approvals, and payouts.</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add commission
            </button>
          )}
        </div>

        {msg && <p className="text-sm text-neutral-700">{msg}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['PENDING', 'APPROVED', 'PAID'].map((s) => (
            <div key={s} className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-500">{COMMISSION_STATUS_LABELS[s]} (page)</p>
              <p className="text-xl font-semibold mt-1">£{(totals[s] || 0).toFixed(0)}</p>
            </div>
          ))}
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Total records</p>
            <p className="text-xl font-semibold mt-1">{meta.total}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select className={INPUT + ' w-auto'} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(COMMISSION_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select className={INPUT + ' w-auto min-w-[180px]'} value={agencyFilter} onChange={(e) => setAgencyFilter(e.target.value)}>
            <option value="">All agencies</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.agencyName}</option>
            ))}
          </select>
        </div>

        {showNew && (
          <form onSubmit={addCommission} className="rounded-lg border border-neutral-200 bg-white p-6 grid md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500">Agency</span>
              <select className={INPUT} required value={form.agencyPartnerId} onChange={(e) => setForm({ ...form, agencyPartnerId: e.target.value })}>
                <option value="">Select…</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.agencyName}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500">Amount</span>
              <input type="number" step="0.01" className={INPUT} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500">Period</span>
              <input className={INPUT} placeholder="2026-Q2" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
            </label>
            <label className="block space-y-1 md:col-span-2">
              <span className="text-xs text-neutral-500">Description</span>
              <input className={INPUT} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg">Save</button>
              <button type="button" className="px-4 py-2 text-sm" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          {loading ? (
            <p className="p-8 text-sm text-neutral-500">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <Percent className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No commissions yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Agency</th>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Period</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  {canManage && <th className="text-left px-4 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">{r.agencyPartner?.agencyName}</td>
                    <td className="px-4 py-3 text-neutral-600">{r.student?.fullName || '—'}</td>
                    <td className="px-4 py-3 font-medium">
                      {r.currency} {r.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{r.period || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${commissionStatusClass(r.status)}`}>
                        {COMMISSION_STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.status === 'PENDING' && (
                            <button type="button" className="text-xs px-2 py-1 rounded border" onClick={() => setStatus(r.id, 'APPROVED')}>
                              Approve
                            </button>
                          )}
                          {r.status === 'APPROVED' && (
                            <button type="button" className="text-xs px-2 py-1 rounded border" onClick={() => setStatus(r.id, 'PAID')}>
                              Mark paid
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {meta.total > 0 && (
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>Showing {meta.from}–{meta.to} of {meta.total}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded border disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Page {meta.page} / {meta.totalPages}</span>
              <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded border disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
