'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  User,
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  getEmployeeById,
  updateEmployee,
  getEmployeeDocuments,
  uploadEmployeeDocument,
  deleteEmployeeDocument,
} from '@/services/hrApi';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On leave' },
  { value: 'RESIGNED', label: 'Resigned' },
  { value: 'TERMINATED', label: 'Terminated' },
];

const DOC_TYPES = [
  { value: 'OFFER_LETTER', label: 'Offer letter' },
  { value: 'ID_PROOF', label: 'ID proof' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'OTHER', label: 'Other' },
];

const DOC_TYPE_LABEL = Object.fromEntries(DOC_TYPES.map((t) => [t.value, t.label]));

const statusBadgeClass = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'ON_LEAVE':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'RESIGNED':
      return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    case 'TERMINATED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-neutral-50 text-neutral-600 border-neutral-200';
  }
};

const emptyForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  location: '',
  biometricId: '',
  joiningDate: '',
  managerId: '',
  access_role: 'EMPLOYEE',
  employmentStatus: 'ACTIVE',
  resignedAt: '',
  terminatedAt: '',
  exitReason: '',
});

export default function EmployeeDetailModal({ employee, allEmployees, onClose, onSaved }) {
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState(emptyForm());
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [uploadType, setUploadType] = useState('ID_PROOF');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [docBusy, setDocBusy] = useState(false);

  useEffect(() => {
    if (!employee?.id) return;
    loadEmployee();
  }, [employee?.id]);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const [empRes, docsRes] = await Promise.all([
        getEmployeeById(employee.id),
        getEmployeeDocuments(employee.id),
      ]);
      if (empRes.success && empRes.data) {
        const e = empRes.data;
        setForm({
          firstName: e.firstName || e.first_name || '',
          lastName: e.lastName || e.last_name || '',
          email: e.email || '',
          phone: e.phone || '',
          department: e.department || '',
          designation: e.designation || '',
          location: e.location || '',
          biometricId: e.biometricId || '',
          joiningDate: e.joiningDate || '',
          managerId: e.managerId || '',
          access_role: e.access_role || 'EMPLOYEE',
          employmentStatus: e.employmentStatus || 'ACTIVE',
          resignedAt: e.resignedAt ? e.resignedAt.slice(0, 10) : '',
          terminatedAt: e.terminatedAt ? e.terminatedAt.slice(0, 10) : '',
          exitReason: e.exitReason || '',
        });
      }
      if (docsRes.success) setDocuments(docsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        ...form,
        managerId: form.managerId || null,
        resignedAt: form.resignedAt || null,
        terminatedAt: form.terminatedAt || null,
        exitReason: form.exitReason || null,
      };
      const res = await updateEmployee(employee.id, payload);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Profile saved' });
        onSaved?.(res.data);
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to save' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Connection error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setDocBusy(true);
    setFeedback(null);
    try {
      const res = await uploadEmployeeDocument(employee.id, uploadFile, {
        type: uploadType,
        notes: uploadNotes || undefined,
      });
      if (res.success) {
        setDocuments((prev) => [res.data, ...prev]);
        setUploadFile(null);
        setUploadNotes('');
        setFeedback({ type: 'success', text: 'Document uploaded' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setDocBusy(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm('Delete this document?')) return;
    setDocBusy(true);
    try {
      const res = await deleteEmployeeDocument(employee.id, docId);
      if (res.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDocBusy(false);
    }
  };

  const managerOptions = allEmployees.filter((e) => e.id !== employee.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="ui-modal w-full max-w-3xl max-h-[90vh] flex flex-col scale-100 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">{employee.name}</h2>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
              {employee.employeeId} · {employee.email}
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-neutral-200 px-6 gap-6 shrink-0">
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'profile'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <User size={14} /> Profile
          </button>
          <button
            type="button"
            onClick={() => setTab('documents')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'documents'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <FileText size={14} /> Documents ({documents.length})
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-neutral-600" size={24} />
              <p className="text-xs text-neutral-500">Loading employee…</p>
            </div>
          ) : tab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">First name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Last name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Designation</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Joining date</label>
                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Manager</label>
                  <select
                    value={form.managerId}
                    onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  >
                    <option value="">No manager</option>
                    {managerOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Biometric ID</label>
                  <input
                    type="text"
                    value={form.biometricId}
                    onChange={(e) => setForm({ ...form, biometricId: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Access role</label>
                  <select
                    value={form.access_role}
                    onChange={(e) => setForm({ ...form, access_role: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  >
                    <option value="EMPLOYEE">Standard employee</option>
                    <option value="HR_MANAGER">HR manager</option>
                    <option value="PAYROLL_ADMIN">Payroll admin</option>
                    <option value="SUPER_ADMIN">Super administrator</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Employment status</label>
                  <select
                    value={form.employmentStatus}
                    onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(form.employmentStatus === 'RESIGNED' || form.employmentStatus === 'TERMINATED') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-neutral-500 ml-1">
                      {form.employmentStatus === 'RESIGNED' ? 'Resignation date' : 'Termination date'}
                    </label>
                    <input
                      type="date"
                      value={form.employmentStatus === 'RESIGNED' ? form.resignedAt : form.terminatedAt}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          ...(form.employmentStatus === 'RESIGNED'
                            ? { resignedAt: e.target.value }
                            : { terminatedAt: e.target.value }),
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-[10px] font-semibold text-neutral-500 ml-1">Exit reason</label>
                    <input
                      type="text"
                      value={form.exitReason}
                      onChange={(e) => setForm({ ...form, exitReason: e.target.value })}
                      placeholder="Optional notes"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {feedback && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 border text-xs font-semibold ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {feedback.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-neutral-200 rounded-lg text-[10px] font-semibold hover:bg-neutral-50 text-neutral-600"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-neutral-900 text-white rounded-lg font-semibold text-[10px] disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save profile
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="ui-panel p-5 space-y-4">
                <h3 className="text-xs font-semibold text-neutral-700">Upload document</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  >
                    {DOC_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.html"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs col-span-1 md:col-span-1"
                  />
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!uploadFile || docBusy}
                  className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                >
                  {docBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Upload
                </button>
              </div>

              {feedback && tab === 'documents' && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 border text-xs font-semibold ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <div className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-8">No documents stored yet.</p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-800 truncate">{doc.fileName}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          {DOC_TYPE_LABEL[doc.type] || doc.type} ·{' '}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                        {doc.notes && (
                          <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{doc.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg bg-white"
                          title="Open"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          disabled={docBusy}
                          className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg bg-white disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { statusBadgeClass, STATUS_OPTIONS };
