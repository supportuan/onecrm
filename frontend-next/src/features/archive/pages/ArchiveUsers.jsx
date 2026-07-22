'use client';

import { useEffect, useMemo, useState } from 'react';
import { Archive, Loader2, Search, UserX } from 'lucide-react';
import { getUsers } from '@/services/userApi';

export default function ArchiveUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getUsers();
        if (cancelled) return;
        if (!res?.success && res?.message) {
          setError(res.message);
          setUsers([]);
          return;
        }
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setUsers(list.filter((u) => u && u.isActive === false));
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load archived users');
          setUsers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = [u.fullName, u.email, u.phone, u.role, u.roleLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [users, search]);

  return (
    <div className="ui-page-shell">
      <div className="ui-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--ui-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Archive className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="ui-text-h3">Deleted users</p>
              <p className="ui-text-meta">
                {loading ? 'Loading…' : `${filtered.length} archived account${filtered.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-muted)]" />
            <input
              className="ui-input pl-9"
              placeholder="Search archived users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[var(--ui-text-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ui-text-body">Loading archived users…</span>
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <p className="ui-text-body text-red-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <UserX className="mb-3 h-10 w-10 text-[var(--ui-text-muted)] opacity-50" strokeWidth={1.5} />
            <p className="ui-text-strong">No deleted users</p>
            <p className="ui-text-meta mt-1">
              Deactivated accounts will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-control)]/50">
                  <th className="ui-text-meta px-5 py-3 font-semibold">Name</th>
                  <th className="ui-text-meta px-5 py-3 font-semibold">Email</th>
                  <th className="ui-text-meta px-5 py-3 font-semibold">Role</th>
                  <th className="ui-text-meta px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[var(--ui-border)] last:border-0 hover:bg-brand-soft/60"
                  >
                    <td className="ui-text-strong px-5 py-3">{user.fullName || '—'}</td>
                    <td className="ui-text-body px-5 py-3">{user.email || '—'}</td>
                    <td className="ui-text-body px-5 py-3">
                      {user.roleLabel || user.role || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-[12px] font-medium text-red-700">
                        Deleted
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
