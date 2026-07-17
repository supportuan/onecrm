'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  X,
  Save,
  Loader2,
  ChevronRight,
  ShieldAlert,
  Users,
  CheckCircle2,
  Settings,
  Palmtree,
  Tag,
  Check,
} from 'lucide-react';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import LeaveMyRequests from './LeaveMyRequests';
import LeaveApprovals from './LeaveApprovals';
import {
  getLeavePlans,
  createLeavePlan,
  deleteLeavePlan,
  getLeaveTypes,
  getLeaveDefinitions,
  addLeaveDefinition,
  deleteLeaveDefinition,
  getLeavePlanEmployees,
  assignLeavePlanEmployees,
  removeLeavePlanEmployee,
  getHolidays,
  createHoliday,
  deleteHoliday,
  getEmployees,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from '@/services/hrApi';

const DEFAULT_TYPE_FORM = {
  leaveTypeId: '',
  annualQuota: 24,
  isUnlimited: false,
  accrualType: 'monthly',
  yearEndPolicy: 'reset',
  carryForwardMax: 0,
  minDays: 0.5,
  maxDays: 30,
  gender: 'all',
  accrualRate: 2,
};

function formatPolicyQuota(def) {
  if (def.is_unlimited) return 'unlimited';
  if (def.accrual_type === 'monthly' && def.accrual_rate > 0) {
    return `${def.accrual_rate}/mo · max ${def.annual_quota}/yr`;
  }
  if (def.accrual_type === 'quarterly' && def.accrual_rate > 0) {
    return `${def.accrual_rate}/qtr · max ${def.annual_quota}/yr`;
  }
  return `${def.annual_quota} days/yr`;
}

function formatAccrualCycle(def) {
  if (def.accrual_type === 'none') return 'Fixed at year start';
  if (def.accrual_type === 'monthly' && def.accrual_rate > 0) return `${def.accrual_rate} days each month`;
  if (def.accrual_type === 'quarterly' && def.accrual_rate > 0) return `${def.accrual_rate} days each quarter`;
  if (def.accrual_type === 'yearly') return 'Once per year';
  return def.accrual_type || '—';
}

function formatYearEndPolicy(def) {
  if (def.year_end_policy === 'carry_forward') {
    return `Carry forward (max ${def.carry_forward_max || def.annual_quota})`;
  }
  if (def.year_end_policy === 'encash') return 'Encashment';
  return 'No carry forward';
}

function resolveAnnualQuota(typeForm) {
  if (typeForm.isUnlimited) return 999;
  if (typeForm.accrualType === 'monthly') return Math.round((typeForm.accrualRate || 0) * 12);
  if (typeForm.accrualType === 'quarterly') return Math.round((typeForm.accrualRate || 0) * 4);
  return typeForm.annualQuota;
}


export default function LeaveManagement() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const canManageLeave = can('MANAGE_LEAVE');
  const canViewLeave = can('VIEW_LEAVE');
  const canApproveLeave = canManageLeave || canViewLeave;
  const initialTab = searchParams.get('tab');
  const [workspaceTab, setWorkspaceTab] = useState(
    initialTab === 'approvals' && canApproveLeave
      ? 'approvals'
      : (initialTab === 'policies' || initialTab === 'holidays') && canManageLeave
        ? 'policies'
        : 'my',
  );
  const [activeMainTab, setActiveMainTab] = useState(
    initialTab === 'holidays' && canManageLeave ? 'holidays' : 'plans',
  ); // 'plans' | 'holidays' | 'categories'

  // Leave categories (HrLeaveType) CRUD state
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '' });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryFeedback, setCategoryFeedback] = useState(null);

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeInnerTab, setActiveInnerTab] = useState('configuration');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [definitions, setDefinitions] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [assignedEmployees, setAssignedEmployees] = useState([]);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const [newPlan, setNewPlan] = useState({ name: '', cycle: 'Apr - Mar' });
  const [typeForm, setTypeForm] = useState({ ...DEFAULT_TYPE_FORM });

  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [holidaysSubmitting, setHolidaysSubmitting] = useState(false);
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'public' });
  const [holidayFolders, setHolidayFolders] = useState(['public', 'restricted', 'institutional']);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    // Plans/types/employees power the manager-only Policies tab. Non-managers
    // (e.g. counsellors) can VIEW_LEAVE but not employees, so skip the admin
    // fetch for them — otherwise getEmployees() 403s and breaks "My leave".
    if (canManageLeave) {
      fetchInitialData();
    } else {
      setLoading(false);
    }
  }, [canManageLeave]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [plansRes, typesRes, empRes] = await Promise.all([getLeavePlans(), getLeaveTypes(), getEmployees()]);
      // Backend wraps every response as { success, message, data }.
      const plans = plansRes?.data || [];
      const types = typesRes?.data || [];
      const employees = empRes?.data || [];
      if (plansRes.success) {
        setPlans(plans);
        if (plans.length > 0) {
          const firstPlan = plans[0];
          setSelectedPlan(firstPlan);
          await fetchPlanDetails(firstPlan.id);
        }
      }
      if (typesRes.success) setLeaveTypes(types);
      if (empRes.success) setAllEmployees(employees);
    } catch (err) {
      console.error('Failed to load initial leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanDetails = async (planId) => {
    try {
      const [defRes, empRes] = await Promise.all([getLeaveDefinitions(planId), getLeavePlanEmployees(planId)]);
      if (defRes.success) setDefinitions(defRes.data || []);
      if (empRes.success) setAssignedEmployees(empRes.data || []);
    } catch (err) {
      console.error(`Failed to fetch plan details for ${planId}:`, err);
    }
  };

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    await fetchPlanDetails(plan.id);
  };

  const handleCreatePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createLeavePlan(newPlan);
      if (res.success && res.data) {
        const created = res.data;
        setPlans([...plans, created]);
        setNewPlan({ name: '', cycle: 'Apr - Mar' });
        setShowPlanModal(false);
        if (!selectedPlan) {
          setSelectedPlan(created);
          fetchPlanDetails(created.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlan = async (plan) => {
    if (
      !confirm(
        `Delete "${plan.name}"? All leave type definitions and employee assignments on this plan will be removed.`,
      )
    ) {
      return;
    }
    try {
      const res = await deleteLeavePlan(plan.id);
      if (res.success) {
        const remaining = plans.filter((p) => p.id !== plan.id);
        setPlans(remaining);
        if (selectedPlan?.id === plan.id) {
          setSelectedPlan(remaining[0] || null);
          if (remaining[0]) await fetchPlanDetails(remaining[0].id);
          else {
            setDefinitions([]);
            setAssignedEmployees([]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Failed to delete leave plan');
    }
  };

  const handleSaveTypeDefinition = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      const annualQuota = resolveAnnualQuota(typeForm);
      const res = await addLeaveDefinition(selectedPlan.id, {
        leaveTypeId: typeForm.leaveTypeId,
        annualQuota,
        accrualType: typeForm.accrualType,
        accrualRate: typeForm.accrualRate,
        yearEndPolicy: typeForm.yearEndPolicy,
        isUnlimited: typeForm.isUnlimited,
      });
      if (res.success) {
        await fetchPlanDetails(selectedPlan.id);
        setShowTypeModal(false);
        setTypeForm({ ...DEFAULT_TYPE_FORM });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDefinition = async (leaveTypeId) => {
    if (!confirm('are you sure you want to delete this Leave type definition?')) return;
    try {
      const res = await deleteLeaveDefinition(selectedPlan.id, leaveTypeId);
      if (res.success) await fetchPlanDetails(selectedPlan.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignEmployeesSubmit = async () => {
    if (!selectedPlan || selectedEmployees.length === 0) return;
    try {
      const res = await assignLeavePlanEmployees(selectedPlan.id, selectedEmployees);
      if (res.success) {
        await fetchPlanDetails(selectedPlan.id);
        setShowAssignModal(false);
        setSelectedEmployees([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssignModal = async () => {
    setSelectedEmployees([]);
    setShowAssignModal(true);
    try {
      const res = await getEmployees();
      if (res.success) setAllEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to refresh employees:', err);
    }
  };

  const handleRemoveEmployee = async (employeeId) => {
    if (!selectedPlan) return;
    if (!confirm('Remove this employee from the leave plan?')) return;
    try {
      const res = await removeLeavePlanEmployee(selectedPlan.id, employeeId);
      if (res.success) await fetchPlanDetails(selectedPlan.id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'holidays') fetchHolidaysList();
  }, [activeMainTab]);

  const fetchHolidaysList = async () => {
    setHolidaysLoading(true);
    try {
      const res = await getHolidays();
      if (res.success) {
        const list = res.data || [];
        setHolidays(list);
        const types = list.map((h) => h.type).filter(Boolean);
        setHolidayFolders(Array.from(new Set([...holidayFolders, ...types])));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHolidaysLoading(false);
    }
  };

  const handleCreateHolidaySubmit = async (e) => {
    e.preventDefault();
    setHolidaysSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res = await createHoliday(newHoliday);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'holiday added successfully' });
        setNewHoliday({ name: '', date: '', type: 'public' });
        await fetchHolidaysList();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'failed to Add holiday' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'connection error' });
    } finally {
      setHolidaysSubmitting(false);
    }
  };

  const handleDeleteHolidayClick = async (id) => {
    if (!confirm('are you sure you want to delete this holiday?')) return;
    try {
      const res = await deleteHoliday(id);
      if (res.success) await fetchHolidaysList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddHolidayFolder = () => {
    const folder = prompt('enter new holiday category (e.g. festival, corporate):');
    if (!folder) return;
    const clean = folder.trim().toLowerCase();
    if (!clean) return;
    if (!holidayFolders.includes(clean)) setHolidayFolders([...holidayFolders, clean]);
    setNewHoliday({ ...newHoliday, type: clean });
  };

  const refreshCategories = async () => {
    try {
      const res = await getLeaveTypes();
      if (res.success) setLeaveTypes(res.data || []);
    } catch (err) {
      console.error('Failed to refresh leave categories:', err);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', code: '' });
    setEditingCategoryId(null);
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim() || !categoryForm.code.trim()) return;
    setCategorySubmitting(true);
    setCategoryFeedback(null);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        code: categoryForm.code.trim().toUpperCase(),
      };
      const res = editingCategoryId
        ? await updateLeaveType(editingCategoryId, payload)
        : await createLeaveType(payload);
      if (res.success) {
        setCategoryFeedback({
          type: 'success',
          text: editingCategoryId ? 'category updated' : 'category added',
        });
        resetCategoryForm();
        await refreshCategories();
      } else {
        setCategoryFeedback({ type: 'error', text: res.error || 'failed to save category' });
      }
    } catch (err) {
      setCategoryFeedback({ type: 'error', text: err?.message || 'connection error' });
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({ name: cat.name, code: cat.code });
    setCategoryFeedback(null);
  };

  const handleDeleteCategory = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      const res = await deleteLeaveType(cat.id);
      if (res.success) {
        if (editingCategoryId === cat.id) resetCategoryForm();
        await refreshCategories();
      } else {
        alert(res.error || 'failed to delete category');
      }
    } catch (err) {
      alert(err?.message || 'failed to delete category');
    }
  };

  const filteredCategories = leaveTypes.filter(
    (c) =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const filteredPlans = plans.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredHolidays = holidays.filter((h) => h.name.toLowerCase().includes(holidaySearchQuery.toLowerCase()));

  if (workspaceTab === 'my') {
    return (
      <div className="ui-page text-neutral-800 font-sans">
        <LeaveWorkspaceHeader
          workspaceTab={workspaceTab}
          setWorkspaceTab={setWorkspaceTab}
          canManageLeave={canManageLeave}
          canApproveLeave={canApproveLeave}
        />
        <LeaveMyRequests />
      </div>
    );
  }

  if (workspaceTab === 'approvals' && canApproveLeave) {
    return (
      <div className="ui-page text-neutral-800 font-sans">
        <LeaveWorkspaceHeader
          workspaceTab={workspaceTab}
          setWorkspaceTab={setWorkspaceTab}
          canManageLeave={canManageLeave}
          canApproveLeave={canApproveLeave}
        />
        <LeaveApprovals />
      </div>
    );
  }

  return (
    <div className="ui-page text-neutral-800 font-sans">
      <LeaveWorkspaceHeader
        workspaceTab={workspaceTab}
        setWorkspaceTab={setWorkspaceTab}
        canManageLeave={canManageLeave}
        canApproveLeave={canApproveLeave}
      />
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight text-brand">Policies & holidays</h2>
          <p className="text-neutral-500 text-[13px] mt-1">
            Configure leave policies, entitlement plans, employee assignments, and the holiday calendar.
          </p>
        </div>

        <div className="flex bg-neutral-50 border border-neutral-200 rounded-lg p-1 shrink-0">
          <button
            onClick={() => setActiveMainTab('plans')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
              activeMainTab === 'plans' ? 'bg-brand text-white shadow-sm' : 'text-neutral-600 hover:text-brand hover:bg-white'
            }`}
          >
            <Palmtree size={12} />
            Entitlement plans
          </button>
          <button
            onClick={() => setActiveMainTab('holidays')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
              activeMainTab === 'holidays' ? 'bg-brand text-white shadow-sm' : 'text-neutral-600 hover:text-brand hover:bg-white'
            }`}
          >
            <CalendarIcon size={12} />
            Holiday calendar
          </button>
          <button
            onClick={() => setActiveMainTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
              activeMainTab === 'categories' ? 'bg-brand text-white shadow-sm' : 'text-neutral-600 hover:text-brand hover:bg-white'
            }`}
          >
            <Tag size={12} />
            Categories
          </button>
        </div>
      </div>

      <div>
        {activeMainTab === 'plans' && (
          <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] animate-in fade-in duration-300">
            {/* Plans sidebar */}
            <div className="w-full lg:w-80 bg-white border border-neutral-200 rounded-lg flex flex-col overflow-hidden shadow-sm shrink-0">
              <div className="p-6 border-b border-neutral-200 bg-neutral-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[11px] font-semibold text-neutral-500">Entitlement plans</h4>
                  <button
                    onClick={() => {
                      setIsEditingPlan(false);
                      setNewPlan({ name: '', cycle: 'Apr - Mar' });
                      setShowPlanModal(true);
                    }}
                    className="bg-neutral-100 hover:bg-neutral-100 text-neutral-700 p-2 rounded-xl transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                  <input
                    type="text"
                    placeholder="search plans..."
                    className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] font-medium text-neutral-800 placeholder-slate-400 outline-none focus:border-brand transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[450px] lg:max-h-none">
                {loading ? (
                  <div className="p-12 text-center text-neutral-500 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-neutral-700" size={24} />
                    <span className="text-[13px]">Loading plans...</span>
                  </div>
                ) : filteredPlans.length > 0 ? (
                  filteredPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full p-5 text-left border-b border-neutral-100 transition-all flex justify-between items-center group ${
                        selectedPlan?.id === plan.id ? 'bg-neutral-100/40 border-l-4 border-l-neutral-900' : 'hover:bg-neutral-50/50'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-[13px] font-semibold ${
                            selectedPlan?.id === plan.id ? 'text-brand' : 'text-neutral-800'
                          }`}
                        >
                          {plan.name}
                        </p>
                        <p className="text-[11px] font-semibold text-neutral-500 mt-1 flex items-center gap-1.5">
                          <CalendarIcon size={10} className="text-neutral-500" />
                          cycle: {plan.cycle || 'Apr - Mar'}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`transition-transform ${
                          selectedPlan?.id === plan.id
                            ? 'text-neutral-700 translate-x-1'
                            : 'text-neutral-500 opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </button>
                  ))
                ) : (
                  <div className="p-12 text-center text-neutral-500 text-[13px]">No entitlement plans found.</div>
                )}
              </div>
            </div>

            {/* Plan details */}
            <div className="flex-1 bg-white border border-neutral-200 rounded-lg flex flex-col overflow-hidden shadow-sm">
              {selectedPlan ? (
                <>
                  <header className="px-8 py-6 border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-neutral-50">
                    <div>
                      <h3 className="text-[15px] font-semibold text-neutral-800">{selectedPlan.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-semibold text-neutral-500">
                          active policy plan · cycle: {selectedPlan.cycle || 'Apr - Mar'}
                        </span>
                      </div>
                    </div>
                    {canManageLeave && (
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(selectedPlan)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 size={14} />
                        Delete plan
                      </button>
                    )}
                  </header>

                  <nav className="px-8 flex gap-8 border-b border-neutral-200 bg-neutral-50/50">
                    {[
                      { id: 'configuration', label: 'Type definitions', icon: Settings },
                      { id: 'employees', label: 'Assigned employees', icon: Users },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveInnerTab(tab.id)}
                          className={`py-4 text-[11px] font-semibold border-b-2 transition-all flex items-center gap-2 ${
                            activeInnerTab === tab.id
                              ? 'border-brand text-neutral-700'
                              : 'border-transparent text-neutral-500 hover:text-neutral-800'
                          }`}
                        >
                          <Icon size={12} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="flex-1 p-8 overflow-y-auto">
                    {activeInnerTab === 'configuration' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-[13px] font-semibold text-neutral-600">Policy rules</h4>
                            <p className="text-[11px] text-neutral-500 mt-1">
                              define limits, accruals, Gender restrictions, and roll-over behavior.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setIsEditingType(false);
                              setTypeForm({ ...DEFAULT_TYPE_FORM });
                              setShowTypeModal(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-[11px] font-semibold transition-all"
                          >
                            <Plus size={14} /> add definition
                          </button>
                        </div>

                        <div className="ui-panel overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500">
                                <tr>
                                  <th className="px-6 py-4">Leave type</th>
                                  <th className="px-6 py-4">Quota</th>
                                  <th className="px-6 py-4">Accrual cycle</th>
                                  <th className="px-6 py-4">Year-end policy</th>
                                  <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100">
                                {definitions.length > 0 ? (
                                  definitions.map((def) => (
                                    <tr key={def.id} className="hover:bg-neutral-50/50 transition-all">
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-neutral-100 text-brand flex items-center justify-center font-semibold text-[11px] border border-neutral-200">
                                            {def.type_code || def.leave_type_code || 'LV'}
                                          </div>
                                          <div>
                                            <span className="text-[13px] font-semibold text-neutral-800">
                                              {def.type_name || def.leave_type_name}
                                            </span>
                                            <span className="block text-[11px] font-semibold text-neutral-500 mt-0.5">
                                              gender: {def.gender_restriction}
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-[13px] font-semibold text-neutral-700">
                                        {def.is_unlimited ? (
                                          <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-[11px] font-semibold border border-sky-200">
                                            unlimited
                                          </span>
                                        ) : (
                                          formatPolicyQuota(def)
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-[11px] font-semibold text-neutral-500">
                                        {formatAccrualCycle(def)}
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                          <span className="text-[11px] font-semibold text-neutral-500">
                                            {formatYearEndPolicy(def)}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1.5">
                                          <button
                                            onClick={() => {
                                              setTypeForm({
                                                leaveTypeId: def.leave_type_id,
                                                annualQuota: parseFloat(def.annual_quota),
                                                isUnlimited: !!def.is_unlimited,
                                                accrualType: def.accrual_type,
                                                yearEndPolicy: def.year_end_policy,
                                                carryForwardMax: parseFloat(def.carry_forward_max || 0),
                                                minDays: parseFloat(def.min_days_per_request || 0.5),
                                                maxDays: parseFloat(def.max_days_per_request || 30),
                                                gender: def.gender_restriction || 'all',
                                                accrualRate: parseFloat(def.accrual_rate || 1.0),
                                              });
                                              setIsEditingType(true);
                                              setShowTypeModal(true);
                                            }}
                                            className="p-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 hover:text-neutral-700 transition-all"
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteDefinition(def.leave_type_id)}
                                            className="p-1.5 bg-white hover:bg-rose-50 border border-neutral-200 rounded-lg text-neutral-500 hover:text-rose-500 transition-all"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 text-[13px]">
                                      no Leave types configured. click "add definition" to set one up.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeInnerTab === 'employees' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-[13px] font-semibold text-neutral-600">Assigned employees</h4>
                            <p className="text-[11px] text-neutral-500 mt-1">
                              personnel covered by the cycle and Policy rules of this plan.
                            </p>
                          </div>
                          <button
                            onClick={handleOpenAssignModal}
                            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-[11px] font-semibold transition-all"
                          >
                            assign employees
                          </button>
                        </div>

                        <div className="ui-panel overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500">
                              <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Department / designation</th>
                                <th className="px-6 py-4 text-right">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                              {assignedEmployees.length > 0 ? (
                                assignedEmployees.map((emp) => (
                                  <tr key={emp.id} className="hover:bg-neutral-50/50 transition-all">
                                    <td className="px-6 py-4">
                                      <span className="text-[13px] font-semibold text-neutral-800">
                                        {emp.first_name} {emp.last_name}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-mono text-neutral-500 font-semibold">
                                      {emp.employee_id || `EMP-${(emp.id || '').toString().substring(0, 4)}`}
                                    </td>
                                    <td className="px-6 py-4 text-[13px] font-semibold text-neutral-500">
                                      {emp.designation || 'specialist'} ·{' '}
                                      <span className="text-[11px] font-semibold text-neutral-500">{emp.department_name || 'operations'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                                        enrolled
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <button
                                        onClick={() => handleRemoveEmployee(emp.id)}
                                        title="Remove from plan"
                                        className="p-1.5 bg-white hover:bg-rose-50 border border-neutral-200 rounded-lg text-neutral-500 hover:text-rose-500 transition-all"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 text-[13px]">
                                    no employees mapped to this entitlement plan.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 space-y-4 py-20 opacity-50">
                  <Palmtree size={48} className="text-neutral-700 opacity-70" />
                  <p className="text-[13px] font-semibold text-neutral-800">No entitlement plan selected</p>
                  <p className="text-[11px] text-neutral-500 max-w-xs text-center font-medium">
                    Create a new plan in the sidebar or select an existing one to configure policies.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMainTab === 'holidays' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="ui-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="filter holidays by name..."
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-medium text-neutral-800 placeholder-slate-400 focus:border-brand outline-none transition-all"
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 ui-panel overflow-hidden flex flex-col">
                <div className="px-8 py-5 border-b border-neutral-200 bg-neutral-50">
                  <h3 className="text-[13px] font-semibold text-neutral-600">Holiday calendar</h3>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500">
                        <th className="px-8 py-4 text-left">Holiday</th>
                        <th className="px-8 py-4 text-left">Date</th>
                        <th className="px-8 py-4 text-left">Category</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {holidaysLoading ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-neutral-700 mx-auto" />
                            <p className="text-[11px] font-semibold text-neutral-500 mt-2">Loading calendar...</p>
                          </td>
                        </tr>
                      ) : filteredHolidays.length > 0 ? (
                        filteredHolidays.map((holiday) => (
                          <tr key={holiday.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl">
                                  <CalendarIcon size={15} />
                                </div>
                                <span className="text-[13px] font-semibold text-neutral-800">{holiday.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-4 text-[13px] font-semibold text-neutral-500">
                              {new Date(holiday.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </td>
                            <td className="px-8 py-4">
                              <span className="px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] font-semibold text-neutral-700">
                                {holiday.type || 'public'}
                              </span>
                            </td>
                            <td className="px-8 py-4 text-right">
                              <button
                                onClick={() => handleDeleteHolidayClick(holiday.id)}
                                className="p-2 bg-white border border-neutral-200 hover:border-rose-500 hover:text-rose-500 rounded-xl transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-[13px] text-neutral-500">
                            no holidays registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="ui-card space-y-6 h-fit">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                  <h3 className="text-[13px] font-semibold text-neutral-800">Add holiday</h3>
                  <button
                    type="button"
                    onClick={handleAddHolidayFolder}
                    className="text-[11px] font-semibold text-neutral-700 hover:text-brand transition-colors"
                  >
                    + custom category
                  </button>
                </div>

                <form onSubmit={handleCreateHolidaySubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-neutral-500 ml-1">Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-800 placeholder-slate-400 focus:border-brand outline-none transition-all"
                      placeholder="e.g. independence day"
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-neutral-500 ml-1">Date</label>
                    <input
                      required
                      type="date"
                      className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-800 focus:border-brand outline-none transition-all"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-neutral-500 ml-1">Category</label>
                    <select
                      className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-800 focus:border-brand outline-none transition-all"
                      value={newHoliday.type}
                      onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value })}
                    >
                      {holidayFolders.map((folder) => (
                        <option key={folder} value={folder}>
                          {folder}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={holidaysSubmitting}
                    className="w-full py-3.5 bg-brand text-white rounded-lg font-semibold text-[11px] shadow-sm hover:bg-brand-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {holidaysSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={14} />}
                    add to calendar
                  </button>
                </form>

                {feedbackMsg && (
                  <div
                    className={`p-4 rounded-lg flex items-center gap-3 border ${
                      feedbackMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {feedbackMsg.type === 'success' ? (
                      <CheckCircle2 size={16} className="shrink-0" />
                    ) : (
                      <ShieldAlert size={16} className="shrink-0" />
                    )}
                    <p className="text-[11px] font-semibold">{feedbackMsg.text}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeMainTab === 'categories' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
              {/* Categories list */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="px-7 pt-7 pb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-neutral-100">
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-tight text-brand leading-tight">
                      Leave categories
                    </h3>
                    <p className="text-[12px] text-neutral-500 mt-1.5 leading-relaxed">
                      The catalog of leave types your plans draw from. Add categories manually below.
                    </p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Search"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-[13px] text-neutral-800 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="p-6">
                  {filteredCategories.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center mb-4">
                        <Tag size={18} className="text-neutral-400" />
                      </div>
                      <p className="text-[13px] font-medium text-neutral-700">No categories yet</p>
                      <p className="text-[12px] text-neutral-500 mt-1 max-w-xs">
                        Use the panel on the right to add your first leave category.
                      </p>
                    </div>
                  ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                      {filteredCategories.map((cat) => {
                        const isEditing = editingCategoryId === cat.id;
                        return (
                          <li
                            key={cat.id}
                            className={`group relative bg-white border rounded-2xl px-5 py-4 transition-all ${
                              isEditing
                                ? 'border-brand shadow-[0_0_0_3px_rgba(0,0,0,0.04)]'
                                : 'border-neutral-200/80 hover:border-neutral-300 hover:shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                            }`}
                          >
                            <div className="flex items-start gap-3.5">
                              <div className="shrink-0 w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center text-[11px] font-semibold tracking-wide">
                                {cat.code.slice(0, 3).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[14px] font-semibold text-brand leading-snug truncate">
                                  {cat.name}
                                </p>
                                <p className="text-[11px] font-medium text-neutral-500 mt-0.5 tracking-wide uppercase">
                                  {cat.code}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditCategory(cat)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 transition-all flex items-center gap-1.5"
                              >
                                <Edit2 size={11} /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-1.5"
                              >
                                <Trash2 size={11} /> Delete
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Add / edit card */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-7 pt-7 pb-5 border-b border-neutral-100">
                  <h3 className="text-[15px] font-semibold tracking-tight text-brand">
                    {editingCategoryId ? 'Edit category' : 'Add category'}
                  </h3>
                  <p className="text-[12px] text-neutral-500 mt-1.5 leading-relaxed">
                    Categories are reusable across all entitlement plans.
                  </p>
                </div>

                <form onSubmit={handleSubmitCategory} className="px-7 py-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-neutral-500 tracking-tight">
                      Display name
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="e.g. Paternity leave"
                      className="w-full px-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-xl text-[13px] text-brand placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-neutral-500 tracking-tight">
                      Short code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={categoryForm.code}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          code: e.target.value.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase(),
                        })
                      }
                      placeholder="e.g. PAT"
                      className="w-full px-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-xl text-[13px] font-medium tracking-wide text-brand placeholder-neutral-400 outline-none focus:border-neutral-400 focus:bg-white transition-all uppercase"
                    />
                    <p className="text-[10.5px] text-neutral-400 pl-0.5">Letters, numbers, dash, underscore.</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={categorySubmitting}
                      className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl text-[12.5px] font-medium tracking-tight transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {categorySubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : editingCategoryId ? (
                        <Check size={14} />
                      ) : (
                        <Plus size={14} />
                      )}
                      {editingCategoryId ? 'Save changes' : 'Add category'}
                    </button>
                    {editingCategoryId && (
                      <button
                        type="button"
                        onClick={resetCategoryForm}
                        className="px-4 py-3 border border-neutral-200 rounded-xl text-[12.5px] font-medium text-neutral-600 hover:bg-neutral-50 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {categoryFeedback && (
                    <div
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[11.5px] font-medium border ${
                        categoryFeedback.type === 'success'
                          ? 'bg-emerald-50/70 text-emerald-700 border-emerald-100'
                          : 'bg-rose-50/70 text-rose-700 border-rose-100'
                      }`}
                    >
                      {categoryFeedback.type === 'success' ? (
                        <CheckCircle2 size={14} className="shrink-0" />
                      ) : (
                        <ShieldAlert size={14} className="shrink-0" />
                      )}
                      {categoryFeedback.text}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="ui-modal scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h2 className="text-[13px] font-semibold text-neutral-800">{isEditingPlan ? 'update plan' : 'create new plan'}</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-neutral-500 hover:text-neutral-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePlanSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-neutral-500 ml-1">Plan name</label>
                <input
                  required
                  type="text"
                  className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-800 placeholder-slate-400 focus:border-brand outline-none transition-all"
                  placeholder="e.g. interns policy plan"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-neutral-500 ml-1">Default cycle</label>
                <select
                  className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-800 focus:border-brand outline-none transition-all"
                  value={newPlan.cycle}
                  onChange={(e) => setNewPlan({ ...newPlan, cycle: e.target.value })}
                >
                  <option value="Apr - Mar">April - March (financial year)</option>
                  <option value="Jan - Dec">January - December (calendar year)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-brand text-white rounded-lg font-semibold text-[11px] shadow-sm hover:bg-brand-hover transition-all"
              >
                save plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Type definition modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="ui-modal scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h2 className="text-[13px] font-semibold text-neutral-800">
                {isEditingType ? 'edit definition' : 'add policy definition'}
              </h2>
              <button onClick={() => setShowTypeModal(false)} className="text-neutral-500 hover:text-neutral-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTypeDefinition} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-neutral-500 ml-1">Leave category</label>
                    <select
                      required
                      disabled={isEditingType}
                      className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-800 focus:border-brand outline-none transition-all"
                      value={typeForm.leaveTypeId}
                      onChange={(e) => setTypeForm({ ...typeForm, leaveTypeId: e.target.value })}
                    >
                      <option value="">Select category...</option>
                      {leaveTypes
                        .filter((lt) => isEditingType || !definitions.find((d) => d.leave_type_id === lt.id))
                        .map((lt) => (
                          <option key={lt.id} value={lt.id}>
                            {lt.name} ({lt.code})
                          </option>
                        ))}
                    </select>
                    {!isEditingType &&
                      leaveTypes.length > 0 &&
                      leaveTypes.every((lt) => definitions.find((d) => d.leave_type_id === lt.id)) && (
                        <p className="text-[11px] text-amber-600 mt-1">
                          Every leave type is already attached to this plan. Edit an existing
                          definition above, or create a new leave type first.
                        </p>
                      )}
                    {leaveTypes.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        No leave types configured for this tenant. Ask the system to seed defaults
                        or create them via the API.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {['monthly', 'quarterly'].includes(typeForm.accrualType) ? (
                      <>
                        <label className="text-[11px] font-semibold text-neutral-500 ml-1">
                          Days per {typeForm.accrualType === 'monthly' ? 'month' : 'quarter'}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-800 focus:border-brand outline-none transition-all"
                          value={typeForm.accrualRate}
                          onChange={(e) => {
                            const rate = parseFloat(e.target.value) || 0;
                            const multiplier = typeForm.accrualType === 'monthly' ? 12 : 4;
                            setTypeForm({
                              ...typeForm,
                              accrualRate: rate,
                              annualQuota: Math.round(rate * multiplier),
                            });
                          }}
                        />
                        <p className="text-[11px] text-neutral-500 ml-1">
                          Annual cap: {resolveAnnualQuota(typeForm)} days · unused balance does not roll over
                          when year-end is set to reset.
                        </p>
                      </>
                    ) : (
                      <>
                        <label className="text-[11px] font-semibold text-neutral-500 ml-1">Annual quota</label>
                        <div className="flex gap-4">
                          <input
                            type="number"
                            disabled={typeForm.isUnlimited}
                            className="flex-1 px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-800 focus:border-brand outline-none transition-all disabled:opacity-30"
                            value={typeForm.annualQuota}
                            onChange={(e) => setTypeForm({ ...typeForm, annualQuota: parseFloat(e.target.value) })}
                          />
                          <label className="flex items-center gap-2 cursor-pointer bg-neutral-50 px-5 rounded-lg border border-neutral-200 hover:border-slate-300 transition-all select-none">
                            <input
                              type="checkbox"
                              className="rounded text-neutral-700 bg-white border-slate-300"
                              checked={typeForm.isUnlimited}
                              onChange={(e) => setTypeForm({ ...typeForm, isUnlimited: e.target.checked })}
                            />
                            <span className="text-[11px] font-semibold text-neutral-600">Unlimited</span>
                          </label>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-neutral-500 ml-1">Accrual mode</label>
                    <select
                      className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-800 focus:border-brand outline-none transition-all"
                      value={typeForm.accrualType}
                      onChange={(e) => {
                        const accrualType = e.target.value;
                        const next = { ...typeForm, accrualType };
                        if (accrualType === 'monthly') {
                          next.accrualRate = next.accrualRate || 2;
                          next.annualQuota = Math.round(next.accrualRate * 12);
                        } else if (accrualType === 'quarterly') {
                          next.accrualRate = next.accrualRate || 3;
                          next.annualQuota = Math.round(next.accrualRate * 4);
                        }
                        setTypeForm(next);
                      }}
                    >
                      <option value="none">Fixed / advance allotment</option>
                      <option value="monthly">Monthly accrual</option>
                      <option value="quarterly">Quarterly accrual</option>
                      <option value="yearly">Annual accrual</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-neutral-500 ml-1">Year-end rule</label>
                    <select
                      className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-800 focus:border-brand outline-none transition-all"
                      value={typeForm.yearEndPolicy}
                      onChange={(e) => setTypeForm({ ...typeForm, yearEndPolicy: e.target.value })}
                    >
                      <option value="reset">No carry forward (reset balance)</option>
                      <option value="carry_forward">Carry forward roll-over</option>
                      <option value="encash">Encashment option</option>
                    </select>
                  </div>

                  {typeForm.yearEndPolicy === 'carry_forward' && (
                    <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <label className="text-[11px] font-semibold text-neutral-500 ml-1">Max carry-forward</label>
                      <input
                        type="number"
                        className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-800 focus:border-brand outline-none transition-all"
                        placeholder="max days to carry over"
                        value={typeForm.carryForwardMax}
                        onChange={(e) => setTypeForm({ ...typeForm, carryForwardMax: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-neutral-500 ml-1">Gender restriction</label>
                    <div className="flex gap-2.5">
                      {['all', 'male', 'female'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setTypeForm({ ...typeForm, gender: g })}
                          className={`flex-1 py-3.5 rounded-lg text-[11px] font-semibold border transition-all ${
                            typeForm.gender === g
                              ? 'bg-brand text-white border-transparent shadow-sm'
                              : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-800 hover:bg-slate-100'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-5 py-3 border border-neutral-200 rounded-lg text-[11px] font-semibold hover:bg-neutral-50 text-neutral-600 transition-all"
                >
                  discard
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-brand text-white rounded-lg font-semibold text-[11px] shadow-sm hover:bg-brand-hover transition-all flex items-center gap-2"
                >
                  <Save size={13} />
                  save definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee assignment modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="ui-modal scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h2 className="text-[13px] font-semibold text-neutral-800">Assign employees to plan</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-neutral-500 hover:text-neutral-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              <p className="text-[11px] font-semibold text-neutral-500 mb-4">
                select employees to enrol in "{selectedPlan?.name}":
              </p>

              <div className="max-h-[300px] overflow-y-auto space-y-2 mb-8 pr-2">
                {allEmployees.length > 0 ? (
                  allEmployees.map((emp) => {
                    const isAlreadyAssigned = assignedEmployees.some((ae) => ae.id === emp.id);
                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all select-none ${
                          isAlreadyAssigned
                            ? 'bg-neutral-50 border-neutral-200 opacity-50 cursor-not-allowed'
                            : selectedEmployees.includes(emp.id)
                            ? 'bg-neutral-100 border-neutral-200 text-brand'
                            : 'bg-neutral-50 border-neutral-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={isAlreadyAssigned}
                          className="w-4 h-4 rounded text-neutral-700 bg-white border-slate-300 focus:ring-neutral-700/30"
                          checked={selectedEmployees.includes(emp.id) || isAlreadyAssigned}
                          onChange={(e) => {
                            if (isAlreadyAssigned) return;
                            if (e.target.checked) setSelectedEmployees([...selectedEmployees, emp.id]);
                            else setSelectedEmployees(selectedEmployees.filter((id) => id !== emp.id));
                          }}
                        />
                        <div>
                          <p className="text-[13px] font-semibold text-neutral-800">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-[11px] font-semibold text-neutral-500 mt-1">
                            {emp.employee_id || `EMP-${(emp.id || '').toString().substring(0, 4)}`} ·{' '}
                            {emp.department_name || 'operations'}
                            {isAlreadyAssigned && (
                              <span className="text-[11px] font-semibold text-neutral-700 ml-1.5">(enrolled)</span>
                            )}
                          </p>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-center text-neutral-500 text-[13px]">No personnel found.</p>
                )}
              </div>

              <div className="flex gap-3 border-t border-neutral-200 pt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-3.5 border border-neutral-200 rounded-lg text-[11px] font-semibold hover:bg-neutral-50 text-neutral-600 transition-all"
                >
                  discard
                </button>
                <button
                  onClick={handleAssignEmployeesSubmit}
                  disabled={selectedEmployees.length === 0}
                  className="flex-1 py-3.5 bg-brand text-white rounded-lg font-semibold text-[11px] shadow-sm hover:bg-brand-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  enrol employees
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaveWorkspaceHeader({ workspaceTab, setWorkspaceTab, canManageLeave, canApproveLeave }) {
  return (
    <div className="mb-6 flex border-b border-neutral-200 pb-4">
      <div className="flex flex-wrap bg-neutral-50 border border-neutral-200 rounded-lg p-1 gap-0.5">
          <button
            type="button"
            onClick={() => setWorkspaceTab('my')}
            className={`px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
              workspaceTab === 'my' ? 'bg-brand text-white shadow-sm' : 'text-neutral-600 hover:bg-white'
            }`}
          >
            My leave
          </button>
          {canApproveLeave && (
            <button
              type="button"
              onClick={() => setWorkspaceTab('approvals')}
              className={`px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                workspaceTab === 'approvals' ? 'bg-brand text-white shadow-sm' : 'text-neutral-600 hover:bg-white'
              }`}
            >
              Approvals
            </button>
          )}
          {canManageLeave && (
            <button
              type="button"
              onClick={() => setWorkspaceTab('policies')}
              className={`px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                workspaceTab === 'policies' ? 'bg-brand text-white shadow-sm' : 'text-neutral-600 hover:bg-white'
              }`}
            >
              Policies
            </button>
          )}
        </div>
    </div>
  );
}
