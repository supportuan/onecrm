'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  Plane,
  History,
  ListChecks,
} from 'lucide-react';
import {
  getApplication,
  updateApplication,
  advanceApplicationStage,
  addDocument,
  updateDocument,
  deleteDocument,
  uploadApplicationDocument,
  uploadOfferLetter,
  uploadVisaDocument,
  notifyMissingDocs,
  upsertOffer,
  upsertVisa,
  listCounsellors,
  getProcessStages,
} from '@/services/studentCrmApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { APPLICATION_STAGES, getNextStage, getStageLabel } from '@/features/student-crm/constants';
import {
  ApplicationHeader,
  ApplicationMetaEditor,
  StageStepper,
  DocumentChecklist,
  OfferLetterPanel,
  VisaPanel,
  AuditTimeline,
} from '@/features/student-crm/components/ApplicationParts';
import StaffApplicationFees from '@/features/student-crm/components/StaffApplicationFees';

const TABS = [
  { key: 'overview', label: 'Overview', icon: ListChecks },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'offer', label: 'Offer', icon: Briefcase },
  { key: 'visa', label: 'Visa', icon: Plane },
  { key: 'history', label: 'History', icon: History },
];

export default function ApplicationDetail({ applicationId }) {
  const router = useRouter();
  const { can } = usePermissions();
  const canManage = can('MANAGE_STUDENT_CRM');

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counsellors, setCounsellors] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [offerUploading, setOfferUploading] = useState(false);
  const [visaUploading, setVisaUploading] = useState(false);
  const [visaWorkflow, setVisaWorkflow] = useState([]);
  const [toast, setToast] = useState({ kind: '', msg: '' });
  const flash = (kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast({ kind: '', msg: '' }), 3000);
  };

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getApplication(applicationId);
      const data = res?.data || null;
      setApp(data);
      if (data?.country) {
        getProcessStages(data.country)
          .then((r) => setVisaWorkflow(r?.data?.visaWorkflow || []))
          .catch(() => setVisaWorkflow([]));
      }
    } catch (e) {
      flash('err', e?.message || 'failed to load application');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchDetail();
    listCounsellors()
      .then((r) => setCounsellors(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {});
  }, [fetchDetail]);

  const missingRequiredCount = useMemo(() => {
    if (!app?.documents) return 0;
    return app.documents.filter((d) => d.required && d.status === 'PENDING').length;
  }, [app]);

  const isFinal = app?.stage === 'ENROLLED' || app?.stage === 'OFFER_REJECTED';
  const isOverdue =
    app?.deadline &&
    new Date(app.deadline) < new Date() &&
    !['ENROLLED', 'OFFER_REJECTED'].includes(app.stage);

  const handleAdvance = async () => {
    if (!app) return;
    if (app.stage === 'ENROLLED' || app.stage === 'OFFER_REJECTED') return;
    const next = app.stage === 'OFFER_RECEIVED' ? 'OFFER_ACCEPTED' : getNextStage(app.stage);
    if (!next) return;
    try {
      await advanceApplicationStage(app.id, { stage: next });
      flash('ok', `Advanced to ${getStageLabel(next)}`);
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to advance stage');
    }
  };

  const handleJumpStage = async (stageKey) => {
    if (!app) return;
    try {
      await advanceApplicationStage(app.id, { stage: stageKey });
      flash('ok', 'Stage updated');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to set stage');
    }
  };

  const handleUpdateMeta = async (payload) => {
    if (!app) return;
    try {
      await updateApplication(app.id, payload);
      flash('ok', 'Application updated');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to update');
    }
  };

  const handleDocStatus = async (docId, status) => {
    if (!app) return;
    try {
      await updateDocument(app.id, docId, { status });
      flash('ok', 'Document updated');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to update document');
    }
  };

  const handleDocApprove = async (docId) => {
    if (!app) return;
    try {
      await updateDocument(app.id, docId, { status: 'VERIFIED' });
      flash('ok', 'Document approved');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to approve document');
    }
  };

  const handleDocReject = async (docId, notes) => {
    if (!app) return;
    try {
      await updateDocument(app.id, docId, { status: 'REJECTED', notes: notes || null });
      flash('ok', 'Document rejected — student notified');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to reject document');
    }
  };

  const handleDocDelete = async (docId) => {
    if (!app) return;
    try {
      await deleteDocument(app.id, docId);
      flash('ok', 'Document removed');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to delete document');
    }
  };

  const handleAddDoc = async (name) => {
    if (!app || !name) return;
    try {
      await addDocument(app.id, { name, required: true });
      flash('ok', 'Added to checklist');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to add document');
    }
  };

  const handleDocUpload = async (docId, file) => {
    if (!app || !file) return;
    setUploadingDocId(docId);
    try {
      await uploadApplicationDocument(app.id, docId, file);
      flash('ok', 'Document uploaded');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'upload failed');
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleOfferUpload = async (file) => {
    if (!app || !file) return;
    setOfferUploading(true);
    try {
      await uploadOfferLetter(app.id, file);
      flash('ok', 'Offer letter uploaded');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'upload failed');
    } finally {
      setOfferUploading(false);
    }
  };

  const handleNotifyMissing = async () => {
    if (!app) return;
    try {
      await notifyMissingDocs(app.id);
      flash('ok', 'Alert dispatched');
    } catch (e) {
      flash('err', e?.message || 'failed to send alert');
    }
  };

  const handleSaveOffer = async (payload) => {
    if (!app) return;
    const { fileUrl: _url, filename: _name, ...meta } = payload;
    try {
      await upsertOffer(app.id, meta);
      flash('ok', 'Offer details saved');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'failed to save offer');
    }
  };

  const handleSaveVisa = async (payload) => {
    if (!app) return;
    try {
      await upsertVisa(app.id, payload);
      flash('ok', 'Visa details saved');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'Failed to save visa details');
    }
  };

  const handleVisaUpload = async (file, label) => {
    if (!app || !file) return;
    setVisaUploading(true);
    try {
      await uploadVisaDocument(app.id, file, label);
      flash('ok', 'Visa document uploaded');
      fetchDetail();
    } catch (e) {
      flash('err', e?.message || 'Upload failed');
    } finally {
      setVisaUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-neutral-900">
        <BackLink />
        <div className="ui-surface p-16 text-center ui-text-meta">Loading application…</div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-neutral-900">
        <BackLink />
        <div className="ui-surface p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 mx-auto flex items-center justify-center">
            <FileText size={18} className="text-neutral-400" />
          </div>
          <p className="ui-text-strong mt-4">Application not found.</p>
          <p className="ui-text-meta mt-1">It may have been removed.</p>
        </div>
      </div>
    );
  }

  const student = app.student || null;

  return (
    <div className="text-neutral-900">
      {toast.msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 ui-text-strong !text-white ${
            toast.kind === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      <BackLink />

      <div className="space-y-5">
        <ApplicationHeader
          app={app}
          student={student}
          canManage={canManage}
          onAdvance={handleAdvance}
          isFinal={isFinal}
          isOverdue={isOverdue}
        />

        <StageStepper app={app} onJump={canManage ? handleJumpStage : null} />

        {/* Tabs */}
        <div className="ui-surface">
          <div className="px-2 sm:px-4 border-b border-neutral-100">
            <nav role="tablist" className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.key;
                const badge =
                  t.key === 'documents' && missingRequiredCount > 0 ? missingRequiredCount : null;
                return (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={isActive}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={`relative flex items-center gap-2 px-4 py-3 ui-text-strong whitespace-nowrap transition-all ${
                      isActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-neutral-900' : 'text-neutral-400'} />
                    {t.label}
                    {badge != null && (
                      <span className="ml-0.5 px-1.5 py-px rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">
                        {badge}
                      </span>
                    )}
                    <span
                      className={`absolute left-3 right-3 -bottom-px h-[2px] rounded-full transition-all ${
                        isActive ? 'bg-neutral-900' : 'bg-transparent'
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-5 sm:p-6 space-y-5 bg-neutral-50/40">
            {activeTab === 'overview' && (
              <>
                <ApplicationMetaEditor
                  app={app}
                  counsellors={counsellors}
                  canManage={canManage}
                  onSave={handleUpdateMeta}
                />
                <StaffApplicationFees app={app} canManage={canManage} onSaved={fetchDetail} />
              </>
            )}
            {activeTab === 'documents' && (
              <DocumentChecklist
                app={app}
                canManage={canManage}
                onStatus={handleDocStatus}
                onApprove={handleDocApprove}
                onReject={handleDocReject}
                onDelete={handleDocDelete}
                onAdd={handleAddDoc}
                onUpload={handleDocUpload}
                uploadingDocId={uploadingDocId}
                missingCount={missingRequiredCount}
                onNotifyMissing={handleNotifyMissing}
              />
            )}
            {activeTab === 'offer' && (
              <OfferLetterPanel
                app={app}
                canManage={canManage}
                onSave={handleSaveOffer}
                onUpload={handleOfferUpload}
                uploading={offerUploading}
              />
            )}
            {activeTab === 'visa' && (
              <VisaPanel
                app={app}
                canManage={canManage}
                onSave={handleSaveVisa}
                onUpload={handleVisaUpload}
                uploading={visaUploading}
                workflow={visaWorkflow}
              />
            )}
            {activeTab === 'history' && <AuditTimeline app={app} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/student-crm/applications"
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 hover:text-neutral-900 mb-4 transition-all"
    >
      <ArrowLeft size={13} /> All applications
    </Link>
  );
}
