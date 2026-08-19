'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  GraduationCap,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  UserRound,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  listStudents,
  listApplications,
  createStudent,
  createApplication,
  deleteApplication,
  listCounsellors,
  listPromotableLeads,
  promoteLead,
  promoteAllLeads,
  getStatistics,
  bulkAssignApplications,
} from '@/services/studentCrmApi';
import { getFormOptions } from '@/services/crmSettingsApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import LogoLoader from '@/components/LogoLoader';
import { getStageLabel, stageBadgeClass } from '@/features/student-crm/constants';
import { countryFlagUrl } from '@/features/student-crm/countryFlag';
import {
  NewStudentModal,
  NewApplicationModal,
  Modal,
  ModalFooter,
  Field,
  formatDate,
} from '@/features/student-crm/components/ApplicationParts';

const stageBadge = stageBadgeClass;

const PROCESS_STAGE_LABELS = {
  GATHERING_CHECKLIST: 'Gathering checklist',
  UNIVERSITY_APPLICATION: 'University application',
  FINANCIAL_EVIDENCE: 'Financial evidence',
  AFTER_I20: 'After I-20',
  PRE_CAS_PROCESS: 'Pre-CAS',
  VISA_APPLICATION: 'Visa application',
  PRE_DEPARTURE: 'Pre-departure',
  ON_ARRIVAL: 'On arrival',
  PRE_REQUISITE: 'Pre-requisite',
};

const DestinationFlag = ({ country }) => {
  const src = countryFlagUrl(country);
  if (!country) return <span className="text-[12px] text-neutral-400">—</span>;
  return src ? (
    <img
      src={src}
      alt={country}
      title={country}
      width={24}
      height={18}
      className="h-[18px] w-6 rounded-[3px] object-cover shadow-sm"
    />
  ) : (
    <span
      title={country}
      className="inline-flex h-[18px] w-6 items-center justify-center rounded-[3px] bg-neutral-100 text-[9px] font-semibold text-neutral-500"
    >
      {country.slice(0, 2).toUpperCase()}
    </span>
  );
};

export default function ApplicationsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const canManage = can('MANAGE_STUDENT_CRM');

  const [allApps, setAllApps] = useState([]);
  const [students, setStudents] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [studentFilterId, setStudentFilterId] = useState(() => {
    const requestedStudentId = Number(searchParams.get('student'));
    return requestedStudentId > 0 ? requestedStudentId : null;
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [pocFilter, setPocFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [toast, setToast] = useState({ kind: '', msg: '' });
  const flash = (kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast({ kind: '', msg: '' }), 3000);
  };

  const [showNewStudent, setShowNewStudent] = useState(false);
  const [showPickStudent, setShowPickStudent] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [showNewApp, setShowNewApp] = useState(false);

  const [promotableLeads, setPromotableLeads] = useState([]);
  const [promotableExpanded, setPromotableExpanded] = useState(false);
  const [promotingId, setPromotingId] = useState(null);
  const [formOptions, setFormOptions] = useState({ countries: [], industries: [] });
  const [stats, setStats] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkCounsellorId, setBulkCounsellorId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, studentsRes] = await Promise.all([
        listApplications({ limit: 500 }),
        listStudents({ limit: 500 }),
      ]);
      setAllApps(Array.isArray(appsRes?.data) ? appsRes.data : []);
      setStudents(Array.isArray(studentsRes?.data) ? studentsRes.data : []);
      setSelectedIds(new Set());
    } catch (e) {
      flash('err', e?.message || 'failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    listCounsellors()
      .then((r) => setCounsellors(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {});
    listPromotableLeads()
      .then((r) => setPromotableLeads(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {});
    getFormOptions()
      .then((r) => setFormOptions(r?.data || { countries: [], industries: [] }))
      .catch(() => {});
    getStatistics()
      .then((r) => setStats(r?.data || null))
      .catch(() => {});
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    const requestedApplicationId = Number(searchParams.get('app'));
    if (
      requestedApplicationId > 0 &&
      allApps.some((application) => application.id === requestedApplicationId)
    ) {
      router.replace(`/student-crm/applications/${requestedApplicationId}`);
      return;
    }

  }, [allApps, loading, router, searchParams]);

  const reloadLeads = async () => {
    try {
      const r = await listPromotableLeads();
      setPromotableLeads(Array.isArray(r?.data) ? r.data : []);
    } catch {
      /* ignore */
    }
  };

  const studentById = useMemo(() => {
    const map = new Map();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;
    return allApps.filter((a) => {
      if (studentFilterId && a.studentId !== studentFilterId) return false;
      if (countryFilter && (a.country || '').toLowerCase() !== countryFilter.toLowerCase()) return false;
      if (pocFilter) {
        if (pocFilter === '__unassigned__') {
          if (a.assignedTo) return false;
        } else if (String(a.assignedTo?.id) !== pocFilter) return false;
      }
      if (fromTs || toTs) {
        const created = a.createdAt ? new Date(a.createdAt).getTime() : null;
        if (!created) return false;
        if (fromTs && created < fromTs) return false;
        if (toTs && created > toTs) return false;
      }
      if (!term) return true;
      const student = a.student || studentById.get(a.studentId);
      return (
        a.applicationCode?.toLowerCase().includes(term) ||
        a.university?.toLowerCase().includes(term) ||
        a.course?.toLowerCase().includes(term) ||
        a.country?.toLowerCase().includes(term) ||
        student?.fullName?.toLowerCase().includes(term) ||
        student?.email?.toLowerCase().includes(term) ||
        student?.phone?.toLowerCase().includes(term)
      );
    });
  }, [allApps, search, studentFilterId, countryFilter, pocFilter, dateFrom, dateTo, studentById]);

  const visaCount = useMemo(
    () => allApps.filter((a) => a.stage === 'VISA_PROCESS').length,
    [allApps]
  );

  const countryOptions = useMemo(() => {
    const set = new Set();
    allApps.forEach((a) => { if (a.country) set.add(a.country); });
    return [...set].sort();
  }, [allApps]);

  const activeFilterCount = [
    dateFrom, dateTo, countryFilter, pocFilter,
  ].filter(Boolean).length;

  const visibleLeads = canManage
    ? promotableLeads.filter((l) => !l.hasStudentProfile || !l.isStudentLoginCreated)
    : [];

  const handlePromoteLead = async (leadId) => {
    setPromotingId(leadId);
    try {
      const res = await promoteLead(leadId, { password: 'Welcome@123' });
      const pwd = res?.data?.tempPassword;
      flash('ok', pwd ? `Student login created. Password: ${pwd}` : 'Lead promoted');
      await reloadLeads();
      await refresh();
    } catch (e) {
      flash('err', e?.message || 'Promote failed');
    } finally {
      setPromotingId(null);
    }
  };

  const handlePromoteAll = async () => {
    if (!window.confirm('Create student logins + applications for all leads?')) return;
    try {
      const res = await promoteAllLeads('Welcome@123');
      const ok = (res?.data || []).filter((r) => r.ok).length;
      flash('ok', `Promoted ${ok} lead(s)`);
      await reloadLeads();
      await refresh();
    } catch (e) {
      flash('err', e?.message || 'Batch promote failed');
    }
  };

  const handleNewStudent = async (form) => {
    try {
      const res = await createStudent(form);
      flash('ok', 'Student created');
      setShowNewStudent(false);
      await refresh();
      if (res?.data) {
        setPickedStudent(res.data);
        setShowNewApp(true);
      }
    } catch (e) {
      flash('err', e?.message || 'failed to create student');
    }
  };

  const handleNewApp = async (form) => {
    if (!pickedStudent) return;
    try {
      const res = await createApplication({ ...form, studentId: pickedStudent.id });
      flash('ok', 'Application created');
      setShowNewApp(false);
      setPickedStudent(null);
      await refresh();
      if (res?.data?.id) router.push(`/student-crm/applications/${res.data.id}`);
    } catch (e) {
      flash('err', e?.message || 'failed to create application');
    }
  };

  const handleDeleteApplication = async (app, studentName) => {
    if (!canManage) return;
    const label = app.applicationCode || studentName || 'this application';
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    setDeletingId(app.id);
    try {
      await deleteApplication(app.id);
      flash('ok', 'Application deleted');
      await refresh();
    } catch (e) {
      flash('err', e?.message || 'failed to delete application');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredIds = useMemo(() => filtered.map((a) => a.id), [filtered]);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAssign = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const assignedToId = bulkCounsellorId === '' ? null : Number(bulkCounsellorId);
    const label =
      assignedToId == null
        ? 'Unassigned'
        : counsellors.find((c) => c.id === assignedToId)?.fullName || 'counsellor';
    if (
      !window.confirm(
        assignedToId == null
          ? `Clear counsellor on ${ids.length} selected application(s)?`
          : `Assign ${ids.length} application(s) to ${label}?`
      )
    ) {
      return;
    }
    setBulkAssigning(true);
    try {
      const res = await bulkAssignApplications({ applicationIds: ids, assignedToId });
      const updated = res?.data?.updated ?? ids.length;
      flash('ok', `Assigned ${updated} application${updated === 1 ? '' : 's'} to ${label}`);
      setBulkCounsellorId('');
      await refresh();
    } catch (e) {
      flash('err', e?.message || 'Bulk assign failed');
    } finally {
      setBulkAssigning(false);
    }
  };

  return (
    <div className="text-brand">
      {toast.msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 ui-text-strong !text-white ${
            toast.kind === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Toolbar: stats, search, filters, new student — one row */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto">
        {stats && (
          <div className="flex items-center gap-2 shrink-0">
            {[
              ['Students', stats.totalStudents],
              ['Enrolled', stats.enrolled],
              [
                'Active apps',
                allApps.filter((a) => !['ENROLLED', 'OFFER_REJECTED'].includes(a.stage)).length,
              ],
              ['Visa', visaCount],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-[76px] rounded-xl border border-white/55 bg-white/35 px-3 py-1.5 shadow-[0_8px_24px_rgba(19,71,144,0.06)] backdrop-blur-md"
              >
                <p className="text-[11px] font-semibold text-brand">{label}</p>
                <p className="text-sm font-semibold tabular-nums leading-tight text-brand/80">
                  {value ?? '—'}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="relative min-w-[180px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications"
            className="w-full rounded-xl border border-white/55 bg-white/35 py-2 pl-9 pr-3 text-[13px] text-brand placeholder-neutral-400 outline-none shadow-[0_8px_24px_rgba(19,71,144,0.06)] backdrop-blur-md transition-all focus:border-white/80 focus:bg-white/50"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAdvancedFilters((v) => !v)}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-medium backdrop-blur-md transition-all ${
            showAdvancedFilters || activeFilterCount > 0
              ? 'border-brand/30 bg-brand/80 text-white shadow-[0_8px_24px_rgba(19,71,144,0.18)]'
              : 'border-white/55 bg-white/35 text-brand shadow-[0_8px_24px_rgba(19,71,144,0.06)] hover:bg-white/50'
          }`}
        >
          <Filter size={13} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 rounded-full bg-white/25 px-1.5 py-px text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        {studentFilterId && (
          <button
            type="button"
            onClick={() => setStudentFilterId(null)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-brand/30 bg-brand/80 px-3 py-2 text-[12px] font-medium text-white backdrop-blur-md"
          >
            {studentById.get(studentFilterId)?.fullName || 'Student'}
            <X size={12} className="ml-0.5" />
          </button>
        )}
        {canManage && visibleLeads.length > 0 && (
          <button
            type="button"
            onClick={handlePromoteAll}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-200/60 bg-amber-50/50 px-3 py-2 text-[12px] font-medium text-amber-800 shadow-[0_8px_24px_rgba(19,71,144,0.06)] backdrop-blur-md transition-all hover:bg-amber-50/80"
          >
            Import leads
            <span className="text-[10px] font-semibold">{visibleLeads.length}</span>
          </button>
        )}
        {canManage && (
          <button
            type="button"
            onClick={() => setShowNewStudent(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/55 bg-white/35 px-3 py-2 text-[12px] font-medium text-brand shadow-[0_8px_24px_rgba(19,71,144,0.06)] backdrop-blur-md transition-all hover:bg-white/50"
          >
            <GraduationCap size={13} /> New student
          </button>
        )}
      </div>

      {/* Promotable leads — collapsible */}
      {canManage && visibleLeads.length > 0 && (
        <div className="ui-surface mb-4 overflow-hidden">
          <button
            type="button"
            onClick={() => setPromotableExpanded((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-neutral-50/60 transition-all"
          >
            <div className="text-left">
              <h2 className="ui-text-h3">Leads ready for applications</h2>
              <p className="ui-text-meta mt-0.5">
                {visibleLeads.length} lead{visibleLeads.length === 1 ? '' : 's'} can be promoted to student accounts.
              </p>
            </div>
            <ChevronRight
              size={16}
              className={`text-neutral-400 transition-transform ${promotableExpanded ? 'rotate-90' : ''}`}
            />
          </button>
          {promotableExpanded && (
            <ul className="divide-y divide-neutral-100 max-h-72 overflow-y-auto border-t border-neutral-100">
              {visibleLeads.map((lead) => (
                <li key={lead.id} className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-neutral-50/60 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center text-[12px] font-semibold shrink-0">
                      {(lead.fullName || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="ui-text-strong truncate">{lead.fullName}</p>
                      <p className="text-[12px] text-neutral-500 truncate">
                        {lead.email} · {lead.preferredCountry || '—'} · {lead.preferredCourse || '—'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={promotingId === lead.id}
                    onClick={() => handlePromoteLead(lead.id)}
                    className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white disabled:opacity-50 transition-all"
                  >
                    {promotingId === lead.id ? 'Creating…' : 'Create login + application'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Advanced filters panel */}
      {showAdvancedFilters && (
        <div className="ui-surface mb-4 px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date range */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Date from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] text-brand outline-none focus:border-neutral-400 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Date to</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] text-brand outline-none focus:border-neutral-400 focus:bg-white transition-all"
              />
            </div>
            {/* Study destination */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Study destination</label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] text-brand outline-none focus:border-neutral-400 focus:bg-white transition-all"
              >
                <option value="">All countries</option>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {/* POC / Counsellor */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">POC (Counsellor)</label>
              <select
                value={pocFilter}
                onChange={(e) => setPocFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] text-brand outline-none focus:border-neutral-400 focus:bg-white transition-all"
              >
                <option value="">All</option>
                <option value="__unassigned__">Unassigned</option>
                {counsellors.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.fullName}</option>
                ))}
              </select>
            </div>
            {activeFilterCount > 0 && (
              <div className="lg:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setCountryFilter('');
                    setPocFilter('');
                  }}
                  className="flex items-center gap-1 text-[12px] text-rose-500 hover:text-rose-700 font-medium"
                >
                  <X size={13} /> Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk assign toolbar */}
      {canManage && selectedIds.size > 0 && (
        <div className="ui-surface mb-5 px-5 py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px]">
            <UserRound size={14} className="text-brand" />
            <span className="font-medium text-brand">{selectedIds.size} selected</span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-neutral-500 hover:text-brand underline-offset-2 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select
              value={bulkCounsellorId}
              onChange={(e) => setBulkCounsellorId(e.target.value)}
              className="ui-field !py-2 !text-[13px] min-w-[200px]"
              aria-label="Assign counsellor"
            >
              <option value="">Unassigned</option>
              {counsellors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={bulkAssigning}
              onClick={handleBulkAssign}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-brand hover:bg-brand-hover disabled:opacity-50 transition-all"
            >
              {bulkAssigning ? 'Assigning…' : 'Assign selected'}
            </button>
          </div>
        </div>
      )}

      {/* Applications table */}
      <div className="ui-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <LogoLoader label="Loading applications…" size="md" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 mx-auto flex items-center justify-center">
              <FileText size={18} className="text-neutral-400" />
            </div>
            <p className="ui-text-strong mt-4">No applications match these filters.</p>
            <p className="ui-text-meta mt-1">Try clearing the search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/60">
                  {canManage && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
                        }}
                        onChange={toggleSelectAll}
                        aria-label="Select all visible applications"
                        className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/30"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 ui-text-caption uppercase">Student ID</th>
                  <th className="px-4 py-3 ui-text-caption uppercase">Application date</th>
                  <th className="px-4 py-3 ui-text-caption uppercase">Name</th>
                  <th className="px-4 py-3 ui-text-caption uppercase">POC</th>
                  <th className="px-4 py-3 ui-text-caption uppercase text-center">Study destination</th>
                  <th className="px-4 py-3 ui-text-caption uppercase">Stage</th>
                  <th className="px-4 py-3 ui-text-caption uppercase">Application status</th>
                  <th className="px-4 py-3 ui-text-caption uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((a) => {
                  const s = a.student || studentById.get(a.studentId);
                  const isSelected = selectedIds.has(a.id);
                  const pocName = a.assignedTo?.fullName || s?.contact?.fullName;
                  const processStage = s?.processStage;
                  return (
                    <tr
                      key={a.id}
                      className={`transition-all ${
                        isSelected ? 'bg-brand-soft/40 hover:bg-brand-soft/60' : 'hover:bg-neutral-50/70'
                      }`}
                    >
                      {canManage && (
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(a.id)}
                            aria-label={`Select ${a.applicationCode}`}
                            className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/30"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] font-mono text-neutral-700">{a.studentId}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] text-neutral-600">{formatDate(a.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="ui-text-strong truncate max-w-[180px]">{s?.fullName || a.studentName || '—'}</p>
                        <p className="text-[12px] text-neutral-500 mt-0.5">{s?.phone || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] text-neutral-600">
                          {pocName || <span className="text-neutral-400">Unassigned</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex justify-center">
                          <DestinationFlag country={a.country || s?.preferredCountry} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] text-neutral-700">
                          {PROCESS_STAGE_LABELS[processStage] || processStage?.replace(/_/g, ' ') || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-md border ${stageBadge(
                            a.stage,
                          )}`}
                        >
                          {getStageLabel(a.stage)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/student-crm/applications/${a.id}`}
                            title="View"
                            aria-label="View application"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-brand transition-all"
                          >
                            <Eye size={15} />
                          </Link>
                          {canManage && (
                            <button
                              type="button"
                              title="Delete"
                              aria-label="Delete application"
                              disabled={deletingId === a.id}
                              onClick={() => handleDeleteApplication(a, s?.fullName)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-all"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewStudent && (
        <NewStudentModal
          onClose={() => setShowNewStudent(false)}
          onSave={handleNewStudent}
          formOptions={formOptions}
          counsellors={counsellors}
        />
      )}
      {showPickStudent && (
        <PickStudentModal
          students={students}
          onClose={() => setShowPickStudent(false)}
          onPick={(s) => {
            setPickedStudent(s);
            setShowPickStudent(false);
            setShowNewApp(true);
          }}
          onNewStudent={() => {
            setShowPickStudent(false);
            setShowNewStudent(true);
          }}
        />
      )}
      {showNewApp && pickedStudent && (
        <NewApplicationModal
          onClose={() => {
            setShowNewApp(false);
            setPickedStudent(null);
          }}
          onSave={handleNewApp}
          student={pickedStudent}
          counsellors={counsellors}
          formOptions={formOptions}
        />
      )}
    </div>
  );
}

function PickStudentModal({ students, onClose, onPick, onNewStudent }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return students.slice(0, 50);
    return students
      .filter((s) => s.fullName?.toLowerCase().includes(t) || s.email?.toLowerCase().includes(t))
      .slice(0, 50);
  }, [students, q]);

  return (
    <Modal title="New application — pick student" onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search students by name or email"
            className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-[13px] text-brand placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition-all"
          />
        </div>
        <div className="max-h-72 overflow-y-auto border border-neutral-100 rounded-xl divide-y divide-neutral-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center ui-text-meta">No students match.</div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onPick(s)}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-neutral-50/70 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                  {(s.fullName || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="ui-text-strong truncate">{s.fullName}</p>
                  <p className="text-[12px] text-neutral-500 truncate">{s.email}</p>
                </div>
                <ChevronRight size={14} className="text-neutral-300" />
              </button>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={onNewStudent}
          className="w-full py-2.5 border border-dashed border-neutral-300 rounded-xl ui-text-strong text-neutral-600 hover:text-brand hover:bg-neutral-50 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus size={13} /> Create new student instead
        </button>
      </div>
    </Modal>
  );
}
