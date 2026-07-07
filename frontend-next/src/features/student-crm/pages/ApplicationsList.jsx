'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  GraduationCap,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Filter,
} from 'lucide-react';
import {
  listStudents,
  listApplications,
  createStudent,
  createApplication,
  listCounsellors,
  listPromotableLeads,
  promoteLead,
  promoteAllLeads,
  getStatistics,
} from '@/services/studentCrmApi';
import { getFormOptions } from '@/services/crmSettingsApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { APPLICATION_STAGES, getStageLabel, stageBadgeClass } from '@/features/student-crm/constants';
import {
  NewStudentModal,
  NewApplicationModal,
  Modal,
  ModalFooter,
  Field,
  formatDate,
} from '@/features/student-crm/components/ApplicationParts';

const stageBadge = stageBadgeClass;

const STAGE_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'DOCUMENTS_PENDING', label: 'Docs pending' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under review' },
  { key: 'OFFER_RECEIVED', label: 'Offer received' },
  { key: 'OFFER_ACCEPTED', label: 'Offer accepted' },
  { key: 'OFFER_REJECTED', label: 'Rejected' },
  { key: 'VISA_PROCESS', label: 'Visa' },
  { key: 'ENROLLED', label: 'Enrolled' },
];

export default function ApplicationsList() {
  const router = useRouter();
  const { can } = usePermissions();
  const canManage = can('MANAGE_STUDENT_CRM');

  const [allApps, setAllApps] = useState([]);
  const [students, setStudents] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [studentFilterId, setStudentFilterId] = useState(null);

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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, studentsRes] = await Promise.all([
        listApplications({ limit: 500 }),
        listStudents({ limit: 500 }),
      ]);
      setAllApps(Array.isArray(appsRes?.data) ? appsRes.data : []);
      setStudents(Array.isArray(studentsRes?.data) ? studentsRes.data : []);
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
    return allApps.filter((a) => {
      if (stageFilter !== 'ALL' && a.stage !== stageFilter) return false;
      if (studentFilterId && a.studentId !== studentFilterId) return false;
      if (!term) return true;
      const student = studentById.get(a.studentId);
      return (
        a.applicationCode?.toLowerCase().includes(term) ||
        a.university?.toLowerCase().includes(term) ||
        a.course?.toLowerCase().includes(term) ||
        a.country?.toLowerCase().includes(term) ||
        student?.fullName?.toLowerCase().includes(term) ||
        student?.email?.toLowerCase().includes(term)
      );
    });
  }, [allApps, search, stageFilter, studentFilterId, studentById]);

  const stageCounts = useMemo(() => {
    const counts = { ALL: allApps.length };
    APPLICATION_STAGES.forEach((s) => (counts[s.key] = 0));
    allApps.forEach((a) => {
      counts[a.stage] = (counts[a.stage] || 0) + 1;
    });
    return counts;
  }, [allApps]);

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

  const openAppRoute = (id) => router.push(`/student-crm/applications/${id}`);

  return (
    <div className="text-neutral-900">
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

      {/* Toolbar */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="ui-text-meta">
          {allApps.length} application{allApps.length === 1 ? '' : 's'} across {students.length} student{students.length === 1 ? '' : 's'}.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {canManage && visibleLeads.length > 0 && (
            <button
              type="button"
              onClick={handlePromoteAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl ui-text-strong bg-amber-50 border border-amber-100 text-amber-800 hover:bg-amber-100 transition-all"
            >
              Import all leads
              <span className="px-1.5 py-px rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-semibold">
                {visibleLeads.length}
              </span>
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setShowNewStudent(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl ui-text-strong text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 transition-all"
            >
              <GraduationCap size={13} /> New student
            </button>
          )}
          {canManage && (
            <button
              onClick={() => {
                setPickedStudent(null);
                setShowPickStudent(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl ui-text-strong !text-white bg-neutral-900 hover:bg-neutral-800 transition-all"
            >
              <Plus size={13} /> New application
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            ['Students', stats.totalStudents],
            ['Enrolled', stats.enrolled],
            ['Active apps', allApps.filter((a) => !['ENROLLED', 'OFFER_REJECTED'].includes(a.stage)).length],
            ['In visa', stageCounts.VISA_PROCESS || 0],
          ].map(([label, value]) => (
            <div key={label} className="ui-surface px-4 py-3">
              <p className="ui-text-meta">{label}</p>
              <p className="text-xl font-semibold text-neutral-900 mt-0.5">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Promotable leads — collapsible */}
      {canManage && visibleLeads.length > 0 && (
        <div className="ui-surface mb-5 overflow-hidden">
          <button
            type="button"
            onClick={() => setPromotableExpanded((v) => !v)}
            className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-neutral-50/60 transition-all"
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
                    className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-50 transition-all"
                  >
                    {promotingId === lead.id ? 'Creating…' : 'Create login + application'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Filter bar */}
      <div className="ui-surface mb-5 px-5 py-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, student, university, course or country"
              className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-[13px] text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition-all"
            />
          </div>
          {studentFilterId && (
            <button
              type="button"
              onClick={() => setStudentFilterId(null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 text-white text-[12px] font-medium"
            >
              <Filter size={12} /> {studentById.get(studentFilterId)?.fullName || 'Student'}
              <X size={12} className="ml-0.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {STAGE_FILTERS.map((s) => {
            const count = stageCounts[s.key] ?? 0;
            const active = stageFilter === s.key;
            const isEmpty = count === 0 && s.key !== 'ALL';
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setStageFilter(s.key)}
                disabled={isEmpty}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  active
                    ? 'bg-neutral-900 text-white'
                    : isEmpty
                    ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {s.label}
                {count > 0 && (
                  <span className={`text-[10.5px] font-semibold ${active ? 'text-white/70' : 'text-neutral-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications table */}
      <div className="ui-surface overflow-hidden">
        {loading ? (
          <div className="p-16 text-center ui-text-meta">Loading applications…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 mx-auto flex items-center justify-center">
              <FileText size={18} className="text-neutral-400" />
            </div>
            <p className="ui-text-strong mt-4">No applications match these filters.</p>
            <p className="ui-text-meta mt-1">Try clearing the search or stage filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/60">
                  <th className="px-5 py-3 ui-text-caption uppercase">Student</th>
                  <th className="px-5 py-3 ui-text-caption uppercase">Application</th>
                  <th className="px-5 py-3 ui-text-caption uppercase">University & course</th>
                  <th className="px-5 py-3 ui-text-caption uppercase">Stage</th>
                  <th className="px-5 py-3 ui-text-caption uppercase">Deadline</th>
                  <th className="px-5 py-3 ui-text-caption uppercase">Counsellor</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((a) => {
                  const s = studentById.get(a.studentId);
                  const initials = (s?.fullName || a.studentName || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                  const isOverdue =
                    a.deadline &&
                    new Date(a.deadline) < new Date() &&
                    !['ENROLLED', 'OFFER_REJECTED'].includes(a.stage);
                  return (
                    <tr
                      key={a.id}
                      onClick={() => openAppRoute(a.id)}
                      className="cursor-pointer hover:bg-neutral-50/70 transition-all"
                    >
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStudentFilterId(a.studentId);
                          }}
                          className="flex items-center gap-3 text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center text-[12px] font-semibold shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="ui-text-strong truncate">{s?.fullName || a.studentName || '—'}</p>
                            <p className="text-[12px] text-neutral-500 truncate">{s?.email || ''}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[12px] font-mono text-neutral-700">{a.applicationCode}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{a.country}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="ui-text-strong leading-snug">{a.university}</p>
                        <p className="text-[12px] text-neutral-500 truncate max-w-xs">{a.course}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-md border ${stageBadge(
                            a.stage,
                          )}`}
                        >
                          {getStageLabel(a.stage)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {a.deadline ? (
                          <span
                            className={`flex items-center gap-1.5 text-[12px] ${
                              isOverdue ? 'text-rose-600 font-medium' : 'text-neutral-600'
                            }`}
                          >
                            <Clock size={12} className={isOverdue ? 'text-rose-500' : 'text-neutral-400'} />
                            {formatDate(a.deadline)}
                          </span>
                        ) : (
                          <span className="text-[12px] text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] text-neutral-600">
                          {a.assignedTo?.fullName || <span className="text-neutral-400">Unassigned</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <ChevronRight size={16} className="text-neutral-300" />
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
      {showNewStudent && <NewStudentModal onClose={() => setShowNewStudent(false)} onSave={handleNewStudent} />}
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
            className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-[13px] text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition-all"
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
          className="w-full py-2.5 border border-dashed border-neutral-300 rounded-xl ui-text-strong text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus size={13} /> Create new student instead
        </button>
      </div>
    </Modal>
  );
}
