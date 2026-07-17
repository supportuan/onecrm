'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Link2,
  Search,
  UserPlus,
} from 'lucide-react';
import {
  listAgencyLeads,
  listAgencyApplications,
  listPartners,
  getStatistics,
  createReferral,
  getMyPartner,
} from '@/services/agencyCrmApi';
import { listStudents } from '@/services/studentCrmApi';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { getStageLabel, stageBadgeClass } from '@/features/student-crm/constants';
import { isAgencyPartnerRole } from '../agentPortal';

const INPUT =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-neutral-400 outline-none';
const PAGE_SIZE = 50;

export default function AgencyLeads() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const isAgent = isAgencyPartnerRole(user?.role);
  const canAssign = can('MANAGE_AGENCY_CRM') && !isAgent;

  const studentHref = (id) =>
    isAgent ? `/agency-crm/students/${id}` : `/student-crm/student-management?student=${id}`;

  const [tab, setTab] = useState('students');
  const [stats, setStats] = useState(null);
  const [partners, setPartners] = useState([]);
  const [agencyFilter, setAgencyFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, from: 0, to: 0 });
  const [loading, setLoading] = useState(false);

  const [showAssign, setShowAssign] = useState(false);
  const [assignAgencyId, setAssignAgencyId] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [studentHits, setStudentHits] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignNotes, setAssignNotes] = useState('');
  const [assignMsg, setAssignMsg] = useState('');
  const [assignBusy, setAssignBusy] = useState(false);
  const [myCode, setMyCode] = useState('');

  useEffect(() => {
    getStatistics({ agencyPartnerId: agencyFilter || undefined })
      .then((r) => setStats(r?.data || null))
      .catch(() => setStats(null));
  }, [agencyFilter]);

  useEffect(() => {
    if (isAgent) {
      getMyPartner()
        .then((r) => setMyCode(r?.data?.agencyCode || ''))
        .catch(() => setMyCode(''));
      return;
    }
    listPartners()
      .then((r) => {
        const list = Array.isArray(r?.data) ? r.data : [];
        setPartners(list);
      })
      .catch(() => setPartners([]));
  }, [isAgent]);

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
        tab === 'students' ? await listAgencyLeads(opts) : await listAgencyApplications(opts);
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

  const searchStudents = async (e) => {
    e?.preventDefault?.();
    const q = studentQuery.trim();
    if (q.length < 2) {
      setAssignMsg('Type at least 2 characters of the student name or email');
      return;
    }
    setSearchingStudents(true);
    setAssignMsg('');
    setSelectedStudent(null);
    try {
      const res = await listStudents({ search: q, limit: 12 });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setStudentHits(items);
      if (!items.length) setAssignMsg('No students found. Create them in Student CRM first, then assign here.');
    } catch (err) {
      setStudentHits([]);
      setAssignMsg(err?.message || 'Student search failed');
    } finally {
      setSearchingStudents(false);
    }
  };

  const assignStudent = async (e) => {
    e.preventDefault();
    if (!assignAgencyId) {
      setAssignMsg('Choose an agency first');
      return;
    }
    if (!selectedStudent?.id) {
      setAssignMsg('Select a student from the search results');
      return;
    }
    setAssignBusy(true);
    setAssignMsg('');
    try {
      await createReferral({
        agencyPartnerId: Number(assignAgencyId),
        studentId: Number(selectedStudent.id),
        notes: assignNotes.trim() || undefined,
      });
      setAssignMsg(`Assigned ${selectedStudent.fullName} to the agency`);
      setSelectedStudent(null);
      setStudentHits([]);
      setStudentQuery('');
      setAssignNotes('');
      setAgencyFilter(String(assignAgencyId));
      setTab('students');
      await load();
    } catch (err) {
      setAssignMsg(err?.message || 'Could not assign student');
    } finally {
      setAssignBusy(false);
    }
  };

  const selectedAgencyName =
    partners.find((p) => String(p.id) === String(assignAgencyId))?.agencyName || '';

  return (
    <div className="ui-page">
      <div className="ui-container space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="ui-text-h2">{isAgent ? 'My students' : 'Students & referrals'}</h1>
            <p className="ui-text-body mt-1 max-w-2xl">
              {isAgent
                ? 'Everyone who joined through your referral link appears here. Open a student to track applications and fees.'
                : 'See which students belong to each agency, or assign an existing student in a few clicks.'}
            </p>
          </div>
          {canAssign && (
            <button
              type="button"
              onClick={() => {
                setShowAssign((v) => !v);
                setAssignMsg('');
              }}
              className="ui-btn-primary inline-flex items-center gap-2 text-sm"
            >
              <UserPlus className="h-4 w-4" />
              {showAssign ? 'Close assign' : 'Assign student'}
            </button>
          )}
          {isAgent && (
            <Link
              href="/agency-crm/co-branding-tools"
              className="ui-btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Link2 className="h-4 w-4" />
              Get referral link
            </Link>
          )}
        </div>

        {isAgent && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            <p className="font-medium text-neutral-900">How students get added</p>
            <ol className="mt-2 list-decimal pl-5 space-y-1 text-neutral-600">
              <li>
                Copy your referral link from{' '}
                <Link href="/agency-crm/co-branding-tools" className="text-brand underline-offset-2 hover:underline">
                  Referral &amp; Branding
                </Link>
                {myCode ? (
                  <span>
                    {' '}
                    (code <span className="font-mono text-neutral-800">{myCode}</span>)
                  </span>
                ) : null}
                .
              </li>
              <li>Share it with the student or use it when capturing the lead.</li>
              <li>They show up automatically in this list — no IDs to type.</li>
            </ol>
          </div>
        )}

        {canAssign && showAssign && (
          <section className="ui-panel p-5 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-brand">Assign an existing student</h2>
              <p className="ui-text-meta mt-1">
                Search by name or email. Do not use application codes like APP-2026-0011.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
              <label className="block space-y-1.5">
                <span className="ui-label">1. Agency</span>
                <select
                  className={INPUT}
                  value={assignAgencyId}
                  onChange={(e) => {
                    setAssignAgencyId(e.target.value);
                    setAssignMsg('');
                  }}
                  required
                >
                  <option value="">Select agency…</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.agencyName} ({p.agencyCode})
                    </option>
                  ))}
                </select>
              </label>

              <form onSubmit={searchStudents} className="space-y-1.5">
                <span className="ui-label">2. Find student</span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                      className={`${INPUT} pl-9`}
                      placeholder="Name or email…"
                      value={studentQuery}
                      onChange={(e) => setStudentQuery(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="ui-btn-secondary shrink-0 px-4" disabled={searchingStudents}>
                    {searchingStudents ? 'Searching…' : 'Search'}
                  </button>
                </div>
              </form>
            </div>

            {studentHits.length > 0 && (
              <div className="space-y-2">
                <p className="ui-label">3. Pick one</p>
                <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 overflow-hidden">
                  {studentHits.map((s) => {
                    const active = selectedStudent?.id === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setAssignMsg('');
                          }}
                          className={`w-full text-left px-4 py-3 flex flex-wrap items-center justify-between gap-2 ${
                            active ? 'bg-brand/5 ring-inset ring-1 ring-brand' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-neutral-900">{s.fullName}</p>
                            <p className="text-xs text-neutral-500">
                              {s.email || 'No email'}
                              {s.phone ? ` · ${s.phone}` : ''}
                            </p>
                          </div>
                          <span className="text-xs text-neutral-400 font-mono">#{s.id}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {selectedStudent && (
              <form onSubmit={assignStudent} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                <p className="text-sm text-neutral-800">
                  Assign <strong>{selectedStudent.fullName}</strong>
                  {selectedAgencyName ? (
                    <>
                      {' '}
                      to <strong>{selectedAgencyName}</strong>
                    </>
                  ) : (
                    ' — select an agency above'
                  )}
                </p>
                <label className="block space-y-1">
                  <span className="ui-label">Notes (optional)</span>
                  <input
                    className={INPUT}
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="e.g. Walk-in from partner event"
                  />
                </label>
                <button
                  type="submit"
                  className="ui-btn-primary"
                  disabled={assignBusy || !assignAgencyId}
                >
                  {assignBusy ? 'Assigning…' : 'Confirm assignment'}
                </button>
              </form>
            )}

            {assignMsg && (
              <p className="text-sm text-neutral-700" role="status">
                {assignMsg}
              </p>
            )}
          </section>
        )}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Referrals', value: stats.totalReferrals },
              { label: 'Students', value: stats.activeStudents },
              { label: 'Applications', value: stats.totalApplications },
              { label: 'Enrolled', value: stats.enrolledStudents },
            ].map((c) => (
              <div key={c.label} className="ui-panel p-4">
                <p className="ui-text-meta">{c.label}</p>
                <p className="text-xl font-semibold text-brand mt-1">{c.value ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden bg-white">
            {[
              { id: 'students', label: isAgent ? 'My students' : 'Referred students' },
              { id: 'applications', label: 'Applications' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium ${
                  tab === t.id ? 'bg-brand text-white' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {!isAgent && partners.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <span className="whitespace-nowrap">Agency</span>
              <select
                className={`${INPUT} w-auto min-w-[180px]`}
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
            </label>
          )}

          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              className={`${INPUT} pl-9`}
              placeholder="Filter list by name, email, code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="ui-panel overflow-hidden">
          {loading ? (
            <p className="p-8 text-sm text-neutral-500">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="ui-text-strong">
                No {tab === 'students' ? 'students' : 'applications'} yet
              </p>
              <p className="ui-text-meta mt-1 max-w-md mx-auto">
                {isAgent
                  ? 'Share your referral link — new students appear here automatically.'
                  : 'Use Assign student above, or wait for referrals from an agency link.'}
              </p>
              {canAssign && !showAssign && (
                <button
                  type="button"
                  className="ui-btn-primary mt-4 inline-flex items-center gap-2 text-sm"
                  onClick={() => setShowAssign(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Assign student
                </button>
              )}
              {isAgent && (
                <Link
                  href="/agency-crm/co-branding-tools"
                  className="ui-btn-secondary mt-4 inline-flex items-center gap-2 text-sm"
                >
                  <Link2 className="h-4 w-4" />
                  Get referral link
                </Link>
              )}
            </div>
          ) : tab === 'students' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/60">
                    {!isAgent && <th className="px-4 py-3 ui-text-caption uppercase">Agency</th>}
                    <th className="px-4 py-3 ui-text-caption uppercase">Student / Lead</th>
                    <th className="px-4 py-3 ui-text-caption uppercase">Contact</th>
                    <th className="px-4 py-3 ui-text-caption uppercase">Status</th>
                    <th className="px-4 py-3 ui-text-caption uppercase">Application</th>
                    <th className="px-4 py-3 ui-text-caption uppercase">Referred</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50/70">
                      {!isAgent && (
                        <td className="px-4 py-3">
                          <div className="font-medium text-brand">{r.agencyPartner?.agencyName}</div>
                          <div className="text-xs text-neutral-500">
                            {r.referralCode || r.agencyPartner?.agencyCode}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        {r.student ? (
                          <Link
                            href={studentHref(r.student.id)}
                            className="font-medium text-brand hover:underline"
                          >
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
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100">
                          {r.status}
                        </span>
                        {r.student?.isEnrolled && (
                          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            Enrolled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {r.application ? (
                          <span>
                            {r.application.applicationCode} · {getStageLabel(r.application.stage)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.student && (
                          <Link
                            href={studentHref(r.student.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-brand"
                          >
                            Open <ExternalLink size={12} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/60">
                    <th className="px-4 py-3 ui-text-caption uppercase">Code</th>
                    <th className="px-4 py-3 ui-text-caption uppercase">Student</th>
                    <th className="px-4 py-3 ui-text-caption uppercase">University</th>
                    <th className="px-4 py-3 ui-text-caption uppercase">Course</th>
                    <th className="px-4 py-3 ui-text-caption uppercase">Stage</th>
                    <th className="px-4 py-3 ui-text-caption uppercase">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50/70">
                      <td className="px-4 py-3 font-mono text-xs">{r.applicationCode}</td>
                      <td className="px-4 py-3">
                        {r.student ? (
                          <Link
                            href={studentHref(r.student.id)}
                            className="font-medium text-brand hover:underline"
                          >
                            {r.student.fullName}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">{r.university}</td>
                      <td className="px-4 py-3 text-neutral-600">{r.course}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${stageBadgeClass(r.stage)}`}
                        >
                          {getStageLabel(r.stage)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.student && (
                          <Link
                            href={studentHref(r.student.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-brand"
                          >
                            Open <ExternalLink size={12} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                className="p-2 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-white"
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
                className="p-2 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-white"
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
