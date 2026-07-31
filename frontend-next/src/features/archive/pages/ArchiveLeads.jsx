'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, Loader2, RotateCcw, Search, UserX } from 'lucide-react';
import { getArchivedLeads, restoreLead } from '@/services/marketingApi';

export default function ArchiveLeads() {
  const canRestore = true;
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [restoringId, setRestoringId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getArchivedLeads({ limit: 100 });
      if (!res?.success && res?.message) {
        setError(res.message);
        setLeads([]);
        return;
      }
      const items = res?.data?.items || res?.data || [];
      setLeads(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.message || 'Failed to load archived leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => {
      const hay = [l.fullName, l.email, l.phone, l.country, l.source?.name, l.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [leads, search]);

  const handleRestore = async (id) => {
    if (!window.confirm('Restore this lead to Lead Management?')) return;
    setRestoringId(id);
    try {
      const res = await restoreLead(id);
      if (!res?.success) {
        alert(res?.message || 'Failed to restore lead');
        return;
      }
      await load();
    } catch (err) {
      alert(err?.message || 'Failed to restore lead');
    } finally {
      setRestoringId(null);
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
            <p className="ui-text-h3">Deleted leads</p>
            <p className="ui-text-meta">
              {loading
                ? 'Loading…'
                : `${filtered.length} archived lead${filtered.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-muted)]" />
          <input
            className="ui-input pl-9"
            placeholder="Search archived leads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--ui-text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ui-text-body">Loading archived leads…</span>
        </div>
      ) : error ? (
        <div className="px-5 py-12 text-center">
          <p className="ui-text-body text-red-600">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <UserX className="mb-3 h-10 w-10 text-[var(--ui-text-muted)] opacity-50" strokeWidth={1.5} />
          <p className="ui-text-strong">No archived leads</p>
          <p className="ui-text-meta mt-1">Deleted leads from Lead Management appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-control)]/50">
                <th className="ui-text-meta px-5 py-3 font-semibold">Name</th>
                <th className="ui-text-meta px-5 py-3 font-semibold">Email</th>
                <th className="ui-text-meta px-5 py-3 font-semibold">Source</th>
                <th className="ui-text-meta px-5 py-3 font-semibold">Deleted</th>
                <th className="ui-text-meta px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-[var(--ui-border)] last:border-0 hover:bg-brand-soft/60"
                >
                  <td className="ui-text-strong px-5 py-3">{lead.fullName || '—'}</td>
                  <td className="ui-text-body px-5 py-3">{lead.email || '—'}</td>
                  <td className="ui-text-body px-5 py-3">{lead.source?.name || '—'}</td>
                  <td className="ui-text-meta px-5 py-3">
                    {lead.deletedAt ? new Date(lead.deletedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {canRestore ? (
                      <button
                        type="button"
                        disabled={restoringId === lead.id}
                        onClick={() => handleRestore(lead.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ui-border)] px-2.5 py-1.5 text-[12px] font-medium text-brand transition hover:bg-brand-soft disabled:opacity-50"
                      >
                        {restoringId === lead.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                        )}
                        Restore
                      </button>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-[12px] font-medium text-red-700">
                        Archived
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
