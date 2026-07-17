'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, Mail, Phone, Search } from 'lucide-react';
import { listUniversityDirectory } from '@/services/agencyCrmApi';

const INPUT =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:border-neutral-400 outline-none';

export default function UniversityDirectory() {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState({ search: '', country: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUniversityDirectory({
        search: q.search || undefined,
        country: q.country || undefined,
        page,
        limit: 25,
      });
      setRows(res?.data?.items || []);
      setMeta({
        total: res?.data?.total ?? 0,
        totalPages: res?.data?.totalPages ?? 1,
      });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQ({ search: search.trim(), country: country.trim() });
  };

  return (
    <div className="ui-container space-y-6">
      <div>
        <h1 className="ui-text-h2">University directory</h1>
        <p className="ui-text-body mt-1">Browse universities and point-of-contact details for application queries.</p>
      </div>

      <form onSubmit={onSearch} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            className={`${INPUT} pl-9`}
            placeholder="Search university name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input
          className={`${INPUT} w-48`}
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <button type="submit" className="ui-btn-primary">Search</button>
      </form>

      <div className="ui-panel overflow-hidden">
        {loading ? (
          <p className="p-8 text-sm text-neutral-500">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No universities found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {rows.map((u) => (
              <li key={u.id} className="p-4 sm:p-5 flex flex-wrap gap-4 justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-brand">{u.name}</p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {[u.city, u.country?.name].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="text-sm space-y-1">
                  {u.pocName && <p className="font-medium text-neutral-800">{u.pocName}</p>}
                  {u.pocEmail ? (
                    <a href={`mailto:${u.pocEmail}`} className="flex items-center gap-1.5 text-brand hover:underline">
                      <Mail size={14} /> {u.pocEmail}
                    </a>
                  ) : (
                    <p className="text-neutral-400 text-xs">No email on file</p>
                  )}
                  {u.pocPhone && (
                    <a href={`tel:${u.pocPhone}`} className="flex items-center gap-1.5 text-neutral-700">
                      <Phone size={14} /> {u.pocPhone}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>{meta.total} universities</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>Page {page} / {meta.totalPages}</span>
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
