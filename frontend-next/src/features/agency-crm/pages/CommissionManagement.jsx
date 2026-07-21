'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Percent, Plus } from 'lucide-react';
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
} from '@/services/agencyCrmApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { COMMISSION_STATUS_LABELS, commissionStatusClass } from '../constants';
import { isAgencyPartnerRole } from '../agentPortal';

const INPUT =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 focus:border-neutral-400 outline-none';
const PAGE_SIZE = 50;

const emptyForm = () => ({
  agencyPartnerId: '',
  amount: '',
  currency: 'INR',
  period: '',
  description: '',
  status: 'PENDING',
});

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
  const [msg, setMsg] = useState('');
  const [rules, setRules] = useState([]);
  const [statement, setStatement] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [payoutPeriod, setPayoutPeriod] = useState('');
  const [ruleForm, setRuleForm] = useState({
    country: '',
    university: '',
    ruleType: 'PERCENTAGE',
    amount: 10,
    trigger: 'ENROLLED',
  });

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
    if (!agencyFilter) return;
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
      setMsg('Commission created');
      await load();
    } catch (err) {
      setMsg(err?.message || 'Failed');
    }
  };

  const onVerify = async (id, approve = true) => {
    if (!canManage) return;
    try {
      await verifyCommission(id, { approve });
      setMsg(approve ? 'Commission verified & approved' : 'Commission rejected');
      await load();
    } catch (err) {
      setMsg(err?.message || 'Verify failed');
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
      setMsg('Payout batch created');
      setTab('payouts');
      await load();
      await loadPayouts();
    } catch (err) {
      setMsg(err?.message || 'Payout failed');
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
            <h1 className="text-2xl font-semibold text-brand">
              {isAgent ? 'My commissions' : 'Commission management'}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {isAgent
                ? 'Track your earnings and statement totals. Payouts are processed by UniNow staff.'
                : 'Verify commissions, build payout batches, and manage rules.'}
            </p>
          </div>
          {canManage && tab === 'commissions' && (
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add commission
            </button>
          )}
        </div>

        {isAgent && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            <p className="font-medium text-neutral-900">View only</p>
            <p className="mt-1 text-neutral-600">
              You can review commission status and amounts here. Approvals and payouts are handled by UniNow —
              contact your coordinator if something looks wrong.
            </p>
            <ol className="mt-3 list-decimal pl-5 space-y-1 text-neutral-600 text-xs">
              <li>Earned when a referred student reaches <strong>Enrolled</strong> (or visa-approved, if configured).</li>
              <li><strong>Pending</strong> — waiting for staff verification.</li>
              <li><strong>Approved</strong> — queued for payout.</li>
              <li><strong>Paid</strong> — included in a completed payout batch.</li>
            </ol>
          </div>
        )}

        {msg && <p className="text-sm text-neutral-700">{msg}</p>}

        {canManage && (
          <div className="flex gap-2 border-b border-neutral-200">
            {[
              { id: 'commissions', label: 'Commissions' },
              { id: 'payouts', label: 'Payouts' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === t.id ? 'border-brand text-brand' : 'border-transparent text-neutral-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {tab === 'commissions' && (
        <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['PENDING', 'APPROVED', 'PAID'].map((s) => (
            <div key={s} className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-500">{COMMISSION_STATUS_LABELS[s]} (page)</p>
              <p className="text-xl font-semibold mt-1">{(totals[s] || 0).toFixed(0)}</p>
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
          {!isAgent && (
            <select className={INPUT + ' w-auto min-w-[180px]'} value={agencyFilter} onChange={(e) => setAgencyFilter(e.target.value)}>
              <option value="">All agencies</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.agencyName}</option>
              ))}
            </select>
          )}
        </div>

        {canManage && selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
            <span>{selectedIds.length} approved commissions selected</span>
            <input
              className={INPUT + ' w-40'}
              placeholder="Period e.g. 2026-Q3"
              value={payoutPeriod}
              onChange={(e) => setPayoutPeriod(e.target.value)}
            />
            <button type="button" className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs" onClick={createBatch}>
              Create payout batch
            </button>
            <button type="button" className="text-xs underline" onClick={() => setSelectedIds([])}>
              Clear
            </button>
          </div>
        )}

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
              <button type="submit" className="px-4 py-2 bg-brand text-white text-sm rounded-lg">Save</button>
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
              {isAgent && (
                <p className="text-xs mt-1 max-w-sm mx-auto">
                  Commissions appear when a referred student reaches Enrolled (then Pending → Approved → Paid).
                </p>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  {canManage && <th className="px-3 py-3" />}
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
                            <>
                              <button type="button" className="text-xs px-2 py-1 rounded border" onClick={() => onVerify(r.id, true)}>
                                Verify &amp; approve
                              </button>
                              <button type="button" className="text-xs px-2 py-1 rounded border text-red-600" onClick={() => onVerify(r.id, false)}>
                                Reject
                              </button>
                            </>
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

        {canManage && agencyFilter && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-medium">Commission rules</h2>
            <form
              className="grid md:grid-cols-5 gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await saveCommissionRule({ ...ruleForm, agencyPartnerId: Number(agencyFilter), amount: Number(ruleForm.amount) });
                const r = await listCommissionRules(agencyFilter);
                setRules(r?.data || []);
                setMsg('Rule saved');
              }}
            >
              <input className={INPUT} placeholder="Country" value={ruleForm.country} onChange={(e) => setRuleForm({ ...ruleForm, country: e.target.value })} />
              <input className={INPUT} placeholder="University" value={ruleForm.university} onChange={(e) => setRuleForm({ ...ruleForm, university: e.target.value })} />
              <select className={INPUT} value={ruleForm.ruleType} onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}>
                <option value="PERCENTAGE">%</option>
                <option value="FIXED">Fixed</option>
              </select>
              <input className={INPUT} type="number" placeholder="Amount" value={ruleForm.amount} onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })} />
              <button type="submit" className="px-3 py-2 bg-brand text-white text-sm rounded-lg">Add rule</button>
            </form>
            <ul className="text-sm space-y-2">
              {rules.map((rule) => (
                <li key={rule.id} className="flex justify-between border-b border-neutral-100 py-2">
                  <span>{rule.country || 'Any'} / {rule.university || 'Any'} — {rule.ruleType} {rule.amount} ({rule.trigger})</span>
                  <button type="button" className="text-red-600 text-xs" onClick={async () => { await deleteCommissionRule(rule.id); setRules((await listCommissionRules(agencyFilter))?.data || []); }}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {statement?.totals && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-medium mb-2">Commission statement</h2>
            <p className="text-sm text-neutral-600">
              Total: ₹{statement.totals.amount?.toLocaleString?.('en-IN')} · Paid: ₹{statement.totals.paid?.toLocaleString?.('en-IN')} · Pending: ₹{statement.totals.pending?.toLocaleString?.('en-IN')}
            </p>
          </div>
        )}
        </>
        )}

        {tab === 'payouts' && canManage && (
          <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
            {!payouts.length ? (
              <p className="p-8 text-sm text-neutral-500">No payout batches yet. Select APPROVED commissions and create a batch.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {payouts.map((p) => (
                  <li key={p.id} className="p-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-brand">Payout #{p.id} · {p.period || 'No period'}</p>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        {p.currency} {Number(p.totalAmount).toFixed(2)} · {p.lines?.length || 0} lines · {p.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {p.status === 'DRAFT' && (
                        <>
                          <button
                            type="button"
                            className="text-xs px-3 py-1.5 border rounded-lg"
                            onClick={async () => {
                              await updatePayoutStatus(p.id, { status: 'PROCESSING' });
                              await loadPayouts();
                            }}
                          >
                            Start processing
                          </button>
                          <button
                            type="button"
                            className="text-xs px-3 py-1.5 border rounded-lg bg-brand text-white"
                            onClick={async () => {
                              await updatePayoutStatus(p.id, { status: 'PAID' });
                              setMsg('Payout marked paid');
                              await loadPayouts();
                              await load();
                            }}
                          >
                            Mark paid
                          </button>
                          <button
                            type="button"
                            className="text-xs px-3 py-1.5 border rounded-lg text-red-600"
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
                          className="text-xs px-3 py-1.5 border rounded-lg bg-brand text-white"
                          onClick={async () => {
                            await updatePayoutStatus(p.id, { status: 'PAID' });
                            setMsg('Payout marked paid');
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
