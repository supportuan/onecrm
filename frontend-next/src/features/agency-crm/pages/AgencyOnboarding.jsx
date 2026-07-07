'use client';

import { useEffect, useState } from 'react';
import { FileUp, CheckCircle2, Loader2 } from 'lucide-react';
import {
  getMyPartner,
  provisionMyPartner,
  listPartnerDocuments,
  uploadPartnerDocument,
  signAgreement,
  submitOnboardingDocs,
} from '@/services/agencyCrmApi';
import { ONBOARDING_STAGE_LABELS, partnerStatusClass } from '../constants';

export default function AgencyOnboarding() {
  const [partner, setPartner] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let res = await getMyPartner().catch(() => null);
      if (!res?.success) {
        res = await provisionMyPartner();
      }
      const p = res?.data;
      setPartner(p || null);
      if (p?.id) {
        const d = await listPartnerDocuments(p.id);
        setDocs(d?.data || []);
      }
    } catch (e) {
      setMsg(e?.message || 'Unable to load onboarding profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !partner?.id) return;
    setBusy(true);
    try {
      await uploadPartnerDocument(partner.id, file, { type: 'KYC_ID' });
      await load();
      setMsg('Document uploaded');
    } catch (err) {
      setMsg(err?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const onSign = async () => {
    if (!partner?.id) return;
    setBusy(true);
    try {
      await signAgreement(partner.id);
      await load();
      setMsg('Agreement signed');
    } catch (err) {
      setMsg(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async () => {
    if (!partner?.id) return;
    setBusy(true);
    try {
      await submitOnboardingDocs(partner.id);
      await load();
      setMsg('Documents submitted for review');
    } catch (err) {
      setMsg(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="ui-container flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="ui-container space-y-6 max-w-2xl">
      <div>
        <h1 className="ui-text-h2">Agent onboarding</h1>
        <p className="ui-text-body mt-1">Complete registration → documents → agreement → admin approval.</p>
      </div>

      {msg && <div className="ui-panel p-3 text-sm">{msg}</div>}

      {partner ? (
        <div className="ui-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="ui-text-strong">{partner.agencyName}</p>
              <p className="ui-text-meta">Code: {partner.agencyCode}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${partnerStatusClass(partner.status)}`}>
              {partner.status}
            </span>
          </div>
          <p className="ui-text-body">
            Stage: {ONBOARDING_STAGE_LABELS[partner.onboardingStage] || partner.onboardingStage}
          </p>

          <ol className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Registration complete
            </li>
            <li>
              <label className="ui-btn-secondary inline-flex items-center gap-2 cursor-pointer">
                <FileUp className="h-4 w-4" />
                Upload ID / business docs
                <input type="file" className="hidden" onChange={onUpload} disabled={busy} />
              </label>
              <p className="ui-text-meta mt-1">{docs.length} document(s) uploaded</p>
            </li>
            <li>
              <button type="button" className="ui-btn-secondary" onClick={onSign} disabled={busy}>
                Sign agency agreement
              </button>
            </li>
            <li>
              <button type="button" className="ui-btn-primary" onClick={onSubmit} disabled={busy}>
                Submit for admin review
              </button>
            </li>
          </ol>
        </div>
      ) : (
        <div className="ui-panel p-6">
          <p className="ui-text-body">No agency profile yet.</p>
          <button type="button" className="ui-btn-primary mt-4" onClick={() => load()}>
            Create my agency profile
          </button>
        </div>
      )}
    </div>
  );
}
