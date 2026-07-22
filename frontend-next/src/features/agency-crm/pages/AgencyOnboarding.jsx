'use client';

import { useEffect, useState } from 'react';
import { FileUp, CheckCircle2, Circle, Loader2, Lock } from 'lucide-react';
import {
  getMyPartner,
  provisionMyPartner,
  listPartnerDocuments,
  uploadPartnerDocument,
  signAgreement,
  submitOnboardingDocs,
} from '@/services/agencyCrmApi';
import { ONBOARDING_STAGE_LABELS, partnerStatusClass } from '../constants';
import {
  canSignAgreement,
  canSubmitOnboardingDocs,
  isAwaitingAdminReview,
  ONBOARDING_STAGE_ORDER,
  stageIndex,
} from '../agentPortal';

const StepIcon = ({ done, current }) => {
  if (done) return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />;
  if (current) return <Circle className="h-4 w-4 shrink-0 text-blue-600" />;
  return <Lock className="h-4 w-4 shrink-0 text-neutral-300" />;
};

export default function AgencyOnboarding() {
  const [partner, setPartner] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

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

  const stage = partner?.onboardingStage || 'REGISTERED';
  const idx = stageIndex(stage);
  const allowSubmitDocs = canSubmitOnboardingDocs(stage);
  const allowSign = canSignAgreement(stage);
  const awaitingAdmin = isAwaitingAdminReview(stage) || stage === 'ACTIVE';

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !partner?.id) return;
    if (idx > stageIndex('DOCS_SUBMITTED')) {
      setMsg('Documents already submitted — contact support to replace files');
      return;
    }
    setBusy(true);
    try {
      await uploadPartnerDocument(partner.id, file, { type: 'KYC_ID' });
      await load();
      setMsg('Document uploaded');
    } catch (err) {
      setMsg(err?.message || 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const onSubmit = async () => {
    if (!partner?.id || !allowSubmitDocs) return;
    setBusy(true);
    try {
      await submitOnboardingDocs(partner.id);
      await load();
      setMsg('Documents submitted — next: sign the agency agreement');
    } catch (err) {
      setMsg(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const onSign = async () => {
    if (!partner?.id || !allowSign) return;
    if (!agreementAccepted) {
      setMsg('Please read and accept the agency agreement before signing');
      return;
    }
    setBusy(true);
    try {
      await signAgreement(partner.id, { agreementVersion: 'v1', accepted: true });
      await load();
      setMsg('Agreement signed — awaiting admin verification');
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
      {msg && <div className="ui-panel p-3 text-sm">{msg}</div>}

      {partner ? (
        <div className="ui-panel p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ui-text-strong">{partner.agencyName}</p>
              <p className="ui-text-meta">Code: {partner.agencyCode}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${partnerStatusClass(partner.status)}`}>
              {partner.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {ONBOARDING_STAGE_ORDER.map((s, i) => (
              <span
                key={s}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  i <= idx
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {ONBOARDING_STAGE_LABELS[s] || s}
              </span>
            ))}
          </div>

          <ol className="space-y-4 text-sm">
            <li className="flex items-start gap-2">
              <StepIcon done current={false} />
              <div>
                <p className="font-medium text-neutral-800">1. Registration</p>
                <p className="ui-text-meta">Agency profile created</p>
              </div>
            </li>

            <li className="flex items-start gap-2">
              <StepIcon done={idx >= stageIndex('DOCS_SUBMITTED')} current={allowSubmitDocs} />
              <div className="space-y-2 flex-1">
                <p className="font-medium text-neutral-800">2. Upload &amp; submit documents</p>
                <label
                  className={`ui-btn-secondary inline-flex items-center gap-2 ${
                    idx > stageIndex('DOCS_SUBMITTED') ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
                  }`}
                >
                  <FileUp className="h-4 w-4" />
                  Upload ID / business docs
                  <input
                    type="file"
                    className="hidden"
                    onChange={onUpload}
                    disabled={busy || idx > stageIndex('DOCS_SUBMITTED')}
                  />
                </label>
                <p className="ui-text-meta">{docs.length} document(s) uploaded</p>
                <button
                  type="button"
                  className="ui-btn-primary"
                  onClick={onSubmit}
                  disabled={busy || !allowSubmitDocs || docs.length < 1}
                >
                  Submit documents
                </button>
              </div>
            </li>

            <li className="flex items-start gap-2">
              <StepIcon done={idx >= stageIndex('AGREEMENT_SIGNED')} current={allowSign} />
              <div className="space-y-2">
                <p className="font-medium text-neutral-800">3. Sign agency agreement</p>
                {allowSign && (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 space-y-2 max-h-48 overflow-y-auto">
                    <p className="font-semibold text-neutral-900">ApplyUniNow Agency Partner Agreement (v1)</p>
                    <p>
                      By signing, you confirm that you are authorised to represent this agency, that KYC documents
                      submitted are accurate, and that you will refer students in accordance with ApplyUniNow policies,
                      commission rules, and data-protection requirements.
                    </p>
                    <p>
                      You agree not to misrepresent university offers, fees, or visa outcomes; to keep student data
                      confidential; and to accept that commissions are payable only after configured triggers
                      (for example enrolment or visa approval) and admin verification.
                    </p>
                    <p>
                      ApplyUniNow may suspend or terminate partner access for fraud, document forgery, or policy breaches.
                      This electronic acceptance records your IP address, user agent, and agreement version.
                    </p>
                    <label className="flex items-start gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={agreementAccepted}
                        onChange={(e) => setAgreementAccepted(e.target.checked)}
                      />
                      <span>I have read and agree to the Agency Partner Agreement (v1).</span>
                    </label>
                  </div>
                )}
                <button
                  type="button"
                  className="ui-btn-secondary"
                  onClick={onSign}
                  disabled={busy || !allowSign || !agreementAccepted}
                >
                  Sign agreement
                </button>
                {!allowSign && idx < stageIndex('DOCS_SUBMITTED') && (
                  <p className="ui-text-meta">Submit documents before signing.</p>
                )}
              </div>
            </li>

            <li className="flex items-start gap-2">
              <StepIcon done={stage === 'ACTIVE'} current={awaitingAdmin && stage !== 'ACTIVE'} />
              <div>
                <p className="font-medium text-neutral-800">4. Admin verification &amp; activation</p>
                <p className="ui-text-meta">
                  {stage === 'ACTIVE'
                    ? 'Your partner account is active.'
                    : awaitingAdmin
                      ? 'Waiting for administrator verification and approval.'
                      : 'Available after you sign the agreement.'}
                </p>
              </div>
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
