'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Download, Eye, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { formatDisplayDate, formatStamp } from '../dateFormat';
import { compressUploadFile } from '../compressUpload';

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const STATUS_STYLES = {
  VERIFIED: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  UPLOADED: 'border-sky-100 bg-sky-50 text-sky-700',
  REJECTED: 'border-rose-100 bg-rose-50 text-rose-700',
  PENDING: 'border-amber-100 bg-amber-50 text-amber-700',
};

/**
 * "Gathering Checklists" merged view: template checklist items drive which
 * documents exist, while the table below is backed by real application
 * documents (upload / verify / reject / delete).
 */
export default function GatheringChecklist({
  app,
  stage,
  canManage,
  handlers = {},
  onSaveWorkflowProgress,
  onSaved,
  ownsUnmatched = false,
}) {
  const templateItems = useMemo(() => stage?.checklists || [], [stage?.checklists]);
  const allDocuments = useMemo(() => app?.documents || [], [app?.documents]);

  const docByName = useMemo(() => {
    const map = new Map();
    allDocuments.forEach((doc) => map.set(normalize(doc.name), doc));
    return map;
  }, [allDocuments]);

  /** Only show documents belonging to this stage; the gathering stage also owns ad-hoc uploads. */
  const documents = useMemo(() => {
    const stageNames = new Set(templateItems.map((item) => normalize(item.label)));
    const templateNames = new Set();
    (app?.workflowTemplate?.stages || []).forEach((item) =>
      (item.checklists || []).forEach((entry) => templateNames.add(normalize(entry.label)))
    );
    return allDocuments.filter((doc) => {
      const key = normalize(doc.name);
      if (stageNames.has(key)) return true;
      return ownsUnmatched && !templateNames.has(key);
    });
  }, [allDocuments, templateItems, app?.workflowTemplate?.stages, ownsUnmatched]);

  const [selected, setSelected] = useState({});
  const [saving, setSaving] = useState(false);
  const [addName, setAddName] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [notice, setNotice] = useState('');
  const [uploadingNew, setUploadingNew] = useState(false);

  useEffect(() => {
    const next = {};
    templateItems.forEach((item) => {
      next[item.id] = docByName.has(normalize(item.label));
    });
    setSelected(next);
  }, [templateItems, docByName]);

  const applySelection = async () => {
    if (!canManage || saving) return;
    setSaving(true);
    setNotice('');
    try {
      const blocked = [];
      for (const item of templateItems) {
        const key = normalize(item.label);
        const existing = docByName.get(key);
        const wanted = Boolean(selected[item.id]);

        if (wanted && !existing) {
          await handlers.onAddDoc?.(item.label);
        } else if (!wanted && existing) {
          if (existing.fileUrl) {
            blocked.push(existing.name);
          } else {
            await handlers.onDocDelete?.(existing.id);
          }
        }
      }

      if (onSaveWorkflowProgress) {
        await onSaveWorkflowProgress({
          fieldValues: [],
          checklistValues: templateItems.map((item) => ({
            checklistTemplateId: item.id,
            completed: Boolean(selected[item.id]),
            valueText: null,
          })),
        });
      }

      if (blocked.length) {
        setNotice(`Kept ${blocked.join(', ')} — remove the uploaded file before unchecking.`);
      }
      await onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const addCustom = async () => {
    const name = addName.trim();
    if (!name) return;
    await handlers.onAddDoc?.(name);
    setAddName('');
  };

  const uploadToDoc = async (file, existing, fallbackName) => {
    if (!canManage || !file) return;
    const label = fallbackName || file.name.replace(/\.[^.]+$/, '').trim() || file.name;
    const created = existing?.id ? existing : await handlers.onAddDoc?.(label);
    const doc = created?.id ? created : created?.data;
    if (!doc?.id) {
      setNotice('Could not create the document entry — please try again.');
      return;
    }
    const compressed = await compressUploadFile(file);
    await handlers.onDocUpload?.(doc.id, compressed);
    await onSaved?.();
  };

  const uploadNewDocument = async (file) => {
    if (!canManage || uploadingNew) return;
    setUploadingNew(true);
    setNotice('');
    try {
      const label = file.name.replace(/\.[^.]+$/, '').trim() || file.name;
      const existing = docByName.get(normalize(label));
      await uploadToDoc(file, existing?.fileUrl ? null : existing, label);
    } finally {
      setUploadingNew(false);
    }
  };

  const extraDocuments = documents.filter(
    (doc) => !templateItems.some((item) => normalize(item.label) === normalize(doc.name))
  );
  const tableRows = [
    ...templateItems.map((item) => ({
      key: `tpl-${item.id}`,
      name: item.label,
      doc: docByName.get(normalize(item.label)) || null,
    })),
    ...extraDocuments.map((doc) => ({
      key: `doc-${doc.id}`,
      name: doc.name,
      doc,
    })),
  ];
  const collected = tableRows.filter((row) => ['UPLOADED', 'VERIFIED'].includes(row.doc?.status)).length;

  const submitReject = (docId) => {
    handlers.onDocReject?.(docId, rejectNotes.trim() || undefined);
    setRejectingId(null);
    setRejectNotes('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold text-brand">
            {stage?.metadata?.checklistTitle || `${stage?.label || 'Document'} Checklists`}
          </h4>
          <div className="flex items-center gap-3">
            {canManage && (handlers.missingRequiredCount || 0) > 0 && (
              <button
                type="button"
                onClick={handlers.onNotifyMissing}
                className="flex items-center gap-1 text-[12px] font-medium text-rose-600 hover:text-rose-700"
              >
                <AlertCircle size={12} /> Notify missing ({handlers.missingRequiredCount})
              </button>
            )}
            {canManage && (
              <button
                type="button"
                onClick={applySelection}
                disabled={saving}
                className="shrink-0 rounded-lg bg-brand px-5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-brand-hover disabled:opacity-50"
              >
                {saving ? 'Updating…' : 'Update'}
              </button>
            )}
          </div>
        </div>

        {templateItems.length ? (
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {templateItems.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 accent-brand"
                  checked={Boolean(selected[item.id])}
                  disabled={!canManage || saving}
                  onChange={(e) =>
                    setSelected((prev) => ({ ...prev, [item.id]: e.target.checked }))
                  }
                />
                <span className="truncate">{item.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No checklist items configured for this step.</p>
        )}

        {notice ? (
          <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">{notice}</p>
        ) : null}

        {canManage && (
          <div className="flex gap-2 pt-1">
            <input
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-brand focus:outline-none"
              placeholder="Add another document to the checklist"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!addName.trim()}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
            >
              <Plus size={13} /> Add
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 bg-neutral-50/60 px-4 py-3">
          <div className="min-w-[140px]">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Stage Started Date</p>
            <p className="mt-1 text-sm font-medium text-brand">
              {formatDisplayDate(app?.createdAt)}
            </p>
          </div>
          <div className="min-w-[140px]">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Document collected</p>
            <p className="mt-1 text-sm font-medium text-brand">
              {collected}/{templateItems.length || documents.length}
            </p>
          </div>
          {canManage && (
            <label
              className={`ml-auto inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-brand-hover ${
                uploadingNew ? 'pointer-events-none opacity-60' : ''
              }`}
              title="Upload a document to this application"
            >
              {uploadingNew ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploadingNew ? 'Uploading…' : 'Upload Document'}
              <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                disabled={uploadingNew}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadNewDocument(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>

        {tableRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">No documents in this step yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-[11px] uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-2 font-medium">S.No.</th>
                  <th className="px-4 py-2 font-medium">Document Name</th>
                  <th className="px-4 py-2 font-medium">Date Uploaded</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, index) => {
                  const doc = row.doc;
                  const hasFile = Boolean(doc?.fileUrl);
                  const isUploading = Boolean(doc && handlers.uploadingDocId === doc.id);
                  return (
                    <tr key={row.key} className="border-b border-neutral-100 align-top last:border-0">
                      <td className="px-4 py-3 text-neutral-500">{index + 1}.</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-brand">{row.name}</p>
                        {doc?.filename ? (
                          <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-500">{doc.filename}</p>
                        ) : null}
                        {doc?.status === 'REJECTED' && doc.notes ? (
                          <p className="mt-1 rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-[11px] text-rose-700">
                            Rejection reason: {doc.notes}
                          </p>
                        ) : null}
                        {doc && rejectingId === doc.id ? (
                          <div className="mt-2 flex gap-2">
                            <input
                              autoFocus
                              className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs focus:border-brand focus:outline-none"
                              placeholder="Reason for rejection"
                              value={rejectNotes}
                              onChange={(e) => setRejectNotes(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => submitReject(doc.id)}
                              className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-700"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingId(null)}
                              className="rounded-lg border border-neutral-200 px-2 py-1 text-neutral-500 hover:bg-neutral-50"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{formatStamp(doc?.uploadedAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            STATUS_STYLES[hasFile ? doc.status : 'PENDING'] || STATUS_STYLES.PENDING
                          }`}
                        >
                          {hasFile && doc.status === 'VERIFIED' ? 'Collected' : hasFile ? doc.status : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {hasFile ? (
                            <>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-brand"
                                title="Preview"
                              >
                                <Eye size={14} />
                              </a>
                              <a
                                href={doc.fileUrl}
                                download={doc.filename || undefined}
                                className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                                title="Download"
                              >
                                <Download size={14} />
                              </a>
                            </>
                          ) : null}
                          {canManage ? (
                            <label
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 transition hover:bg-amber-100"
                              title={hasFile ? 'Add or replace file' : 'Add file'}
                            >
                              {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                              Add
                              <input
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                disabled={isUploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadToDoc(file, doc, row.name);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          ) : null}
                          {canManage && hasFile ? (
                            <button
                              type="button"
                              onClick={() =>
                                handlers.onDocClearFile
                                  ? handlers.onDocClearFile(doc.id)
                                  : handlers.onDocDelete?.(doc.id)
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-700 transition hover:bg-rose-100"
                              title="Delete uploaded file"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          ) : null}
                          {canManage && doc?.status === 'UPLOADED' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handlers.onDocApprove?.(doc.id)}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-100"
                              >
                                <Check size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingId(doc.id)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700 transition hover:bg-rose-100"
                              >
                                <X size={11} />
                              </button>
                            </>
                          ) : null}
                          {canManage && doc && !hasFile ? (
                            <button
                              type="button"
                              onClick={() => handlers.onDocDelete?.(doc.id)}
                              className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600"
                              title="Remove this item"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : null}
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
    </div>
  );
}
