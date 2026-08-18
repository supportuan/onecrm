'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import {
  getApplication,
  updateApplication,
  addDocument,
  updateDocument,
  deleteDocument,
  uploadApplicationDocument,
  uploadOfferLetter,
  uploadVisaDocument,
  uploadVisaChecklistDocument,
  addVisaDocument,
  updateVisaDocument,
  deleteVisaDocument,
  notifyMissingDocs,
  upsertOffer,
  upsertVisa,
  listCounsellors,
  getProcessStages,
  createApplicationTask,
  updateApplicationTask,
  deleteApplicationTask,
  saveWorkflowProgress,
  updateStudent,
} from '@/services/studentCrmApi';
import { getFormOptions } from '@/services/crmSettingsApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { useAuth } from '@/lib/auth/AuthContext';
import SimpleWorkflowAccordion from '@/features/student-crm/components/SimpleWorkflowAccordion';
import { compressUploadFile } from '@/features/student-crm/compressUpload';

export default function ApplicationDetail({ applicationId }) {
  const router = useRouter();
  const { can } = usePermissions();
  const { user } = useAuth();
  const canManage = can('MANAGE_STUDENT_CRM');

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counsellors, setCounsellors] = useState([]);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [offerUploading, setOfferUploading] = useState(false);
  const [visaUploading, setVisaUploading] = useState(false);
  const [visaUploadingDocId, setVisaUploadingDocId] = useState(null);
  const [taskBusy, setTaskBusy] = useState(false);
  const [visaWorkflow, setVisaWorkflow] = useState([]);
  const [formOptions, setFormOptions] = useState({ countries: [], industries: [] });
  const [toast, setToast] = useState({ kind: '', msg: '' });
  const flash = (kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast({ kind: '', msg: '' }), 3000);
  };

  const fetchDetail = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchDetail();
    listCounsellors()
      .then((r) => setCounsellors(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {});
    getFormOptions()
      .then((r) => setFormOptions(r?.data || { countries: [], industries: [] }))
      .catch(() => {});
  }, [fetchDetail]);

  const missingRequiredCount = useMemo(() => {
    if (!app?.documents) return 0;
    return app.documents.filter((d) => d.required && d.status === 'PENDING').length;
  }, [app]);

  const handleSaveStudentInfo = async (payload) => {
    const studentId = app?.student?.id || app?.studentId;
    if (!studentId) return;
    try {
      await updateStudent(studentId, payload);
      flash('ok', 'Student details updated');
      await fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'failed to update student');
    }
  };

  const handleUpdateMeta = async (payload) => {
    if (!app) return;
    try {
      await updateApplication(app.id, payload);
      flash('ok', 'Application updated');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'failed to update');
    }
  };

  const handleSaveWorkflowProgress = async (payload) => {
    if (!app) return;
    try {
      await saveWorkflowProgress(app.id, payload);
      flash('ok', 'Section saved');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'failed to save section');
    }
  };

  const handleDocStatus = async (docId, status) => {
    if (!app) return;
    try {
      await updateDocument(app.id, docId, { status });
      flash('ok', 'Document updated');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'failed to update document');
    }
  };

  const handleDocApprove = async (docId) => {
    if (!app) return;
    try {
      await updateDocument(app.id, docId, { status: 'VERIFIED' });
      flash('ok', 'Document approved');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'failed to approve document');
    }
  };

  const handleDocReject = async (docId, notes) => {
    if (!app) return;
    try {
      await updateDocument(app.id, docId, { status: 'REJECTED', notes: notes || null });
      flash('ok', 'Document rejected — student notified');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'failed to reject document');
    }
  };

  const handleDocDelete = async (docId) => {
    if (!app) return;
    try {
      await deleteDocument(app.id, docId);
      flash('ok', 'Document removed');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'failed to delete document');
    }
  };

  const handleDocClearFile = async (docId) => {
    if (!app) return;
    try {
      await updateDocument(app.id, docId, { fileUrl: null, filename: null, status: 'PENDING', notes: null });
      flash('ok', 'File deleted');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'failed to delete file');
    }
  };

  const handleAddDoc = async (name) => {
    if (!app || !name) return;
    try {
      const created = await addDocument(app.id, { name, required: true });
      await fetchDetail({ silent: true });
      return created?.data || created;
    } catch (e) {
      flash('err', e?.message || 'failed to add document');
    }
    return null;
  };

  const handleDocUpload = async (docId, file) => {
    if (!app || !file) return;
    setUploadingDocId(docId);
    try {
      await uploadApplicationDocument(app.id, docId, await compressUploadFile(file));
      flash('ok', 'Document uploaded');
      fetchDetail({ silent: true });
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
      await uploadOfferLetter(app.id, await compressUploadFile(file));
      flash('ok', 'Offer letter uploaded');
      fetchDetail({ silent: true });
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
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'failed to save offer');
    }
  };

  const handleSaveVisa = async (payload) => {
    if (!app) return;
    try {
      await upsertVisa(app.id, payload);
      flash('ok', 'Visa details saved');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'Failed to save visa details');
    }
  };

  const handleVisaUpload = async (file, label) => {
    if (!app || !file) return;
    setVisaUploading(true);
    try {
      await uploadVisaDocument(app.id, await compressUploadFile(file), label);
      flash('ok', 'Visa document uploaded');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'Upload failed');
    } finally {
      setVisaUploading(false);
    }
  };

  const handleVisaChecklistUpload = async (docId, file) => {
    if (!app || !file) return;
    setVisaUploadingDocId(docId);
    try {
      await uploadVisaChecklistDocument(app.id, docId, await compressUploadFile(file));
      flash('ok', 'Visa document uploaded');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'Upload failed');
    } finally {
      setVisaUploadingDocId(null);
    }
  };

  const handleAddVisaDoc = async (name) => {
    if (!app) return;
    try {
      await addVisaDocument(app.id, { name, required: true });
      flash('ok', 'Checklist item added');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'Failed to add item');
    }
  };

  const handleVisaDocStatus = async (docId, status) => {
    if (!app) return;
    try {
      await updateVisaDocument(app.id, docId, { status });
      flash('ok', `Document ${status.toLowerCase()}`);
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'Update failed');
    }
  };

  const handleDeleteVisaDoc = async (docId) => {
    if (!app || !confirm('Remove this visa document item?')) return;
    try {
      await deleteVisaDocument(app.id, docId);
      flash('ok', 'Removed');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'Delete failed');
    }
  };

  const handleCreateTask = async (payload) => {
    if (!app) return;
    setTaskBusy(true);
    try {
      await createApplicationTask(app.id, payload);
      flash('ok', 'Task created');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'Failed to create task');
    } finally {
      setTaskBusy(false);
    }
  };

  const handleUpdateTask = async (taskId, payload) => {
    if (!app) return;
    try {
      await updateApplicationTask(app.id, taskId, payload);
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!app || !confirm('Delete this task?')) return;
    try {
      await deleteApplicationTask(app.id, taskId);
      flash('ok', 'Task deleted');
      fetchDetail({ silent: true });
    } catch (e) {
      flash('err', e?.message || 'Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="text-brand">
        <BackLink />
        <div className="ui-surface p-16 text-center ui-text-meta">Loading application…</div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-brand">
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

  return (
    <div className="text-brand">
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

      <div className="space-y-5">
        <SimpleWorkflowAccordion
          app={app}
          canManage={canManage}
          counsellors={counsellors}
          formOptions={formOptions}
          onSaveWorkflowProgress={handleSaveWorkflowProgress}
          onSaved={fetchDetail}
          variant="detail"
          handlers={{
            onUpdateMeta: handleUpdateMeta,
            onSaveStudentInfo: handleSaveStudentInfo,
            onDocStatus: handleDocStatus,
            onDocApprove: handleDocApprove,
            onDocReject: handleDocReject,
            onDocDelete: handleDocDelete,
            onDocClearFile: handleDocClearFile,
            onAddDoc: handleAddDoc,
            onDocUpload: handleDocUpload,
            uploadingDocId,
            onNotifyMissing: handleNotifyMissing,
            onCreateTask: handleCreateTask,
            onUpdateTask: handleUpdateTask,
            onDeleteTask: handleDeleteTask,
            taskBusy,
            onSaveOffer: handleSaveOffer,
            onOfferUpload: handleOfferUpload,
            offerUploading,
            onSaveVisa: handleSaveVisa,
            onVisaUpload: handleVisaUpload,
            onVisaChecklistUpload: handleVisaChecklistUpload,
            onAddVisaDoc: handleAddVisaDoc,
            onVisaDocStatus: handleVisaDocStatus,
            onDeleteVisaDoc: handleDeleteVisaDoc,
            visaUploading,
            visaUploadingDocId,
            visaWorkflow,
            missingRequiredCount,
            currentUserId: user?.id,
          }}
        />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/student-crm/applications"
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 hover:text-brand mb-4 transition-all"
    >
      <ArrowLeft size={13} /> All applications
    </Link>
  );
}
