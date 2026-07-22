'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  IndianRupee,
  Percent,
  Plus,
  Wallet,
} from 'lucide-react';
import {
  listCommissions,
  createCommission,
  updateCommission,
  listPartners,
  getCommissionStatement,
  listCommissionRules,
  saveCommissionRule,
  deleteCommissionRule,
  verifyCommission,
  listPayouts,
  createPayout,
  updatePayoutStatus,
  getMyPartner,
  getStatistics,
} from '@/services/agencyCrmApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { COMMISSION_STATUS_LABELS, commissionStatusClass } from '../constants';
import { isAgencyPartnerRole } from '../agentPortal';

const INPUT =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-brand outline-none';
const PAGE_SIZE = 50;

const emptyForm = () => ({
  agencyPartnerId: '',
  amount: '',
  currency: 'INR',
  period: '',
  description: '',
  status: 'PENDING',
});

const formatMoney = (value, currency = 'INR') => {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(0)}`;
  }
};

export default function CommissionManagement() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can('MANAGE_AGENCY_CRM');
  const isAgent = isAgencyPartnerRole(user?.role);

  const [tab, setTab] = useState('commissions');
  const [partners, setPartners] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, from: 0, to: 0 });
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [toast, setToast] = useState({ kind: '', msg: '' });
  const [rules, setRules] = useState([]);
  const [statement, setStatement] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [payoutPeriod, setPayoutPeriod] = useState('');
  const [stats, setStats] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    country: '',
    university: '',
    ruleType: 'PERCENTAGE',
    amount: 10,
    trigger: 'ENROLLED',
  });

  const flash = (kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast({ kind: '', msg: '' }), 3200);
  };

  useEffect(() => {
    if (isAgent) {
      getMyPartner()
        .then((r) => {
          if (r?.data?.id) setAgencyFilter(String(r.data.id));
        })
        .catch(() => {});
      return;
    }
    listPartners()
      .then((r) => setPartners(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setPartners([]));
  }, [isAgent]);

  useEffect(() => {
    getStatistics({ agencyPartnerId: agencyFilter || undefined })
      .then((r) => setStats(r?.data || null))
      .catch(() => setStats(null));
  }, [agencyFilter]);

  useEffect(() => {
    if (!agencyFilter) {
      setRules([]);
      setStatement(null);
      return;
    }
    listCommissionRules(agencyFilter)
      .then((r) => setRules(r?.data || []))
      .catch(() => setRules([]));
    getCommissionStatement({ agencyPartnerId: agencyFilter })
      .then((r) => setStatement(r?.data || null))
      .catch(() => setStatement(null));
  }, [agencyFilter]);

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

  const loadPayouts = useCallback(async () => {
    if (!canManage) return;
    try {
      const res = await listPayouts();
      setPayouts(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setPayouts([]);
    }
  }, [canManage]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (tab === 'payouts') loadPayouts().catch(() => {});
  }, [tab, loadPayouts]);

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
      flash('ok', 'Commission created');
      await load();
      const s = await getStatistics({ agencyPartnerId: agencyFilter || undefined }).catch(() => null);
      if (s?.data) setStats(s.data);
    } catch (err) {
      flash('err', err?.message || 'Failed');
    }
  };

  const onVerify = async (id, approve = true) => {
    if (!canManage) return;
    try {
      await verifyCommission(id, { approve });
      flash('ok', approve ? 'Verified & approved' : 'Commission rejected');
      await load();
      const s = await getStatistics({ agencyPartnerId: agencyFilter || undefined }).catch(() => null);
      if (s?.data) setStats(s.data);
    } catch (err) {
      flash('err', err?.message || 'Verify failed');
    }
  };

  const setStatus = async (id, status) => {
    if (!canManage) return;
    try {
      await updateCommission(id, { status });
      await load();
      const s = await getStatistics({ agencyPartnerId: agencyFilter || undefined }).catch(() => null);
      if (s?.data) setStats(s.data);
    } catch (err) {
      flash('err', err?.message || 'Update failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createBatch = async () => {
    if (!selectedIds.length) return;
    try {
      await createPayout({
        commissionIds: selectedIds,
        period: payoutPeriod || undefined,
      });
      setSelectedIds([]);
      setPayoutPeriod('');
      flash('ok', 'Payout batch created');
      setTab('payouts');
      await load();
      await loadPayouts();
    } catch (err) {
      flash('err', err?.message || 'Payout failed');
    }
  };

  const kpis = useMemo(() => {
    const pending = stats?.pendingCommissions ?? 0;
    const approved = stats?.approvedCommissions ?? 0;
    const paid = stats?.paidCommissions ?? 0;
    const paidAmount = stats?.totalCommissionAmount ?? 0;
    const statementPending = statement?.totals?.pending;
    const statementApproved = statement?.totals?.approved;
    return [
      {
        key: 'pending',
        label: 'Pending verify',
        value: pending,
        sub: statementPending != null ? formatMoney(statementPending) : 'Awaiting staff',
        icon: Clock3,
        accent: pending > 0,
        filter: 'PENDING',
      },
      {
        key: 'approved',
        label: 'Queued payout',
        value: approved,
        sub: statementApproved != null ? formatMoney(statementApproved) : 'Ready to batch',
        icon: Wallet,
        accent: false,
        filter: 'APPROVED',
      },
      {
        key: 'paid',
        label: 'Paid lines',
        value: paid,
        sub: 'Completed lines',
        icon: CheckCircle2,
        accent: false,
        filter: 'PAID',
      },
      {
        key: 'volume',
        label: 'Paid volume',
        value: formatMoney(paidAmount),
        sub: `${meta.total} ledger rows`,
        icon: IndianRupee,
        accent: false,
        filter: '',
      },
    ];
  }, [stats, statement, meta.total]);

  const pendingCount = stats?.pendingCommissions ?? 0;
  const draftPayouts = payouts.filter((p) => p.status === 'DRAFT' || p.status === 'PROCESSING').length;

  return (
    <div className="text-brand">
      {toast.msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[13px] font-medium text-white ${
            toast.kind === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="space-y-5">
        {/* KPI strip */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {kpis.map((k) => {
            const Icon = k.icon;
            const active = statusFilter === k.filter && k.filter !== '';
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => {
                  if (!k.filter) return;
                  setStatusFilter((prev) => (prev === k.filter ? '' : k.filter));
                  setTab('commissions');
                }}
                className={`app-glass-card rounded-2xl px-4 py-4 text-left transition-all ${
                  k.filter ? 'hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'
                } ${active ? 'ring-2 ring-brand/30 border-brand/40' : ''} ${
                  k.accent ? 'ring-1 ring-amber-200' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10.5px] font-medium uppercase tracking-wide text-neutral-500">
                    {k.label}
                  </p>
                  <div className={`app-gradient-icon !w-8 !h-8 !flex-[0_0_32px] ${k.accent ? 'ring-2 ring-amber-300/70' : ''}`}>
                    <Icon size={13} />
                  </div>
                </div>
                <p className="mt-2 text-[22px] font-semibold tracking-tight tabular-nums leading-none">
                  {k.value}
                </p>
                <p className="mt-1.5 text-[11px] text-neutral-500">{k.sub}</p>
              </button>
            );
          })}
        </div>

        {/* Attention + actions */}
        <div className="flex flex-wrap items-center gap-3">
          {canManage && pendingCount > 0 && (
            <div className="app-glass-card flex flex-1 min-w-[240px] items-center justify-between gap-3 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <AlertCircle size={14} className="text-amber-600" />
                </div>
                <p className="text-[13px] text-neutral-800 truncate">
                  <span className="font-semibold text-brand">{pendingCount}</span> commission
                  {pendingCount === 1 ? '' : 's'} need verification
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium"
                onClick={() => {
                  setStatusFilter('PENDING');
                  setTab('commissions');
                }}
              >
                Review now
              </button>
            </div>
          )}

          {canManage && (
            <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-xl p-1 ml-auto">
              {[
                { id: 'commissions', label: 'Ledger' },
                { id: 'payouts', label: `Payouts${draftPayouts ? ` (${draftPayouts})` : ''}` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    tab === t.id
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-white hover:text-brand'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {canManage && tab === 'commissions' && (
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-white text-[12.5px] font-medium hover:bg-brand-hover"
            >
              <Plus className="w-3.5 h-3.5" />
              Add commission
            </button>
          )}
        </div>

        {isAgent && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-700">
            <p className="font-medium text-neutral-900">View only</p>
            <p className="mt-1 text-[12.5px] text-neutral-600">
              Approvals and payouts are handled by UniNow. Earned on <strong>Enrolled</strong> → Pending → Approved → Paid.
            </p>
          </div>
        )}

        {tab === 'commissions' && (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: '', label: 'All' },
                  ...Object.entries(COMMISSION_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
                ].map((s) => (
                  <button
                    key={s.value || 'all'}
                    type="button"
                    onClick={() => setStatusFilter(s.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      statusFilter === s.value
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand/40'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {!isAgent && (
                <select
                  className={`${INPUT} w-auto min-w-[180px] ml-auto`}
                  value={agencyFilter}
                  onChange={(e) => setAgencyFilter(e.target.value)}
                >
                  <option value="">All agencies</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.agencyName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {canManage && selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm">
                <Banknote className="w-4 h-4 text-brand shrink-0" />
                <span className="font-medium">{selectedIds.length} approved selected</span>
                <input
                  className={`${INPUT} w-40`}
                  placeholder="Period e.g. 2026-Q3"
                  value={payoutPeriod}
                  onChange={(e) => setPayoutPeriod(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-medium"
                  onClick={createBatch}
                >
                  Create payout batch
                </button>
                <button type="button" className="text-xs underline text-neutral-600" onClick={() => setSelectedIds([])}>
                  Clear
                </button>
              </div>
            )}

            {showNew && (
              <form
                onSubmit={addCommission}
                className="app-glass-card rounded-2xl p-5 grid md:grid-cols-2 gap-4"
              >
                <label className="block space-y-1">
                  <span className="text-xs text-neutral-500">Agency</span>
                  <select
                    className={INPUT}
                    required
                    value={form.agencyPartnerId}
                    onChange={(e) => setForm({ ...form, agencyPartnerId: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.agencyName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-neutral-500">Amount</span>
                  <input
                    type="number"
                    step="0.01"
                    className={INPUT}
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-neutral-500">Period</span>
                  <input
                    className={INPUT}
                    placeholder="2026-Q2"
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                  />
                </label>
                <label className="block space-y-1 md:col-span-2">
                  <span className="text-xs text-neutral-500">Description</span>
                  <input
                    className={INPUT}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </label>
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-brand text-white text-sm rounded-lg font-medium">
                    Save
                  </button>
                  <button type="button" className="px-4 py-2 text-sm text-neutral-600" onClick={() => setShowNew(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className={`grid gap-4 ${canManage && agencyFilter ? 'xl:grid-cols-[minmax(0,1fr)_300px]' : ''}`}>
              <div className="app-glass-card rounded-2xl overflow-hidden min-w-0">
                {loading ? (
                  <p className="p-8 text-sm text-neutral-500">Loading ledger…</p>
                ) : rows.length === 0 ? (
                  <div className="p-12 text-center text-neutral-500">
                    <Percent className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-neutral-700">No commissions yet</p>
                    {isAgent && (
                      <p className="text-xs mt-1 max-w-sm mx-auto">
                        Lines appear when a referred student reaches Enrolled.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-50/80 text-[11px] uppercase tracking-wide text-neutral-500 border-b border-neutral-100">
                          {canManage && <th className="px-3 py-3 w-10" />}
                          <th className="text-left px-4 py-3 font-semibold">Agency</th>
                          <th className="text-left px-4 py-3 font-semibold">Student</th>
                          <th className="text-left px-4 py-3 font-semibold">Amount</th>
                          <th className="text-left px-4 py-3 font-semibold">Period</th>
                          <th className="text-left px-4 py-3 font-semibold">Status</th>
                          {canManage && <th className="text-left px-4 py-3 font-semibold">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50/60">
                            {canManage && (
                              <td className="px-3 py-3">
                                {r.status === 'APPROVED' && (
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(r.id)}
                                    onChange={() => toggleSelect(r.id)}
                                  />
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3 font-medium">{r.agencyPartner?.agencyName}</td>
                            <td className="px-4 py-3 text-neutral-600">{r.student?.fullName || '—'}</td>
                            <td className="px-4 py-3 font-semibold tabular-nums">
                              {r.currency} {Number(r.amount).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-neutral-600">{r.period || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${commissionStatusClass(r.status)}`}>
                                {COMMISSION_STATUS_LABELS[r.status] || r.status}
                              </span>
                            </td>
                            {canManage && (
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {r.status === 'PENDING' && (
                                    <>
                                      <button
                                        type="button"
                                        className="text-[11px] px-2 py-1 rounded-lg bg-brand text-white font-medium"
                                        onClick={() => onVerify(r.id, true)}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        className="text-[11px] px-2 py-1 rounded-lg border border-neutral-200 text-red-600"
                                        onClick={() => onVerify(r.id, false)}
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {r.status === 'APPROVED' && (
                                    <button
                                      type="button"
                                      className="text-[11px] px-2 py-1 rounded-lg border border-neutral-200"
                                      onClick={() => setStatus(r.id, 'PAID')}
                                    >
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
                  </div>
                )}

                {meta.total > 0 && (
                  <div className="flex items-center justify-between text-[12.5px] text-neutral-600 px-4 py-3 border-t border-neutral-100">
                    <span>
                      Showing {meta.from}–{meta.to} of {meta.total}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="p-1.5 rounded-lg border border-neutral-200 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span>
                        {meta.page} / {meta.totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= meta.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="p-1.5 rounded-lg border border-neutral-200 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {canManage && agencyFilter && (
                <div className="space-y-4">
                  {statement?.totals && (
                    <div className="app-glass-card rounded-2xl p-4 space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                        Agency statement
                      </p>
                      <div className="space-y-2">
                        {[
                          ['Total', statement.totals.amount],
                          ['Pending', statement.totals.pending],
                          ['Approved', statement.totals.approved],
                          ['Paid', statement.totals.paid],
                        ].map(([label, val]) => (
                          <div key={label} className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500">{label}</span>
                            <span className="font-semibold tabular-nums">{formatMoney(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="app-glass-card rounded-2xl p-4 space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      Commission rules
                    </p>
                    <form
                      className="space-y-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await saveCommissionRule({
                          ...ruleForm,
                          agencyPartnerId: Number(agencyFilter),
                          amount: Number(ruleForm.amount),
                        });
                        const r = await listCommissionRules(agencyFilter);
                        setRules(r?.data || []);
                        flash('ok', 'Rule saved');
                      }}
                    >
                      <input
                        className={INPUT}
                        placeholder="Country"
                        value={ruleForm.country}
                        onChange={(e) => setRuleForm({ ...ruleForm, country: e.target.value })}
                      />
                      <input
                        className={INPUT}
                        placeholder="University"
                        value={ruleForm.university}
                        onChange={(e) => setRuleForm({ ...ruleForm, university: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className={INPUT}
                          value={ruleForm.ruleType}
                          onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}
                        >
                          <option value="PERCENTAGE">%</option>
                          <option value="FIXED">Fixed</option>
                        </select>
                        <input
                          className={INPUT}
                          type="number"
                          placeholder="Amount"
                          value={ruleForm.amount}
                          onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })}
                        />
                      </div>
                      <button type="submit" className="w-full px-3 py-2 bg-brand text-white text-sm rounded-lg font-medium">
                        Add rule
                      </button>
                    </form>
                    <ul className="text-[12.5px] space-y-2 max-h-48 overflow-y-auto">
                      {rules.length === 0 && <li className="text-neutral-400">No rules yet.</li>}
                      {rules.map((rule) => (
                        <li
                          key={rule.id}
                          className="flex justify-between gap-2 border-b border-neutral-100 py-2"
                        >
                          <span className="min-w-0">
                            {rule.country || 'Any'} / {rule.university || 'Any'} — {rule.ruleType}{' '}
                            {rule.amount}
                          </span>
                          <button
                            type="button"
                            className="text-red-600 text-[11px] shrink-0"
                            onClick={async () => {
                              await deleteCommissionRule(rule.id);
                              setRules((await listCommissionRules(agencyFilter))?.data || []);
                            }}
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'payouts' && canManage && (
          <div className="app-glass-card rounded-2xl overflow-hidden">
            {!payouts.length ? (
              <p className="p-8 text-sm text-neutral-500">
                No payout batches yet. Select APPROVED commissions and create a batch.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {payouts.map((p) => (
                  <li key={p.id} className="p-5 flex flex-wrap items-center justify-between gap-3 hover:bg-neutral-50/50">
                    <div>
                      <p className="font-semibold text-brand">
                        Payout #{p.id}
                        <span className="text-neutral-400 font-normal"> · {p.period || 'No period'}</span>
                      </p>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        {p.currency} {Number(p.totalAmount).toFixed(2)} · {p.lines?.length || 0} lines ·{' '}
                        <span className="font-medium text-neutral-700">{p.status}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {p.status === 'DRAFT' && (
                        <>
                          <button
                            type="button"
                            className="text-xs px-3 py-1.5 border border-neutral-200 rounded-lg"
                            onClick={async () => {
                              await updatePayoutStatus(p.id, { status: 'PROCESSING' });
                              await loadPayouts();
                            }}
                          >
                            Start processing
                          </button>
                          <button
                            type="button"
                            className="text-xs px-3 py-1.5 rounded-lg bg-brand text-white font-medium"
                            onClick={async () => {
                              await updatePayoutStatus(p.id, { status: 'PAID' });
                              flash('ok', 'Payout marked paid');
                              await loadPayouts();
                              await load();
                            }}
                          >
                            Mark paid
                          </button>
                          <button
                            type="button"
                            className="text-xs px-3 py-1.5 border border-neutral-200 rounded-lg text-red-600"
                            onClick={async () => {
                              await updatePayoutStatus(p.id, { status: 'CANCELLED' });
                              await loadPayouts();
                              await load();
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {p.status === 'PROCESSING' && (
                        <button
                          type="button"
                          className="text-xs px-3 py-1.5 rounded-lg bg-brand text-white font-medium"
                          onClick={async () => {
                            await updatePayoutStatus(p.id, { status: 'PAID' });
                            flash('ok', 'Payout marked paid');
                            await loadPayouts();
                            await load();
                          }}
                        >
                          Mark paid
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
