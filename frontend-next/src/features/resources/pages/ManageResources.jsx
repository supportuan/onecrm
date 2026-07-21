'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  FileUp,
  Loader2,
  Trash2,
  Users,
} from 'lucide-react';
import {
  deleteResource,
  listResourceAcknowledgements,
  listResourcesAdmin,
  uploadResource,
  updateResource,
} from '@/services/resourcesApi';
import CountryDropdown from '@/lib/CountryDropdown/CountryDropdown';

export default function ManageResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [ackModal, setAckModal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    requiresAcknowledgement: true,
    targetRoles: ['ALL'],
    category: 'INHOUSE',
    targetCountries: [],
    countryId: '',
    file: null,
    isPublished: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await listResourcesAdmin();
      setResources(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setMsg(e.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.file) {
      setMsg('Please choose a file to upload');
      return;
    }
    if (form.category === 'ACADEMICS' && form.targetCountries.length === 0) {
      setMsg('Please select a country for Academics');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      await uploadResource(form);
      setForm({
        name: '',
        description: '',
        requiresAcknowledgement: true,
        targetRoles: ['ALL'],
        category: 'INHOUSE',
        targetCountries: [],
        countryId: '',
        file: null,
        isPublished: true,
      });
      setMsg('Knowledge uploaded');
      await load();
    } catch (err) {
      setMsg(err.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this knowledge item?')) return;
    try {
      await deleteResource(id);
      setMsg('Knowledge item deleted');
      await load();
    } catch (err) {
      setMsg(err.message || 'Delete failed');
    }
  };

  const togglePublished = async (resource) => {
    try {
      await updateResource(resource.id, { isPublished: !resource.isPublished });
      await load();
    } catch (err) {
      setMsg(err.message || 'Update failed');
    }
  };

  const openAcknowledgements = async (resource) => {
    try {
      const res = await listResourceAcknowledgements(resource.id);
      setAckModal({
        resource,
        rows: Array.isArray(res?.data) ? res.data : [],
      });
    } catch (err) {
      setMsg(err.message || 'Failed to load acknowledgements');
    }
  };

  return (
    <div className="ui-container space-y-6">
      <div>
        <h1 className="ui-text-h2">Upload &amp; Manage Knowledge</h1>
        <p className="ui-text-body mt-1">
          Publish InHouse, country-specific Academics, and agent-only knowledge.
        </p>
      </div>

      {msg && <div className="ui-panel p-3 text-sm">{msg}</div>}

      <form onSubmit={submit} className="ui-panel p-6 space-y-4">
        <h2 className="ui-text-h3 flex items-center gap-2">
          <FileUp className="h-4 w-4" /> Upload knowledge
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="ui-field"
            placeholder="Title"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="file"
            className="ui-field"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
            required
          />
        </div>
        <textarea
          className="ui-field min-h-[90px]"
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Knowledge section</span>
            <select
              className="ui-field"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                  targetRoles: e.target.value === 'AGENTS' ? ['AGENT'] : ['ALL'],
                  targetCountries: [],
                  countryId: '',
                })
              }
            >
              <option value="INHOUSE">InHouse — all roles</option>
              <option value="ACADEMICS">Academics — selected country</option>
              <option value="AGENTS">Agents — agent roles only</option>
            </select>
          </label>
          {form.category === 'ACADEMICS' && (
            <label className="space-y-1 text-sm font-medium text-neutral-700">
              <span>Academic country</span>
              <CountryDropdown
                value={form.countryId}
                onChange={(country) =>
                  setForm({
                    ...form,
                    countryId: country?.id ? String(country.id) : '',
                    targetCountries: country?.name ? [country.name] : [],
                  })
                }
                placeholder="Select academic country"
                required
                className="ui-field"
              />
            </label>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={form.requiresAcknowledgement}
            onChange={(e) => setForm({ ...form, requiresAcknowledgement: e.target.checked })}
          />
          Requires acknowledgement
        </label>
        <button type="submit" disabled={saving} className="ui-btn-primary inline-flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          Upload knowledge
        </button>
      </form>

      <div className="ui-panel divide-y divide-[var(--ui-border)]">
        {loading ? (
          <p className="p-6 ui-text-meta">Loading…</p>
        ) : !resources.length ? (
          <p className="p-6 ui-text-meta">No knowledge uploaded yet.</p>
        ) : (
          resources.map((resource) => (
            <div key={resource.id} className="p-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-neutral-900">{resource.name}</p>
                {resource.description && (
                  <p className="text-sm text-neutral-600 mt-1">{resource.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-neutral-500">
                  <span>{resource.category || 'INHOUSE'}</span>
                  {resource.targetCountries?.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{resource.targetCountries.join(', ')}</span>
                    </>
                  )}
                  <span>{resource.isPublished ? 'Published' : 'Draft'}</span>
                  <span>•</span>
                  <span>{resource.acknowledgementCount || 0} acknowledgements</span>
                  {resource.requiresAcknowledgement && (
                    <>
                      <span>•</span>
                      <span>Acknowledgement required</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAcknowledgements(resource)}
                  className="ui-btn-secondary inline-flex items-center gap-2"
                >
                  <Users className="h-4 w-4" /> View acks
                </button>
                <button
                  type="button"
                  onClick={() => togglePublished(resource)}
                  className="ui-btn-secondary"
                >
                  {resource.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(resource.id)}
                  className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {ackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="ui-card w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-neutral-200">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Acknowledgements — {ackModal.resource.name}
              </h3>
            </div>
            <div className="overflow-y-auto p-5 space-y-3">
              {!ackModal.rows.length ? (
                <p className="text-sm text-neutral-500">No acknowledgements yet.</p>
              ) : (
                ackModal.rows.map((row) => (
                  <div key={row.id} className="text-sm border border-neutral-100 rounded-lg p-3">
                    <p className="font-medium text-neutral-900">{row.user?.fullName}</p>
                    <p className="text-neutral-500">{row.user?.email}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(row.acknowledgedAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="p-5 border-t border-neutral-200">
              <button type="button" className="ui-btn-secondary w-full" onClick={() => setAckModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
