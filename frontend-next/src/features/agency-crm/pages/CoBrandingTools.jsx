'use client';

import { useEffect, useState } from 'react';
import { Copy, Layers, Save } from 'lucide-react';
import { getMyPartner, listPartners, updatePartner } from '@/services/agencyCrmApi';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { isAgencyPartnerRole } from '../agentPortal';

const INPUT =
  'w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:border-neutral-400 outline-none';

export default function CoBrandingTools() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can('MANAGE_AGENCY_CRM');
  const isAgent = isAgencyPartnerRole(user?.role);
  /** Agents edit own branding via VIEW; admins use MANAGE across partners. */
  const canEditBranding = isAgent || canManage;

  const [partners, setPartners] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [partner, setPartner] = useState(null);
  const [branding, setBranding] = useState({
    tagline: '',
    primaryColor: '#1e40af',
    logoUrl: '',
    websiteUrl: '',
  });
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const applyPartner = (p) => {
    if (!p) return;
    setPartner(p);
    const b = p.branding || {};
    setBranding({
      tagline: b.tagline || '',
      primaryColor: b.primaryColor || '#1e40af',
      logoUrl: b.logoUrl || '',
      websiteUrl: b.websiteUrl || '',
    });
  };

  useEffect(() => {
    (async () => {
      try {
        if (isAgent) {
          const res = await getMyPartner();
          applyPartner(res?.data);
          return;
        }
        const res = await listPartners();
        const list = Array.isArray(res?.data) ? res.data : [];
        setPartners(list);
        if (list.length) {
          setSelectedId((prev) => prev || String(list[0].id));
          applyPartner(list[0]);
        }
      } catch {
        setPartner(null);
      }
    })().catch(() => {});
  }, [isAgent]);

  useEffect(() => {
    if (isAgent || !selectedId || !partners.length) return;
    const p = partners.find((x) => String(x.id) === String(selectedId));
    if (p) applyPartner(p);
  }, [selectedId, partners, isAgent]);

  const referralLink =
    typeof window !== 'undefined' && partner?.agencyCode
      ? `${window.location.origin}/?ref=${partner.agencyCode}`
      : partner?.agencyCode
        ? `/?ref=${partner.agencyCode}`
        : '';

  const save = async (e) => {
    e.preventDefault();
    if (!canEditBranding || !partner?.id) return;
    try {
      const res = await updatePartner(partner.id, { branding });
      setPartner(res?.data || partner);
      setMsg('Branding saved');
    } catch (err) {
      setMsg(err?.message || 'Save failed');
    }
  };

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg('Could not copy link');
    }
  };

  if (!partner) {
    return (
      <div className="ui-page">
        <div className="ui-container">
          <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center text-neutral-500">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No agency profile found. Set up an agency partner first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page">
      <div className="ui-container space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand">
            {isAgent ? 'Referral & branding' : 'Co-branding tools'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Referral links and branded assets for {partner.agencyName}.
          </p>
        </div>

        {msg && <p className="text-sm text-neutral-700">{msg}</p>}

        {!isAgent && partners.length > 1 && (
          <select
            className={INPUT + ' max-w-md'}
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              const p = partners.find((x) => String(x.id) === e.target.value);
              applyPartner(p);
            }}
          >
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.agencyName}</option>
            ))}
          </select>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="font-medium text-brand">Referral link</h2>
            <p className="text-sm text-neutral-500">
              Share this link so leads are attributed to agency code <strong>{partner.agencyCode}</strong>.
            </p>
            <div className="flex gap-2">
              <input className={INPUT} readOnly value={referralLink} />
              <button type="button" onClick={copyLink} className="px-3 py-2 border border-neutral-200 rounded-lg">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-600">Copied to clipboard</p>}
          </div>

          <div
            className="rounded-lg border p-6 text-white"
            style={{ backgroundColor: branding.primaryColor || '#1e40af' }}
          >
            <p className="text-xs opacity-80 uppercase tracking-wide">Preview</p>
            <h3 className="text-xl font-semibold mt-2">{partner.agencyName}</h3>
            <p className="text-sm mt-2 opacity-90">{branding.tagline || 'Your pathway to world-class education'}</p>
            {branding.websiteUrl && (
              <p className="text-xs mt-4 opacity-75">{branding.websiteUrl}</p>
            )}
          </div>
        </div>

        <form onSubmit={save} className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-medium text-brand">Brand settings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500">Tagline</span>
              <input className={INPUT} value={branding.tagline} onChange={(e) => setBranding({ ...branding, tagline: e.target.value })} disabled={!canEditBranding} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500">Primary colour</span>
              <input type="color" className="h-10 w-full rounded border border-neutral-200" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} disabled={!canEditBranding} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500">Logo URL</span>
              <input className={INPUT} value={branding.logoUrl} onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })} disabled={!canEditBranding} placeholder="https://…" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500">Website URL</span>
              <input className={INPUT} value={branding.websiteUrl} onChange={(e) => setBranding({ ...branding, websiteUrl: e.target.value })} disabled={!canEditBranding} />
            </label>
          </div>
          {canEditBranding && (
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm rounded-lg">
              <Save className="w-4 h-4" />
              Save branding
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
