'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getAutomations,
  getAutomationById,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  getAutomationSummary
} from '../../services/marketingApi';
import {
  Search,
  Plus,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  Trash2,
  Info,
  Calendar,
  Cpu,
  Mail,
  Smartphone,
  MessageSquare
} from 'lucide-react';

const mapStatusLabel = (status) => {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'PAUSED': return 'Paused';
    case 'DRAFT': return 'Draft';
    default: return status;
  }
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'ACTIVE': return 'border-emerald-200 bg-emerald-50/50 text-emerald-700';
    case 'PAUSED': return 'border-amber-200 bg-amber-50/50 text-amber-700';
    case 'DRAFT': return 'border-neutral-200 bg-neutral-50/50 text-neutral-600';
    default: return 'border-neutral-200 bg-neutral-50/50 text-neutral-700';
  }
};

const Automation = () => {
  const [automations, setAutomations] = useState([]);
  const [summary, setSummary] = useState({
    totalActiveWorkflows: 8,
    leadsAutomated: 2450,
    emailsSent: 18320,
    whatsappMessages: 6740,
    smsSent: 3120,
    engagementRate: 34.5
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters, Pagination, & Sorting State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(5); // 5 compact rows matches screenshot perfectly
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  // Form State for Add / Edit
  const [workflowForm, setWorkflowForm] = useState({
    workflowName: '',
    trigger: '',
    action: '',
    status: 'ACTIVE',
    emailsSent: 0,
    whatsappMessages: 0,
    smsSent: 0,
    leadsAutomated: 0,
    engagementRate: 0.0
  });

  // Fetch automations and summary from backend API
  const fetchAutomationsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAutomations({
        search,
        page,
        limit,
        sortBy,
        sortOrder
      });

      if (response.success) {
        setAutomations(response.data.items || []);
        setTotalCount(response.data.total || 0);

        // Also fetch the summary stats
        const summaryRes = await getAutomationSummary();
        if (summaryRes.success) {
          setSummary(summaryRes.data);
        } else if (response.data.summary) {
          setSummary(response.data.summary);
        }
      } else {
        setError(response.message || 'Failed to retrieve automation workflows.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend marketing automation services failed. Please check backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomationsData();
  }, [search, page]);

  // Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...workflowForm,
        emailsSent: workflowForm.emailsSent ? parseInt(workflowForm.emailsSent) : 0,
        whatsappMessages: workflowForm.whatsappMessages ? parseInt(workflowForm.whatsappMessages) : 0,
        smsSent: workflowForm.smsSent ? parseInt(workflowForm.smsSent) : 0,
        leadsAutomated: workflowForm.leadsAutomated ? parseInt(workflowForm.leadsAutomated) : 0,
        engagementRate: workflowForm.engagementRate ? parseFloat(workflowForm.engagementRate) : 0.0
      };

      const response = await createAutomation(payload);
      if (response.success) {
        setIsCreateOpen(false);
        setWorkflowForm({
          workflowName: '',
          trigger: '',
          action: '',
          status: 'ACTIVE',
          emailsSent: 0,
          whatsappMessages: 0,
          smsSent: 0,
          leadsAutomated: 0,
          engagementRate: 0.0
        });
        fetchAutomationsData();
      } else {
        alert(response.message || 'Failed to create automation flow.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend flow creator.');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (flow) => {
    setSelectedWorkflow(flow);
    setWorkflowForm({
      workflowName: flow.workflowName || '',
      trigger: flow.trigger || '',
      action: flow.action || '',
      status: flow.status || 'ACTIVE',
      emailsSent: flow.emailsSent || 0,
      whatsappMessages: flow.whatsappMessages || 0,
      smsSent: flow.smsSent || 0,
      leadsAutomated: flow.leadsAutomated || 0,
      engagementRate: flow.engagementRate || 0.0
    });
    setIsEditOpen(true);
  };

  // Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...workflowForm,
        emailsSent: parseInt(workflowForm.emailsSent),
        whatsappMessages: parseInt(workflowForm.whatsappMessages),
        smsSent: parseInt(workflowForm.smsSent),
        leadsAutomated: parseInt(workflowForm.leadsAutomated),
        engagementRate: parseFloat(workflowForm.engagementRate)
      };

      const response = await updateAutomation(selectedWorkflow.id, payload);
      if (response.success) {
        setIsEditOpen(false);
        fetchAutomationsData();
      } else {
        alert(response.message || 'Failed to update automation flow.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend flow updater.');
    }
  };

  // Soft Delete Flow
  const handleDeleteFlow = async (id) => {
    if (!window.confirm('Are you sure you want to delete this automation workflow?')) return;
    try {
      const response = await deleteAutomation(id);
      if (response.success) {
        fetchAutomationsData();
      } else {
        alert(response.message || 'Failed to delete automation flow.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend flow deleter.');
    }
  };

  // Pagination bounds
  const totalPages = Math.ceil(totalCount / limit);
  const startRow = (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, totalCount);

  return (
    <div className="space-y-6">
      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-2 py-1.5 rounded-lg border border-neutral-200/50 shadow-xs">
        <div className="flex flex-1 items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 sm:max-w-md shadow-xs transition focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-neutral-900/60">
          <Search className="h-5 w-5 text-neutral-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search flow..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-500 font-semibold"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-neutral-500 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => {
            setWorkflowForm({
              workflowName: '',
              trigger: '',
              action: '',
              status: 'ACTIVE',
              emailsSent: 0,
              whatsappMessages: 0,
              smsSent: 0,
              leadsAutomated: 0,
              engagementRate: 0.0
            });
            setIsCreateOpen(true);
          }}
          className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-md active:scale-95 hover:shadow-lg"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Add flow
        </button>
      </div>

      {/* ERROR FEEDBACK */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg text-sm font-semibold shadow-xs animate-in slide-in-from-top-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* DUAL SECTION LAYOUT */}
      {loading && automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-lg border border-neutral-200 shadow-xs">
          <Loader2 className="h-10 w-10 text-brand animate-spin" />
          <p className="text-sm text-neutral-500 font-semibold mt-4">Retrieving active marketing automations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Active Automation Workflows Table Card (3/5 columns) */}
          <div className="lg:col-span-3 bg-white border border-neutral-200/80 rounded-[20px] shadow-2xs overflow-hidden flex flex-col justify-between min-h-[480px]">
            <div>
              <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
                <h2 className="text-lg font-extrabold text-brand tracking-tight">Active Automation Workflows</h2>
                <button
                  onClick={() => setSearch('')}
                  className="border border-neutral-200 hover:bg-neutral-50 px-4 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 flex items-center gap-1.5 transition cursor-pointer shadow-3xs active:scale-95"
                >
                  View All
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-500 stroke-[2.5]" />
                </button>
              </div>

              {automations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                  <Cpu className="h-12 w-12 text-neutral-600 mb-3" />
                  <h3 className="text-lg font-semibold text-neutral-700">No automation workflows found</h3>
                  <p className="text-sm text-neutral-500 font-medium mt-1">Create a new trigger-based stream or adjust filters to begin.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-neutral-100 font-semibold text-xs text-[#556987]">
                        <th className="px-6 py-4">Workflow Name</th>
                        <th className="px-5 py-4">Trigger</th>
                        <th className="px-5 py-4">Action</th>
                        <th className="px-5 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-sm font-semibold text-neutral-700">
                      {automations.map((flow) => (
                        <tr key={flow.id} className="hover:bg-neutral-50/50 transition">
                          {/* Workflow Name */}
                          <td className="px-6 py-4.5">
                            <span className="font-semibold text-brand block leading-tight">{flow.workflowName}</span>
                          </td>
                          {/* Trigger */}
                          <td className="px-5 py-4.5 text-xs text-neutral-500 font-semibold max-w-[150px] truncate">
                            {flow.trigger}
                          </td>
                          {/* Action */}
                          <td className="px-5 py-4.5 text-xs text-neutral-600 font-semibold max-w-[180px] truncate">
                            {flow.action}
                          </td>
                          {/* Status Badge */}
                          <td className="px-5 py-4.5 text-center">
                            <span className={`inline-flex px-3 py-1 rounded-full border text-[11px] font-bold tracking-wide ${getStatusStyle(flow.status)}`}>
                              {mapStatusLabel(flow.status)}
                            </span>
                          </td>
                          {/* Actions */}
                          <td className="px-6 py-4.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEdit(flow)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-neutral-500 hover:text-neutral-600 transition cursor-pointer"
                                title="Edit Details"
                              >
                                <Settings className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteFlow(flow.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-neutral-500 hover:text-red-600 transition cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Table pagination / footer info */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4 bg-[#f8fafc]/50">
                <span className="text-neutral-500 text-xs font-semibold">
                  Showing {startRow} to {endRow} of {totalCount} flows
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="p-1.5 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition disabled:opacity-50 cursor-pointer disabled:pointer-events-none active:scale-95"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-neutral-600 stroke-[2.5]" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition active:scale-95 ${page === p ? 'bg-brand text-white font-extrabold shadow-sm' : 'bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition disabled:opacity-50 cursor-pointer disabled:pointer-events-none active:scale-95"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-600 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Automation Performance Summary Card (2/5 columns) */}
          <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-[20px] shadow-2xs p-6 flex flex-col justify-between min-h-[480px]">
            <div>
              <h2 className="text-[17px] font-semibold text-brand tracking-tight border-b border-neutral-100 pb-4 mb-2 text-left">
                Automation Performance Summary
              </h2>

              <div className="divide-y divide-neutral-100 font-semibold text-[13.5px] text-neutral-600">
                <div className="py-4 flex justify-between items-center">
                  <span>Total active Workflows</span>
                  <strong className="text-[15px] text-brand font-semibold">
                    {summary.totalActiveWorkflows || 0}
                  </strong>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <span>Leads Automated</span>
                  <strong className="text-[15px] text-brand font-semibold">
                    {new Intl.NumberFormat('en-US').format(summary.leadsAutomated || 0)}
                  </strong>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <span>Email Sent (30 days)</span>
                  <strong className="text-[15px] text-brand font-semibold">
                    {new Intl.NumberFormat('en-US').format(summary.emailsSent || 0)}
                  </strong>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <span>WhatsApp Messages</span>
                  <strong className="text-[15px] text-brand font-semibold">
                    {new Intl.NumberFormat('en-US').format(summary.whatsappMessages || 0)}
                  </strong>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <span>SMS Sent</span>
                  <strong className="text-[15px] text-brand font-semibold">
                    {new Intl.NumberFormat('en-US').format(summary.smsSent || 0)}
                  </strong>
                </div>
                <div className="py-4 flex justify-between items-center border-b border-neutral-100">
                  <span>Average Engagement Rate</span>
                  <strong className="text-[15.5px] text-brand font-semibold">
                    {summary.engagementRate !== undefined ? `${summary.engagementRate.toFixed(1)}%` : '34.5%'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200/50 rounded-xl p-4.5 mt-6 text-xs leading-relaxed text-neutral-500 font-semibold flex items-start gap-2.5">
              <Info className="h-4.5 w-4.5 text-brand flex-shrink-0 stroke-[2.5]" />
              <span>
                Performance summary calculations aggregate historical email telemetry, landing page captures, and WhatsApp response actions in active campaigns.
              </span>
            </div>
          </div>

        </div>
      )}

      {/* CREATE FLOW MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-brand/20 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-[24px] shadow-sm w-auto overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-[#f8fafc]">
              <h3 className="text-lg font-extrabold text-brand">Create New Automation Stream</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-neutral-500 hover:text-neutral-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 font-semibold text-neutral-700 text-sm">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Workflow Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Lead Welcome"
                  value={workflowForm.workflowName}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, workflowName: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Trigger</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Lead Created"
                    value={workflowForm.trigger}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, trigger: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Action</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Email, WhatsApp"
                    value={workflowForm.action}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, action: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Status</label>
                  <select
                    value={workflowForm.status}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, status: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Leads Automated</label>
                  <input
                    type="number"
                    value={workflowForm.leadsAutomated}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, leadsAutomated: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Emails Sent</label>
                  <input
                    type="number"
                    value={workflowForm.emailsSent}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, emailsSent: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">WhatsApp Sent</label>
                  <input
                    type="number"
                    value={workflowForm.whatsappMessages}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, whatsappMessages: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">SMS Sent</label>
                  <input
                    type="number"
                    value={workflowForm.smsSent}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, smsSent: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Engagement Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  max="100"
                  value={workflowForm.engagementRate}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, engagementRate: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="border border-neutral-200 hover:bg-neutral-50 px-5 py-2.5 rounded-xl font-semibold text-neutral-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-xl font-semibold transition cursor-pointer shadow-md"
                >
                  Create Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FLOW MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-brand/20 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-[24px] shadow-sm w-auto overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-[#f8fafc]">
              <h3 className="text-lg font-extrabold text-brand">Edit Automation Stream</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-neutral-500 hover:text-neutral-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 font-semibold text-neutral-700 text-sm">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Workflow Name</label>
                <input
                  type="text"
                  required
                  value={workflowForm.workflowName}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, workflowName: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Trigger</label>
                  <input
                    type="text"
                    required
                    value={workflowForm.trigger}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, trigger: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Action</label>
                  <input
                    type="text"
                    required
                    value={workflowForm.action}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, action: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Status</label>
                  <select
                    value={workflowForm.status}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, status: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Leads Automated</label>
                  <input
                    type="number"
                    value={workflowForm.leadsAutomated}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, leadsAutomated: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Emails Sent</label>
                  <input
                    type="number"
                    value={workflowForm.emailsSent}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, emailsSent: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">WhatsApp Sent</label>
                  <input
                    type="number"
                    value={workflowForm.whatsappMessages}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, whatsappMessages: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">SMS Sent</label>
                  <input
                    type="number"
                    value={workflowForm.smsSent}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, smsSent: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Engagement Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  max="100"
                  value={workflowForm.engagementRate}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, engagementRate: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="border border-neutral-200 hover:bg-neutral-50 px-5 py-2.5 rounded-xl font-semibold text-neutral-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-xl font-semibold transition cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Automation;
