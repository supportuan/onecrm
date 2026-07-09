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
} from '@/services/studentCrmApi';
import {
  DocumentChecklist,
  StudentOfferPanel,
  StudentVisaPanel,
  formatDate,
} from '@/features/student-crm/components/ApplicationParts';
import { getStageLabel } from '@/features/student-crm/constants';

export default function StudentApplicationDetail({ applicationId }) {
  const [app, setApp] = useState(null);
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
        <Link href="/applicant/applications" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft size={14} /> Back to applications
        </Link>
        <p className="text-sm text-neutral-500">Application not found.</p>
      </div>
    );
  }

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
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeft size={14} /> Back to applications
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">{app.university}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {app.applicationCode} · {app.course} · {getStageLabel(app.stage)}
          {app.deadline && (
            <span className="ml-2 text-neutral-400">· Deadline {formatDate(app.deadline)}</span>
          )}
        </p>
      </div>

      <StudentOfferPanel
        app={app}
        busy={offerBusy}
        onAccept={() => handleOfferDecision('ACCEPTED')}
        onReject={() => handleOfferDecision('REJECTED')}
      />

      <StudentVisaPanel app={app} workflow={workflow} />

      <DocumentChecklist
        app={app}
        canManage={false}
        canUpload
        onUpload={handleDocUpload}
        uploadingDocId={uploadingDocId}
      />
    </div>
  );
}
