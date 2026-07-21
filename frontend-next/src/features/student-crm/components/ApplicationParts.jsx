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

const normalizeVisaDocs = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((d) => d?.fileUrl);
  if (raw.fileUrl) return [raw];
  return [];
};

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
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/40 backdrop-blur-md animate-in fade-in duration-200">
    <div className="ui-surface w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
      <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="ui-text-h3">{title}</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-brand flex items-center justify-center transition-all"
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
      className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl ui-text-strong !text-white transition-all"
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
              className="flex items-center gap-1.5 text-neutral-700 hover:text-brand font-medium"
            >
              <ExternalLink size={12} /> Student profile
            </Link>
          )}
        </div>
      </div>
      {canManage && !isFinal && (
        <button
          onClick={onAdvance}
          className="shrink-0 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl ui-text-strong !text-white flex items-center gap-1.5 transition-all"
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
        className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl ui-text-strong !text-white shrink-0 transition-all"
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
            {onJump
              ? 'Application stage drives progress. Jump only when docs/fees allow (backend enforces gates).'
              : 'Read-only view of application stage progress.'}
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
                      ? 'bg-brand text-white ring-4 ring-neutral-100'
                      : isPassed
                      ? 'bg-brand text-white'
                      : 'bg-white border border-neutral-200 text-neutral-400'
                  } ${onJump ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={s.label}
                >
                  {isPassed ? <Check size={12} strokeWidth={3} /> : s.order}
                </button>
                <span
                  className={`mt-2 text-[11px] font-medium text-center leading-tight tracking-tight px-0.5 ${
                    isActive ? 'text-brand' : isPassed ? 'text-neutral-700' : 'text-neutral-400'
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
  const [dragOverDocId, setDragOverDocId] = useState(null);
  const canUpload = canUploadProp ?? canManage;
  const docs = app.documents || [];
  const required = docs.filter((d) => d.required);
  const done = required.filter((d) => ['UPLOADED', 'VERIFIED'].includes(d.status)).length;
  const rejected = docs.filter((d) => d.status === 'REJECTED').length;
  const missing = required.filter((d) => d.status === 'PENDING');
  const pct = required.length ? Math.round((done / required.length) * 100) : 0;

  const studentMayUpload = (d) => canUpload && ['PENDING', 'REJECTED'].includes(d.status);

  const acceptDroppedFile = (docId, event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverDocId(null);
    const file = event.dataTransfer?.files?.[0];
    if (file) onUpload?.(docId, file);
  };

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
              {rejected > 0 ? ` · ${rejected} rejected` : ''}
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
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        {!canManage && (missing.length > 0 || rejected > 0) && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-900">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <p>
              {rejected > 0
                ? `${rejected} document${rejected === 1 ? '' : 's'} need re-upload after counsellor review.`
                : `${missing.length} required document${missing.length === 1 ? '' : 's'} still missing.`}
              {' '}Drag and drop a file onto a row, or use the upload button.
            </p>
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
              const droppable = studentMayUpload(d) && !isUploading;
              const isDragOver = dragOverDocId === d.id;
              return (
                <div
                  key={d.id}
                  className={`px-5 py-4 transition ${
                    isDragOver
                      ? 'bg-brand-soft/80 ring-2 ring-inset ring-brand/30'
                      : 'hover:bg-neutral-50/50'
                  }`}
                  onDragOver={(e) => {
                    if (!droppable) return;
                    e.preventDefault();
                    setDragOverDocId(d.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverDocId === d.id) setDragOverDocId(null);
                  }}
                  onDrop={(e) => {
                    if (!droppable) return;
                    acceptDroppedFile(d.id, e);
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Icon + name */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
                          hasFile ? 'bg-sky-50 border-sky-100 text-sky-600' : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                        }`}
                      >
                        {isUploading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : hasFile ? (
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
                          {isDragOver && (
                            <span className="text-[10px] font-semibold uppercase text-brand">Drop to upload</span>
                          )}
                        </div>
                        {d.filename ? (
                          <p className="text-[11px] text-neutral-500 mt-0.5 truncate font-mono">{d.filename}</p>
                        ) : (
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {droppable ? 'No file — click upload or drag & drop' : 'No file uploaded'}
                          </p>
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
                        <>
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-neutral-500 hover:text-brand hover:bg-neutral-100 rounded-lg transition"
                            title="Preview"
                          >
                            <Eye size={14} />
                          </a>
                          <a
                            href={d.fileUrl}
                            download={d.filename || undefined}
                            className="p-2 text-neutral-500 hover:text-brand hover:bg-neutral-100 rounded-lg transition"
                            title="Download"
                          >
                            <Download size={14} />
                          </a>
                        </>
                      )}
                      {(canManage || studentMayUpload(d)) && (
                        <label
                          className={`p-2 rounded-lg transition cursor-pointer ${
                            isUploading
                              ? 'text-neutral-400 bg-neutral-50'
                              : 'text-neutral-500 hover:text-brand hover:bg-neutral-100'
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
            className="shrink-0 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl ui-text-strong !text-white flex items-center gap-1 transition-all"
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
                  className={`px-3 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white ui-text-strong !text-white flex items-center gap-1.5 cursor-pointer transition ${
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
            className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl ui-text-strong !text-white transition-all"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

/* -------------------- Visa application -------------------- */

export const VisaPanel = ({
  app,
  canManage,
  onSave,
  onUpload,
  onChecklistUpload,
  onAddDoc,
  onDocStatus,
  onDeleteDoc,
  uploading,
  uploadingDocId,
  workflow = [],
}) => {
  const checklistDocs = app.visaTracking?.visaDocuments || [];
  const legacyDocs = normalizeVisaDocs(app.visaTracking?.documents);
  const [uploadLabel, setUploadLabel] = useState('');
  const [addName, setAddName] = useState('');
  const [form, setForm] = useState(() => ({
    country: app.visaTracking?.country || app.country || '',
    status: app.visaTracking?.status || 'NOT_STARTED',
    appointmentDate: toDateInputValue(app.visaTracking?.appointmentDate),
    decisionDate: toDateInputValue(app.visaTracking?.decisionDate),
    notes: app.visaTracking?.notes || '',
  }));

  useEffect(() => {
    setForm({
      country: app.visaTracking?.country || app.country || '',
      status: app.visaTracking?.status || 'NOT_STARTED',
      appointmentDate: toDateInputValue(app.visaTracking?.appointmentDate),
      decisionDate: toDateInputValue(app.visaTracking?.decisionDate),
      notes: app.visaTracking?.notes || '',
    });
  }, [app.id, app.visaTracking]);

  const statusIdx = workflow.findIndex((s) => s.suggestedStatus === form.status);
  const required = checklistDocs.filter((d) => d.required);
  const done = required.filter((d) => ['UPLOADED', 'VERIFIED'].includes(d.status)).length;
  const pct = required.length ? Math.round((done / required.length) * 100) : 0;

  return (
    <div className="ui-surface px-6 py-5 space-y-5">
      <div>
        <h4 className="ui-text-h3">Visa application</h4>
        <p className="ui-text-meta mt-0.5">
          Country workflow, document checklist, and status tracking.
        </p>
      </div>

      {workflow.length > 0 && (
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {workflow.map((step, idx) => (
            <li
              key={step.key}
              className={`rounded-lg border px-3 py-2 text-xs ${
                statusIdx >= idx
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-600'
              }`}
            >
              <span className="font-medium">
                {idx + 1}. {step.label}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="ui-text-strong">Visa documents</p>
            <p className="ui-text-meta">
              {checklistDocs.length} checklist items
              {required.length > 0 ? ` · ${done}/${required.length} required uploaded` : ''}
            </p>
          </div>
          {required.length > 0 && (
            <span className="text-xs font-semibold text-neutral-600">{pct}%</span>
          )}
        </div>

        {checklistDocs.length > 0 ? (
          <ul className="space-y-2">
            {checklistDocs.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-neutral-100"
              >
                <div className="min-w-0">
                  <p className="ui-text-strong truncate">
                    {doc.name}
                    {doc.required ? (
                      <span className="text-rose-500 ml-1">*</span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {doc.status}
                    {doc.filename ? ` · ${doc.filename}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs border rounded-lg"
                    >
                      View
                    </a>
                  )}
                  {canManage && onChecklistUpload && ['PENDING', 'REJECTED', 'UPLOADED'].includes(doc.status) && (
                    <label
                      className={`px-2 py-1 text-xs border rounded-lg cursor-pointer bg-brand text-white ${
                        uploadingDocId === doc.id ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      {uploadingDocId === doc.id ? 'Uploading…' : 'Upload'}
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onChecklistUpload(doc.id, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                  {canManage && onDocStatus && doc.status === 'UPLOADED' && (
                    <button
                      type="button"
                      onClick={() => onDocStatus(doc.id, 'VERIFIED')}
                      className="px-2 py-1 text-xs border border-emerald-200 text-emerald-700 rounded-lg"
                    >
                      Verify
                    </button>
                  )}
                  {canManage && onDocStatus && ['UPLOADED', 'VERIFIED'].includes(doc.status) && (
                    <button
                      type="button"
                      onClick={() => onDocStatus(doc.id, 'REJECTED')}
                      className="px-2 py-1 text-xs border border-rose-200 text-rose-700 rounded-lg"
                    >
                      Reject
                    </button>
                  )}
                  {canManage && onDeleteDoc && (
                    <button
                      type="button"
                      onClick={() => onDeleteDoc(doc.id)}
                      className="p-1 text-rose-600"
                      title="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : legacyDocs.length > 0 ? (
          <ul className="space-y-2">
            {legacyDocs.map((doc, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-neutral-100"
              >
                <p className="ui-text-strong truncate">
                  {doc.label || doc.filename || `Document ${i + 1}`}
                </p>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs border rounded-lg">
                  View
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ui-text-meta text-center py-2">
            Save visa details to seed the country checklist, or add a custom document.
          </p>
        )}

        {canManage && (
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end pt-2 border-t border-neutral-200">
            {onAddDoc && (
              <div className="flex flex-1 gap-2">
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="ui-field flex-1"
                  placeholder="Add checklist item name"
                />
                <button
                  type="button"
                  className="px-3 py-2 text-xs border rounded-lg"
                  onClick={() => {
                    if (!addName.trim()) return;
                    onAddDoc(addName.trim());
                    setAddName('');
                  }}
                >
                  Add item
                </button>
              </div>
            )}
            {onUpload && (
              <>
                <Field label="Custom upload label" className="flex-1">
                  <input
                    value={uploadLabel}
                    onChange={(e) => setUploadLabel(e.target.value)}
                    className="ui-field"
                    placeholder="e.g. Extra affidavit"
                  />
                </Field>
                <label
                  className={`px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white ui-text-strong !text-white flex items-center justify-center gap-1.5 cursor-pointer transition ${
                    uploading ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Extra file
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUpload(file, uploadLabel || undefined);
                      e.target.value = '';
                    }}
                  />
                </label>
              </>
            )}
          </div>
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

/* -------------------- Application tasks -------------------- */

const TASK_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const ApplicationTasksPanel = ({
  app,
  canManage,
  counsellors = [],
  onCreate,
  onUpdate,
  onDelete,
  busy,
}) => {
  const tasks = app.tasks || [];
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedToId: app.assignedToId || '',
    dueDate: '',
  });

  const openTasks = tasks.filter((t) => !['COMPLETED', 'CANCELLED'].includes(t.status));
  const overdue = openTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());

  return (
    <div className="space-y-4">
      <div className="ui-surface px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="ui-text-h3">Tasks & reminders</h4>
            <p className="ui-text-meta mt-0.5">
              {openTasks.length} open · {overdue.length} overdue · {tasks.length} total
            </p>
          </div>
        </div>
      </div>

      {canManage && (
        <div className="ui-surface px-6 py-5 space-y-3">
          <p className="ui-text-strong">Create task</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="ui-field"
                placeholder="e.g. Follow up on SOP"
              />
            </Field>
            <Field label="Due date">
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="ui-field"
              />
            </Field>
            <Field label="Assignee">
              <select
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                className="ui-field ui-select"
              >
                <option value="">Unassigned</option>
                {counsellors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || c.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="ui-field"
                placeholder="Optional details"
              />
            </Field>
          </div>
          <button
            type="button"
            disabled={!form.title.trim() || busy}
            onClick={() => {
              onCreate?.({
                title: form.title.trim(),
                description: form.description || undefined,
                assignedToId: form.assignedToId ? Number(form.assignedToId) : null,
                dueDate: form.dueDate || null,
              });
              setForm({
                title: '',
                description: '',
                assignedToId: app.assignedToId || '',
                dueDate: '',
              });
            }}
            className="ui-btn-primary px-4 disabled:opacity-40"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add task
          </button>
        </div>
      )}

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="ui-surface p-10 text-center ui-text-meta">No tasks yet.</div>
        ) : (
          tasks.map((task) => {
            const isOverdue =
              task.dueDate &&
              !['COMPLETED', 'CANCELLED'].includes(task.status) &&
              new Date(task.dueDate) < new Date();
            return (
              <div
                key={task.id}
                className={`ui-surface px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3 ${
                  isOverdue ? 'border-rose-200' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="ui-text-strong truncate">{task.title}</p>
                  <p className="ui-text-meta mt-0.5">
                    {task.assignedTo?.fullName || 'Unassigned'}
                    {task.dueDate ? ` · due ${formatDate(task.dueDate)}` : ''}
                    {isOverdue ? ' · overdue' : ''}
                  </p>
                  {task.description && (
                    <p className="text-xs text-neutral-500 mt-1">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canManage ? (
                    <select
                      value={task.status}
                      onChange={(e) => onUpdate?.(task.id, { status: e.target.value })}
                      className="ui-field ui-select text-xs py-1.5"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-medium text-neutral-600">{task.status}</span>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => onDelete?.(task.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* -------------------- Student portal: offer decision -------------------- */

export const StudentOfferPanel = ({ app, onAccept, onReject, busy }) => {
  const offer = app.offerLetter;
  if (!offer?.fileUrl) return null;

  const decided = offer.studentDecision && offer.studentDecision !== 'PENDING';

  return (
    <div className="ui-panel p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-brand">Offer letter</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Review your offer and accept or decline before the deadline.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={offer.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50"
        >
          <FileText size={14} /> View offer letter
        </a>
        {offer.decisionDeadline && (
          <span className="text-xs text-neutral-500">
            Decision by {formatDate(offer.decisionDeadline)}
          </span>
        )}
        {offer.conditional && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Conditional</span>
        )}
      </div>
      {decided ? (
        <p className="text-sm font-medium text-neutral-800">
          You {offer.studentDecision === 'ACCEPTED' ? 'accepted' : 'declined'} this offer
          {offer.decisionAt ? ` on ${formatDate(offer.decisionAt)}` : ''}.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            className="ui-btn-primary"
          >
            Accept offer
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="ui-btn-secondary"
          >
            Decline offer
          </button>
        </div>
      )}
    </div>
  );
};

/* -------------------- Student portal: visa status -------------------- */

export const StudentVisaPanel = ({ app, workflow = [], canUpload = false, onUpload, uploadingDocId }) => {
  const visa = app.visaTracking;
  if (!visa && !['VISA_PROCESS', 'OFFER_ACCEPTED', 'ENROLLED'].includes(app.stage)) return null;

  const checklistDocs = visa?.visaDocuments || [];
  const legacyDocs = normalizeVisaDocs(visa?.documents);
  const docs =
    checklistDocs.length > 0
      ? checklistDocs.map((d) => ({
          id: d.id,
          label: d.name,
          filename: d.filename,
          fileUrl: d.fileUrl,
          status: d.status,
          required: d.required,
        }))
      : legacyDocs;
  const statusIdx = workflow.findIndex((s) => s.suggestedStatus === visa?.status);
  const progressPct =
    workflow.length > 0
      ? Math.round(((Math.max(statusIdx, 0) + (statusIdx >= 0 ? 1 : 0)) / workflow.length) * 100)
      : visa?.status === 'APPROVED'
        ? 100
        : visa?.status && visa.status !== 'NOT_STARTED'
          ? 40
          : 0;

  const upcoming = [];
  if (visa?.appointmentDate) {
    const when = new Date(visa.appointmentDate);
    upcoming.push({
      label: when < new Date() ? 'Biometrics / visa appointment (past)' : 'Upcoming biometrics / visa appointment',
      detail: formatDate(visa.appointmentDate),
      overdue: when < new Date() && !['APPROVED', 'REJECTED'].includes(visa?.status),
    });
  }
  if (visa?.decisionDate) {
    upcoming.push({
      label: 'Visa decision',
      detail: formatDate(visa.decisionDate),
      overdue: false,
    });
  }

  const missing = checklistDocs.filter(
    (d) => d.required && ['PENDING', 'REJECTED'].includes(d.status),
  );

  return (
    <div className="ui-panel p-5 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-brand">Visa status</h2>
          <p className="text-xs text-neutral-500 mt-1">
            {visa?.country || app.country} — {getVisaStatusLabel(visa?.status || 'NOT_STARTED')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-brand">{progressPct}%</p>
          <p className="text-[11px] text-neutral-400">Visa progress</p>
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      {workflow.length > 0 && (
        <ol className="relative space-y-0 border-l border-neutral-200 ml-2 pl-5">
          {workflow.map((step, idx) => {
            const done = statusIdx >= idx;
            const active = statusIdx === idx;
            return (
              <li key={step.key} className="relative pb-4 last:pb-0">
                <span
                  className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white ${
                    done ? 'bg-emerald-500' : active ? 'bg-brand' : 'bg-neutral-300'
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    done ? 'text-emerald-800' : active ? 'text-brand' : 'text-neutral-500'
                  }`}
                >
                  {idx + 1}. {step.label}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-[11px] text-neutral-400">{step.description}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
            Upcoming visa tasks
          </p>
          <ul className="space-y-2">
            {upcoming.map((item, i) => (
              <li
                key={i}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                  item.overdue ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <span className="font-medium">{item.label}</span>
                <span className="text-xs text-neutral-500 shrink-0">{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {visa?.notes && (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          {visa.notes}
        </p>
      )}

      {canUpload && missing.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-900">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <p>{missing.length} required visa document{missing.length === 1 ? '' : 's'} still needed.</p>
        </div>
      )}

      {docs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
            Visa documents
          </p>
          <ul className="space-y-2">
            {docs.map((doc, i) => (
              <li
                key={doc.id || i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {doc.label || doc.filename || `Document ${i + 1}`}
                    {doc.required ? <span className="text-rose-500 ml-1">*</span> : null}
                  </p>
                  {doc.status && (
                    <p className="text-[11px] text-neutral-500 mt-0.5">{doc.status}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-neutral-700 hover:text-brand underline"
                    >
                      View
                    </a>
                  )}
                  {canUpload &&
                    doc.id &&
                    onUpload &&
                    ['PENDING', 'REJECTED'].includes(doc.status) && (
                      <label
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand text-white cursor-pointer ${
                          uploadingDocId === doc.id ? 'opacity-60 pointer-events-none' : ''
                        }`}
                      >
                        {uploadingDocId === doc.id ? 'Uploading…' : 'Upload'}
                        <input
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUpload(doc.id, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                </div>
              </li>
            ))}
          </ul>
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
          <span className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-brand border-2 border-white" />
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
