'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  UserRound,
  Calendar,
  Globe,
  Clock,
} from 'lucide-react';
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
import StudentPaymentPanel from '../components/StudentPaymentPanel';
import StudentWorkflowGuide, { resolveStudentWorkflow } from '../components/StudentWorkflowGuide';
import { StudentPageHeader } from '../layout/StudentPortalLayoutContext';
import {
  sp,
  StudentPortalPage,
  StudentPortalPanel,
  ProgressBar,
  SkeletonBlock,
} from '../student-portal-ui';

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
    return (
      <StudentPortalPage>
        <SkeletonBlock className="h-10 w-48" />
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-64" />
      </StudentPortalPage>
    );
  }

  if (!app) {
    return (
      <StudentPortalPage>
        <Link href="/applicant/applications" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-brand">
          <ArrowLeft size={14} /> Back to applications
        </Link>
        <div className={sp.empty}>Application not found.</div>
      </StudentPortalPage>
    );
  }

  const { currentStepId, steps } = resolveStudentWorkflow(app, readiness);
  const doneSteps = steps.filter((s) => s.status === 'done').length;
  const progressPct = Math.round(((doneSteps + (steps.some((s) => s.status === 'active') ? 0.5 : 0)) / steps.length) * 100);
  const showDocs = ['documents', 'payment', 'review'].includes(currentStepId);
  const showPayment = ['payment', 'review'].includes(currentStepId) || (readiness && !readiness.feesPaid);
  const showOffer =
    currentStepId === 'offer' ||
    (app.stage === 'OFFER_RECEIVED' && app.offerLetter) ||
    ['OFFER_ACCEPTED', 'OFFER_REJECTED'].includes(app.stage);
  const showVisa = ['visa'].includes(currentStepId) || ['VISA_PROCESS', 'ENROLLED', 'OFFER_ACCEPTED'].includes(app.stage);
  const overdue = app.deadline && new Date(app.deadline) < new Date();

  return (
    <StudentPortalPage>
      {toast.msg && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-medium text-white shadow-xl ${
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
          className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-brand"
        >
          <ArrowLeft size={14} /> Back to applications
        </Link>
        <StudentPageHeader
          title={app.university}
          description={`${app.applicationCode} · ${app.course}`}
        />
      </div>

      <StudentPortalPanel className={`${sp.panelPad} space-y-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className={sp.badge}>{getStageLabel(app.stage)}</span>
            {app.intake && <span className={sp.badge}>Intake {app.intake}</span>}
            {app.deadline && (
              <span className={`${sp.badge} ${overdue ? 'border-rose-200 bg-rose-50 text-rose-700' : ''}`}>
                <Clock size={12} className="mr-1" />
                Deadline {formatDate(app.deadline)}
              </span>
            )}
          </div>
          <div className="min-w-[120px] text-right">
            <p className="text-2xl font-semibold text-brand">{progressPct}%</p>
            <p className="text-[11px] text-slate-400">Progress</p>
          </div>
        </div>
        <ProgressBar value={progressPct} />

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Meta icon={Globe} label="Country" value={app.country} />
          <Meta icon={Calendar} label="Submitted" value={formatDate(app.createdAt)} />
          <Meta icon={Clock} label="Last updated" value={formatDate(app.updatedAt)} />
          <Meta
            icon={UserRound}
            label="Assigned counsellor"
            value={app.assignedTo?.fullName || 'Not assigned yet'}
          />
          {app.assignedTo?.email && (
            <Meta label="Counsellor email" value={app.assignedTo.email} />
          )}
          {app.offerLetter?.fileUrl && (
            <div className="sm:col-span-2 lg:col-span-1">
              <a
                href={app.offerLetter.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={sp.btnGhost}
              >
                <Download size={14} /> Download offer letter
              </a>
            </div>
          )}
        </dl>
      </StudentPortalPanel>

      <StudentWorkflowGuide app={app} readiness={readiness} />

      {(app.stageEvents || []).length > 0 && (
        <StudentPortalPanel className={`${sp.panelPad} space-y-4`}>
          <div>
            <p className={sp.sectionEyebrow}>Status timeline</p>
            <h2 className={`${sp.sectionTitle} mt-1`}>Application updates</h2>
          </div>
          <ol className="relative ml-2 space-y-4 border-l border-slate-200 pl-5">
            {app.stageEvents.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand" />
                <p className="text-sm font-medium text-brand">
                  {e.fromStage
                    ? `${getStageLabel(e.fromStage)} → ${getStageLabel(e.toStage)}`
                    : `Started at ${getStageLabel(e.toStage)}`}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {new Date(e.createdAt).toLocaleString()}
                  {e.changedBy?.fullName ? ` · ${e.changedBy.fullName}` : ''}
                  {e.notes ? ` · ${e.notes}` : ''}
                </p>
              </li>
            ))}
          </ol>
        </StudentPortalPanel>
      )}

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
        <StudentPortalPanel className={`${sp.panelPad} text-center`}>
          <p className="text-sm font-medium text-brand">Your application is with your counsellor</p>
          <p className={`${sp.body} mt-2`}>
            Documents and fees are complete. You will be notified when there is an update from the university.
          </p>
        </StudentPortalPanel>
      )}
    </StudentPortalPage>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {Icon && <Icon size={12} />}
        {label}
      </dt>
      <dd className="text-sm font-medium text-brand break-all">{value || '—'}</dd>
    </div>
  );
}
