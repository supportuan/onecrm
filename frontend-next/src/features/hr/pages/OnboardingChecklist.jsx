'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle2, Circle, Plus, User, Calendar,
  FileText, Shield, BookOpen, ChevronDown, ChevronUp, X, Save,
  Upload, ExternalLink, Settings,
} from 'lucide-react';
import {
  getOnboardingChecklists,
  createOnboardingChecklist,
  updateOnboardingItem,
  getOnboardingTemplates,
  createOnboardingTemplate,
  deleteOnboardingTemplate,
  getEmployees,
  uploadOnboardingItemAttachment,
} from '@/services/hrApi';

const DEFAULT_TEMPLATE_ITEMS = [
  { category: 'DOCUMENTS', title: 'Signed Offer Letter', dueOffsetDays: 0, assigneeRole: 'HR' },
  { category: 'DOCUMENTS', title: 'ID Proof & Address Proof', dueOffsetDays: 1, assigneeRole: 'Employee' },
  { category: 'DOCUMENTS', title: 'Bank Account Details', dueOffsetDays: 2, assigneeRole: 'Employee' },
  { category: 'ACCESS', title: 'Email & SSO Account', dueOffsetDays: 0, assigneeRole: 'IT' },
  { category: 'ACCESS', title: 'Laptop / Equipment', dueOffsetDays: 1, assigneeRole: 'IT' },
  { category: 'TRAINING', title: 'Orientation Session', dueOffsetDays: 3, assigneeRole: 'HR' },
  { category: 'TRAINING', title: 'Compliance Training', dueOffsetDays: 7, assigneeRole: 'HR' },
];

const CATEGORY_META = {
  DOCUMENTS: { label: 'Documents', icon: FileText, color: 'blue' },
  ACCESS: { label: 'System Access', icon: Shield, color: 'purple' },
  TRAINING: { label: 'Training', icon: BookOpen, color: 'green' },
};

const STATUS_BADGE = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

export default function OnboardingChecklist() {
  const [checklists, setChecklists] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ employeeId: '', employeeName: '', startDate: '', templateId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(null);

  useEffect(() => {
    fetchChecklists();
    fetchTemplates();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      if (res.success) setEmployees(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await getOnboardingTemplates();
      if (res.success) setTemplates(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChecklists = async () => {
    setLoading(true);
    try {
      const res = await getOnboardingChecklists();
      if (res.success) setChecklists(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChecklist = async () => {
    if (!form.employeeId || !form.employeeName || !form.startDate) return;
    setSubmitting(true);
    try {
      const payload = {
        employeeId: form.employeeId,
        employeeName: form.employeeName,
        startDate: form.startDate,
        ...(form.templateId ? { templateId: form.templateId } : {}),
      };
      const res = await createOnboardingChecklist(payload);
      if (res.success) {
        setChecklists(prev => [...prev, res.data]);
        setShowCreateModal(false);
        setForm({ employeeId: '', employeeName: '', startDate: '', templateId: '' });
        showSuccess('Onboarding checklist created');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmployeePick = (e) => {
    const emp = employees.find((x) => x.id === e.target.value);
    setForm((f) => ({
      ...f,
      employeeId: emp?.id || '',
      employeeName: emp?.name || '',
    }));
  };

  const handleItemUpload = async (checklist, item, file) => {
    if (!file) return;
    setUploadBusy(item.id);
    try {
      const res = await uploadOnboardingItemAttachment(checklist.id, item.id, file);
      if (res.success) {
        setChecklists((prev) => prev.map((c) => (c.id === res.data.id ? res.data : c)));
        showSuccess('Document attached');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadBusy(null);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    try {
      const res = await createOnboardingTemplate({
        name: newTemplateName.trim(),
        items: DEFAULT_TEMPLATE_ITEMS,
      });
      if (res.success) {
        setTemplates((prev) => [...prev, res.data]);
        setNewTemplateName('');
        showSuccess('Template created');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this onboarding template?')) return;
    try {
      const res = await deleteOnboardingTemplate(id);
      if (res.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        showSuccess('Template deleted');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleItem = async (checklist, item) => {
    const newStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const res = await updateOnboardingItem(checklist.id, item.id, { status: newStatus, completedBy: 'HR Manager' });
      if (res.success) {
        setChecklists(prev => prev.map(c => c.id === res.data.id ? res.data : c));
        showSuccess(`Item marked as ${newStatus.toLowerCase()}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const getProgress = (items) => {
    const done = items.filter(i => i.status === 'COMPLETED').length;
    return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  };

  const groupByCategory = (items) => {
    const groups = {};
    for (const item of items) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  };

  return (
    <div className="ui-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            Employee Onboarding
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track documents, system access, and training for new employees</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" /> Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Checklist
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400 text-sm">Loading checklists...</div>
      ) : (
        <div className="space-y-4">
          {checklists.map(checklist => {
            const { done, total, pct } = getProgress(checklist.items);
            const isExpanded = expandedId === checklist.id;
            const groups = groupByCategory(checklist.items);

            return (
              <div key={checklist.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Checklist Header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : checklist.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{checklist.employeeName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Start: {new Date(checklist.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{done}/{total} tasks</p>
                      <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-1">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[checklist.status]}`}>
                      {checklist.status.replace('_', ' ')}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Items */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-5">
                    {Object.entries(groups).map(([category, items]) => {
                      const meta = CATEGORY_META[category];
                      const Icon = meta.icon;
                      return (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 text-${meta.color}-500`} />
                            <span className="text-sm font-semibold text-gray-700">{meta.label}</span>
                          </div>
                          <div className="space-y-2 pl-6">
                            {items.map(item => (
                              <div key={item.id} className="flex items-start gap-3 group">
                                <button
                                  onClick={() => handleToggleItem(checklist, item)}
                                  className="mt-0.5 shrink-0"
                                >
                                  {item.status === 'COMPLETED'
                                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    : <Circle className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
                                  }
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${item.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                    {item.title}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-0.5 text-[10px] text-gray-400">
                                    {item.dueDate && <span>Due: {item.dueDate}</span>}
                                    {item.assignee && <span>Assignee: {item.assignee}</span>}
                                  </div>
                                  {item.attachmentUrl && (
                                    <a href={item.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-0.5 mt-0.5">
                                      <ExternalLink className="w-3 h-3" /> {item.attachmentFileName || 'Attachment'}
                                    </a>
                                  )}
                                  {item.category === 'DOCUMENTS' && item.status !== 'COMPLETED' && (
                                    <label className="text-[10px] text-gray-500 flex items-center gap-1 mt-1 cursor-pointer">
                                      <Upload className="w-3 h-3" />
                                      {uploadBusy === item.id ? 'Uploading…' : 'Upload file'}
                                      <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        className="hidden"
                                        onChange={(e) => handleItemUpload(checklist, item, e.target.files?.[0])}
                                      />
                                    </label>
                                  )}
                                  {item.completedAt && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      Completed by {item.completedBy} · {new Date(item.completedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {!checklists.length && (
            <div className="text-center py-16 text-gray-400 text-sm">
              No onboarding checklists yet. Create one for a new employee.
            </div>
          )}
        </div>
      )}

      {showTemplates && (
        <div className="fixed inset-0 bg-brand/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Onboarding Templates</h2>
              <button onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 mb-6">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.name}{t.isDefault ? ' (default)' : ''}</p>
                    <p className="text-xs text-gray-400">{t.items?.length ?? 0} items</p>
                  </div>
                  {!t.isDefault && (
                    <button onClick={() => handleDeleteTemplate(t.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  )}
                </div>
              ))}
              {!templates.length && <p className="text-sm text-gray-400">No custom templates yet.</p>}
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-medium text-gray-600">Create from standard checklist</p>
              <input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={handleCreateTemplate} className="w-full bg-brand text-white py-2 rounded-lg text-sm">
                Save template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-brand/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">New Onboarding Checklist</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Employee</label>
                <select
                  value={form.employeeId}
                  onChange={handleEmployeePick}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select employee…</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Onboarding template</label>
                <select
                  value={form.templateId}
                  onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Default checklist</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (default)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChecklist}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Create Checklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
