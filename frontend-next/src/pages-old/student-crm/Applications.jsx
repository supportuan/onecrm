'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  GraduationCap,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  Globe,
  Clock,
  History,
  User,
  ExternalLink,
  User,
  ExternalLink,
} from 'lucide-react';
import {
  listStudents,
  listApplications,
  getApplication,
  createStudent,
  createApplication,
  updateApplication,
  updateApplication,
  advanceApplicationStage,
  addDocument,
  updateDocument,
  deleteDocument,
  notifyMissingDocs,
  upsertOffer,
  upsertVisa,
  listCounsellors,
} from '@/services/studentCrmApi';
import { getFormOptions, listUniversities, listCourses } from '@/services/crmSettingsApi';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import {
  APPLICATION_STAGES,
  DOC_STATUSES,
  VISA_STATUSES,
  OFFER_DECISION,
  getNextStage,
  getStageLabel,
  stageBadgeClass,
} from '@/features/student-crm/constants';
import {
  APPLICATION_STAGES,
  DOC_STATUSES,
  VISA_STATUSES,
  OFFER_DECISION,
  getNextStage,
  getStageLabel,
  stageBadgeClass,
} from '@/features/student-crm/constants';

const INPUT_CLS =
  'w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] font-semibold text-neutral-800 focus:border-neutral-900 outline-none transition-all disabled:opacity-70';

const stageBadge = stageBadgeClass;

const stepState = (stageKey, currentStage) => {
  if (currentStage === stageKey) return 'active';
  if (currentStage === 'OFFER_REJECTED') {
    if (['DRAFT', 'DOCUMENTS_PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'OFFER_RECEIVED'].includes(stageKey)) {
      return 'passed';
    }
    if (stageKey === 'OFFER_REJECTED') return 'active';
    return 'future';
  }
  const order = APPLICATION_STAGES.find((s) => s.key === stageKey)?.order ?? 0;
  const currentOrder = APPLICATION_STAGES.find((s) => s.key === currentStage)?.order ?? 0;
  if (stageKey === 'OFFER_REJECTED') return 'branch';
  if (order < currentOrder) return 'passed';
  return 'future';
const stageBadge = stageBadgeClass;

const stepState = (stageKey, currentStage) => {
  if (currentStage === stageKey) return 'active';
  if (currentStage === 'OFFER_REJECTED') {
    if (['DRAFT', 'DOCUMENTS_PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'OFFER_RECEIVED'].includes(stageKey)) {
      return 'passed';
    }
    if (stageKey === 'OFFER_REJECTED') return 'active';
    return 'future';
  }
  const order = APPLICATION_STAGES.find((s) => s.key === stageKey)?.order ?? 0;
  const currentOrder = APPLICATION_STAGES.find((s) => s.key === currentStage)?.order ?? 0;
  if (stageKey === 'OFFER_REJECTED') return 'branch';
  if (order < currentOrder) return 'passed';
  return 'future';
};

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch (_) {
    return '—';
  }
};

const Applications = () => {
  const searchParams = useSearchParams();
  const studentParam = searchParams.get('student');
  const appParam = searchParams.get('app');
  const searchParams = useSearchParams();
  const studentParam = searchParams.get('student');
  const appParam = searchParams.get('app');
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can('MANAGE_STUDENT_CRM');

  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [apps, setApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [counsellors, setCounsellors] = useState([]);
  const [counsellors, setCounsellors] = useState([]);

  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [toast, setToast] = useState({ kind: '', msg: '' });
  const flash = (kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast({ kind: '', msg: '' }), 3000);
  };

  const [showNewStudent, setShowNewStudent] = useState(false);
  const [showNewApp, setShowNewApp] = useState(false);
  const [promotableLeads, setPromotableLeads] = useState([]);
  const [formOptions, setFormOptions] = useState({ countries: [], industries: [] });
  const [promotingId, setPromotingId] = useState(null);

  const fetchPromotableLeads = useCallback(async () => {
    try {
      const res = await listPromotableLeads();
      setPromotableLeads(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setPromotableLeads([]);
    }
  }, []);

  const handlePromoteLead = async (leadId) => {
    setPromotingId(leadId);
    try {
      const res = await promoteLead(leadId, { password: 'Welcome@123' });
      const pwd = res?.data?.tempPassword;
      flash('ok', pwd ? `Student login created. Password: ${pwd}` : 'Lead promoted to application');
      await fetchPromotableLeads();
      await fetchStudents();
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
      await fetchPromotableLeads();
      await fetchStudents();
    } catch (e) {
      flash('err', e?.message || 'Batch promote failed');
    }
  };

  useEffect(() => {
    fetchPromotableLeads();
    getFormOptions()
      .then((r) => setFormOptions(r?.data || { countries: [], industries: [] }))
      .catch(() => {});
  }, [fetchPromotableLeads]);

  // -------- fetch students --------
  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await listStudents({ search: studentSearch, limit: 200 });
      const list = Array.isArray(res?.data) ? res.data : [];
      setStudents(list);
      if (studentParam) {
        const id = Number(studentParam);
        const found = list.find((s) => s.id === id);
        if (found) setSelectedStudent(found);
      } else if (list.length && !selectedStudent) {
      if (studentParam) {
        const id = Number(studentParam);
        const found = list.find((s) => s.id === id);
        if (found) setSelectedStudent(found);
      } else if (list.length && !selectedStudent) {
        setSelectedStudent(list[0]);
      }
    } catch (e) {
      flash('err', e?.message || 'failed to load students');
    } finally {
      setLoadingStudents(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentSearch, studentParam]);
  }, [studentSearch, studentParam]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    listCounsellors()
      .then((res) => setCounsellors(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setCounsellors([]));
  }, []);

  useEffect(() => {
    listCounsellors()
      .then((res) => setCounsellors(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setCounsellors([]));
  }, []);

  // -------- fetch apps for selected student --------
  const fetchApps = useCallback(async () => {
    if (!selectedStudent) {
      setApps([]);
      return;
    }
    setLoadingApps(true);
    try {
      const res = await listApplications({ studentId: selectedStudent.id, limit: 100 });
      const list = Array.isArray(res?.data) ? res.data : [];
      setApps(list);
      if (appParam) {
        const id = Number(appParam);
        if (list.some((a) => a.id === id)) setSelectedAppId(id);
        else if (list.length) setSelectedAppId(list[0].id);
      } else if (list.length) setSelectedAppId(list[0].id);
      if (appParam) {
        const id = Number(appParam);
        if (list.some((a) => a.id === id)) setSelectedAppId(id);
        else if (list.length) setSelectedAppId(list[0].id);
      } else if (list.length) setSelectedAppId(list[0].id);
      else {
        setSelectedAppId(null);
        setAppDetail(null);
      }
    } catch (e) {
      flash('err', e?.message || 'failed to load applications');
    } finally {
      setLoadingApps(false);
    }
  }, [selectedStudent, appParam]);
  }, [selectedStudent, appParam]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // -------- fetch app detail --------
  const fetchDetail = useCallback(async () => {
    if (!selectedAppId) {
      setAppDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const res = await getApplication(selectedAppId);
      setAppDetail(res?.data || null);
    } catch (e) {
      flash('err', e?.message || 'failed to load application');
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedAppId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // -------- stage actions --------
  const handleAdvance = async () => {
    if (!appDetail) return;
    const current = appDetail.stage;
    if (current === 'ENROLLED' || current === 'OFFER_REJECTED') return;
    const next =
      current === 'OFFER_RECEIVED' ? 'OFFER_ACCEPTED' : getNextStage(current);
    if (!next) return;
    const current = appDetail.stage;
    if (current === 'ENROLLED' || current === 'OFFER_REJECTED') return;
    const next =
      current === 'OFFER_RECEIVED' ? 'OFFER_ACCEPTED' : getNextStage(current);
    if (!next) return;
    try {
      await advanceApplicationStage(appDetail.id, { stage: next });
      flash('ok', `Advanced to ${getStageLabel(next)}`);
      flash('ok', `Advanced to ${getStageLabel(next)}`);
      await fetchDetail();
      await fetchApps();
    } catch (e) {
      flash('err', e?.message || 'failed to advance stage');
    }
  };

  const handleUpdateMeta = async (payload) => {
    if (!appDetail) return;
    try {
      await updateApplication(appDetail.id, payload);
      flash('ok', 'Application updated');
      await fetchDetail();
      await fetchApps();
    } catch (e) {
      flash('err', e?.message || 'failed to update application');
    }
  };

  const handleUpdateMeta = async (payload) => {
    if (!appDetail) return;
    try {
      await updateApplication(appDetail.id, payload);
      flash('ok', 'Application updated');
      await fetchDetail();
      await fetchApps();
    } catch (e) {
      flash('err', e?.message || 'failed to update application');
    }
  };

  const handleJumpStage = async (stageKey) => {
    if (!appDetail) return;
    try {
      await advanceApplicationStage(appDetail.id, { stage: stageKey });
      flash('ok', 'stage updated');
      await fetchDetail();
      await fetchApps();
    } catch (e) {
      flash('err', e?.message || 'failed to set stage');
    }
  };

  // -------- doc actions --------
  const handleDocStatus = async (docId, status) => {
    if (!appDetail) return;
    try {
      await updateDocument(appDetail.id, docId, { status });
      flash('ok', 'document updated');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to update document');
    }
  };

  const handleDocDelete = async (docId) => {
    if (!appDetail) return;
    try {
      await deleteDocument(appDetail.id, docId);
      flash('ok', 'document removed');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to delete document');
    }
  };

  const handleAddDoc = async (name) => {
    if (!appDetail || !name) return;
    try {
      await addDocument(appDetail.id, { name, required: true });
      flash('ok', 'document added to checklist');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to add document');
    }
  };

  const handleNotifyMissing = async () => {
    if (!appDetail) return;
    try {
      await notifyMissingDocs(appDetail.id);
      flash('ok', 'missing-document alert dispatched');
    } catch (e) {
      flash('err', e?.message || 'failed to send alert');
    }
  };

  // -------- offer / visa actions --------
  const handleSaveOffer = async (payload) => {
    if (!appDetail) return;
    try {
      await upsertOffer(appDetail.id, payload);
      flash('ok', 'offer letter saved');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to save offer');
    }
  };

  const handleSaveVisa = async (payload) => {
    if (!appDetail) return;
    try {
      await upsertVisa(appDetail.id, payload);
      flash('ok', 'visa tracking saved');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to save visa tracking');
    }
  };

  // -------- new entity creation --------
  const handleNewStudent = async (form) => {
    try {
      const res = await createStudent(form);
      flash('ok', 'student created');
      setShowNewStudent(false);
      await fetchStudents();
      if (res?.data) setSelectedStudent(res.data);
    } catch (e) {
      flash('err', e?.message || 'failed to create student');
    }
  };

  const handleNewApp = async (form) => {
    if (!selectedStudent) return;
    try {
      const res = await createApplication({ ...form, studentId: selectedStudent.id });
      flash('ok', 'application created');
      setShowNewApp(false);
      await fetchApps();
      if (res?.data?.id) setSelectedAppId(res.data.id);
    } catch (e) {
      flash('err', e?.message || 'failed to create application');
    }
  };

  // -------- derived --------
  const missingRequiredCount = useMemo(() => {
    if (!appDetail?.documents) return 0;
    return appDetail.documents.filter((d) => d.required && d.status === 'PENDING').length;
  }, [appDetail]);

  const isFinal = appDetail?.stage === 'ENROLLED' || appDetail?.stage === 'OFFER_REJECTED';
  const isOverdue =
    appDetail?.deadline &&
    new Date(appDetail.deadline) < new Date() &&
    !['ENROLLED', 'OFFER_REJECTED'].includes(appDetail.stage);
  const isFinal = appDetail?.stage === 'ENROLLED' || appDetail?.stage === 'OFFER_REJECTED';
  const isOverdue =
    appDetail?.deadline &&
    new Date(appDetail.deadline) < new Date() &&
    !['ENROLLED', 'OFFER_REJECTED'].includes(appDetail.stage);

  return (
    <div className="ui-page text-neutral-800 font-sans">
      {toast.msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold text-white ${
            toast.kind === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Applications</h1>
          <p className="text-neutral-500 text-sm mt-1">
            track student applications from initiation through enrolment.{' '}
            {can('VIEW_MARKETING') && 'leads from marketing can be converted into applications here.'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {canManage && promotableLeads.length > 0 && (
            <button
              type="button"
              onClick={handlePromoteAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-semibold bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100"
            >
              Import all leads ({promotableLeads.length})
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setShowNewStudent(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-semibold bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 transition-all"
            >
              <GraduationCap size={13} /> new student
            </button>
          )}
          {canManage && selectedStudent && (
            <button
              onClick={() => setShowNewApp(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm transition-all"
            >
              <Plus size={13} /> new application
            </button>
          )}
        </div>
      </div>

      {canManage && promotableLeads.some((l) => !l.hasStudentProfile || !l.isStudentLoginCreated) && (
        <div className="ui-panel mb-5 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200 bg-neutral-50">
            <h2 className="text-xs font-semibold text-neutral-800">Leads ready for student applications</h2>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              Creates student login (password Welcome@123), profile, and application using universities from CRM settings.
            </p>
          </div>
          <ul className="divide-y divide-neutral-100 max-h-48 overflow-y-auto">
            {promotableLeads
              .filter((l) => !l.hasStudentProfile || !l.isStudentLoginCreated)
              .map((lead) => (
                <li key={lead.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-900">{lead.fullName}</p>
                    <p className="text-[10px] text-neutral-500">
                      {lead.email} · {lead.preferredCountry || '—'} · {lead.preferredCourse || '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={promotingId === lead.id}
                    onClick={() => handlePromoteLead(lead.id)}
                    className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-neutral-900 text-white disabled:opacity-50"
                  >
                    {promotingId === lead.id ? 'Creating…' : 'Create login + application'}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">
        {/* Students column */}
        <div className="col-span-12 lg:col-span-3 ui-panel flex flex-col overflow-hidden max-h-[calc(100vh-180px)]">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-700">students</h3>
              <span className="text-[10px] font-semibold text-neutral-500">{students.length}</span>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="search by name or email..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-[11px] font-medium text-neutral-700 focus:border-neutral-900 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {loadingStudents ? (
              <div className="p-8 text-center text-[10px] text-neutral-500">Loading...</div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-[10px] text-neutral-500">no students yet.</div>
            ) : (
              students.map((s) => {
                const active = selectedStudent?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left px-4 py-3 transition ${
                      active ? 'bg-neutral-100/50 border-l-4 border-l-neutral-900' : 'hover:bg-neutral-50/60'
                    }`}
                  >
                    <p className={`text-[11px] font-semibold ${active ? 'text-neutral-800' : 'text-neutral-800'}`}>{s.fullName}</p>
                    <p className="text-[9px] text-neutral-500 truncate mt-0.5">{s.email}</p>
                    <p className="text-[9px] text-neutral-500 mt-1">
                      {s.applications?.length || 0} application{(s.applications?.length || 0) === 1 ? '' : 's'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Applications column */}
        <div className="col-span-12 lg:col-span-3 ui-panel flex flex-col overflow-hidden max-h-[calc(100vh-180px)]">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50">
            <h3 className="text-xs font-semibold text-neutral-700">
              {selectedStudent ? `applications · ${selectedStudent.fullName}` : 'applications'}
            </h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">{apps.length} total</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {loadingApps ? (
              <div className="p-8 text-center text-[10px] text-neutral-500">Loading...</div>
            ) : !selectedStudent ? (
              <div className="p-8 text-center text-[10px] text-neutral-500">select a student first.</div>
            ) : apps.length === 0 ? (
              <div className="p-8 text-center text-[10px] text-neutral-500">no applications yet.</div>
            ) : (
              apps.map((a) => {
                const active = selectedAppId === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAppId(a.id)}
                    className={`w-full text-left px-4 py-3 transition ${
                      active ? 'bg-neutral-100/50 border-l-4 border-l-neutral-900' : 'hover:bg-neutral-50/60'
                    }`}
                  >
                    <p className="text-[10px] font-mono font-semibold text-neutral-700">{a.applicationCode}</p>
                    <p className={`text-[11px] font-semibold mt-1 ${active ? 'text-neutral-800' : 'text-neutral-800'}`}>{a.university}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {a.course} · {a.country}
                    </p>
                    <span
                      className={`mt-2 inline-block px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest rounded-md border ${stageBadge(
                        a.stage
                      )}`}
                    >
                      {getStageLabel(a.stage)}
                      {getStageLabel(a.stage)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail column */}
        <div className="col-span-12 lg:col-span-6 space-y-5">
          {loadingDetail ? (
            <div className="ui-panel p-16 text-center text-[11px] text-neutral-500">
              loading application...
            </div>
          ) : !appDetail ? (
            <div className="ui-panel p-16 text-center space-y-2">
              <FileText size={28} className="text-neutral-700 mx-auto opacity-70" />
              <p className="text-xs font-semibold text-neutral-800">no application selected</p>
              <p className="text-[10px] text-neutral-500">create or select one to see its 8-stage workflow.</p>
            </div>
          ) : (
            <>
              <ApplicationHeader
                app={appDetail}
                student={selectedStudent}
                canManage={canManage}
                onAdvance={handleAdvance}
                isFinal={isFinal}
                isOverdue={isOverdue}
              />
              <ApplicationMetaEditor
                app={appDetail}
                counsellors={counsellors}
                canManage={canManage}
                onSave={handleUpdateMeta}
              />
              <StageStepper app={appDetail} onJump={canManage ? handleJumpStage : null} />
              <ApplicationHeader
                app={appDetail}
                student={selectedStudent}
                canManage={canManage}
                onAdvance={handleAdvance}
                isFinal={isFinal}
                isOverdue={isOverdue}
              />
              <ApplicationMetaEditor
                app={appDetail}
                counsellors={counsellors}
                canManage={canManage}
                onSave={handleUpdateMeta}
              />
              <StageStepper app={appDetail} onJump={canManage ? handleJumpStage : null} />
              <DocumentChecklist
                app={appDetail}
                canManage={canManage}
                onStatus={handleDocStatus}
                onDelete={handleDocDelete}
                onAdd={handleAddDoc}
                missingCount={missingRequiredCount}
                onNotifyMissing={handleNotifyMissing}
              />
              <OfferLetterPanel app={appDetail} canManage={canManage} onSave={handleSaveOffer} />
              <VisaPanel app={appDetail} canManage={canManage} onSave={handleSaveVisa} />
              <AuditTimeline app={appDetail} />
            </>
          )}
        </div>
      </div>

      {showNewStudent && <NewStudentModal onClose={() => setShowNewStudent(false)} onSave={handleNewStudent} />}
      {showNewApp && selectedStudent && (
        <NewApplicationModal
          onClose={() => setShowNewApp(false)}
          onSave={handleNewApp}
          student={selectedStudent}
          counsellors={counsellors}
        />
      )}
    </div>
  );
};

/* -------------------- sub-components -------------------- */

const ApplicationHeader = ({ app, student, canManage, onAdvance, isFinal, isOverdue }) => (
const ApplicationHeader = ({ app, student, canManage, onAdvance, isFinal, isOverdue }) => (
  <div className="ui-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <p className="text-[10px] font-mono font-semibold text-neutral-700">{app.applicationCode}</p>
      <h2 className="text-base font-semibold text-neutral-900 mt-1">
        {app.university} · <span className="text-neutral-600">{app.course}</span>
      </h2>
      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-neutral-500">
        <span className="flex items-center gap-1">
          <Globe size={11} /> {app.country}
        </span>
        {app.intake && <span>· Intake {app.intake}</span>}
        {app.intake && <span>· Intake {app.intake}</span>}
        {app.deadline && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-semibold' : ''}`}>
            <Clock size={11} /> Deadline {formatDate(app.deadline)}
            {isOverdue && ' · Overdue'}
          </span>
        )}
        {app.assignedTo && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-semibold' : ''}`}>
            <Clock size={11} /> Deadline {formatDate(app.deadline)}
            {isOverdue && ' · Overdue'}
          </span>
        )}
        {app.assignedTo && (
          <span className="flex items-center gap-1">
            <User size={11} /> {app.assignedTo.fullName}
            <User size={11} /> {app.assignedTo.fullName}
          </span>
        )}
        {student && (
          <Link
            href={`/student-crm/student-management?student=${student.id}`}
            className="flex items-center gap-1 text-neutral-700 hover:text-neutral-900 font-semibold"
          >
            <ExternalLink size={11} /> View student profile
          </Link>
        )}
        {student && (
          <Link
            href={`/student-crm/student-management?student=${student.id}`}
            className="flex items-center gap-1 text-neutral-700 hover:text-neutral-900 font-semibold"
          >
            <ExternalLink size={11} /> View student profile
          </Link>
        )}
      </div>
      <span
        className={`mt-3 inline-block px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-md border ${stageBadge(
          app.stage
        )}`}
      >
        {getStageLabel(app.stage)}
      </span>
      <span
        className={`mt-3 inline-block px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-md border ${stageBadge(
          app.stage
        )}`}
      >
        {getStageLabel(app.stage)}
      </span>
    </div>
    {canManage && !isFinal && (
      <button
        onClick={onAdvance}
        className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
      >
        Advance stage <ArrowRight size={13} />
        Advance stage <ArrowRight size={13} />
      </button>
    )}
  </div>
);

const ApplicationMetaEditor = ({ app, counsellors, canManage, onSave }) => {
  const [deadline, setDeadline] = useState(app.deadline?.slice(0, 10) || '');
  const [assignedToId, setAssignedToId] = useState(app.assignedToId ? String(app.assignedToId) : '');

  useEffect(() => {
    setDeadline(app.deadline?.slice(0, 10) || '');
    setAssignedToId(app.assignedToId ? String(app.assignedToId) : '');
  }, [app.id, app.deadline, app.assignedToId]);

  if (!canManage) return null;

  return (
    <div className="ui-panel p-4 flex flex-col sm:flex-row sm:items-end gap-3">
      <Field label="Application deadline">
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={INPUT_CLS}
        />
      </Field>
      <Field label="Assigned counsellor">
        <select
          value={assignedToId}
          onChange={(e) => setAssignedToId(e.target.value)}
          className={INPUT_CLS}
        >
          <option value="">Unassigned</option>
          {counsellors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
      </Field>
      <button
        type="button"
        onClick={() =>
          onSave({
            deadline: deadline || null,
            assignedToId: assignedToId ? Number(assignedToId) : null,
          })
        }
        className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-semibold shrink-0"
      >
        Save assignment
      </button>
    </div>
  );
};

const StageStepper = ({ app, onJump }) => (
const ApplicationMetaEditor = ({ app, counsellors, canManage, onSave }) => {
  const [deadline, setDeadline] = useState(app.deadline?.slice(0, 10) || '');
  const [assignedToId, setAssignedToId] = useState(app.assignedToId ? String(app.assignedToId) : '');

  useEffect(() => {
    setDeadline(app.deadline?.slice(0, 10) || '');
    setAssignedToId(app.assignedToId ? String(app.assignedToId) : '');
  }, [app.id, app.deadline, app.assignedToId]);

  if (!canManage) return null;

  return (
    <div className="ui-panel p-4 flex flex-col sm:flex-row sm:items-end gap-3">
      <Field label="Application deadline">
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={INPUT_CLS}
        />
      </Field>
      <Field label="Assigned counsellor">
        <select
          value={assignedToId}
          onChange={(e) => setAssignedToId(e.target.value)}
          className={INPUT_CLS}
        >
          <option value="">Unassigned</option>
          {counsellors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
      </Field>
      <button
        type="button"
        onClick={() =>
          onSave({
            deadline: deadline || null,
            assignedToId: assignedToId ? Number(assignedToId) : null,
          })
        }
        className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-semibold shrink-0"
      >
        Save assignment
      </button>
    </div>
  );
};

const StageStepper = ({ app, onJump }) => (
  <div className="ui-panel p-6 space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="text-[10px] font-semibold text-neutral-500">Application workflow</h4>
      {onJump && <span className="text-[9px] text-neutral-500">Click a stage to jump</span>}
      <h4 className="text-[10px] font-semibold text-neutral-500">Application workflow</h4>
      {onJump && <span className="text-[9px] text-neutral-500">Click a stage to jump</span>}
    </div>
    <div className="flex flex-wrap gap-2 pb-2">
      {APPLICATION_STAGES.map((s) => {
        const state = stepState(s.key, app.stage);
    <div className="flex flex-wrap gap-2 pb-2">
      {APPLICATION_STAGES.map((s) => {
        const state = stepState(s.key, app.stage);
        return (
          <button
            key={s.key}
            onClick={onJump ? () => onJump(s.key) : undefined}
            disabled={!onJump}
            className={`shrink-0 px-3 py-2.5 rounded-xl border text-[9px] uppercase font-extrabold tracking-wider transition ${
              state === 'active'
              state === 'active'
                ? 'bg-neutral-900 border-neutral-900 text-white shadow-md ring-2 ring-neutral-200 ring-offset-1'
                : state === 'passed'
                : state === 'passed'
                ? 'bg-neutral-100/60 border-neutral-200 text-neutral-900'
                : state === 'branch'
                ? 'bg-rose-50/50 border-rose-200 text-rose-600 border-dashed'
                : state === 'branch'
                ? 'bg-rose-50/50 border-rose-200 text-rose-600 border-dashed'
                : 'bg-neutral-50 border-neutral-200 text-neutral-500'
            } ${onJump ? 'cursor-pointer hover:border-neutral-500' : 'cursor-default'}`}
          >
            {s.order}. {s.label}
            {s.order}. {s.label}
          </button>
        );
      })}
    </div>
    {app.stage === 'OFFER_RECEIVED' && onJump && (
      <p className="text-[10px] text-neutral-500">
        At offer received, advance defaults to offer accepted — or jump to offer rejected.
      </p>
    )}
    {app.stage === 'OFFER_RECEIVED' && onJump && (
      <p className="text-[10px] text-neutral-500">
        At offer received, advance defaults to offer accepted — or jump to offer rejected.
      </p>
    )}
  </div>
);

const DocumentChecklist = ({ app, canManage, onStatus, onDelete, onAdd, missingCount, onNotifyMissing }) => {
  const [addName, setAddName] = useState('');
  return (
    <div className="ui-panel p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-neutral-700">document checklist</h4>
          <p className="text-[10px] text-neutral-500 mt-0.5">
            {app.documents?.length || 0} items · {missingCount} required missing
          </p>
        </div>
        {canManage && missingCount > 0 && (
          <button
            onClick={onNotifyMissing}
            className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <AlertCircle size={11} /> send missing-docs alert
          </button>
        )}
      </div>
      <div className="border border-neutral-100 rounded-lg overflow-hidden divide-y divide-neutral-100">
        {(app.documents || []).length === 0 ? (
          <div className="p-6 text-center text-[10px] text-neutral-500">no documents listed.</div>
        ) : (
          (app.documents || []).map((d) => (
            <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-neutral-50/60 transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold text-neutral-800">{d.name}</p>
                  {d.required && <span className="text-[8px] font-semibold text-rose-600">required</span>}
                </div>
                {d.notes && <p className="text-[9px] text-neutral-500 mt-0.5">{d.notes}</p>}
                {d.filename && <p className="text-[9px] text-neutral-500 mt-0.5 font-mono">{d.filename}</p>}
              </div>
              <div className="flex items-center gap-2">
                {canManage ? (
                  <select
                    value={d.status}
                    onChange={(e) => onStatus(d.id, e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border outline-none ${
                      d.status === 'VERIFIED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : d.status === 'UPLOADED'
                        ? 'bg-sky-50 border-sky-200 text-sky-700'
                        : d.status === 'REJECTED'
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}
                  >
                    {DOC_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.toLowerCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-lg border bg-neutral-50 border-neutral-200 text-neutral-600">
                    {d.status}
                  </span>
                )}
                {canManage && (
                  <button
                    onClick={() => onDelete(d.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {canManage && (
        <div className="flex items-center gap-2 pt-2">
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="add document to checklist..."
            className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] font-medium text-neutral-700 focus:border-neutral-900 outline-none"
          />
          <button
            onClick={() => {
              if (addName.trim()) {
                onAdd(addName.trim());
                setAddName('');
              }
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-[10px] font-semibold flex items-center gap-1"
          >
            <Plus size={11} /> add
          </button>
        </div>
      )}
    </div>
  );
};

const OfferLetterPanel = ({ app, canManage, onSave }) => {
  const [form, setForm] = useState(() => ({
    fileUrl: app.offerLetter?.fileUrl || '',
    filename: app.offerLetter?.filename || '',
    receivedAt: app.offerLetter?.receivedAt?.slice(0, 10) || '',
    conditional: app.offerLetter?.conditional || false,
    decisionDeadline: app.offerLetter?.decisionDeadline?.slice(0, 10) || '',
    studentDecision: app.offerLetter?.studentDecision || 'PENDING',
    notes: app.offerLetter?.notes || '',
  }));
  useEffect(() => {
    setForm({
      fileUrl: app.offerLetter?.fileUrl || '',
      filename: app.offerLetter?.filename || '',
      receivedAt: app.offerLetter?.receivedAt?.slice(0, 10) || '',
      conditional: app.offerLetter?.conditional || false,
      decisionDeadline: app.offerLetter?.decisionDeadline?.slice(0, 10) || '',
      studentDecision: app.offerLetter?.studentDecision || 'PENDING',
      notes: app.offerLetter?.notes || '',
    });
  }, [app.id, app.offerLetter]);

  return (
    <div className="ui-panel p-6 space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-neutral-700">offer letter</h4>
        <p className="text-[10px] text-neutral-500 mt-0.5">track offer details and the student's decision.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="received date">
          <input
            type="date"
            disabled={!canManage}
            value={form.receivedAt}
            onChange={(e) => setForm({ ...form, receivedAt: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="decision deadline">
          <input
            type="date"
            disabled={!canManage}
            value={form.decisionDeadline}
            onChange={(e) => setForm({ ...form, decisionDeadline: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="filename">
          <input
            type="text"
            disabled={!canManage}
            placeholder="offer.pdf"
            value={form.filename}
            onChange={(e) => setForm({ ...form, filename: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="file url">
          <input
            type="text"
            disabled={!canManage}
            placeholder="https://..."
            value={form.fileUrl}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="student decision">
          <select
            disabled={!canManage}
            value={form.studentDecision}
            onChange={(e) => setForm({ ...form, studentDecision: e.target.value })}
            className={INPUT_CLS}
          >
            {OFFER_DECISION.map((s) => (
              <option key={s} value={s}>
                {s.toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="conditional?">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
            <input
              type="checkbox"
              disabled={!canManage}
              checked={form.conditional}
              onChange={(e) => setForm({ ...form, conditional: e.target.checked })}
              className="accent-neutral-900"
            />
            <span className="text-[10px] font-semibold text-neutral-700">conditional offer</span>
          </label>
        </Field>
      </div>
      <Field label="notes">
        <textarea
          disabled={!canManage}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className={INPUT_CLS}
        />
      </Field>
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => onSave(form)}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-semibold"
          >
            save offer details
          </button>
        </div>
      )}
    </div>
  );
};

const VisaPanel = ({ app, canManage, onSave }) => {
  const [form, setForm] = useState(() => ({
    country: app.visaTracking?.country || app.country || '',
    status: app.visaTracking?.status || 'NOT_STARTED',
    appointmentDate: app.visaTracking?.appointmentDate?.slice(0, 10) || '',
    decisionDate: app.visaTracking?.decisionDate?.slice(0, 10) || '',
    notes: app.visaTracking?.notes || '',
  }));
  useEffect(() => {
    setForm({
      country: app.visaTracking?.country || app.country || '',
      status: app.visaTracking?.status || 'NOT_STARTED',
      appointmentDate: app.visaTracking?.appointmentDate?.slice(0, 10) || '',
      decisionDate: app.visaTracking?.decisionDate?.slice(0, 10) || '',
      notes: app.visaTracking?.notes || '',
    });
  }, [app.id, app.visaTracking]);

  return (
    <div className="ui-panel p-6 space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-neutral-700">visa tracking</h4>
        <p className="text-[10px] text-neutral-500 mt-0.5">monitor the Visa process and outcome.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="visa country">
          <input
            disabled={!canManage}
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="status">
          <select
            disabled={!canManage}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={INPUT_CLS}
          >
            {VISA_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="appointment date">
          <input
            type="date"
            disabled={!canManage}
            value={form.appointmentDate}
            onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="decision date">
          <input
            type="date"
            disabled={!canManage}
            value={form.decisionDate}
            onChange={(e) => setForm({ ...form, decisionDate: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
      </div>
      <Field label="notes">
        <textarea
          disabled={!canManage}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className={INPUT_CLS}
        />
      </Field>
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => onSave(form)}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-semibold"
          >
            save visa tracking
          </button>
        </div>
      )}
    </div>
  );
};

const AuditTimeline = ({ app }) => (
  <div className="ui-panel p-6 space-y-4">
    <div className="flex items-center gap-2">
      <History size={13} className="text-neutral-500" />
      <h4 className="text-xs font-semibold text-neutral-700">audit trail</h4>
    </div>
    <ol className="relative border-l border-neutral-200 pl-6 space-y-3 ml-2">
      {(app.stageEvents || []).map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-neutral-900 border-2 border-white" />
          <p className="text-[11px] font-semibold text-neutral-800">
            {e.fromStage
              ? `${getStageLabel(e.fromStage)} → ${getStageLabel(e.toStage)}`
              : `Started at ${getStageLabel(e.toStage)}`}
            {e.fromStage
              ? `${getStageLabel(e.fromStage)} → ${getStageLabel(e.toStage)}`
              : `Started at ${getStageLabel(e.toStage)}`}
          </p>
          <p className="text-[9px] text-neutral-500 mt-0.5">
            {new Date(e.createdAt).toLocaleString()}
            {e.changedBy?.fullName ? ` · ${e.changedBy.fullName}` : ''}
            {e.notes ? ` · ${e.notes}` : ''}
            {new Date(e.createdAt).toLocaleString()}
            {e.changedBy?.fullName ? ` · ${e.changedBy.fullName}` : ''}
            {e.notes ? ` · ${e.notes}` : ''}
          </p>
        </li>
      ))}
      {(!app.stageEvents || app.stageEvents.length === 0) && (
        <p className="text-[10px] text-neutral-500">no events yet.</p>
      )}
    </ol>
  </div>
);

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-semibold text-neutral-500 ml-1">{label}</label>
    {children}
  </div>
);

const NewStudentModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', preferredCountry: '' });
  return (
    <Modal title="new student" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.fullName || !form.email) return;
          onSave(form);
        }}
        className="space-y-4 p-6"
      >
        <Field label="full name *">
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="email *">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="phone">
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={INPUT_CLS} />
        </Field>
        <Field label="preferred country">
          <input
            value={form.preferredCountry}
            onChange={(e) => setForm({ ...form, preferredCountry: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <ModalFooter onClose={onClose} submitLabel="create student" />
      </form>
    </Modal>
  );
};

const NewApplicationModal = ({ onClose, onSave, student, counsellors = [] }) => {
  const [form, setForm] = useState({
    country: student?.preferredCountry || '',
    countryId: student?.countryId || '',
    university: '',
    universityId: '',
    course: student?.preferredCourse || '',
    courseId: '',
    intake: '',
    deadline: '',
    assignedToId: '',
    assignedToId: '',
    notes: '',
  });

  useEffect(() => {
    if (!form.countryId) {
      setCountryUniversities([]);
      return;
    }
    setLoadingUnis(true);
    listUniversities({ countryId: Number(form.countryId), page: 1, limit: 500 })
      .then((r) => setCountryUniversities(r?.data?.items || []))
      .catch(() => setCountryUniversities([]))
      .finally(() => setLoadingUnis(false));
  }, [form.countryId]);

  useEffect(() => {
    if (!form.universityId) {
      setUniversityCourses([]);
      return;
    }
    setLoadingCourses(true);
    listCourses({ universityId: Number(form.universityId), page: 1, limit: 500 })
      .then((r) => setUniversityCourses(r?.data?.items || []))
      .catch(() => setUniversityCourses([]))
      .finally(() => setLoadingCourses(false));
  }, [form.universityId]);

  const onCountryChange = (countryId) => {
    const country = countries.find((c) => c.id === Number(countryId));
    setForm({
      ...form,
      countryId,
      country: country?.name || '',
      university: '',
      universityId: '',
      course: '',
      courseId: '',
    });
  };

  const onUniversityChange = (universityId) => {
    const uni = countryUniversities.find((u) => u.id === Number(universityId));
    setForm({
      ...form,
      universityId,
      university: uni?.name || '',
      countryId: uni?.countryId || form.countryId,
      country: uni?.country?.name || form.country,
      course: '',
      courseId: '',
    });
  };

  const onCourseChange = (courseId) => {
    const course = universityCourses.find((c) => c.id === Number(courseId));
    setForm({
      ...form,
      courseId,
      course: course?.name || '',
    });
  };

  return (
    <Modal title={`New application · ${student?.fullName}`} onClose={onClose}>
    <Modal title={`New application · ${student?.fullName}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.country || !form.university || !form.course) return;
          onSave({
            ...form,
            assignedToId: form.assignedToId ? Number(form.assignedToId) : undefined,
          });
          onSave({
            ...form,
            assignedToId: form.assignedToId ? Number(form.assignedToId) : undefined,
          });
        }}
        className="space-y-4 p-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="country *">
            {countries.length ? (
              <select
                required
                value={form.countryId}
                onChange={(e) => onCountryChange(e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className={INPUT_CLS}
              />
            )}
          </Field>
          <Field label="intake">
            <input
              value={form.intake}
              onChange={(e) => setForm({ ...form, intake: e.target.value })}
              placeholder="fall 2026"
              className={INPUT_CLS}
            />
          </Field>
        </div>
        <Field label="university *">
          {loadingUnis ? (
            <input disabled className={INPUT_CLS} placeholder="Loading universities..." />
          ) : countryUniversities.length ? (
            <select
              required
              value={form.universityId}
              onChange={(e) => onUniversityChange(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">Select university</option>
              {countryUniversities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.city ? ` · ${u.city}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              required
              value={form.university}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
              className={INPUT_CLS}
              placeholder={form.countryId ? 'No universities for this country' : 'Select a country first'}
            />
          )}
        </Field>
        <Field label="course *">
          {loadingCourses ? (
            <input disabled className={INPUT_CLS} placeholder="Loading courses..." />
          ) : universityCourses.length ? (
            <select
              required
              value={form.courseId}
              onChange={(e) => onCourseChange(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">Select course</option>
              {universityCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.level ? ` (${c.level})` : ''}
                  {c.duration ? ` · ${c.duration}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              required
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value, courseId: '' })}
              className={INPUT_CLS}
              placeholder={form.universityId ? 'No courses imported — type manually' : 'Select university first'}
            />
          )}
        </Field>
        <Field label="deadline">
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="assigned counsellor">
          <select
            value={form.assignedToId}
            onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
            className={INPUT_CLS}
          >
            <option value="">Unassigned</option>
            {counsellors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="assigned counsellor">
          <select
            value={form.assignedToId}
            onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
            className={INPUT_CLS}
          >
            <option value="">Unassigned</option>
            {counsellors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="notes">
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className={INPUT_CLS}
          />
        </Field>
        <ModalFooter onClose={onClose} submitLabel="create application" />
      </form>
    </Modal>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-white border border-neutral-200 rounded-lg w-auto shadow-sm">
      <div className="px-5 py-3 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
        <h3 className="text-xs font-semibold text-neutral-800">{title}</h3>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
          <X size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ModalFooter = ({ onClose, submitLabel }) => (
  <div className="flex gap-3 pt-4 border-t border-neutral-200">
    <button
      type="button"
      onClick={onClose}
      className="flex-1 py-3 border border-neutral-200 rounded-lg text-[10px] font-semibold text-neutral-600 hover:bg-neutral-50"
    >
      discard
    </button>
    <button
      type="submit"
      className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-semibold"
    >
      {submitLabel}
    </button>
  </div>
);

export default Applications;
