'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import {
  listStudents,
  listApplications,
  getApplication,
  createStudent,
  createApplication,
  advanceApplicationStage,
  addDocument,
  updateDocument,
  deleteDocument,
  notifyMissingDocs,
  upsertOffer,
  upsertVisa,
} from '@/services/studentCrmApi';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';

/* 8-stage workflow per spec.
 * Draft → Documents Pending → Submitted → Under Review → Offer Received
 *  → Offer Accepted / Rejected → Visa Process → Enrolled
 */
const STAGES = [
  { key: 'DRAFT', label: 'draft' },
  { key: 'DOCUMENTS_PENDING', label: 'documents pending' },
  { key: 'SUBMITTED', label: 'submitted' },
  { key: 'UNDER_REVIEW', label: 'under review' },
  { key: 'OFFER_RECEIVED', label: 'offer received' },
  { key: 'OFFER_ACCEPTED', label: 'offer accepted' },
  { key: 'VISA_PROCESS', label: 'visa process' },
  { key: 'ENROLLED', label: 'enrolled' },
];

const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));

const DOC_STATUSES = ['PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED'];
const VISA_STATUSES = ['NOT_STARTED', 'DOCUMENTS_GATHERING', 'APPLIED', 'INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED'];
const OFFER_DECISION = ['PENDING', 'ACCEPTED', 'REJECTED'];

const INPUT_CLS =
  'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all disabled:opacity-70';

const stageBadge = (stageKey) => {
  if (stageKey === 'ENROLLED') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (stageKey === 'OFFER_REJECTED') return 'bg-rose-50 border-rose-200 text-rose-700';
  if (stageKey?.startsWith('OFFER')) return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-indigo-50 border-indigo-200 text-indigo-700';
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
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can('MANAGE_STUDENT_CRM');

  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [apps, setApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [appDetail, setAppDetail] = useState(null);

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

  // -------- fetch students --------
  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await listStudents({ search: studentSearch, limit: 200 });
      const list = Array.isArray(res?.data) ? res.data : [];
      setStudents(list);
      if (list.length && !selectedStudent) {
        setSelectedStudent(list[0]);
      }
    } catch (e) {
      flash('err', e?.message || 'failed to load students');
    } finally {
      setLoadingStudents(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentSearch]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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
      if (list.length) setSelectedAppId(list[0].id);
      else {
        setSelectedAppId(null);
        setAppDetail(null);
      }
    } catch (e) {
      flash('err', e?.message || 'failed to load applications');
    } finally {
      setLoadingApps(false);
    }
  }, [selectedStudent]);

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
    const idx = STAGE_INDEX[appDetail.stage];
    if (idx === undefined || idx >= STAGES.length - 1) return;
    const next = STAGES[idx + 1].key;
    try {
      await advanceApplicationStage(appDetail.id, { stage: next });
      flash('ok', `advanced to ${STAGES[idx + 1].label}`);
      await fetchDetail();
      await fetchApps();
    } catch (e) {
      flash('err', e?.message || 'failed to advance stage');
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

  const currentStageIdx = appDetail ? STAGE_INDEX[appDetail.stage] : -1;
  const isFinal = appDetail?.stage === 'ENROLLED';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      {toast.msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold text-white ${
            toast.kind === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">applications</h1>
          <p className="text-slate-500 text-sm mt-1">
            track student applications from initiation through enrolment.{' '}
            {can('VIEW_MARKETING') && 'leads from marketing can be converted into applications here.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <button
              onClick={() => setShowNewStudent(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition-all"
            >
              <GraduationCap size={13} /> new student
            </button>
          )}
          {canManage && selectedStudent && (
            <button
              onClick={() => setShowNewApp(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            >
              <Plus size={13} /> new application
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Students column */}
        <div className="col-span-12 lg:col-span-3 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-180px)]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700">students</h3>
              <span className="text-[10px] font-semibold text-slate-500">{students.length}</span>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="search by name or email..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 focus:border-indigo-600 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingStudents ? (
              <div className="p-8 text-center text-[10px] text-slate-400">loading...</div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-[10px] text-slate-400">no students yet.</div>
            ) : (
              students.map((s) => {
                const active = selectedStudent?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left px-4 py-3 transition ${
                      active ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <p className={`text-[11px] font-semibold ${active ? 'text-indigo-800' : 'text-slate-800'}`}>{s.fullName}</p>
                    <p className="text-[9px] text-slate-500 truncate mt-0.5 lowercase">{s.email}</p>
                    <p className="text-[9px] text-slate-400 mt-1">
                      {s.applications?.length || 0} application{(s.applications?.length || 0) === 1 ? '' : 's'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Applications column */}
        <div className="col-span-12 lg:col-span-3 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-180px)]">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-xs font-semibold text-slate-700">
              {selectedStudent ? `applications · ${selectedStudent.fullName}` : 'applications'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{apps.length} total</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingApps ? (
              <div className="p-8 text-center text-[10px] text-slate-400">loading...</div>
            ) : !selectedStudent ? (
              <div className="p-8 text-center text-[10px] text-slate-400">select a student first.</div>
            ) : apps.length === 0 ? (
              <div className="p-8 text-center text-[10px] text-slate-400">no applications yet.</div>
            ) : (
              apps.map((a) => {
                const active = selectedAppId === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAppId(a.id)}
                    className={`w-full text-left px-4 py-3 transition ${
                      active ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <p className="text-[10px] font-mono font-semibold text-indigo-600">{a.applicationCode}</p>
                    <p className={`text-[11px] font-semibold mt-1 ${active ? 'text-indigo-800' : 'text-slate-800'}`}>{a.university}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {a.course} · {a.country}
                    </p>
                    <span
                      className={`mt-2 inline-block px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest rounded-md border ${stageBadge(
                        a.stage
                      )}`}
                    >
                      {STAGES.find((s) => s.key === a.stage)?.label || a.stage}
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
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-16 text-center text-[11px] text-slate-400">
              loading application...
            </div>
          ) : !appDetail ? (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-16 text-center space-y-2">
              <FileText size={28} className="text-indigo-600 mx-auto opacity-70" />
              <p className="text-xs font-semibold text-slate-800">no application selected</p>
              <p className="text-[10px] text-slate-500">create or select one to see its 8-stage workflow.</p>
            </div>
          ) : (
            <>
              <ApplicationHeader app={appDetail} canManage={canManage} onAdvance={handleAdvance} isFinal={isFinal} />
              <StageStepper app={appDetail} onJump={canManage ? handleJumpStage : null} currentIdx={currentStageIdx} />
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
        <NewApplicationModal onClose={() => setShowNewApp(false)} onSave={handleNewApp} student={selectedStudent} />
      )}
    </div>
  );
};

/* -------------------- sub-components -------------------- */

const ApplicationHeader = ({ app, canManage, onAdvance, isFinal }) => (
  <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <p className="text-[10px] font-mono font-semibold text-indigo-600">{app.applicationCode}</p>
      <h2 className="text-base font-semibold text-slate-900 mt-1">
        {app.university} · <span className="text-slate-600">{app.course}</span>
      </h2>
      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Globe size={11} /> {app.country}
        </span>
        {app.intake && <span>· intake {app.intake}</span>}
        {app.deadline && (
          <span className="flex items-center gap-1">
            <Clock size={11} /> deadline {formatDate(app.deadline)}
          </span>
        )}
        {app.assignedTo && <span>· assigned to {app.assignedTo.fullName}</span>}
      </div>
    </div>
    {canManage && !isFinal && (
      <button
        onClick={onAdvance}
        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
      >
        advance stage <ArrowRight size={13} />
      </button>
    )}
  </div>
);

const StageStepper = ({ app, currentIdx, onJump }) => (
  <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="text-[10px] font-semibold text-slate-500">8-stage workflow</h4>
      {onJump && <span className="text-[9px] text-slate-400">click a stage to jump</span>}
    </div>
    <div className="flex gap-2 overflow-x-auto pb-2">
      {STAGES.map((s, i) => {
        const passed = currentIdx >= i;
        const active = app.stage === s.key;
        return (
          <button
            key={s.key}
            onClick={onJump ? () => onJump(s.key) : undefined}
            disabled={!onJump}
            className={`shrink-0 px-3 py-2.5 rounded-xl border text-[9px] uppercase font-extrabold tracking-wider transition ${
              active
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md ring-2 ring-indigo-200 ring-offset-1'
                : passed
                ? 'bg-indigo-50/60 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            } ${onJump ? 'cursor-pointer hover:border-indigo-400' : 'cursor-default'}`}
          >
            {i + 1}. {s.label}
          </button>
        );
      })}
    </div>
  </div>
);

const DocumentChecklist = ({ app, canManage, onStatus, onDelete, onAdd, missingCount, onNotifyMissing }) => {
  const [addName, setAddName] = useState('');
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-700">document checklist</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">
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
      <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
        {(app.documents || []).length === 0 ? (
          <div className="p-6 text-center text-[10px] text-slate-400">no documents listed.</div>
        ) : (
          (app.documents || []).map((d) => (
            <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold text-slate-800">{d.name}</p>
                  {d.required && <span className="text-[8px] font-semibold text-rose-600">required</span>}
                </div>
                {d.notes && <p className="text-[9px] text-slate-500 mt-0.5">{d.notes}</p>}
                {d.filename && <p className="text-[9px] text-slate-400 mt-0.5 font-mono">{d.filename}</p>}
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
                  <span className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-lg border bg-slate-50 border-slate-200 text-slate-600">
                    {d.status}
                  </span>
                )}
                {canManage && (
                  <button
                    onClick={() => onDelete(d.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
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
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-medium text-slate-700 focus:border-indigo-600 outline-none"
          />
          <button
            onClick={() => {
              if (addName.trim()) {
                onAdd(addName.trim());
                setAddName('');
              }
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-semibold flex items-center gap-1"
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
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-slate-700">offer letter</h4>
        <p className="text-[10px] text-slate-500 mt-0.5">track offer details and the student's decision.</p>
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
          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              disabled={!canManage}
              checked={form.conditional}
              onChange={(e) => setForm({ ...form, conditional: e.target.checked })}
              className="accent-indigo-600"
            />
            <span className="text-[10px] font-semibold text-slate-700">conditional offer</span>
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
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-semibold"
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
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-slate-700">visa tracking</h4>
        <p className="text-[10px] text-slate-500 mt-0.5">monitor the visa process and outcome.</p>
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
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-semibold"
          >
            save visa tracking
          </button>
        </div>
      )}
    </div>
  );
};

const AuditTimeline = ({ app }) => (
  <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
    <div className="flex items-center gap-2">
      <History size={13} className="text-slate-500" />
      <h4 className="text-xs font-semibold text-slate-700">audit trail</h4>
    </div>
    <ol className="relative border-l border-slate-200 pl-6 space-y-3 ml-2">
      {(app.stageEvents || []).map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white" />
          <p className="text-[11px] font-semibold text-slate-800">
            {e.fromStage ? `${e.fromStage} → ${e.toStage}` : `started at ${e.toStage}`}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5">
            {new Date(e.createdAt).toLocaleString()} {e.notes ? `· ${e.notes}` : ''}
          </p>
        </li>
      ))}
      {(!app.stageEvents || app.stageEvents.length === 0) && (
        <p className="text-[10px] text-slate-400">no events yet.</p>
      )}
    </ol>
  </div>
);

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-semibold text-slate-500 ml-1">{label}</label>
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

const NewApplicationModal = ({ onClose, onSave, student }) => {
  const [form, setForm] = useState({
    country: student?.preferredCountry || '',
    university: '',
    course: '',
    intake: '',
    deadline: '',
    notes: '',
  });
  return (
    <Modal title={`new application · ${student?.fullName}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.country || !form.university || !form.course) return;
          onSave(form);
        }}
        className="space-y-4 p-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="country *">
            <input
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className={INPUT_CLS}
            />
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
          <input
            required
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="course *">
          <input
            required
            value={form.course}
            onChange={(e) => setForm({ ...form, course: e.target.value })}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="deadline">
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className={INPUT_CLS}
          />
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
    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h3 className="text-xs font-semibold text-slate-800">{title}</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
          <X size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ModalFooter = ({ onClose, submitLabel }) => (
  <div className="flex gap-3 pt-4 border-t border-slate-200">
    <button
      type="button"
      onClick={onClose}
      className="flex-1 py-3 border border-slate-200 rounded-2xl text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
    >
      discard
    </button>
    <button
      type="submit"
      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-semibold"
    >
      {submitLabel}
    </button>
  </div>
);

export default Applications;
