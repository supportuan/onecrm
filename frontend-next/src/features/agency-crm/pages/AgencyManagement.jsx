'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Save, Search, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import {
  listPartners,
  createPartner,
  updatePartner,
  getStatistics,
  updatePartnerStatus,
  advanceOnboarding,
} from '@/services/agencyCrmApi';
import { PARTNER_STATUS_LABELS, partnerStatusClass } from '../constants';

const INPUT =
  'w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:border-neutral-400 outline-none';

const emptyForm = () => ({
  agencyName: '',
  agencyCode: '',
  fullName: '',
  email: '',
  password: 'Welcome@123',
  phone: '',
  contactPerson: '',
  city: '',
  country: '',
  services: '',
  commissionRate: 10,
  status: 'PENDING',
  notes: '',
});

export default function AgencyManagement() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can('MANAGE_AGENCY_CRM');
  const isFreelancer = user?.role === 'AGENCY_FREELANCER' || user?.role === 'AGENT';

  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        listPartners({ search: search || undefined }),
        getStatistics(),
      ]);
      const list = Array.isArray(pRes?.data) ? pRes.data : [];
      setPartners(list);
      setStats(sRes?.data || null);
      if (!selectedId && list.length) setSelectedId(list[0].id);
      if (isFreelancer && list.length === 1) setSelectedId(list[0].id);
    } catch (e) {
      flash(e?.message || 'Failed to load agencies');
    } finally {
      setLoading(false);
    }
  }, [search, selectedId, isFreelancer]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const selected = partners.find((p) => p.id === selectedId) || null;

  useEffect(() => {
    if (!selected) return;
    setForm({
      agencyName: selected.agencyName || '',
      agencyCode: selected.agencyCode || '',
      fullName: selected.user?.fullName || '',
      email: selected.email || selected.user?.email || '',
      password: '',
      phone: selected.phone || selected.user?.phone || '',
      contactPerson: selected.contactPerson || '',
      city: selected.city || '',
      country: selected.country || '',
      services: selected.services || '',
      commissionRate: selected.commissionRate ?? 10,
      status: selected.status || 'ACTIVE',
      notes: selected.notes || '',
    });
  }, [selected]);

  const savePartner = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!canManage && !isFreelancer) return;
    try {
      await updatePartner(selectedId, {
        agencyName: form.agencyName,
        agencyCode: form.agencyCode,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone,
        city: form.city,
        country: form.country,
        services: form.services,
        commissionRate: Number(form.commissionRate),
        status: form.status,
        notes: form.notes,
      });
      flash('Agency updated');
      await load();
    } catch (e) {
      flash(e?.message || 'Update failed');
    }
  };

  const addPartner = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      const res = await createPartner({
        agencyName: form.agencyName,
        agencyCode: form.agencyCode || undefined,
        fullName: form.fullName || form.agencyName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        contactPerson: form.contactPerson || form.fullName,
        city: form.city || undefined,
        country: form.country || undefined,
        commissionRate: Number(form.commissionRate),
        status: form.status,
        notes: form.notes || undefined,
      });
      setShowNew(false);
      setForm(emptyForm());
      setSelectedId(res?.data?.id);
      flash('Agency partner created');
      await load();
    } catch (e) {
      flash(e?.message || 'Create failed');
    }
  };

  return (
    <div className="ui-page">
      <div className="ui-container space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-brand">Agency management</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {isFreelancer
                ? 'Your agency partner profile and referral settings.'
                : 'Manage agency partners, contracts, and commission rates.'}
            </p>
          </div>
          {canManage && !isFreelancer && (
            <button
              type="button"
              onClick={() => {
                setShowNew(true);
                setForm(emptyForm());
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add agency
            </button>
          )}
        </div>

        {msg && <p className="text-sm text-neutral-700">{msg}</p>}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Referrals', value: stats.totalReferrals },
              { label: 'Active students', value: stats.activeStudents },
              { label: 'Enrolled', value: stats.enrolledStudents },
              { label: 'Commission paid', value: `£${stats.totalCommissionAmount?.toFixed?.(0) ?? stats.totalCommissionAmount}` },
            ].map((c) => (
              <div key={c.label} className="rounded-lg border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-500">{c.label}</p>
                <p className="text-xl font-semibold text-brand mt-1">{c.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {!isFreelancer && (
            <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  className={`${INPUT} pl-9`}
                  placeholder="Search agencies…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-1 max-h-[480px] overflow-y-auto">
                {loading && <p className="text-sm text-neutral-500 p-2">Loading…</p>}
                {!loading && partners.length === 0 && (
                  <p className="text-sm text-neutral-500 p-2">No agencies yet.</p>
                )}
                {partners.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${
                      selectedId === p.id ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="font-medium text-brand">{p.agencyName}</div>
                    <div className="text-xs text-neutral-500">{p.agencyCode}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            {!selected && !showNew && (
              <div className="text-center py-12 text-neutral-500">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Select an agency or create a new partner.</p>
              </div>
            )}

            {(selected || showNew) && (
              <form onSubmit={showNew ? addPartner : savePartner} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-neutral-500" />
                  <h2 className="text-lg font-medium text-brand">
                    {showNew ? 'New agency partner' : selected.agencyName}
                  </h2>
                  {!showNew && selected?.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${partnerStatusClass(selected.status)}`}>
                      {PARTNER_STATUS_LABELS[selected.status] || selected.status}
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Agency name</span>
                    <input className={INPUT} required value={form.agencyName} onChange={(e) => setForm({ ...form, agencyName: e.target.value })} disabled={!canManage} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Agency code</span>
                    <input className={INPUT} value={form.agencyCode} onChange={(e) => setForm({ ...form, agencyCode: e.target.value })} disabled={!canManage} placeholder="Auto-generated if empty" />
                  </label>
                  {showNew && (
                    <>
                      <label className="block space-y-1">
                        <span className="text-xs text-neutral-500">Contact full name</span>
                        <input className={INPUT} required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs text-neutral-500">Login email</span>
                        <input type="email" className={INPUT} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs text-neutral-500">Initial password</span>
                        <input className={INPUT} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                      </label>
                    </>
                  )}
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Contact person</span>
                    <input className={INPUT} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} disabled={!canManage} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Phone</span>
                    <input className={INPUT} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!canManage} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">City</span>
                    <input className={INPUT} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} disabled={!canManage} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Country</span>
                    <input className={INPUT} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} disabled={!canManage} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Commission rate (%)</span>
                    <input type="number" step="0.1" className={INPUT} value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} disabled={!canManage || isFreelancer} />
                  </label>
                  {!isFreelancer && (
                    <label className="block space-y-1">
                      <span className="text-xs text-neutral-500">Status</span>
                      <select className={INPUT} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={!canManage}>
                        {Object.entries(PARTNER_STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <label className="block space-y-1">
                  <span className="text-xs text-neutral-500">Services offered</span>
                  <input
                    className={INPUT}
                    value={form.services}
                    onChange={(e) => setForm({ ...form, services: e.target.value })}
                    disabled={isFreelancer && !canManage}
                    placeholder="e.g. Study abroad, visa support"
                  />
                </label>

                {!showNew && canManage && !isFreelancer && selectedId && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                    {['VERIFIED', 'APPROVED', 'ACTIVE', 'INACTIVE', 'BLACKLISTED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 hover:bg-neutral-50"
                        onClick={async () => {
                          await updatePartnerStatus(selectedId, st);
                          flash(`Status → ${st}`);
                          await load();
                        }}
                      >
                        Mark {PARTNER_STATUS_LABELS[st]}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 hover:bg-neutral-50"
                      onClick={async () => {
                        await advanceOnboarding(selectedId, 'VERIFIED');
                        flash('Onboarding verified');
                        await load();
                      }}
                    >
                      Verify docs
                    </button>
                  </div>
                )}

                <label className="block space-y-1">
                  <span className="text-xs text-neutral-500">Notes</span>
                  <textarea className={`${INPUT} min-h-[80px]`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={!canManage} />
                </label>

                {(canManage || isFreelancer) && (
                  <div className="flex gap-2">
                    <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm rounded-lg">
                      <Save className="w-4 h-4" />
                      {showNew ? 'Create agency' : 'Save changes'}
                    </button>
                    {showNew && (
                      <button type="button" className="px-4 py-2 text-sm text-neutral-600" onClick={() => setShowNew(false)}>
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
