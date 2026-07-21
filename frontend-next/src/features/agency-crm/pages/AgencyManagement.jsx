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
  approvePartnerLogin,
  listPartnerDocuments,
  verifyPartnerDocument,
} from '@/services/agencyCrmApi';
import { PARTNER_STATUS_LABELS, ONBOARDING_STAGE_LABELS, partnerStatusClass } from '../constants';
import { isAgencyPartnerRole, ONBOARDING_STAGE_ORDER } from '../agentPortal';

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

/** Admin partner-ops screen. Agents use the portal shell (onboarding / my students). */
export default function AgencyManagement() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can('MANAGE_AGENCY_CRM');
  const isFreelancer = isAgencyPartnerRole(user?.role);

  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [showNew, setShowNew] = useState(false);
  const [activePanel, setActivePanel] = useState('details');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [caps, setCaps] = useState({
    canPayFees: false,
    canMessageUniversity: false,
    canManageApplications: true,
    canViewCommission: true,
  });

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const load = useCallback(async () => {
    if (isFreelancer) return;
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
    const c = selected.capabilities || {};
    setCaps({
      canPayFees: Boolean(c.canPayFees),
      canMessageUniversity: Boolean(c.canMessageUniversity),
      canManageApplications: c.canManageApplications !== false,
      canViewCommission: c.canViewCommission !== false,
    });
    if (canManage && selected.id) {
      setDocsLoading(true);
      setDocsError('');
      listPartnerDocuments(selected.id)
        .then((r) => setDocs(r?.data || []))
        .catch((error) => {
          setDocs([]);
          setDocsError(error?.message || 'Unable to load submitted documents');
        })
        .finally(() => setDocsLoading(false));
    } else {
      setDocs([]);
      setDocsError('');
      setDocsLoading(false);
    }
  }, [selected, canManage]);

  if (isFreelancer) {
    return (
      <div className="ui-container py-12 max-w-lg">
        <div className="ui-panel p-6 space-y-3">
          <h1 className="ui-text-h2">Partner operations</h1>
          <p className="ui-text-body">
            Agency Management is an administrator screen. Use the Agent Hub for your profile,
            students, and commissions.
          </p>
          <a href="/agency-crm/onboarding" className="ui-btn-primary inline-flex">
            Go to onboarding
          </a>
        </div>
      </div>
    );
  }

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
      flash('Agency created. Configure permissions and onboarding separately.');
      await load();
      setSelectedId(res?.data?.id);
      setActivePanel('access');
    } catch (e) {
      flash(e?.message || 'Create failed');
    }
  };

  const changeStatus = async (status, successMessage) => {
    if (!selectedId) return;
    try {
      await updatePartnerStatus(selectedId, status);
      flash(successMessage);
      await load();
    } catch (e) {
      flash(e?.message || 'Status update failed');
    }
  };

  const changeOnboardingStage = async (stage, successMessage) => {
    if (!selectedId) return;
    try {
      await advanceOnboarding(selectedId, stage);
      flash(successMessage);
      await load();
    } catch (e) {
      flash(e?.message || 'Onboarding update failed');
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
                ? 'View your agency profile, referral code, and commission terms.'
                : 'Manage agency partners, contracts, and commission rates.'}
            </p>
          </div>
          {canManage && !isFreelancer && (
            <button
              type="button"
              onClick={() => {
                setShowNew(true);
                setActivePanel('details');
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

        {canManage && !isFreelancer && (() => {
          const awaiting = partners.filter((p) => {
            const stage = p.onboardingStage;
            return (
              stage === 'DOCS_SUBMITTED' ||
              stage === 'AGREEMENT_SIGNED' ||
              stage === 'VERIFIED' ||
              stage === 'APPROVED'
            ) && stage !== 'ACTIVE' && p.status !== 'ACTIVE';
          });
          if (!awaiting.length) return null;
          return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">Partners awaiting onboarding action ({awaiting.length})</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {awaiting.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="text-xs px-2.5 py-1 rounded-lg border border-amber-300 bg-white hover:bg-amber-50"
                    onClick={() => {
                      setSelectedId(p.id);
                      setShowNew(false);
                      setActivePanel('access');
                    }}
                  >
                    {p.agencyName}
                  </button>
                ))}
              </ul>
            </div>
          );
        })()}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Referrals', value: stats.totalReferrals },
              { label: 'Active students', value: stats.activeStudents },
              { label: 'Enrolled', value: stats.enrolledStudents },
              { label: 'Commission paid', value: `£${stats.totalCommissionAmount?.toFixed?.(0) ?? stats.totalCommissionAmount}` },
            ].map((c) => (
              <div key={c.label} className="ui-panel p-4">
                <p className="ui-text-meta">{c.label}</p>
                <p className="text-xl font-semibold text-brand mt-1">{c.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className={`grid gap-5 ${isFreelancer ? '' : 'lg:grid-cols-[240px_minmax(0,1fr)]'}`}>
          {!isFreelancer && (
            <div className="ui-panel p-4 space-y-3">
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
                    <div className="text-xs text-neutral-500">
                      {p.agencyCode} · {ONBOARDING_STAGE_LABELS[p.onboardingStage] || p.onboardingStage}
                    </div>
                    {(p._count?.documents || 0) > 0 && (
                      <div className="mt-1 text-[11px] font-medium text-amber-700">
                        {p._count.documents} submitted document{p._count.documents === 1 ? '' : 's'}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ui-panel min-w-0 p-4 sm:p-5">
            {!selected && !showNew && (
              <div className="text-center py-12 text-neutral-500">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Select an agency or create a new partner.</p>
              </div>
            )}

            {isFreelancer && selected && !showNew && (
              <p className="mb-4 text-xs text-neutral-500 rounded-lg bg-neutral-50 border border-neutral-100 px-3 py-2">
                Your agency profile is contract-managed. Contact your ApplyUniNow admin to update details.
                Use your referral code below when sharing leads.
              </p>
            )}

            {(selected || showNew) && (
              <form onSubmit={showNew ? addPartner : savePartner} className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
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

                {!showNew && canManage && !isFreelancer && (
                  <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
                    <button
                      type="button"
                      onClick={() => setActivePanel('details')}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        activePanel === 'details'
                          ? 'bg-brand text-white'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      Agency details
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePanel('access')}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        activePanel === 'access'
                          ? 'bg-brand text-white'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      Onboarding &amp; documents
                      {(selected?._count?.documents || docs.length) > 0 &&
                        ` (${selected?._count?.documents || docs.length} docs)`}
                    </button>
                  </div>
                )}

                {(showNew || activePanel === 'details') && (
                  <>
                {showNew && (
                  <p className="text-xs text-neutral-500">
                    Fields marked <span className="font-semibold text-red-600">*</span> are required.
                    Permissions are configured after the agency is created.
                  </p>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Agency name <span className="text-red-600">*</span></span>
                    <input className={INPUT} required value={form.agencyName} onChange={(e) => setForm({ ...form, agencyName: e.target.value })} disabled={!canManage || isFreelancer} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Referral / agency code</span>
                    <input className={INPUT} value={form.agencyCode} onChange={(e) => setForm({ ...form, agencyCode: e.target.value })} disabled={!canManage || isFreelancer} placeholder="Auto-generated if empty" />
                  </label>
                  {showNew && (
                    <>
                      <label className="block space-y-1">
                        <span className="text-xs text-neutral-500">Contact full name <span className="text-red-600">*</span></span>
                        <input className={INPUT} required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs text-neutral-500">Login email <span className="text-red-600">*</span></span>
                        <input type="email" className={INPUT} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs text-neutral-500">Initial password <span className="text-red-600">*</span></span>
                        <input type="password" className={INPUT} required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                      </label>
                    </>
                  )}
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Contact person</span>
                    <input className={INPUT} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} disabled={!canManage || isFreelancer} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Phone</span>
                    <input className={INPUT} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!canManage || isFreelancer} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">City</span>
                    <input className={INPUT} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} disabled={!canManage || isFreelancer} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Country</span>
                    <input className={INPUT} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} disabled={!canManage || isFreelancer} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-neutral-500">Commission rate (%)</span>
                    <input type="number" step="0.1" className={INPUT} value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} disabled={!canManage || isFreelancer} />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs text-neutral-500">Services offered</span>
                  <input
                    className={INPUT}
                    value={form.services}
                    onChange={(e) => setForm({ ...form, services: e.target.value })}
                    disabled={!canManage || isFreelancer}
                    placeholder="e.g. Study abroad, visa support"
                  />
                </label>
                  </>
                )}

                {!showNew && activePanel === 'access' && canManage && !isFreelancer && selectedId && selected && (
                  <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/60 p-3">
                    <p className="text-sm font-semibold text-neutral-800">Partner lifecycle</p>
                    <p className="text-xs text-neutral-500">
                      Approve login → partner uploads documents and signs the agreement → staff verifies, approves, and activates.
                    </p>
                    <div
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        docs.length
                          ? 'border-amber-200 bg-amber-50 text-amber-950'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                      }`}
                    >
                      {docsLoading
                        ? 'Loading submitted documents…'
                        : docsError
                          ? docsError
                          : docs.length
                            ? `${docs.length} submitted document${docs.length === 1 ? '' : 's'} awaiting review below.`
                            : 'No documents have been uploaded by this partner.'}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 xl:grid-cols-6">
                      {ONBOARDING_STAGE_ORDER.map((s) => (
                        <span
                          key={s}
                          className={`truncate rounded-md px-2 py-1 text-center text-[10px] ${
                            s === selected.onboardingStage
                              ? 'bg-brand text-white'
                              : 'bg-white border border-neutral-200 text-neutral-500'
                          }`}
                        >
                          {ONBOARDING_STAGE_LABELS[s]}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!selected.user?.isApproved ? (
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"
                          onClick={async () => {
                            try {
                              await approvePartnerLogin(selectedId);
                              flash('Portal login approved — partner can complete setup');
                              await load();
                            } catch (e) {
                              flash(e?.message || 'Approve login failed');
                            }
                          }}
                        >
                          1. Allow portal login
                        </button>
                      ) : (
                        <span className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Portal login allowed
                        </span>
                      )}
                      {selected.onboardingStage === 'AGREEMENT_SIGNED' && (
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs rounded-lg bg-brand text-white hover:opacity-90"
                          onClick={() =>
                            changeOnboardingStage(
                              'VERIFIED',
                              'Partner documents and agreement verified'
                            )
                          }
                        >
                          2. Verify partner
                        </button>
                      )}
                      {selected.onboardingStage === 'VERIFIED' && (
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs rounded-lg bg-brand text-white hover:opacity-90"
                          onClick={() =>
                            changeOnboardingStage('APPROVED', 'Partner approved')
                          }
                        >
                          3. Approve partner
                        </button>
                      )}
                      {selected.onboardingStage === 'APPROVED' && (
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs rounded-lg bg-brand text-white hover:opacity-90"
                          onClick={() =>
                            changeOnboardingStage(
                              'ACTIVE',
                              'Partner activated — referral sharing unlocked'
                            )
                          }
                        >
                          4. Activate partner
                        </button>
                      )}
                      {selected.onboardingStage === 'ACTIVE' && (
                        <span className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {selected.status === 'ACTIVE'
                            ? 'Active — referrals enabled'
                            : `${PARTNER_STATUS_LABELS[selected.status] || selected.status} — referrals disabled`}
                        </span>
                      )}
                      {!['SUSPENDED', 'INACTIVE', 'BLACKLISTED'].includes(selected.status) ? (
                        <>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 hover:bg-neutral-50"
                            onClick={() => changeStatus('SUSPENDED', 'Partner suspended')}
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 hover:bg-neutral-50"
                            onClick={() => changeStatus('INACTIVE', 'Partner marked inactive')}
                          >
                            Mark inactive
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => changeStatus('BLACKLISTED', 'Partner blacklisted')}
                          >
                            Blacklist
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"
                          onClick={() => {
                            const restoredStatus =
                              selected.onboardingStage === 'ACTIVE'
                                ? 'ACTIVE'
                                : selected.onboardingStage === 'APPROVED'
                                  ? 'APPROVED'
                                  : selected.onboardingStage === 'VERIFIED'
                                    ? 'VERIFIED'
                                    : 'PENDING';
                            return changeStatus(restoredStatus, 'Partner access restored');
                          }}
                        >
                          Restore access
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {canManage && !isFreelancer && !showNew && activePanel === 'access' && selected && (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="order-2 rounded-lg border border-neutral-200 bg-neutral-50/60 p-4 xl:order-2">
                      <p className="text-xs font-semibold text-neutral-700 mb-2">Agency permissions</p>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        {[
                          ['canPayFees', 'Can pay student fees'],
                          ['canMessageUniversity', 'Can message university'],
                          ['canManageApplications', 'Can manage applications'],
                          ['canViewCommission', 'Can view commissions'],
                        ].map(([key, label]) => (
                          <label key={key} className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(caps[key])}
                              onChange={(e) => setCaps({ ...caps, [key]: e.target.checked })}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="mt-2 text-xs px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"
                        onClick={async () => {
                          try {
                            const response = await updatePartner(selectedId, { capabilities: caps });
                            if (response?.data) {
                              setPartners((current) =>
                                current.map((partner) =>
                                  partner.id === selectedId ? response.data : partner
                                )
                              );
                            }
                            flash('Permissions updated');
                          } catch (e) {
                            flash(e?.message || 'Permission update failed');
                          }
                        }}
                      >
                        Save permissions
                      </button>
                    </div>

                    <div className="order-1 rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                      <p className="text-sm font-semibold text-neutral-800 mb-1">
                        Submitted documents ({docs.length})
                      </p>
                      <p className="mb-2 text-xs text-neutral-500">
                        Open each file, then verify or reject it before verifying the partner.
                      </p>
                      {docsLoading ? (
                        <p className="text-xs text-neutral-500">Loading submitted documents…</p>
                      ) : docsError ? (
                        <p className="text-xs text-red-700">{docsError}</p>
                      ) : !docs.length ? (
                        <p className="text-xs text-neutral-500">No documents uploaded.</p>
                      ) : (
                        <ul className="space-y-2">
                          {docs.map((d) => (
                            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm">
                              <div className="min-w-0">
                                <p className="font-medium">{d.fileName}</p>
                                <p className="text-xs text-neutral-500">
                                  {d.type} · v{d.version} · {d.verificationStatus || 'PENDING'}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {d.fileUrl && (
                                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-brand underline">
                                    View
                                  </a>
                                )}
                                {d.verificationStatus !== 'VERIFIED' && (
                                  <button
                                    type="button"
                                    className="text-xs px-2 py-1 border rounded"
                                    onClick={async () => {
                                      try {
                                        await verifyPartnerDocument(selectedId, d.id, { verificationStatus: 'VERIFIED' });
                                        setDocs((await listPartnerDocuments(selectedId))?.data || []);
                                        flash('Document verified');
                                      } catch (error) {
                                        flash(error?.message || 'Document verification failed');
                                      }
                                    }}
                                  >
                                    Verify
                                  </button>
                                )}
                                {d.verificationStatus !== 'REJECTED' && (
                                  <button
                                    type="button"
                                    className="text-xs px-2 py-1 border rounded text-red-600"
                                    onClick={async () => {
                                      try {
                                        await verifyPartnerDocument(selectedId, d.id, { verificationStatus: 'REJECTED' });
                                        setDocs((await listPartnerDocuments(selectedId))?.data || []);
                                        flash('Document rejected');
                                      } catch (error) {
                                        flash(error?.message || 'Document rejection failed');
                                      }
                                    }}
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {(showNew || activePanel === 'details') && (
                  <>
                <label className="block space-y-1">
                  <span className="text-xs text-neutral-500">Notes</span>
                  <textarea className={`${INPUT} min-h-[80px]`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={!canManage || isFreelancer} />
                </label>

                {canManage && !isFreelancer && (
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
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
