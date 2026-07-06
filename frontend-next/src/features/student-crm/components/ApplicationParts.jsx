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
  Upload,
  FileText,
  Download,
  Eye,
  Loader2,
  Paperclip,
} from 'lucide-react';
import {
  APPLICATION_STAGES,
  DOC_STATUSES,
  VISA_STATUSES,
  OFFER_DECISION,
  getStageLabel,
  getVisaStatusLabel,
  stageBadgeClass,
} from '@/features/student-crm/constants';
import CatalogCourseFields from './CatalogCourseFields';

const stageBadge = stageBadgeClass;

export const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '—';
  }
};

/** Normalize API DateTime (string, Date, or null) for <input type="date">. */
export const toDateInputValue = (value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  try {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  } catch {
    return '';
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
  const [deadline, setDeadline] = useState(toDateInputValue(app.deadline));
  const [assignedToId, setAssignedToId] = useState(app.assignedToId ? String(app.assignedToId) : '');

  useEffect(() => {
    setDeadline(toDateInputValue(app.deadline));
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

const docStatusStyle = (status) => {
  if (status === 'VERIFIED') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (status === 'UPLOADED') return 'bg-sky-50 border-sky-200 text-sky-700';
  if (status === 'REJECTED') return 'bg-rose-50 border-rose-200 text-rose-700';
  return 'bg-amber-50 border-amber-200 text-amber-700';
};

const fileExt = (name) => (name?.split('.').pop() || '').toUpperCase();

export const DocumentChecklist = ({
  app,
  canManage,
  canUpload: canUploadProp,
  onStatus,
  onApprove,
  onReject,
  onDelete,
  onAdd,
  onUpload,
  uploadingDocId,
  missingCount,
  onNotifyMissing,
}) => {
  const [addName, setAddName] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const canUpload = canUploadProp ?? canManage;
  const docs = app.documents || [];
  const required = docs.filter((d) => d.required);
  const done = required.filter((d) => ['UPLOADED', 'VERIFIED'].includes(d.status)).length;
  const pct = required.length ? Math.round((done / required.length) * 100) : 0;

  const studentMayUpload = (d) => canUpload && ['PENDING', 'REJECTED'].includes(d.status);

  const submitReject = (docId) => {
    onReject?.(docId, rejectNotes.trim() || undefined);
    setRejectingId(null);
    setRejectNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="ui-surface px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="ui-text-h3">Document management</h4>
            <p className="ui-text-meta mt-0.5">
              {docs.length} items · {done}/{required.length} required uploaded
            </p>
          </div>
          {canManage && missingCount > 0 && (
            <button
              onClick={onNotifyMissing}
              className="text-[12px] font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <AlertCircle size={12} /> Notify missing ({missingCount})
            </button>
          )}
        </div>
        {required.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between ui-text-caption mb-1.5">
              <span>Required progress</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div className="h-full rounded-full bg-neutral-900 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Document list */}
      <div className="ui-surface overflow-hidden">
        {docs.length === 0 ? (
          <div className="p-10 text-center ui-text-meta">No documents in checklist yet.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {docs.map((d) => {
              const hasFile = Boolean(d.fileUrl);
              const isUploading = uploadingDocId === d.id;
              return (
                <div key={d.id} className="px-5 py-4 hover:bg-neutral-50/50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Icon + name */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
                          hasFile ? 'bg-sky-50 border-sky-100 text-sky-600' : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                        }`}
                      >
                        {hasFile ? (
                          <span className="text-[9px] font-bold">{fileExt(d.filename) || 'FILE'}</span>
                        ) : (
                          <Paperclip size={14} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="ui-text-strong">{d.name}</p>
                          {d.required && (
                            <span className="text-[10px] font-semibold text-rose-600 uppercase">required</span>
                          )}
                        </div>
                        {d.filename ? (
                          <p className="text-[11px] text-neutral-500 mt-0.5 truncate font-mono">{d.filename}</p>
                        ) : (
                          <p className="text-[11px] text-neutral-400 mt-0.5">No file uploaded</p>
                        )}
                        {d.uploadedAt && (
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            Uploaded {formatDate(d.uploadedAt)}
                          </p>
                        )}
                        {d.notes && d.status === 'REJECTED' && (
                          <p className="text-[11px] text-rose-600 mt-1 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1">
                            Rejection reason: {d.notes}
                          </p>
                        )}
                        {d.notes && d.status !== 'REJECTED' && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">{d.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                      {hasFile && d.fileUrl && (
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition"
                          title="View / download"
                        >
                          <Eye size={14} />
                        </a>
                      )}
                      {(canManage || studentMayUpload(d)) && (
                        <label
                          className={`p-2 rounded-lg transition cursor-pointer ${
                            isUploading
                              ? 'text-neutral-400 bg-neutral-50'
                              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                          }`}
                          title={hasFile ? 'Replace file' : 'Upload file'}
                        >
                          {isUploading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Upload size={14} />
                          )}
                          <input
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                            disabled={isUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) onUpload(d.id, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                      {canManage && d.status === 'UPLOADED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove?.(d.id)}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide border bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1"
                          >
                            <Check size={11} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingId(d.id);
                              setRejectNotes('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 transition flex items-center gap-1"
                          >
                            <X size={11} /> Reject
                          </button>
                        </>
                      )}
                      {canManage && d.status !== 'UPLOADED' && (
                        <select
                          value={d.status}
                          onChange={(e) => onStatus(d.id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide border outline-none ${docStatusStyle(d.status)}`}
                        >
                          {DOC_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.toLowerCase()}
                            </option>
                          ))}
                        </select>
                      )}
                      {!canManage && (
                        <span
                          className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-lg border ${docStatusStyle(d.status)}`}
                        >
                          {d.status}
                        </span>
                      )}
                      {canManage && (
                        <button
                          onClick={() => onDelete(d.id)}
                          className="p-2 text-neutral-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Remove from checklist"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  {rejectingId === d.id && (
                    <div className="mt-3 ml-[52px] flex flex-col sm:flex-row gap-2">
                      <input
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="Reason for rejection (optional)"
                        className="ui-field flex-1 text-[12px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitReject(d.id);
                          if (e.key === 'Escape') setRejectingId(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => submitReject(d.id)}
                        className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[12px] font-medium"
                      >
                        Confirm reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="px-3 py-2 border border-neutral-200 rounded-lg text-[12px] font-medium text-neutral-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canManage && (
        <div className="ui-surface px-5 py-4 flex items-center gap-2">
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Add document to checklist (e.g. Passport copy)"
            className="ui-field flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && addName.trim()) {
                onAdd(addName.trim());
                setAddName('');
              }
            }}
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

export const OfferLetterPanel = ({ app, canManage, onSave, onUpload, uploading }) => {
  const [form, setForm] = useState(() => ({
    fileUrl: app.offerLetter?.fileUrl || '',
    filename: app.offerLetter?.filename || '',
    receivedAt: toDateInputValue(app.offerLetter?.receivedAt),
    conditional: app.offerLetter?.conditional || false,
    decisionDeadline: toDateInputValue(app.offerLetter?.decisionDeadline),
    studentDecision: app.offerLetter?.studentDecision || 'PENDING',
    notes: app.offerLetter?.notes || '',
  }));
  useEffect(() => {
    setForm({
      fileUrl: app.offerLetter?.fileUrl || '',
      filename: app.offerLetter?.filename || '',
      receivedAt: toDateInputValue(app.offerLetter?.receivedAt),
      conditional: app.offerLetter?.conditional || false,
      decisionDeadline: toDateInputValue(app.offerLetter?.decisionDeadline),
      studentDecision: app.offerLetter?.studentDecision || 'PENDING',
      notes: app.offerLetter?.notes || '',
    });
  }, [app.id, app.offerLetter]);

  const hasFile = Boolean(form.fileUrl);

  return (
    <div className="ui-surface px-6 py-5 space-y-5">
      <div>
        <h4 className="ui-text-h3">Offer letter</h4>
        <p className="ui-text-meta mt-0.5">Upload the offer document and track the student's decision.</p>
      </div>

      {/* File upload zone */}
      <div
        className={`rounded-xl border-2 border-dashed p-6 transition ${
          hasFile ? 'border-sky-200 bg-sky-50/40' : 'border-neutral-200 bg-neutral-50/40'
        }`}
      >
        {hasFile ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <p className="ui-text-strong truncate">{form.filename || 'Offer letter'}</p>
                {form.receivedAt && (
                  <p className="text-[11px] text-neutral-500">Received {formatDate(form.receivedAt)}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={form.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 ui-text-strong flex items-center gap-1.5 transition"
              >
                <Eye size={13} /> View
              </a>
              <a
                href={form.fileUrl}
                download={form.filename || 'offer-letter'}
                className="px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 ui-text-strong flex items-center gap-1.5 transition"
              >
                <Download size={13} /> Download
              </a>
              {canManage && (
                <label
                  className={`px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white ui-text-strong !text-white flex items-center gap-1.5 cursor-pointer transition ${
                    uploading ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Replace
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        ) : canManage ? (
          <label
            className={`flex flex-col items-center justify-center gap-2 py-4 cursor-pointer ${
              uploading ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {uploading ? (
              <Loader2 size={24} className="text-neutral-400 animate-spin" />
            ) : (
              <Upload size={24} className="text-neutral-400" />
            )}
            <p className="ui-text-strong text-neutral-700">
              {uploading ? 'Uploading to S3…' : 'Click to upload offer letter'}
            </p>
            <p className="ui-text-meta">PDF, JPG, PNG, DOC — max 20 MB</p>
            <input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        ) : (
          <p className="ui-text-meta text-center py-4">No offer letter uploaded yet.</p>
        )}
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
            Save
          </button>
        </div>
      )}
    </div>
  );
};

/* -------------------- Visa application -------------------- */

export const VisaPanel = ({ app, canManage, onSave, onUpload, uploading }) => {
  const visaDoc = app.visaTracking?.documents || {};
  const [form, setForm] = useState(() => ({
    country: app.visaTracking?.country || app.country || '',
    status: app.visaTracking?.status || 'NOT_STARTED',
    appointmentDate: toDateInputValue(app.visaTracking?.appointmentDate),
    decisionDate: toDateInputValue(app.visaTracking?.decisionDate),
    notes: app.visaTracking?.notes || '',
    fileUrl: visaDoc.fileUrl || '',
    filename: visaDoc.filename || '',
  }));

  useEffect(() => {
    const doc = app.visaTracking?.documents || {};
    setForm({
      country: app.visaTracking?.country || app.country || '',
      status: app.visaTracking?.status || 'NOT_STARTED',
      appointmentDate: toDateInputValue(app.visaTracking?.appointmentDate),
      decisionDate: toDateInputValue(app.visaTracking?.decisionDate),
      notes: app.visaTracking?.notes || '',
      fileUrl: doc.fileUrl || '',
      filename: doc.filename || '',
    });
  }, [app.id, app.visaTracking]);

  const hasFile = Boolean(form.fileUrl);

  return (
    <div className="ui-surface px-6 py-5 space-y-5">
      <div>
        <h4 className="ui-text-h3">Visa application</h4>
        <p className="ui-text-meta mt-0.5">
          Upload visa documents and track submission, appointment, and outcome.
        </p>
      </div>

      <div
        className={`rounded-xl border-2 border-dashed p-6 transition ${
          hasFile ? 'border-emerald-200 bg-emerald-50/40' : 'border-neutral-200 bg-neutral-50/40'
        }`}
      >
        {hasFile ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <p className="ui-text-strong truncate">{form.filename || 'Visa document'}</p>
                {visaDoc.uploadedAt && (
                  <p className="text-[11px] text-neutral-500">
                    Uploaded {formatDate(visaDoc.uploadedAt)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={form.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 ui-text-strong flex items-center gap-1.5 transition"
              >
                <Eye size={13} /> View
              </a>
              <a
                href={form.fileUrl}
                download={form.filename || 'visa-document'}
                className="px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 ui-text-strong flex items-center gap-1.5 transition"
              >
                <Download size={13} /> Download
              </a>
              {canManage && onUpload && (
                <label
                  className={`px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white ui-text-strong !text-white flex items-center gap-1.5 cursor-pointer transition ${
                    uploading ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Replace
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        ) : canManage && onUpload ? (
          <label
            className={`flex flex-col items-center justify-center gap-2 py-4 cursor-pointer ${
              uploading ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {uploading ? (
              <Loader2 size={24} className="text-neutral-400 animate-spin" />
            ) : (
              <Upload size={24} className="text-neutral-400" />
            )}
            <p className="ui-text-strong text-neutral-700">
              {uploading ? 'Uploading…' : 'Upload visa document'}
            </p>
            <p className="ui-text-meta">Approval letter, visa stamp, or CAS — PDF, JPG, PNG, DOC</p>
            <input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        ) : (
          <p className="ui-text-meta text-center py-4">No visa document uploaded yet.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Destination country">
          <input
            disabled={!canManage}
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="ui-field"
            placeholder="e.g. United Kingdom"
          />
        </Field>
        <Field label="Application status">
          <select
            disabled={!canManage}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="ui-field ui-select"
          >
            {VISA_STATUSES.map((s) => (
              <option key={s} value={s}>
                {getVisaStatusLabel(s)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Biometrics / appointment">
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
      <Field label="Internal notes">
        <textarea
          disabled={!canManage}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="ui-field"
          placeholder="Counsellor notes on visa progress"
        />
      </Field>
      {canManage && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              onSave({
                country: form.country,
                status: form.status,
                appointmentDate: form.appointmentDate || undefined,
                decisionDate: form.decisionDate || undefined,
                notes: form.notes,
              })
            }
            className="ui-btn-primary px-5"
          >
            Save
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
  const initialCountryId =
    student?.countryId != null
      ? String(student.countryId)
      : countries.find((c) => c.name === student?.preferredCountry)?.id != null
        ? String(countries.find((c) => c.name === student?.preferredCountry).id)
        : '';

  const [form, setForm] = useState({
    country: student?.preferredCountry || '',
    countryId: initialCountryId,
    university: '',
    universityId: '',
    course: student?.preferredCourse || '',
    courseId: '',
    intake: '',
    deadline: '',
    assignedToId: '',
    notes: '',
  });

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
          <div className="col-span-2">
            <CatalogCourseFields
              countries={countries}
              value={form}
              onChange={(catalog) => setForm((prev) => ({ ...prev, ...catalog }))}
            />
          </div>
          <Field label="Intake">
            <input
              value={form.intake}
              onChange={(e) => setForm({ ...form, intake: e.target.value })}
              placeholder="Fall 2026"
              className="ui-field"
            />
          </Field>
        </div>
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
