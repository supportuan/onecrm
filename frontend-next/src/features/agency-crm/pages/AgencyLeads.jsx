'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ClipboardList, Search } from 'lucide-react';
import {
  listAgencyLeads,
  listAgencyApplications,
  listPartners,
  getStatistics,
  createReferral,
  getMyPartner,
} from '@/services/agencyCrmApi';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';

const INPUT =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 focus:border-neutral-400 outline-none';
const PAGE_SIZE = 50;

export default function AgencyLeads() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const isFreelancer = user?.role === 'AGENCY_FREELANCER' || user?.role === 'AGENT';

  const [tab, setTab] = useState('referrals');
  const [stats, setStats] = useState(null);
  const [partners, setPartners] = useState([]);
  const [agencyFilter, setAgencyFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, from: 0, to: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStatistics({ agencyPartnerId: agencyFilter || undefined })
      .then((r) => setStats(r?.data || null))
      .catch(() => setStats(null));
  }, [agencyFilter]);

  useEffect(() => {
    if (!isFreelancer) {
      listPartners()
        .then((r) => setPartners(Array.isArray(r?.data) ? r.data : []))
        .catch(() => setPartners([]));
    }
  }, [isFreelancer]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const opts = {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        agencyPartnerId: agencyFilter || undefined,
      };
      const res =
        tab === 'referrals' ? await listAgencyLeads(opts) : await listAgencyApplications(opts);
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
      setMeta({ total: 0, page: 1, totalPages: 1, from: 0, to: 0 });
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, agencyFilter]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, agencyFilter]);

  const [referralForm, setReferralForm] = useState({ leadId: '', studentId: '', notes: '' });
  const [referralMsg, setReferralMsg] = useState('');

  const submitReferral = async (e) => {
    e.preventDefault();
    try {
      let partnerId = agencyFilter;
      if (!partnerId && isFreelancer) {
        const mine = await getMyPartner();
        partnerId = mine?.data?.id;
      }
      if (!partnerId) {
        setReferralMsg('Select an agency first');
        return;
      }
      await createReferral({
        agencyPartnerId: Number(partnerId),
        leadId: referralForm.leadId ? Number(referralForm.leadId) : undefined,
        studentId: referralForm.studentId ? Number(referralForm.studentId) : undefined,
        notes: referralForm.notes || undefined,
      });
      setReferralForm({ leadId: '', studentId: '', notes: '' });
      setReferralMsg('Referral linked');
      await load();
    } catch (err) {
      setReferralMsg(err?.message || 'Referral failed');
    }
  };

  return (
    <div className="ui-page">
      <div className="ui-container space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Agency leads</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Referrals and applications attributed to agency partners.
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Referrals', value: stats.totalReferrals },
              { label: 'Students', value: stats.activeStudents },
              { label: 'Applications', value: stats.totalApplications },
              { label: 'Enrolled', value: stats.enrolledStudents },
            ].map((c) => (
              <div key={c.label} className="rounded-lg border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-500">{c.label}</p>
                <p className="text-xl font-semibold mt-1">{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {(can('VIEW_AGENCY_CRM') || isFreelancer) && (
          <form onSubmit={submitReferral} className="rounded-lg border border-neutral-200 bg-white p-4 grid md:grid-cols-4 gap-3 items-end">
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500">Lead ID</span>
              <input className={INPUT} value={referralForm.leadId} onChange={(e) => setReferralForm({ ...referralForm, leadId: e.target.value })} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500">Student ID</span>
              <input className={INPUT} value={referralForm.studentId} onChange={(e) => setReferralForm({ ...referralForm, studentId: e.target.value })} />
            </label>
            <label className="block space-y-1 md:col-span-1">
              <span className="text-xs text-neutral-500">Notes</span>
              <input className={INPUT} value={referralForm.notes} onChange={(e) => setReferralForm({ ...referralForm, notes: e.target.value })} />
            </label>
            <button type="submit" className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg h-[38px]">
              Link referral
            </button>
            {referralMsg && <p className="text-xs text-neutral-600 md:col-span-4">{referralMsg}</p>}
          </form>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
            {[
              { id: 'referrals', label: 'Referrals' },
              { id: 'applications', label: 'Applications' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm ${tab === t.id ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {!isFreelancer && partners.length > 0 && (
            <select className={INPUT + ' w-auto min-w-[180px]'} value={agencyFilter} onChange={(e) => setAgencyFilter(e.target.value)}>
              <option value="">All agencies</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.agencyName}</option>
              ))}
            </select>
          )}

          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              className={`${INPUT} pl-9`}
              placeholder="Search name, email, code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          {loading ? (
            <p className="p-8 text-sm text-neutral-500">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No {tab === 'referrals' ? 'referrals' : 'applications'} found.</p>
            </div>
          ) : tab === 'referrals' ? (
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Agency</th>
                  <th className="text-left px-4 py-3 font-medium">Lead / Student</th>
                  <th className="text-left px-4 py-3 font-medium">Contact</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Application</th>
                  <th className="text-left px-4 py-3 font-medium">Referred</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.agencyPartner?.agencyName}</div>
                      <div className="text-xs text-neutral-500">{r.referralCode || r.agencyPartner?.agencyCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      {r.student ? (
                        <Link href={`/student-crm/student-management?student=${r.student.id}`} className="text-blue-700 hover:underline">
                          {r.student.fullName}
                        </Link>
                      ) : r.lead ? (
                        <span>{r.lead.fullName}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {r.student?.email || r.lead?.email || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100">{r.status}</span>
                      {r.student?.isEnrolled && (
                        <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Enrolled</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {r.application ? (
                        <span>{r.application.applicationCode} · {r.application.stage}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">University</th>
                  <th className="text-left px-4 py-3 font-medium">Course</th>
                  <th className="text-left px-4 py-3 font-medium">Stage</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-medium">{r.applicationCode}</td>
                    <td className="px-4 py-3">
                      {r.student ? (
                        <Link href={`/student-crm/student-management?student=${r.student.id}`} className="text-blue-700 hover:underline">
                          {r.student.fullName}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">{r.university}</td>
                    <td className="px-4 py-3 text-neutral-600">{r.course}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100">{r.stage}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {meta.total > 0 && (
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>
              Showing {meta.from}–{meta.to} of {meta.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded border border-neutral-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {meta.page} / {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded border border-neutral-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
