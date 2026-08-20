'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, ExternalLink, Eye, Loader2, Plus, Search, Trash2, Upload } from 'lucide-react';
import {
  listStudentUniversities,
  removeStudentUniversity,
  uploadStudentUniversityOfferLetter,
  upsertStudentUniversity,
} from '@/services/studentCrmApi';
import { formatStamp } from '../dateFormat';
import { compressUploadFile } from '../compressUpload';
import RequiredStatusIcon, { isFilledValue } from './RequiredStatusIcon';

export const APPLICATION_STATUS_OPTIONS = [
  'University Shortlisted',
  'Application Submitted',
  'Offer Letter Received',
  'Offer Letter Rejected',
  'On Hold',
  'Deferred',
  'Visa Granted',
  'Visa Refused',
];

/**
 * Shortlist of universities for the application, backed by StudentUniversity
 * records (status, course link and the single "selected" choice).
 */
export default function UniversityApplicationPanel({
  app,
  stage,
  canManage,
  countryId = null,
  universityCatalog = [],
  onUpdateMeta,
  onSaved,
}) {
  const studentId = app?.student?.id || app?.studentId || null;
  const resolvedCountryId = countryId || app?.student?.countryId || app?.student?.country?.id || null;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [pendingIds, setPendingIds] = useState([]);
  const [extraCatalog, setExtraCatalog] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState('');

  const statusOptions = useMemo(() => {
    const field = (stage?.fields || []).find((item) => item.fieldKey === 'application_status');
    const fromTemplate = Array.isArray(field?.optionsJson) ? field.optionsJson.map((o) => String(o?.value ?? o)) : [];
    const extras = ['On Hold', 'Deferred', 'Visa Granted', 'Visa Refused'];
    const base = fromTemplate.length ? fromTemplate : APPLICATION_STATUS_OPTIONS;
    return [...base, ...extras.filter((item) => !base.some((option) => String(option).toLowerCase() === item.toLowerCase()))];
  }, [stage]);

  const requiredByKey = useMemo(() => {
    const map = {};
    (stage?.fields || []).forEach((field) => {
      if (field?.fieldKey) map[field.fieldKey] = Boolean(field.required);
    });
    return map;
  }, [stage]);

  const catalog = useMemo(() => {
    const seen = new Set();
    return [...(universityCatalog || []), ...extraCatalog].filter((item) => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [universityCatalog, extraCatalog]);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await listStudentUniversities(studentId);
      const items = res?.data || res || [];
      setRows(Array.isArray(items) ? items : []);
      setError('');
    } catch (e) {
      setError(e?.message || 'Could not load universities');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        rows.map((row) => [row.universityId, { status: row.status || '', courseLink: row.courseLink || '' }])
      )
    );
  }, [rows]);

  const usedIds = useMemo(() => new Set(rows.map((row) => row.universityId)), [rows]);
  const available = catalog.filter((item) => !usedIds.has(item.id));
  const offersReceived = rows.filter((row) => Boolean(row.offerLetterFileUrl)).length;

  const trimmedQuery = query.trim();
  const matches = useMemo(() => {
    const needle = trimmedQuery.toLowerCase();
    if (!needle) return available.slice(0, 8);
    return available.filter((item) => String(item.name || '').toLowerCase().includes(needle)).slice(0, 8);
  }, [available, trimmedQuery]);

  const exactMatch = useMemo(
    () =>
      available.find((item) => String(item.name || '').toLowerCase() === trimmedQuery.toLowerCase()) || null,
    [available, trimmedQuery]
  );
  const alreadyAddedExact = useMemo(
    () =>
      rows.some(
        (row) => String(row.university?.name || '').toLowerCase() === trimmedQuery.toLowerCase()
      ),
    [rows, trimmedQuery]
  );
  const canAddCustom = Boolean(trimmedQuery && !exactMatch && !alreadyAddedExact && matches.length === 0);

  const save = async (universityId, payload) => {
    if (!canManage || !studentId) return;
    setBusyId(universityId);
    try {
      await upsertStudentUniversity(studentId, { universityId, ...payload });
      await load();
      setError('');
    } catch (e) {
      setError(e?.message || 'Could not save');
    } finally {
      setBusyId(null);
    }
  };

  const addUniversities = async ({ ids = [], names = [] } = {}) => {
    if (!canManage || !studentId) return;
    const universityIds = [...new Set(ids.map((id) => Number(id)).filter(Boolean))];
    const uniqueNames = [...new Set(names.map((name) => String(name || '').trim()).filter(Boolean))];
    if (!universityIds.length && !uniqueNames.length) return;
    if (uniqueNames.length && !resolvedCountryId) {
      setError('Set a destination country before adding a university that is not in the catalog.');
      return;
    }
    setAdding(true);
    try {
      const res = await upsertStudentUniversity(studentId, {
        universityIds,
        names: uniqueNames,
        countryId: resolvedCountryId ? Number(resolvedCountryId) : undefined,
        status: statusOptions[0],
      });
      const added = Array.isArray(res?.data) ? res.data : res?.data ? [res.data] : [];
      setExtraCatalog((prev) => {
        const next = [...prev];
        added.forEach((row) => {
          if (row?.university?.id && !next.some((item) => item.id === row.university.id)) {
            next.push({ id: row.university.id, name: row.university.name });
          }
        });
        return next;
      });
      setQuery('');
      setPendingIds([]);
      await load();
      setError('');
    } catch (e) {
      setError(e?.message || 'Could not add universities');
    } finally {
      setAdding(false);
    }
  };

  const addFromForm = async () => {
    const names = canAddCustom ? [trimmedQuery] : [];
    const ids = pendingIds.filter((id) => !usedIds.has(id));
    if (exactMatch && !ids.includes(exactMatch.id)) ids.push(exactMatch.id);
    await addUniversities({ ids, names });
  };

  const togglePending = (universityId) => {
    setPendingIds((prev) =>
      prev.includes(universityId) ? prev.filter((id) => id !== universityId) : [...prev, universityId]
    );
  };

  const uploadOffer = async (row, file) => {
    if (!canManage || !studentId || !file) return;
    setBusyId(row.universityId);
    try {
      const compressed = await compressUploadFile(file);
      await uploadStudentUniversityOfferLetter(studentId, row.universityId, compressed, app?.id);
      await load();
      await onSaved?.();
      setError('');
    } catch (e) {
      setError(e?.message || 'Could not upload offer letter');
    } finally {
      setBusyId(null);
    }
  };

  const selectUniversity = async (row) => {
    if (!canManage || !studentId) return;
    setBusyId(row.universityId);
    try {
      for (const other of rows) {
        if (other.isSelected && other.universityId !== row.universityId) {
          await upsertStudentUniversity(studentId, { universityId: other.universityId, isSelected: false });
        }
      }
      await upsertStudentUniversity(studentId, { universityId: row.universityId, isSelected: true });
      const name = row.university?.name;
      const countryName = row.university?.country?.name;
      const meta = {};
      if (name && name !== app?.university) meta.university = name;
      if (
        countryName &&
        String(countryName).toLowerCase() !== String(app?.country || '').toLowerCase()
      ) {
        meta.country = countryName;
      }
      if (Object.keys(meta).length) await onUpdateMeta?.(meta);
      await load();
      await onSaved?.();
    } catch (e) {
      setError(e?.message || 'Could not select university');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row) => {
    if (!canManage || !studentId) return;
    setBusyId(row.universityId);
    try {
      await removeStudentUniversity(studentId, row.universityId);
      await load();
    } catch (e) {
      setError(e?.message || 'Could not remove university');
    } finally {
      setBusyId(null);
    }
  };

  const linkClass = 'text-[12px] font-medium text-amber-600 hover:text-amber-700 disabled:opacity-40';
  const pendingCount = useMemo(() => {
    const ids = new Set(pendingIds);
    if (exactMatch) ids.add(exactMatch.id);
    return ids.size + (canAddCustom ? 1 : 0);
  }, [pendingIds, exactMatch, canAddCustom]);
  const addDisabled = !canManage || adding || busyId !== null || pendingCount === 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1 space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              Add universities
            </label>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-brand focus:outline-none"
                placeholder={studentId ? 'Search catalog or type a new university name' : 'Link a student first'}
                value={query}
                disabled={!canManage || !studentId}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFromForm();
                  }
                }}
              />
            </div>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={addFromForm}
              disabled={addDisabled}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-hover disabled:opacity-40"
            >
              {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {pendingCount > 1 ? `Add ${pendingCount} universities` : 'Add university'}
            </button>
          )}
        </div>

        {canManage && studentId ? (
          <div className="mt-3 space-y-2">
            {matches.length ? (
              <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
                {matches.map((item) => {
                  const checked = pendingIds.includes(item.id);
                  return (
                    <li key={item.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand"
                          checked={checked}
                          onChange={() => togglePending(item.id)}
                        />
                        <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : trimmedQuery ? (
              <p className="text-xs text-neutral-500">No catalog match for “{trimmedQuery}”.</p>
            ) : available.length ? (
              <p className="text-xs text-neutral-500">Tick one or more universities, or type a new name and add it.</p>
            ) : (
              <p className="text-xs text-neutral-500">
                Catalog is empty for this country. Type a university name and add it.
              </p>
            )}
            {canAddCustom ? (
              <p className="text-xs text-brand">
                “{trimmedQuery}” will be created and added to this application.
              </p>
            ) : alreadyAddedExact ? (
              <p className="text-xs text-neutral-500">“{trimmedQuery}” is already on this shortlist.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 bg-neutral-50/60 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Received Offer Letters</p>
          <p className="mt-1 text-sm font-medium text-brand">
            {offersReceived}/{rows.length}
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            {offersReceived === 0
              ? 'Upload an offer letter on a university to update this count.'
              : `${offersReceived} of ${rows.length} universities have an offer letter on file.`}
          </p>
        </div>

        {loading ? (
          <p className="flex items-center justify-center gap-2 p-8 text-sm text-neutral-500">
            <Loader2 size={14} className="animate-spin" /> Loading universities…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">
            No universities shortlisted yet. Search or tick universities above, then add them.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-[11px] uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-2 font-medium">S.No.</th>
                  <th className="px-4 py-2 font-medium">Selected University</th>
                  <th className="px-4 py-2 font-medium">Application Status</th>
                  <th className="px-4 py-2 font-medium">Last Updated Status</th>
                  <th className="px-4 py-2 font-medium">Course link</th>
                  <th className="px-4 py-2 font-medium">Offer letter</th>
                  <th className="px-4 py-2 font-medium">Selection of University</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const draft = drafts[row.universityId] || {};
                  const busy = busyId === row.universityId;
                  const statusDirty = (draft.status || '') !== (row.status || '');
                  const linkDirty = (draft.courseLink || '') !== (row.courseLink || '');
                  return (
                    <tr key={row.universityId} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3 text-neutral-500">{index + 1}.</td>
                      <td className="px-4 py-3 font-medium text-brand">
                        <span className="inline-flex items-center gap-1.5">
                          {requiredByKey.select_university ? (
                            <RequiredStatusIcon submitted={isFilledValue(row.university?.name)} />
                          ) : null}
                          {row.university?.name || `#${row.universityId}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {requiredByKey.application_status ? (
                            <RequiredStatusIcon submitted={isFilledValue(draft.status || row.status)} />
                          ) : null}
                          <select
                            className="w-40 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 focus:border-brand focus:outline-none"
                            value={draft.status || ''}
                            disabled={!canManage || busy}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [row.universityId]: { ...(prev[row.universityId] || {}), status: e.target.value },
                              }))
                            }
                          >
                            <option value="">Select status</option>
                            {statusOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {canManage && (
                            <button
                              type="button"
                              className={linkClass}
                              disabled={busy || !statusDirty}
                              onClick={() => save(row.universityId, { status: draft.status })}
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-neutral-700">{row.status || '--'}</p>
                        <p className="text-[11px] text-neutral-400">{formatStamp(row.updatedAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {requiredByKey.course_link ? (
                            <RequiredStatusIcon submitted={isFilledValue(draft.courseLink || row.courseLink)} />
                          ) : null}
                          <input
                            className="w-36 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-brand focus:outline-none"
                            placeholder="Link..."
                            value={draft.courseLink || ''}
                            disabled={!canManage || busy}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [row.universityId]: { ...(prev[row.universityId] || {}), courseLink: e.target.value },
                              }))
                            }
                          />
                          {canManage && (
                            <button
                              type="button"
                              className={linkClass}
                              disabled={busy || !linkDirty}
                              onClick={() => save(row.universityId, { courseLink: draft.courseLink })}
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {requiredByKey.received_offer_letters ? (
                            <RequiredStatusIcon submitted={Boolean(row.offerLetterFileUrl)} />
                          ) : null}
                          <div className="min-w-0">
                        {row.offerLetterFileUrl ? (
                          <div className="space-y-1.5">
                            <p className="max-w-[160px] truncate font-mono text-[11px] text-neutral-500" title={row.offerLetterFilename || ''}>
                              {row.offerLetterFilename || 'Offer letter'}
                            </p>
                            <p className="text-[11px] text-neutral-400">{formatStamp(row.offerLetterReceivedAt)}</p>
                            <div className="flex flex-wrap items-center gap-1">
                              <a
                                href={row.offerLetterFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition hover:bg-neutral-100 hover:text-brand"
                                title="View offer letter"
                                aria-label="View offer letter"
                              >
                                <Eye size={15} />
                              </a>
                              <a
                                href={row.offerLetterFileUrl}
                                download={row.offerLetterFilename || undefined}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition hover:bg-neutral-100 hover:text-brand"
                                title="Download offer letter"
                                aria-label="Download offer letter"
                              >
                                <Download size={15} />
                              </a>
                              {canManage ? (
                                <label
                                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-neutral-600 transition hover:bg-neutral-100 hover:text-brand"
                                  title="Replace offer letter"
                                  aria-label="Replace offer letter"
                                >
                                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                    disabled={busy}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) uploadOffer(row, file);
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                              ) : null}
                            </div>
                          </div>
                        ) : canManage ? (
                          <label
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-neutral-600 transition hover:bg-neutral-100 hover:text-brand"
                            title="Upload offer letter"
                            aria-label="Upload offer letter"
                          >
                            {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                            <input
                              type="file"
                              className="hidden"
                              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                              disabled={busy}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadOffer(row, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        ) : (
                          <span className="text-[11px] text-neutral-400">No file</span>
                        )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {row.isSelected ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 size={12} /> Selected
                          </span>
                        ) : canManage ? (
                          <button
                            type="button"
                            onClick={() => selectUniversity(row)}
                            disabled={busy}
                            className="rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition hover:border-brand hover:text-brand disabled:opacity-40"
                          >
                            Mark selected
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-400">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {row.courseLink ? (
                            <a
                              href={row.courseLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition hover:bg-neutral-100 hover:text-brand"
                              title="Open course link"
                              aria-label="Open course link"
                            >
                              <ExternalLink size={15} />
                            </a>
                          ) : null}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => remove(row)}
                              disabled={busy}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                              title="Delete"
                              aria-label="Remove university"
                            >
                              {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
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
    </div>
  );
}
