'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  X,
  Globe,
  Clock,
  History,
  User,
  ExternalLink,
  Calendar,
  Check,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  APPLICATION_STAGES,
  DOC_STATUSES,
  VISA_STATUSES,
  OFFER_DECISION,
  getStageLabel,
  stageBadgeClass,
} from '@/features/student-crm/constants';
import { listUniversities, listCourses } from '@/services/crmSettingsApi';

const stageBadge = stageBadgeClass;

export const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '—';
  }
};

export const stepState = (stageKey, currentStage) => {
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

/* -------------------- Building blocks -------------------- */

export const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block ui-text-caption">{label}</label>
    {children}
  </div>
);

export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-md animate-in fade-in duration-200">
    <div className="ui-surface w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
      <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="ui-text-h3">{title}</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-all"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export const ModalFooter = ({ onClose, submitLabel }) => (
  <div className="flex gap-2.5 pt-5 mt-2 border-t border-neutral-100">
    <button
      type="button"
      onClick={onClose}
      className="flex-1 py-2.5 border border-neutral-200 rounded-xl ui-text-strong text-neutral-700 hover:bg-neutral-50 transition-all"
    >
      Cancel
    </button>
    <button
      type="submit"
      className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl ui-text-strong !text-white transition-all"
    >
      {submitLabel}
    </button>
  </div>
);

/* -------------------- Header & Meta -------------------- */

export const ApplicationHeader = ({ app, student, canManage, onAdvance, isFinal, isOverdue }) => (
  <div className="ui-surface overflow-hidden">
    <div className="px-6 py-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[11px] font-mono font-medium text-neutral-500 tracking-tight">{app.applicationCode}</p>
          <span
            className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-md border ${stageBadge(
              app.stage,
            )}`}
          >
            {getStageLabel(app.stage)}
          </span>
        </div>
        <h2 className="ui-text-h2 mt-1.5">{app.university}</h2>
        <p className="ui-text-meta mt-0.5">{app.course}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 ui-text-body !text-neutral-600">
          <span className="flex items-center gap-1.5">
            <Globe size={12} className="text-neutral-400" /> {app.country}
          </span>
          {app.intake && (
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="text-neutral-400" /> {app.intake}
            </span>
          )}
          {app.deadline && (
            <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-rose-600 font-medium' : ''}`}>
              <Clock size={12} className={isOverdue ? 'text-rose-500' : 'text-neutral-400'} />
              {formatDate(app.deadline)}
              {isOverdue && ' · Overdue'}
            </span>
          )}
          {app.assignedTo && (
            <span className="flex items-center gap-1.5">
              <User size={12} className="text-neutral-400" /> {app.assignedTo.fullName}
            </span>
          )}
          {student && (
            <Link
              href={`/student-crm/student-management?student=${student.id}`}
              className="flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900 font-medium"
            >
              <ExternalLink size={12} /> Student profile
            </Link>
          )}
        </div>
      </div>
      {canManage && !isFinal && (
        <button
          onClick={onAdvance}
          className="shrink-0 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl ui-text-strong !text-white flex items-center gap-1.5 transition-all"
        >
          Advance stage <ArrowRight size={14} />
        </button>
      )}
    </div>
  </div>
);

export const ApplicationMetaEditor = ({ app, counsellors, canManage, onSave }) => {
  const [deadline, setDeadline] = useState(app.deadline?.slice(0, 10) || '');
  const [assignedToId, setAssignedToId] = useState(app.assignedToId ? String(app.assignedToId) : '');

  useEffect(() => {
    setDeadline(app.deadline?.slice(0, 10) || '');
    setAssignedToId(app.assignedToId ? String(app.assignedToId) : '');
  }, [app.id, app.deadline, app.assignedToId]);

  if (!canManage) return null;

  return (
    <div className="ui-surface p-4 flex flex-col sm:flex-row sm:items-end gap-3">
      <Field label="Application deadline">
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="ui-field"
        />
      </Field>
      <Field label="Assigned counsellor">
        <select
          value={assignedToId}
          onChange={(e) => setAssignedToId(e.target.value)}
          className="ui-field"
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
        className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl ui-text-strong !text-white shrink-0 transition-all"
      >
        Save
      </button>
    </div>
  );
};

/* -------------------- Stage stepper -------------------- */

export const StageStepper = ({ app, onJump }) => {
  const visibleStages = APPLICATION_STAGES.filter((s) => s.key !== 'OFFER_REJECTED');
  return (
    <div className="ui-surface px-6 py-5">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h4 className="ui-text-h3">Workflow</h4>
          <p className="ui-text-meta mt-0.5">
            {onJump ? 'Click any stage to jump.' : 'Read-only view of progress.'}
          </p>
        </div>
        {app.stage === 'OFFER_REJECTED' && (
          <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
            Offer rejected
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute top-3.5 left-3.5 right-3.5 h-px bg-neutral-200" aria-hidden />
        <ol className="relative flex justify-between items-start gap-1">
          {visibleStages.map((s) => {
            const state = stepState(s.key, app.stage);
            const isPassed = state === 'passed';
            const isActive = state === 'active';
            return (
              <li key={s.key} className="flex-1 flex flex-col items-center min-w-0">
                <button
                  type="button"
                  onClick={onJump ? () => onJump(s.key) : undefined}
                  disabled={!onJump}
                  className={`group relative w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all z-10 ${
                    isActive
                      ? 'bg-neutral-900 text-white ring-4 ring-neutral-100'
                      : isPassed
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-400'
                  } ${onJump ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={s.label}
                >
                  {isPassed ? <Check size={12} strokeWidth={3} /> : s.order}
                </button>
                <span
                  className={`mt-2 text-[11px] font-medium text-center leading-tight tracking-tight px-0.5 ${
                    isActive ? 'text-neutral-900' : isPassed ? 'text-neutral-700' : 'text-neutral-400'
                  }`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {app.stage === 'OFFER_RECEIVED' && onJump && (
        <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-2">
          <p className="ui-text-meta">Offer received — choose the student's response:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onJump('OFFER_ACCEPTED')}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 text-[12px] font-medium transition-all"
            >
              Mark accepted
            </button>
            <button
              type="button"
              onClick={() => onJump('OFFER_REJECTED')}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 text-[12px] font-medium transition-all"
            >
              Mark rejected
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------- Document checklist -------------------- */

export const DocumentChecklist = ({ app, canManage, onStatus, onDelete, onAdd, missingCount, onNotifyMissing }) => {
  const [addName, setAddName] = useState('');
  return (
    <div className="ui-surface px-6 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="ui-text-h3">Documents</h4>
          <p className="ui-text-meta mt-0.5">
            {app.documents?.length || 0} items · {missingCount} required missing
          </p>
        </div>
        {canManage && missingCount > 0 && (
          <button
            onClick={onNotifyMissing}
            className="text-[12px] font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <AlertCircle size={12} /> Notify missing
          </button>
        )}
      </div>
      <div className="border border-neutral-100 rounded-xl overflow-hidden divide-y divide-neutral-100">
        {(app.documents || []).length === 0 ? (
          <div className="p-6 text-center ui-text-meta">No documents listed.</div>
        ) : (
          (app.documents || []).map((d) => (
            <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-neutral-50/60 transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="ui-text-strong">{d.name}</p>
                  {d.required && <span className="text-[10px] font-semibold text-rose-600">required</span>}
                </div>
                {d.notes && <p className="text-[11px] text-neutral-500 mt-0.5">{d.notes}</p>}
                {d.filename && <p className="text-[11px] text-neutral-500 mt-0.5 font-mono">{d.filename}</p>}
              </div>
              <div className="flex items-center gap-2">
                {canManage ? (
                  <select
                    value={d.status}
                    onChange={(e) => onStatus(d.id, e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide border outline-none ${
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
                  <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-lg border bg-neutral-50 border-neutral-200 text-neutral-600">
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
        <div className="flex items-center gap-2">
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Add document to checklist"
            className="ui-field"
          />
          <button
            onClick={() => {
              if (addName.trim()) {
                onAdd(addName.trim());
                setAddName('');
              }
            }}
            className="shrink-0 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl ui-text-strong !text-white flex items-center gap-1 transition-all"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      )}
    </div>
  );
};

/* -------------------- Offer letter -------------------- */

export const OfferLetterPanel = ({ app, canManage, onSave }) => {
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
    <div className="ui-surface px-6 py-5 space-y-4">
      <div>
        <h4 className="ui-text-h3">Offer letter</h4>
        <p className="ui-text-meta mt-0.5">Track offer details and the student's decision.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Received date">
          <input
            type="date"
            disabled={!canManage}
            value={form.receivedAt}
            onChange={(e) => setForm({ ...form, receivedAt: e.target.value })}
            className="ui-field"
          />
        </Field>
        <Field label="Decision deadline">
          <input
            type="date"
            disabled={!canManage}
            value={form.decisionDeadline}
            onChange={(e) => setForm({ ...form, decisionDeadline: e.target.value })}
            className="ui-field"
          />
        </Field>
        <Field label="Filename">
          <input
            type="text"
            disabled={!canManage}
            placeholder="offer.pdf"
            value={form.filename}
            onChange={(e) => setForm({ ...form, filename: e.target.value })}
            className="ui-field"
          />
        </Field>
        <Field label="File URL">
          <input
            type="text"
            disabled={!canManage}
            placeholder="https://..."
            value={form.fileUrl}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            className="ui-field"
          />
        </Field>
        <Field label="Student decision">
          <select
            disabled={!canManage}
            value={form.studentDecision}
            onChange={(e) => setForm({ ...form, studentDecision: e.target.value })}
            className="ui-field"
          >
            {OFFER_DECISION.map((s) => (
              <option key={s} value={s}>
                {s.toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Conditional?">
          <label className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              disabled={!canManage}
              checked={form.conditional}
              onChange={(e) => setForm({ ...form, conditional: e.target.checked })}
              className="accent-neutral-900"
            />
            <span className="ui-text-body">Conditional offer</span>
          </label>
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          disabled={!canManage}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="ui-field"
        />
      </Field>
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => onSave(form)}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl ui-text-strong !text-white transition-all"
          >
            Save offer
          </button>
        </div>
      )}
    </div>
  );
};

/* -------------------- Visa tracking -------------------- */

export const VisaPanel = ({ app, canManage, onSave }) => {
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
    <div className="ui-surface px-6 py-5 space-y-4">
      <div>
        <h4 className="ui-text-h3">Visa tracking</h4>
        <p className="ui-text-meta mt-0.5">Monitor the visa process and outcome.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Visa country">
          <input
            disabled={!canManage}
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="ui-field"
          />
        </Field>
        <Field label="Status">
          <select
            disabled={!canManage}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="ui-field"
          >
            {VISA_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Appointment date">
          <input
            type="date"
            disabled={!canManage}
            value={form.appointmentDate}
            onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
            className="ui-field"
          />
        </Field>
        <Field label="Decision date">
          <input
            type="date"
            disabled={!canManage}
            value={form.decisionDate}
            onChange={(e) => setForm({ ...form, decisionDate: e.target.value })}
            className="ui-field"
          />
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          disabled={!canManage}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="ui-field"
        />
      </Field>
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => onSave(form)}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl ui-text-strong !text-white transition-all"
          >
            Save visa
          </button>
        </div>
      )}
    </div>
  );
};

/* -------------------- Audit timeline -------------------- */

export const AuditTimeline = ({ app }) => (
  <div className="ui-surface px-6 py-5 space-y-4">
    <div className="flex items-center gap-2">
      <History size={14} className="text-neutral-500" />
      <h4 className="ui-text-h3">Audit trail</h4>
    </div>
    <ol className="relative border-l border-neutral-200 pl-6 space-y-3 ml-2">
      {(app.stageEvents || []).map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-neutral-900 border-2 border-white" />
          <p className="ui-text-strong">
            {e.fromStage
              ? `${getStageLabel(e.fromStage)} → ${getStageLabel(e.toStage)}`
              : `Started at ${getStageLabel(e.toStage)}`}
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {new Date(e.createdAt).toLocaleString()}
            {e.changedBy?.fullName ? ` · ${e.changedBy.fullName}` : ''}
            {e.notes ? ` · ${e.notes}` : ''}
          </p>
        </li>
      ))}
      {(!app.stageEvents || app.stageEvents.length === 0) && (
        <p className="ui-text-meta">No events yet.</p>
      )}
    </ol>
  </div>
);

/* -------------------- Modals: new student / new application -------------------- */

export const NewStudentModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', preferredCountry: '' });
  return (
    <Modal title="New student" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.fullName || !form.email) return;
          onSave(form);
        }}
        className="space-y-4 p-6"
      >
        <Field label="Full name *">
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="ui-field"
          />
        </Field>
        <Field label="Email *">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="ui-field"
          />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="ui-field" />
        </Field>
        <Field label="Preferred country">
          <input
            value={form.preferredCountry}
            onChange={(e) => setForm({ ...form, preferredCountry: e.target.value })}
            className="ui-field"
          />
        </Field>
        <ModalFooter onClose={onClose} submitLabel="Create student" />
      </form>
    </Modal>
  );
};

export const NewApplicationModal = ({ onClose, onSave, student, counsellors = [], formOptions = {} }) => {
  const countries = formOptions.countries || [];
  const [countryUniversities, setCountryUniversities] = useState([]);
  const [universityCourses, setUniversityCourses] = useState([]);
  const [loadingUnis, setLoadingUnis] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.country || !form.university || !form.course) return;
          onSave({
            ...form,
            assignedToId: form.assignedToId ? Number(form.assignedToId) : undefined,
          });
        }}
        className="space-y-4 p-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Country *">
            {countries.length ? (
              <select
                required
                value={form.countryId}
                onChange={(e) => onCountryChange(e.target.value)}
                className="ui-field"
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
                className="ui-field"
              />
            )}
          </Field>
          <Field label="Intake">
            <input
              value={form.intake}
              onChange={(e) => setForm({ ...form, intake: e.target.value })}
              placeholder="Fall 2026"
              className="ui-field"
            />
          </Field>
        </div>
        <Field label="University *">
          {loadingUnis ? (
            <input disabled className="ui-field" placeholder="Loading universities..." />
          ) : countryUniversities.length ? (
            <select
              required
              value={form.universityId}
              onChange={(e) => onUniversityChange(e.target.value)}
              className="ui-field"
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
              className="ui-field"
              placeholder={form.countryId ? 'No universities for this country' : 'Select a country first'}
            />
          )}
        </Field>
        <Field label="Course *">
          {loadingCourses ? (
            <input disabled className="ui-field" placeholder="Loading courses..." />
          ) : universityCourses.length ? (
            <select
              required
              value={form.courseId}
              onChange={(e) => onCourseChange(e.target.value)}
              className="ui-field"
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
              className="ui-field"
              placeholder={form.universityId ? 'No courses imported — type manually' : 'Select university first'}
            />
          )}
        </Field>
        <Field label="Deadline">
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="ui-field"
          />
        </Field>
        <Field label="Assigned counsellor">
          <select
            value={form.assignedToId}
            onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
            className="ui-field"
          >
            <option value="">Unassigned</option>
            {counsellors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="ui-field"
          />
        </Field>
        <ModalFooter onClose={onClose} submitLabel="Create application" />
      </form>
    </Modal>
  );
};

export { stageBadge };
