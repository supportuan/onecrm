'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Download, FileText, Loader2, Upload } from 'lucide-react';
import {
  acknowledgeResource,
  listPendingResources,
  listResources,
} from '@/services/resourcesApi';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';

const AUDIENCE_LABELS = {
  ALL: 'All users',
  STUDENT: 'Students',
  AGENT: 'Agents',
  STAFF: 'Staff',
};
const CATEGORY_LABELS = {
  INHOUSE: 'InHouse',
  ACADEMICS: 'Academics',
  AGENTS: 'Agents',
};
const CATEGORY_ORDER = ['INHOUSE', 'ACADEMICS', 'AGENTS'];

export default function ResourceLibrary() {
  const { syncProfile } = useAuth();
  const { can } = usePermissions();
  const canManage = can('MANAGE_RESOURCES');
  const [resources, setResources] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ackLoadingId, setAckLoadingId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [allRes, pendingRes] = await Promise.all([listResources(), listPendingResources()]);
      setResources(Array.isArray(allRes?.data) ? allRes.data : []);
      setPending(Array.isArray(pendingRes?.data) ? pendingRes.data : []);
    } catch (e) {
      setMsg(e.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const acknowledge = async (id) => {
    setAckLoadingId(id);
    setMsg('');
    try {
      await acknowledgeResource(id);
      setMsg('Acknowledgement recorded');
      await load();
      await syncProfile?.();
    } catch (e) {
      setMsg(e.message || 'Failed to acknowledge');
    } finally {
      setAckLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="ui-container flex items-center justify-center min-h-[40vh] text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading knowledge…
      </div>
    );
  }
  const orderedResources = [...resources].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category || 'INHOUSE') -
      CATEGORY_ORDER.indexOf(b.category || 'INHOUSE'),
  );

  return (
    <div className="ui-container space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="ui-text-h2">Knowledge Hub</h1>
          <p className="ui-text-body mt-1">
            Access knowledge available to your role and selected country.
          </p>
        </div>
        {canManage && (
          <Link href="/resources/manage" className="ui-btn-primary inline-flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload knowledge
          </Link>
        )}
      </div>

      {msg && <div className="ui-panel p-3 text-sm">{msg}</div>}

      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">
              {pending.length} item{pending.length === 1 ? '' : 's'} require acknowledgement
            </p>
            <p className="text-sm text-amber-800 mt-1">
              Please review and acknowledge each required document below.
            </p>
          </div>
        </div>
      )}

      <div className="ui-panel divide-y divide-[var(--ui-border)]">
        {!orderedResources.length ? (
          <p className="p-6 ui-text-meta">No knowledge available yet.</p>
        ) : (
          orderedResources.map((resource, index) => (
            <div key={resource.id} className="p-5 space-y-3">
              {(index === 0 ||
                orderedResources[index - 1]?.category !== resource.category) && (
                <h2 className="ui-text-h3">
                  {CATEGORY_LABELS[resource.category] || 'InHouse'}
                </h2>
              )}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-neutral-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">{resource.name}</p>
                    {resource.description && (
                      <p className="text-sm text-neutral-600 mt-1">{resource.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                        {CATEGORY_LABELS[resource.category] || 'InHouse'}
                      </span>
                      {(resource.targetCountries || []).map((country) => (
                        <span
                          key={country}
                          className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600"
                        >
                          {country}
                        </span>
                      ))}
                      {(resource.targetRoles || ['ALL']).map((role) => (
                        <span
                          key={role}
                          className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600"
                        >
                          {AUDIENCE_LABELS[role] || role}
                        </span>
                      ))}
                      {resource.requiresAcknowledgement && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Acknowledgement required
                        </span>
                      )}
                      {resource.acknowledged && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Acknowledged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ui-btn-secondary inline-flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {resource.fileName || 'Download'}
                    </a>
                  )}
                  {resource.pendingAcknowledgement && (
                    <button
                      type="button"
                      disabled={ackLoadingId === resource.id}
                      onClick={() => acknowledge(resource.id)}
                      className="ui-btn-primary inline-flex items-center gap-2"
                    >
                      {ackLoadingId === resource.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      I acknowledge
                    </button>
                  )}
                </div>
              </div>
              {resource.acknowledgedAt && (
                <p className="text-xs text-neutral-500">
                  Acknowledged on {new Date(resource.acknowledgedAt).toLocaleString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
