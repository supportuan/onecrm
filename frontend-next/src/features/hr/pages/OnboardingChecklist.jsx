'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle2, Circle, Plus, User, Calendar,
  FileText, Shield, BookOpen, ChevronDown, ChevronUp, X, Save
} from 'lucide-react';
import {
  getOnboardingChecklists,
  createOnboardingChecklist,
  updateOnboardingItem
} from '@/services/hrApi';

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
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ employeeId: '', employeeName: '', startDate: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChecklists();
  }, []);

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
      const res = await createOnboardingChecklist(form);
      if (res.success) {
        setChecklists(prev => [...prev, res.data]);
        setShowCreateModal(false);
        setForm({ employeeId: '', employeeName: '', startDate: '' });
        showSuccess('Onboarding checklist created');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
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
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Checklist
        </button>
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
                                <div className="flex-1">
                                  <p className={`text-sm ${item.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                    {item.title}
                                  </p>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">New Onboarding Checklist</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Employee ID</label>
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  placeholder="e.g. E005"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Employee Name</label>
                <input
                  type="text"
                  value={form.employeeName}
                  onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
