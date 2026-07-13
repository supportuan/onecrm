'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  getApplication,
  listMyApplications,
  uploadApplicationDocument,
  respondToOffer,
  getProcessStages,
  getApplicationReadiness,
} from '@/services/studentCrmApi';
import {
  DocumentChecklist,
  StudentOfferPanel,
  StudentVisaPanel,
  formatDate,
} from '@/features/student-crm/components/ApplicationParts';
import StudentPaymentPanel from '../components/StudentPaymentPanel';
import StudentWorkflowGuide, { resolveStudentWorkflow } from '../components/StudentWorkflowGuide';
import { getStageLabel } from '@/features/student-crm/constants';

export default function StudentApplicationDetail({ applicationId }) {
  const [app, setApp] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [workflow, setWorkflow] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [offerBusy, setOfferBusy] = useState(false);
  const [toast, setToast] = useState({ kind: '', msg: '' });

  const flash = (kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast({ kind: '', msg: '' }), 3000);
  };

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      let data = null;
      try {
        const res = await getApplication(applicationId);
        data = res?.data || null;
      } catch {
        const listRes = await listMyApplications();
        const items = Array.isArray(listRes?.data) ? listRes.data : [];
        data = items.find((a) => String(a.id) === String(applicationId)) || null;
      }
      setApp(data);
      if (data?.id) {
        const readinessRes = await getApplicationReadiness(data.id);
        setReadiness(readinessRes?.data || null);
      }
      if (data?.country) {
        const stagesRes = await getProcessStages(data.country);
        setWorkflow(stagesRes?.data?.visaWorkflow || []);
      }
    } catch (e) {
      flash('err', e?.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleDocUpload = async (docId, file) => {
    if (!app || !file) return;
    setUploadingDocId(docId);
    try {
      await uploadApplicationDocument(app.id, docId, file);
      flash('ok', 'Document uploaded — your counsellor will review it');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'Upload failed');
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleOfferDecision = async (decision) => {
    if (!app) return;
    const label = decision === 'ACCEPTED' ? 'accept' : 'decline';
    if (!window.confirm(`Are you sure you want to ${label} this offer?`)) return;
    setOfferBusy(true);
    try {
      await respondToOffer(app.id, decision);
      flash('ok', `Offer ${decision === 'ACCEPTED' ? 'accepted' : 'declined'}`);
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'Could not record decision');
    } finally {
      setOfferBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading application…</p>;
  }

  if (!app) {
    return (
      <div className="space-y-4">
        <Link href="/applicant/applications" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-brand">
          <ArrowLeft size={14} /> Back to applications
        </Link>
        <p className="text-sm text-neutral-500">Application not found.</p>
      </div>
    );
  }

  const { currentStepId } = resolveStudentWorkflow(app, readiness);
  const showDocs = ['documents', 'payment', 'review'].includes(currentStepId);
  const showPayment = ['payment', 'review'].includes(currentStepId) || (readiness && !readiness.feesPaid);
  const showOffer =
    currentStepId === 'offer' ||
    (app.stage === 'OFFER_RECEIVED' && app.offerLetter) ||
    ['OFFER_ACCEPTED', 'OFFER_REJECTED'].includes(app.stage);
  const showVisa = ['visa'].includes(currentStepId) || ['VISA_PROCESS', 'ENROLLED', 'OFFER_ACCEPTED'].includes(app.stage);

  return (
    <div className="space-y-6">
      {toast.msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[13px] font-medium text-white ${
            toast.kind === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div>
        <Link
          href="/applicant/applications"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-brand mb-4"
        >
          <ArrowLeft size={14} /> Back to applications
        </Link>
        <h1 className="text-2xl font-semibold text-brand">{app.university}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {app.applicationCode} · {app.course} · {getStageLabel(app.stage)}
          {app.deadline && (
            <span className="ml-2 text-neutral-400">· Deadline {formatDate(app.deadline)}</span>
          )}
        </p>
      </div>

      <StudentWorkflowGuide app={app} readiness={readiness} />

      {showOffer && (
        <StudentOfferPanel
          app={app}
          busy={offerBusy}
          onAccept={() => handleOfferDecision('ACCEPTED')}
          onReject={() => handleOfferDecision('REJECTED')}
        />
      )}

      {showDocs && (
        <DocumentChecklist
          app={app}
          canManage={false}
          canUpload={currentStepId === 'documents' || app.documents?.some((d) => d.status === 'REJECTED')}
          onUpload={handleDocUpload}
          uploadingDocId={uploadingDocId}
        />
      )}

      {showPayment && (
        <StudentPaymentPanel app={app} readiness={readiness} onPaid={fetchDetail} />
      )}

      {showVisa && (
        <StudentVisaPanel app={app} workflow={workflow} />
      )}

      {currentStepId === 'review' && !showOffer && (
        <section className="ui-panel p-5 text-center">
          <p className="text-sm font-medium text-brand">Your application is with your counsellor</p>
          <p className="text-sm text-neutral-500 mt-2">
            Documents and fees are complete. You will be notified when there is an update from the university.
          </p>
        </section>
      )}
    </div>
  );
}
