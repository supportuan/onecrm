'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, Download, Loader2, RotateCcw, Search, Trash2, UserX } from 'lucide-react';
import {
  downloadStudentExport,
  listArchivedStudents,
  permanentlyDeleteStudent,
  restoreStudent,
} from '@/services/studentCrmApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';

export default function ArchiveStudents() {
  const { can } = usePermissions();
  const canManage = can('MANAGE_STUDENT_CRM');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listArchivedStudents({ limit: 100 });
      if (!res?.success && res?.message) {
        setError(res.message);
        setStudents([]);
        return;
      }
      const items = res?.data?.items || res?.data || [];
      setStudents(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.message || 'Failed to load archived students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const hay = [s.fullName, s.email, s.phone, s.country?.name, s.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [students, search]);

  const handleDownload = async (student) => {
    setBusyId(`dl-${student.id}`);
    try {
      await downloadStudentExport(student.id, student.fullName || student.email || `student_${student.id}`);
    } catch (err) {
      alert(err?.message || 'Failed to download student data');
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm('Restore this student to Student Information?')) return;
    setBusyId(`restore-${id}`);
    try {
      const res = await restoreStudent(id);
      if (!res?.success) {
        alert(res?.message || 'Failed to restore student');
        return;
      }
      await load();
    } catch (err) {
      alert(err?.message || 'Failed to restore student');
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentDelete = async (student) => {
    const name = student.fullName || student.email || `#${student.id}`;
    if (
      !window.confirm(
        `Permanently delete ${name}?\n\nThis cannot be undone. Applications and uploaded files will be removed.\n\nTip: download their data first.`,
      )
    ) {
      return;
    }
    if (!window.confirm('Final confirmation: permanently delete this archived student?')) return;

    setBusyId(`purge-${student.id}`);
    try {
      const res = await permanentlyDeleteStudent(student.id);
      if (!res?.success) {
        alert(res?.message || 'Failed to permanently delete student');
        return;
      }
      await load();
    } catch (err) {
      alert(err?.message || 'Failed to permanently delete student');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="ui-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--ui-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Archive className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <p className="ui-text-h3">Deleted students</p>
            <p className="ui-text-meta">
              {loading
                ? 'Loading…'
                : `${filtered.length} archived student${filtered.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-muted)]" />
          <input
            className="ui-input pl-9"
            placeholder="Search archived students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--ui-text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ui-text-body">Loading archived students…</span>
        </div>
      ) : error ? (
        <div className="px-5 py-12 text-center">
          <p className="ui-text-body text-red-600">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <UserX className="mb-3 h-10 w-10 text-[var(--ui-text-muted)] opacity-50" strokeWidth={1.5} />
          <p className="ui-text-strong">No archived students</p>
          <p className="ui-text-meta mt-1">
            Use Download &amp; archive on Student Information to move profiles here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-control)]/50">
                <th className="ui-text-meta px-5 py-3 font-semibold">Name</th>
                <th className="ui-text-meta px-5 py-3 font-semibold">Email</th>
                <th className="ui-text-meta px-5 py-3 font-semibold">Country</th>
                <th className="ui-text-meta px-5 py-3 font-semibold">Apps</th>
                <th className="ui-text-meta px-5 py-3 font-semibold">Deleted</th>
                <th className="ui-text-meta px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => {
                const busy = busyId != null && String(busyId).includes(String(student.id));
                return (
                  <tr
                    key={student.id}
                    className="border-b border-[var(--ui-border)] last:border-0 hover:bg-brand-soft/60"
                  >
                    <td className="ui-text-strong px-5 py-3">{student.fullName || '—'}</td>
                    <td className="ui-text-body px-5 py-3">{student.email || '—'}</td>
                    <td className="ui-text-body px-5 py-3">{student.country?.name || '—'}</td>
                    <td className="ui-text-body px-5 py-3">{student.applications?.length ?? 0}</td>
                    <td className="ui-text-meta px-5 py-3">
                      {student.deletedAt ? new Date(student.deletedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDownload(student)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ui-border)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--ui-text)] transition hover:bg-[var(--ui-bg-control)] disabled:opacity-50"
                        >
                          {busyId === `dl-${student.id}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                          )}
                          Download
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRestore(student.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ui-border)] px-2.5 py-1.5 text-[12px] font-medium text-brand transition hover:bg-brand-soft disabled:opacity-50"
                          >
                            {busyId === `restore-${student.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                            )}
                            Restore
                          </button>
                        )}
                        {canManage && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handlePermanentDelete(student)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-[12px] font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {busyId === `purge-${student.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                            )}
                            Delete forever
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
  );
}
