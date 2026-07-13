'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { listCountries, listCatalog, getCatalogStats, createUniversity } from '@/services/crmSettingsApi';
import {
  listChecklistTemplates,
  createChecklistTemplate,
  deleteChecklistTemplate,
  getChecklist,
} from '@/services/studentCrmApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';

const INPUT = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg';
const PAGE_SIZE = 50;

export default function CrmSettingsPage() {
  const { can } = usePermissions();
  const canManage = can('MANAGE_STUDENT_CRM');
  const [countries, setCountries] = useState([]);
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, from: 0, to: 0 });
  const [page, setPage] = useState(1);
  const [countryFilter, setCountryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', countryId: '', city: '' });
  const [msg, setMsg] = useState('');
  const [templates, setTemplates] = useState([]);
  const [tplForm, setTplForm] = useState({ country: '', university: '', docName: '', docRequired: true });
  const [tplDocs, setTplDocs] = useState([]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCatalog({
        countryId: countryFilter || undefined,
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
      });
      const data = res?.data || {};
      setRows(data.items || []);
      setMeta({
        total: data.total ?? 0,
        page: data.page ?? 1,
        totalPages: data.totalPages ?? 1,
        from: data.from ?? 0,
        to: data.to ?? 0,
      });
    } catch {
      setRows([]);
      setMeta({ total: 0, page: 1, totalPages: 1, from: 0, to: 0 });
    } finally {
      setLoading(false);
    }
  }, [countryFilter, page, search]);

  useEffect(() => {
    listCountries()
      .then((r) => setCountries(r?.data || []))
      .catch(() => setCountries([]));
    getCatalogStats()
      .then((r) => setStats(r?.data || null))
      .catch(() => setStats(null));
    listChecklistTemplates()
      .then((r) => setTemplates(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    loadCatalog().catch(() => {});
  }, [loadCatalog]);

  useEffect(() => {
    setPage(1);
  }, [countryFilter, search]);

  const addUniversity = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      await createUniversity({
        name: form.name,
        countryId: Number(form.countryId),
        city: form.city || undefined,
      });
      setForm({ name: '', countryId: '', city: '' });
      setMsg('University added');
      const s = await getCatalogStats();
      setStats(s?.data || null);
      await loadCatalog();
    } catch (err) {
      setMsg(err.message || 'Failed');
    }
  };

  const loadDefaultDocs = async (country) => {
    if (!country) return;
    try {
      const res = await getChecklist(country);
      const items = Array.isArray(res?.data) ? res.data : [];
      setTplDocs(items);
    } catch {
      setTplDocs([]);
    }
  };

  const saveTemplate = async (e) => {
    e.preventDefault();
    if (!canManage || !tplForm.country || tplDocs.length === 0) return;
    try {
      await createChecklistTemplate({
        country: tplForm.country,
        university: tplForm.university || null,
        documents: tplDocs,
      });
      setMsg('Checklist template saved');
      setTplForm({ country: '', university: '', docName: '', docRequired: true });
      setTplDocs([]);
      const r = await listChecklistTemplates();
      setTemplates(Array.isArray(r?.data) ? r.data : []);
    } catch (err) {
      setMsg(err.message || 'Failed to save template');
    }
  };

  const removeTemplate = async (id) => {
    if (!canManage || !window.confirm('Delete this template?')) return;
    try {
      await deleteChecklistTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setMsg('Template deleted');
    } catch (err) {
      setMsg(err.message || 'Delete failed');
    }
  };

  return (
    <div className="ui-page">
      <div className="ui-container space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand">CRM settings</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Universities and courses mapped from ApplyUniNow — one row per course.
          </p>
        </div>

        {msg && <p className="text-sm text-neutral-700">{msg}</p>}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['Universities', stats.universities],
              ['Courses', stats.courses?.toLocaleString()],
              ['Unis with courses', stats.universitiesWithCourses],
              ['Mapped (external ID)', stats.mappedUniversities],
            ].map(([label, value]) => (
              <div key={label} className="ui-panel p-4">
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="text-xl font-semibold text-brand mt-1">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="ui-panel p-5">
          <h2 className="text-sm font-semibold mb-3">Countries ({countries.length})</h2>
          <div className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCountryFilter(countryFilter === String(c.id) ? '' : String(c.id))}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  countryFilter === String(c.id)
                    ? 'bg-brand text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {canManage && (
          <form onSubmit={addUniversity} className="ui-panel p-5 grid md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs text-neutral-500">University name</label>
              <input className={INPUT} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Country</label>
              <select className={INPUT} value={form.countryId} onChange={(e) => setForm({ ...form, countryId: e.target.value })} required>
                <option value="">Select</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500">City</label>
              <input className={INPUT} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <button type="submit" className="ui-btn-primary">
              Add university
            </button>
          </form>
        )}

        <div className="ui-panel overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-sm">Universities &amp; courses</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {meta.total > 0
                  ? `Showing ${meta.from}–${meta.to} of ${meta.total.toLocaleString()} courses`
                  : 'No courses found'}
              </p>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                className="pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg w-64"
                placeholder="Search university or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-left text-xs text-neutral-500 border-b border-neutral-200">
                  <th className="px-5 py-3 font-medium">Country</th>
                  <th className="px-5 py-3 font-medium">University</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Level</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Intake</th>
                  <th className="px-5 py-3 font-medium">Tuition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-neutral-500">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-neutral-500">
                      No courses match your filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.courseId} className="hover:bg-neutral-50/80">
                      <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{r.countryName}</td>
                      <td className="px-5 py-3 font-medium text-brand max-w-[200px]">{r.universityName}</td>
                      <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">{r.universityCity || '—'}</td>
                      <td className="px-5 py-3 text-neutral-800 max-w-[280px]">{r.courseName}</td>
                      <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">{r.level || '—'}</td>
                      <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">{r.duration || '—'}</td>
                      <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">{r.intakes || '—'}</td>
                      <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">{r.tuitionFee || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="px-5 py-4 border-t border-neutral-200 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm text-neutral-600">
                Page {page} of {meta.totalPages.toLocaleString()}
                <span className="text-neutral-400 ml-2">
                  ({(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, meta.total)})
                </span>
              </span>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="ui-panel p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm">Document checklist templates</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Per-country (and optional university) defaults used when new applications are created.
            </p>
          </div>

          {canManage && (
            <form onSubmit={saveTemplate} className="space-y-3 border border-neutral-200 rounded-lg p-4">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-neutral-500">Country *</label>
                  <input
                    className={INPUT}
                    value={tplForm.country}
                    onChange={(e) => {
                      setTplForm({ ...tplForm, country: e.target.value });
                      loadDefaultDocs(e.target.value);
                    }}
                    placeholder="e.g. United Kingdom"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">University (optional)</label>
                  <input
                    className={INPUT}
                    value={tplForm.university}
                    onChange={(e) => setTplForm({ ...tplForm, university: e.target.value })}
                    placeholder="Leave blank for country default"
                  />
                </div>
                <div className="flex items-end">
                  <button type="button" className="ui-btn-secondary w-full" onClick={() => loadDefaultDocs(tplForm.country)}>
                    Load built-in defaults
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs text-neutral-500">Add document</label>
                  <input
                    className={INPUT}
                    value={tplForm.docName}
                    onChange={(e) => setTplForm({ ...tplForm, docName: e.target.value })}
                    placeholder="Document name"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs pb-2">
                  <input
                    type="checkbox"
                    checked={tplForm.docRequired}
                    onChange={(e) => setTplForm({ ...tplForm, docRequired: e.target.checked })}
                  />
                  Required
                </label>
                <button
                  type="button"
                  className="ui-btn-secondary"
                  onClick={() => {
                    if (!tplForm.docName.trim()) return;
                    setTplDocs([...tplDocs, { name: tplForm.docName.trim(), required: tplForm.docRequired }]);
                    setTplForm({ ...tplForm, docName: '' });
                  }}
                >
                  Add row
                </button>
              </div>

              {tplDocs.length > 0 && (
                <ul className="text-sm divide-y divide-neutral-100 border border-neutral-100 rounded-lg">
                  {tplDocs.map((d, i) => (
                    <li key={i} className="flex justify-between px-3 py-2">
                      <span>{d.name}{d.required ? ' *' : ''}</span>
                      <button type="button" className="text-xs text-rose-600" onClick={() => setTplDocs(tplDocs.filter((_, j) => j !== i))}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button type="submit" className="ui-btn-primary" disabled={!tplForm.country || tplDocs.length === 0}>
                Save template
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-500 border-b">
                  <th className="py-2 pr-4">Country</th>
                  <th className="py-2 pr-4">University</th>
                  <th className="py-2 pr-4">Documents</th>
                  {canManage && <th className="py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 4 : 3} className="py-6 text-center text-neutral-500">
                      No custom templates — built-in country defaults are used.
                    </td>
                  </tr>
                ) : (
                  templates.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2 pr-4">{t.country}</td>
                      <td className="py-2 pr-4">{t.university || '— (country default)'}</td>
                      <td className="py-2 pr-4 text-neutral-600">
                        {Array.isArray(t.documents) ? `${t.documents.length} items` : '—'}
                      </td>
                      {canManage && (
                        <td className="py-2 text-right">
                          <button type="button" className="text-xs text-rose-600" onClick={() => removeTemplate(t.id)}>
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
