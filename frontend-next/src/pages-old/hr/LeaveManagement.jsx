'use client';

import { useState, useEffect } from 'react';
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
  Grid
} from 'lucide-react';
import { 
  getLeavePlans, 
  createLeavePlan, 
  getLeaveTypes, 
  getLeaveDefinitions, 
  addLeaveDefinition, 
  deleteLeaveDefinition, 
  getLeavePlanEmployees, 
  assignLeavePlanEmployees,
  getHolidays,
  createHoliday,
  deleteHoliday,
  getEmployees,
  getLeaveRequests,
  applyLeaveRequest,
  processLeaveApproval,
  getLeaveBalancesReport
} from '../../services/hrApi';

export default function LeaveManagement() {
  // [x] Refactor `LeaveManagement.jsx` to use crisp light theme (no `bg-slate-900`, no gradients)
  const [activeMainTab, setActiveMainTab] = useState('plans'); // 'plans' | 'holidays'

  // Plan tab states
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeInnerTab, setActiveInnerTab] = useState('configuration'); // 'configuration' | 'employees'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [definitions, setDefinitions] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [assignedEmployees, setAssignedEmployees] = useState([]);

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  
  // Form States
  const [newPlan, setNewPlan] = useState({ name: '', cycle: 'Apr - Mar' });
  const [typeForm, setTypeForm] = useState({
    leaveTypeId: '',
    annualQuota: 12,
    isUnlimited: false,
    accrualType: 'monthly',
    yearEndPolicy: 'carry_forward',
    carryForwardMax: 5,
    minDays: 0.5,
    maxDays: 30,
    gender: 'all',
    accrualRate: 1.0
  });

  // Holiday States
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [holidaysSubmitting, setHolidaysSubmitting] = useState(false);
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'public' });
  const [holidayFolders, setHolidayFolders] = useState(['public', 'restricted', 'institutional']);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Leave Workflow states
  const [requests, setRequests] = useState([]);
  const [reqsLoading, setReqsLoading] = useState(false);
  const [balancesReport, setBalancesReport] = useState([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    employeeId: '1',
    leaveTypeId: 'type_1',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [approvalRemarks, setApprovalRemarks] = useState('');

  const fetchLeaveRequests = async () => {
    setReqsLoading(true);
    try {
      const res = await getLeaveRequests();
      if (res.success) setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setReqsLoading(false);
    }
  };

  const fetchBalancesReport = async () => {
    setBalancesLoading(true);
    try {
      const res = await getLeaveBalancesReport();
      if (res.success) setBalancesReport(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBalancesLoading(false);
    }
  };

  const handleApplyLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await applyLeaveRequest(applyForm);
      if (res.success) {
        alert('Leave request submitted successfully!');
        setShowApplyModal(false);
        setApplyForm({
          employeeId: '1',
          leaveTypeId: 'type_1',
          startDate: '',
          endDate: '',
          reason: ''
        });
        if (activeMainTab === 'requests') fetchLeaveRequests();
        else fetchBalancesReport();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit leave request.');
    }
  };

  const handleProcessApproval = async (reqId, role, status) => {
    try {
      const res = await processLeaveApproval(reqId, role, status, approvalRemarks);
      if (res.success) {
        alert(`Leave request ${status.toLowerCase()} successfully!`);
        setApprovalRemarks('');
        fetchLeaveRequests();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to process approval.');
    }
  };

  useEffect(() => {
    if (activeMainTab === 'requests') {
      fetchLeaveRequests();
    } else if (activeMainTab === 'balances') {
      fetchBalancesReport();
    }
  }, [activeMainTab]);

  // Load plans & initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [plansRes, typesRes, empRes] = await Promise.all([
        getLeavePlans(),
        getLeaveTypes(),
        getEmployees()
      ]);
      
      if (plansRes.success) {
        setPlans(plansRes.plans || []);
        if (plansRes.plans && plansRes.plans.length > 0) {
          const firstPlan = plansRes.plans[0];
          setSelectedPlan(firstPlan);
          await fetchPlanDetails(firstPlan.id);
        }
      }
      if (typesRes.success) {
        setLeaveTypes(typesRes.types || []);
      }
      if (empRes.success) {
        setAllEmployees(empRes.employees || []);
      }
    } catch (err) {
      console.error('Failed to load initial leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanDetails = async (planId) => {
    try {
      const [defRes, empRes] = await Promise.all([
        getLeaveDefinitions(planId),
        getLeavePlanEmployees(planId)
      ]);
      if (defRes.success) setDefinitions(defRes.definitions || []);
      if (empRes.success) setAssignedEmployees(empRes.employees || []);
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
      if (res.success) {
        setPlans([...plans, res.plan]);
        setNewPlan({ name: '', cycle: 'Apr - Mar' });
        setShowPlanModal(false);
        if (!selectedPlan) {
          setSelectedPlan(res.plan);
          fetchPlanDetails(res.plan.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTypeDefinition = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      const res = await addLeaveDefinition(selectedPlan.id, typeForm);
      if (res.success) {
        await fetchPlanDetails(selectedPlan.id);
        setShowTypeModal(false);
        setTypeForm({
          leaveTypeId: '',
          annualQuota: 12,
          isUnlimited: false,
          accrualType: 'monthly',
          yearEndPolicy: 'carry_forward',
          carryForwardMax: 5,
          minDays: 0.5,
          maxDays: 30,
          gender: 'all',
          accrualRate: 1.0
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDefinition = async (leaveTypeId) => {
    if (!confirm('Are you sure you want to delete this leave type definition?')) return;
    try {
      const res = await deleteLeaveDefinition(selectedPlan.id, leaveTypeId);
      if (res.success) {
        await fetchPlanDetails(selectedPlan.id);
      }
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

  // Holidays actions
  useEffect(() => {
    if (activeMainTab === 'holidays') {
      fetchHolidaysList();
    }
  }, [activeMainTab]);

  const fetchHolidaysList = async () => {
    setHolidaysLoading(true);
    try {
      const res = await getHolidays();
      if (res.success) {
        setHolidays(res.holidays || []);
        const types = (res.holidays || [])
          .map(h => h.type)
          .filter(Boolean);
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
        setFeedbackMsg({ type: 'success', text: 'Holiday added successfully!' });
        setNewHoliday({ name: '', date: '', type: 'public' });
        await fetchHolidaysList();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Failed to add holiday' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Connection error' });
    } finally {
      setHolidaysSubmitting(false);
    }
  };

  const handleDeleteHolidayClick = async (id) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    try {
      const res = await deleteHoliday(id);
      if (res.success) {
        await fetchHolidaysList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddHolidayFolder = () => {
    const folder = prompt('Enter new holiday list type (e.g. Festival, Corporate):');
    if (!folder) return;
    const clean = folder.trim().toLowerCase();
    if (!clean) return;
    if (!holidayFolders.includes(clean)) {
      setHolidayFolders([...holidayFolders, clean]);
    }
    setNewHoliday({ ...newHoliday, type: clean });
  };

  const filteredPlans = plans.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredHolidays = holidays.filter(h => h.name.toLowerCase().includes(holidaySearchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      {/* Premium Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">
            Leave & Holiday Management
          </h1>
          <p className="text-slate-550 text-sm mt-1">
            Configure enterprise leave policies, custom entitlement plans, employee allocations, and corporate calendars.
          </p>
        </div>

        {/* Tab Switcher and Apply Action */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all shrink-0"
          >
            <Plus size={14} />
            Apply Leave
          </button>
          
          <div className="flex bg-slate-200/60 p-1 border border-slate-300 rounded-2xl shadow-inner shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveMainTab('plans')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                activeMainTab === 'plans'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Palmtree size={14} />
              Entitlement Plans
            </button>
            <button
              onClick={() => setActiveMainTab('requests')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                activeMainTab === 'requests'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <CheckCircle2 size={14} />
              Workflow Approvals
            </button>
            <button
              onClick={() => setActiveMainTab('balances')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                activeMainTab === 'balances'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Grid size={14} />
              Balances Report
            </button>
            <button
              onClick={() => setActiveMainTab('holidays')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                activeMainTab === 'holidays'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <CalendarIcon size={14} />
              Holiday Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeMainTab === 'plans' && (
          <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] animate-in fade-in duration-300">
            {/* Sidebar for Entitlement Plans */}
            <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm shrink-0">
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[11px] font-semibold text-slate-500">Entitlement Plans</h4>
                  <button 
                    onClick={() => { 
                      setIsEditingPlan(false); 
                      setNewPlan({ name: '', cycle: 'Apr - Mar' }); 
                      setShowPlanModal(true); 
                    }} 
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2 rounded-xl transition-all duration-200"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search plans..." 
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-455 outline-none focus:border-indigo-600 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[450px] lg:max-h-none no-scrollbar">
                {loading ? (
                  <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-indigo-600" size={24} />
                    <span className="text-xs">Loading plans...</span>
                  </div>
                ) : filteredPlans.length > 0 ? (
                  filteredPlans.map(plan => (
                    <button
                       key={plan.id}
                       onClick={() => handleSelectPlan(plan)}
                      className={`w-full p-5 text-left border-b border-slate-100 transition-all flex justify-between items-center group relative ${
                        selectedPlan?.id === plan.id 
                          ? 'bg-slate-50 border-l-4 border-l-indigo-600' 
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-extrabold uppercase tracking-wider ${
                          selectedPlan?.id === plan.id ? 'text-indigo-600' : 'text-slate-800'
                        }`}>
                          {plan.name}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-450 mt-1.5 flex items-center gap-1.5">
                          <CalendarIcon size={10} className="text-slate-400" />
                          Cycle: {plan.cycle || 'Apr - Mar'}
                        </p>
                      </div>
                      <ChevronRight size={14} className={`transition-transform duration-300 ${
                        selectedPlan?.id === plan.id ? 'text-indigo-600 translate-x-1' : 'text-slate-400 opacity-0 group-hover:opacity-100'
                      }`} />
                    </button>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-450 text-xs italic">
                    No entitlement plans found.
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Area for Entitlement Plan details */}
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm">
              {selectedPlan ? (
                <>
                  <header className="px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{selectedPlan.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Active Policy Plan · Cycle: {selectedPlan.cycle || 'Apr - Mar'}
                        </span>
                      </div>
                    </div>
                  </header>

                  <nav className="px-8 flex gap-8 border-b border-slate-200 bg-slate-50/50">
                    {[
                      { id: 'configuration', label: 'Type Definitions', icon: Settings },
                      { id: 'employees', label: 'Assigned Coverage', icon: Users }
                    ].map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveInnerTab(tab.id)}
                          className={`py-4 text-[11px] font-extrabold uppercase tracking-widest border-b-2 transition-all duration-200 flex items-center gap-2 ${
                            activeInnerTab === tab.id 
                              ? 'border-indigo-600 text-indigo-600' 
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Icon size={12} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
                    {activeInnerTab === 'configuration' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500">Policy Rules</h4>
                            <p className="text-[10px] text-slate-450 mt-1">Define limits, accruals, gender exclusions, and roll-over structures.</p>
                          </div>
                          <button 
                            onClick={() => { 
                              setIsEditingType(false); 
                              setTypeForm({
                                leaveTypeId: '',
                                annualQuota: 12,
                                isUnlimited: false,
                                accrualType: 'monthly',
                                yearEndPolicy: 'carry_forward',
                                carryForwardMax: 5,
                                minDays: 0.5,
                                maxDays: 30,
                                gender: 'all',
                                accrualRate: 1.0
                              });
                              setShowTypeModal(true); 
                            }} 
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-semibold transition-all duration-200"
                          >
                            <Plus size={14} /> Add Definition
                          </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500">
                                <tr>
                                  <th className="px-6 py-4">Leave Type</th>
                                  <th className="px-6 py-4">Quota</th>
                                  <th className="px-6 py-4">Accrual Cycle</th>
                                  <th className="px-6 py-4">Year End Policy</th>
                                  <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {definitions.length > 0 ? (
                                  definitions.map(def => (
                                    <tr key={def.id} className="hover:bg-slate-50/50 transition-all">
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold text-[10px] border border-indigo-200">
                                            {def.type_code || def.leave_type_code || 'LV'}
                                          </div>
                                          <div>
                                            <span className="text-xs font-semibold text-slate-800">{def.type_name || def.leave_type_name}</span>
                                            <span className="block text-[9px] font-semibold text-slate-450 mt-0.5">Gender: {def.gender_restriction}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                                        {def.is_unlimited ? (
                                          <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-[10px] font-semibold border border-sky-200">Unlimited</span>
                                        ) : (
                                          `${def.annual_quota} Days`
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-[10px] font-semibold text-slate-500">
                                        {def.accrual_type} {def.accrual_rate && def.accrual_type !== 'none' ? `(${def.accrual_rate}/period)` : ''}
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-semibold text-slate-500">
                                            {def.year_end_policy?.replace('_', ' ')}
                                          </span>
                                          {def.year_end_policy === 'carry_forward' && (
                                            <span className="text-[9px] text-slate-450 font-semibold">Max: {def.carry_forward_max} days</span>
                                          )}
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
                                                accrualRate: parseFloat(def.accrual_rate || 1.0)
                                              });
                                              setIsEditingType(true);
                                              setShowTypeModal(true);
                                            }} 
                                            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteDefinition(def.leave_type_id)}
                                            className="p-1.5 bg-white hover:bg-red-50 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                                      No leave types configured for this plan yet. Click "Add Definition" to set one up.
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
                            <h4 className="text-xs font-semibold text-slate-500">Assigned Employees</h4>
                            <p className="text-[10px] text-slate-450 mt-1">Personnel assigned to follow the cycle and policy rules of this plan.</p>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedEmployees([]);
                              setShowAssignModal(true);
                            }} 
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-semibold transition-all duration-200"
                          >
                            Assign Staff
                          </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500">
                              <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Department / Designation</th>
                                <th className="px-6 py-4 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {assignedEmployees.length > 0 ? (
                                assignedEmployees.map(emp => (
                                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-all">
                                    <td className="px-6 py-4">
                                      <span className="text-xs font-semibold text-slate-800">
                                        {emp.first_name} {emp.last_name}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-mono text-slate-500 font-semibold">
                                      {emp.employee_id || `EMP-${emp.id.substring(0, 4)}`}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                      {emp.designation || 'Specialist'} · <span className="text-[10px] font-semibold text-slate-400">{emp.department_name || 'Operations'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-semibold border border-emerald-200">
                                        Enrolled
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                                    No staff coverage currently mapped to this entitlement plan.
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
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 py-20 opacity-40">
                  <Palmtree size={64} className="text-slate-400 animate-bounce" />
                  <p className="text-xs font-semibold text-slate-500">No Entitlement Plan Selected</p>
                  <p className="text-[10px] text-slate-500 max-w-xs text-center font-medium">Create a new plan on the left panel or select an existing one to configure policies.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMainTab === 'holidays' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Stats and search bar */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter holidays by name..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 outline-none transition-all"
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Layout for holiday grid/table + adder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Table side (2 cols) */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="px-8 py-5 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-xs font-semibold text-slate-650">Corporate Holidays</h3>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500">
                        <th className="px-8 py-4 text-left">Holiday Name</th>
                        <th className="px-8 py-4 text-left">Date</th>
                        <th className="px-8 py-4 text-left">Classification</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {holidaysLoading ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                            <p className="text-[10px] font-semibold text-slate-400 mt-2">Loading Calendar...</p>
                          </td>
                        </tr>
                      ) : filteredHolidays.length > 0 ? (
                        filteredHolidays.map((holiday) => (
                          <tr key={holiday.id} className="hover:bg-slate-50/50 transition-colors duration-200">
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl">
                                  <CalendarIcon size={15} />
                                </div>
                                <span className="text-xs font-semibold text-slate-850">{holiday.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-4 text-xs font-semibold text-slate-500">
                              {new Date(holiday.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </td>
                            <td className="px-8 py-4">
                              <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-semibold text-indigo-600">
                                {holiday.type || 'public'}
                              </span>
                            </td>
                            <td className="px-8 py-4 text-right">
                              <button 
                                onClick={() => handleDeleteHolidayClick(holiday.id)} 
                                className="p-2 bg-white border border-slate-200 hover:border-red-500 hover:text-red-500 rounded-xl transition-all duration-200"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-xs text-slate-400 italic">
                            No holidays currently registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add form side (1 col) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 h-fit">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-xs font-semibold text-slate-800">Register Holiday</h3>
                  <button 
                    type="button" 
                    onClick={handleAddHolidayFolder} 
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    + Custom Type
                  </button>
                </div>

                <form onSubmit={handleCreateHolidaySubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-400 ml-1">Holiday Identifier</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-600 outline-none transition-all"
                      placeholder="e.g. Independence Day"
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-400 ml-1">Date</label>
                    <input
                      required
                      type="date"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-400 ml-1">Classification Category</label>
                    <select
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
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
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] tracking-[0.2em] shadow-sm hover:scale-[1.01] hover:shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {holidaysSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={14} />}
                    Add To Calendar
                  </button>
                </form>

                {feedbackMsg && (
                  <div
                    className={`p-4 rounded-2xl flex items-center gap-3 border ${
                      feedbackMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {feedbackMsg.type === 'success' ? (
                      <CheckCircle2 size={16} className="shrink-0" />
                    ) : (
                      <ShieldAlert size={16} className="shrink-0" />
                    )}
                    <p className="text-[10px] font-semibold">{feedbackMsg.text}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeMainTab === 'requests' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Workflow Approval Remarks</h3>
                <p className="text-[10px] text-slate-450 mt-1">Provide comment remarks before taking an approval action.</p>
              </div>
              <input
                type="text"
                placeholder="Enter approval/rejection remarks..."
                className="flex-1 max-w-lg px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-8 py-5 border-b border-slate-200 bg-slate-50">
                <h3 className="text-xs font-semibold text-slate-650">Leave Approval Backlog</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-550">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Leave Details</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Workflow Status</th>
                      <th className="px-6 py-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {reqsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24} />
                          <p className="text-[10px] font-semibold text-slate-400 mt-2">Loading requests...</p>
                        </td>
                      </tr>
                    ) : requests.length > 0 ? (
                      requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <span className="font-bold text-slate-800">{req.employeeName}</span>
                          </td>
                          <td className="px-6 py-5 font-semibold text-slate-600">
                            {req.leaveTypeName}
                          </td>
                          <td className="px-6 py-5 text-slate-500">
                            <div>{req.startDate} to {req.endDate}</div>
                            <div className="text-[10px] font-bold text-indigo-600 mt-0.5">
                              {Math.ceil(Math.abs(new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
                            </div>
                          </td>
                          <td className="px-6 py-5 text-slate-500 italic max-w-xs truncate">
                            {req.reason}
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-1">
                              <span className={`px-2.5 py-1 text-[8px] font-extrabold uppercase rounded-lg border ${
                                req.status === 'APPROVED'
                                  ? 'bg-emerald-50 border-emerald-250 text-emerald-700 animate-pulse'
                                  : req.status === 'REJECTED'
                                    ? 'bg-red-50 border-red-250 text-red-700'
                                    : 'bg-indigo-50 border-indigo-200 text-indigo-750'
                              }`}>
                                {req.status?.replace('_', ' ')}
                              </span>
                              <div className="text-[8px] text-slate-400 font-semibold space-y-0.5 mt-1 leading-none">
                                <p>Manager: <span className={req.managerApproval === 'APPROVED' ? 'text-emerald-600 font-black' : req.managerApproval === 'REJECTED' ? 'text-red-500 font-black' : 'text-slate-500'}>{req.managerApproval}</span></p>
                                <p>HR: <span className={req.hrApproval === 'APPROVED' ? 'text-emerald-600 font-black' : req.hrApproval === 'REJECTED' ? 'text-red-500 font-black' : 'text-slate-500'}>{req.hrApproval}</span></p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              {req.status === 'PENDING_MANAGER' && (
                                <>
                                  <button
                                    onClick={() => handleProcessApproval(req.id, 'MANAGER', 'APPROVED')}
                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[9px] font-bold hover:bg-indigo-700 shadow-sm shrink-0"
                                  >
                                    Approve (Manager)
                                  </button>
                                  <button
                                    onClick={() => handleProcessApproval(req.id, 'MANAGER', 'REJECTED')}
                                    className="px-3 py-1.5 bg-white border border-red-200 text-red-650 hover:bg-red-50 rounded-xl text-[9px] font-bold shrink-0"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {req.status === 'PENDING_HR' && (
                                <>
                                  <button
                                    onClick={() => handleProcessApproval(req.id, 'HR', 'APPROVED')}
                                    className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-[9px] font-bold hover:bg-purple-700 shadow-sm shrink-0"
                                  >
                                    Approve (HR)
                                  </button>
                                  <button
                                    onClick={() => handleProcessApproval(req.id, 'HR', 'REJECTED')}
                                    className="px-3 py-1.5 bg-white border border-red-200 text-red-650 hover:bg-red-50 rounded-xl text-[9px] font-bold shrink-0"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {(req.status === 'APPROVED' || req.status === 'REJECTED') && (
                                <span className="text-[10px] text-slate-400 italic font-semibold">Processed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                          No leave requests cataloged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'balances' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-8 py-5 border-b border-slate-200 bg-slate-50">
                <h3 className="text-xs font-semibold text-slate-655">Leave Balances Report</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Casual Leave (Allocated/Used/Remaining)</th>
                      <th className="px-6 py-4">Medical Leave (Allocated/Used/Remaining)</th>
                      <th className="px-6 py-4">Earned Leave (Allocated/Used/Remaining)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {balancesLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24} />
                          <p className="text-[10px] font-semibold text-slate-450 mt-2">Loading Balances...</p>
                        </td>
                      </tr>
                    ) : balancesReport.length > 0 ? (
                      balancesReport.map((rep) => {
                        const cl = rep.balances?.find(b => b.leaveTypeCode === 'CL') || { allocated: 12, used: 0, remaining: 12 };
                        const ml = rep.balances?.find(b => b.leaveTypeCode === 'ML') || { allocated: 10, used: 0, remaining: 10 };
                        const el = rep.balances?.find(b => b.leaveTypeCode === 'EL') || { allocated: 15, used: 0, remaining: 15 };
                        return (
                          <tr key={rep.employeeId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-5">
                              <span className="font-bold text-slate-800">{rep.name}</span>
                              <span className="block text-[9px] text-slate-400 font-mono mt-0.5">{rep.employeeId}</span>
                            </td>
                            <td className="px-6 py-5 text-slate-500 font-semibold">
                              {rep.department || 'Operations'}
                            </td>
                            <td className="px-6 py-5">
                              <div className="font-semibold text-slate-700">{cl.allocated} / {cl.used} / <span className="text-indigo-650 font-bold">{cl.remaining}</span></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="font-semibold text-slate-700">{ml.allocated} / {ml.used} / <span className="text-indigo-655 font-bold">{ml.remaining}</span></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="font-semibold text-slate-700">{el.allocated} / {el.used} / <span className="text-indigo-650 font-bold">{el.remaining}</span></div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                          No leave balance records mapped.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* Apply Leave Request Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-semibold text-slate-800">Submit Leave Application</h2>
              <button 
                onClick={() => setShowApplyModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleApplyLeaveSubmit} className="p-8 space-y-5 font-sans">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 ml-1">Applicant Employee</label>
                <select
                  value={applyForm.employeeId}
                  onChange={(e) => setApplyForm({ ...applyForm, employeeId: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:border-indigo-600 outline-none transition-all cursor-pointer"
                >
                  {allEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId || `EMP-${emp.id.substring(0, 4)}`})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 ml-1">Leave Classification Type</label>
                <select
                  value={applyForm.leaveTypeId}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:border-indigo-600 outline-none transition-all cursor-pointer"
                >
                  {leaveTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-500 ml-1">Start Date</label>
                  <input
                    required
                    type="date"
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-500 ml-1">End Date</label>
                  <input
                    required
                    type="date"
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 ml-1">Reason for Absence</label>
                <textarea
                  required
                  placeholder="Provide reasoning details..."
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-[10px] font-semibold hover:bg-slate-50 text-slate-550 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  File Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-semibold text-slate-800">
                {isEditingPlan ? 'Update Plan' : 'Register New Plan'}
              </h2>
              <button 
                onClick={() => setShowPlanModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePlanSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 ml-1">Plan Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Interns Policy Plan"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 ml-1">Default Cycle</label>
                <select 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                  value={newPlan.cycle}
                  onChange={(e) => setNewPlan({ ...newPlan, cycle: e.target.value })}
                >
                  <option value="Apr - Mar">April - March (Standard Financial)</option>
                  <option value="Jan - Dec">January - December (Calendar Year)</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] tracking-[0.2em] shadow-sm hover:scale-[1.01] hover:bg-indigo-700 transition-all"
              >
                Commit Plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Type Definitions (Entitlement Logic) Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-semibold text-slate-800">
                {isEditingType ? 'Edit Rule Definition' : 'Define New Policy Rule'}
              </h2>
              <button 
                onClick={() => setShowTypeModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTypeDefinition} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left col */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">Leave Category</label>
                    <select 
                      required 
                      disabled={isEditingType} 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                      value={typeForm.leaveTypeId} 
                      onChange={(e) => setTypeForm({ ...typeForm, leaveTypeId: e.target.value })}
                    >
                      <option value="">Select Category...</option>
                      {leaveTypes
                        .filter(lt => isEditingType || !definitions.find(d => d.leave_type_id === lt.id))
                        .map(lt => (
                          <option key={lt.id} value={lt.id}>{lt.name} ({lt.code})</option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">Annual Allotted Quota</label>
                    <div className="flex gap-4">
                      <input 
                        type="number" 
                        disabled={typeForm.isUnlimited} 
                        className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all disabled:opacity-30" 
                        value={typeForm.annualQuota} 
                        onChange={(e) => setTypeForm({ ...typeForm, annualQuota: parseFloat(e.target.value) })} 
                      />
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all select-none">
                        <input 
                          type="checkbox" 
                          className="rounded text-indigo-600 bg-white border-slate-300"
                          checked={typeForm.isUnlimited} 
                          onChange={(e) => setTypeForm({ ...typeForm, isUnlimited: e.target.checked })} 
                        />
                        <span className="text-[9px] font-semibold text-slate-600">Unlimited</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">Accrual Mode & Rate</label>
                    <div className="flex gap-3">
                      <select 
                        className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                        value={typeForm.accrualType} 
                        onChange={(e) => setTypeForm({ ...typeForm, accrualType: e.target.value })}
                      >
                        <option value="none">Fixed / Advance Allotment</option>
                        <option value="monthly">Monthly Accrual</option>
                        <option value="quarterly">Quarterly Accrual</option>
                        <option value="yearly">Annual Accrual</option>
                      </select>
                      {['monthly', 'quarterly'].includes(typeForm.accrualType) && (
                        <input 
                          type="number" 
                          step="0.1" 
                          className="w-24 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all" 
                          placeholder="Rate" 
                          value={typeForm.accrualRate} 
                          onChange={(e) => setTypeForm({ ...typeForm, accrualRate: parseFloat(e.target.value) })} 
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Right col */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">Year-End Cycle Rule</label>
                    <select 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                      value={typeForm.yearEndPolicy} 
                      onChange={(e) => setTypeForm({ ...typeForm, yearEndPolicy: e.target.value })}
                    >
                      <option value="reset">Clear / Reset Balance</option>
                      <option value="carry_forward">Carry Forward Roll-Over</option>
                      <option value="encash">Encashment Option</option>
                    </select>
                  </div>

                  {typeForm.yearEndPolicy === 'carry_forward' && (
                    <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <label className="text-[10px] font-semibold text-slate-500 ml-1">Max Carry-Forward Cap</label>
                      <input 
                        type="number" 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all" 
                        placeholder="Max days to carry over" 
                        value={typeForm.carryForwardMax} 
                        onChange={(e) => setTypeForm({ ...typeForm, carryForwardMax: parseFloat(e.target.value) })} 
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">Demographics (Gender Constraint)</label>
                    <div className="flex gap-2.5">
                      {['all', 'male', 'female'].map(g => (
                        <button 
                          key={g} 
                          type="button" 
                          onClick={() => setTypeForm({ ...typeForm, gender: g })} 
                          className={`flex-1 py-3.5 rounded-2xl text-[9px] font-extrabold uppercase tracking-widest border transition-all duration-200 ${
                            typeForm.gender === g 
                              ? 'bg-indigo-600 text-white border-transparent shadow-sm' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-850 hover:bg-slate-100'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowTypeModal(false)}
                  className="px-5 py-3 border border-slate-200 rounded-2xl text-[10px] font-semibold hover:bg-slate-50 text-slate-600 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] shadow-sm hover:scale-[1.01] hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Save size={13} />
                  Save Definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-semibold text-slate-800">Enrol Staff to Plan</h2>
              <button 
                onClick={() => setShowAssignModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8">
              <p className="text-[10px] font-semibold text-slate-500 mb-4">Select employees to cover under "{selectedPlan?.name}" policies:</p>
              
              <div className="max-h-[300px] overflow-y-auto space-y-2 mb-8 pr-2 no-scrollbar">
                {allEmployees.length > 0 ? (
                  allEmployees.map(emp => {
                    const isAlreadyAssigned = assignedEmployees.some(ae => ae.id === emp.id);
                    return (
                      <label 
                        key={emp.id} 
                        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-205 select-none ${
                          isAlreadyAssigned 
                            ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                            : selectedEmployees.includes(emp.id)
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-350'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          disabled={isAlreadyAssigned}
                          className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-indigo-500/30" 
                          checked={selectedEmployees.includes(emp.id) || isAlreadyAssigned} 
                          onChange={(e) => {
                            if (isAlreadyAssigned) return;
                            if (e.target.checked) {
                              setSelectedEmployees([...selectedEmployees, emp.id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                            }
                          }} 
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{emp.first_name} {emp.last_name}</p>
                          <p className="text-[10px] font-semibold text-slate-450 mt-1">
                            {emp.employee_id || `EMP-${emp.id.substring(0, 4)}`} · {emp.department_name || 'Operations'}
                            {isAlreadyAssigned && <span className="text-[9px] font-semibold text-indigo-600 ml-1.5">(Enrolled)</span>}
                          </p>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-450 text-xs italic">No personnel found in directory.</p>
                )}
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-6">
                <button 
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-[10px] font-semibold hover:bg-slate-50 text-slate-600 transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={handleAssignEmployeesSubmit} 
                  disabled={selectedEmployees.length === 0}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] shadow-sm hover:scale-[1.01] hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Authorize Enrollment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
