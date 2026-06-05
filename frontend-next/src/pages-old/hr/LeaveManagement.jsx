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
} from '../../services/hrApi';

export default function LeaveManagement() {
  const [activeMainTab, setActiveMainTab] = useState('plans'); // 'plans' | 'holidays'

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
    accrualRate: 1.0,
  });

  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [holidaysSubmitting, setHolidaysSubmitting] = useState(false);
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'public' });
  const [holidayFolders, setHolidayFolders] = useState(['public', 'restricted', 'institutional']);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [plansRes, typesRes, empRes] = await Promise.all([getLeavePlans(), getLeaveTypes(), getEmployees()]);
      if (plansRes.success) {
        setPlans(plansRes.plans || []);
        if (plansRes.plans && plansRes.plans.length > 0) {
          const firstPlan = plansRes.plans[0];
          setSelectedPlan(firstPlan);
          await fetchPlanDetails(firstPlan.id);
        }
      }
      if (typesRes.success) setLeaveTypes(typesRes.types || []);
      if (empRes.success) setAllEmployees(empRes.employees || []);
    } catch (err) {
      console.error('Failed to load initial leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanDetails = async (planId) => {
    try {
      const [defRes, empRes] = await Promise.all([getLeaveDefinitions(planId), getLeavePlanEmployees(planId)]);
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
          accrualRate: 1.0,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDefinition = async (leaveTypeId) => {
    if (!confirm('are you sure you want to delete this leave type definition?')) return;
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

  useEffect(() => {
    if (activeMainTab === 'holidays') fetchHolidaysList();
  }, [activeMainTab]);

  const fetchHolidaysList = async () => {
    setHolidaysLoading(true);
    try {
      const res = await getHolidays();
      if (res.success) {
        setHolidays(res.holidays || []);
        const types = (res.holidays || []).map((h) => h.type).filter(Boolean);
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
        setFeedbackMsg({ type: 'error', text: res.error || 'failed to add holiday' });
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

  const filteredPlans = plans.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredHolidays = holidays.filter((h) => h.name.toLowerCase().includes(holidaySearchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">leave & holidays</h1>
          <p className="text-slate-500 text-sm mt-1">
            configure leave policies, entitlement plans, employee assignments, and the holiday calendar.
          </p>
        </div>

        <div className="flex bg-slate-50 border border-slate-200 rounded-2xl p-1 shrink-0">
          <button
            onClick={() => setActiveMainTab('plans')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-semibold transition-all ${
              activeMainTab === 'plans' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-700 hover:bg-white'
            }`}
          >
            <Palmtree size={12} />
            entitlement plans
          </button>
          <button
            onClick={() => setActiveMainTab('holidays')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-semibold transition-all ${
              activeMainTab === 'holidays' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-700 hover:bg-white'
            }`}
          >
            <CalendarIcon size={12} />
            holiday calendar
          </button>
        </div>
      </div>

      <div>
        {activeMainTab === 'plans' && (
          <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] animate-in fade-in duration-300">
            {/* Plans sidebar */}
            <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm shrink-0">
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-semibold text-slate-500">entitlement plans</h4>
                  <button
                    onClick={() => {
                      setIsEditingPlan(false);
                      setNewPlan({ name: '', cycle: 'Apr - Mar' });
                      setShowPlanModal(true);
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2 rounded-xl transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="search plans..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[450px] lg:max-h-none">
                {loading ? (
                  <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-indigo-600" size={24} />
                    <span className="text-xs">loading plans...</span>
                  </div>
                ) : filteredPlans.length > 0 ? (
                  filteredPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full p-5 text-left border-b border-slate-100 transition-all flex justify-between items-center group ${
                        selectedPlan?.id === plan.id ? 'bg-indigo-50/40 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-xs font-semibold lowercase ${
                            selectedPlan?.id === plan.id ? 'text-indigo-700' : 'text-slate-800'
                          }`}
                        >
                          {plan.name}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-450 mt-1 flex items-center gap-1.5">
                          <CalendarIcon size={10} className="text-slate-400" />
                          cycle: {plan.cycle || 'Apr - Mar'}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`transition-transform ${
                          selectedPlan?.id === plan.id
                            ? 'text-indigo-600 translate-x-1'
                            : 'text-slate-400 opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </button>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-450 text-xs">no entitlement plans found.</div>
                )}
              </div>
            </div>

            {/* Plan details */}
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm">
              {selectedPlan ? (
                <>
                  <header className="px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 lowercase">{selectedPlan.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-semibold text-slate-500">
                          active policy plan · cycle: {selectedPlan.cycle || 'Apr - Mar'}
                        </span>
                      </div>
                    </div>
                  </header>

                  <nav className="px-8 flex gap-8 border-b border-slate-200 bg-slate-50/50">
                    {[
                      { id: 'configuration', label: 'type definitions', icon: Settings },
                      { id: 'employees', label: 'assigned employees', icon: Users },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveInnerTab(tab.id)}
                          className={`py-4 text-[10px] font-semibold border-b-2 transition-all flex items-center gap-2 ${
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

                  <div className="flex-1 p-8 overflow-y-auto">
                    {activeInnerTab === 'configuration' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-600">policy rules</h4>
                            <p className="text-[10px] text-slate-450 mt-1">
                              define limits, accruals, gender restrictions, and roll-over behavior.
                            </p>
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
                                accrualRate: 1.0,
                              });
                              setShowTypeModal(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-semibold transition-all"
                          >
                            <Plus size={14} /> add definition
                          </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500">
                                <tr>
                                  <th className="px-6 py-4">leave type</th>
                                  <th className="px-6 py-4">quota</th>
                                  <th className="px-6 py-4">accrual cycle</th>
                                  <th className="px-6 py-4">year-end policy</th>
                                  <th className="px-6 py-4 text-right">actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {definitions.length > 0 ? (
                                  definitions.map((def) => (
                                    <tr key={def.id} className="hover:bg-slate-50/50 transition-all">
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold text-[10px] border border-indigo-200">
                                            {def.type_code || def.leave_type_code || 'LV'}
                                          </div>
                                          <div>
                                            <span className="text-xs font-semibold text-slate-800 lowercase">
                                              {def.type_name || def.leave_type_name}
                                            </span>
                                            <span className="block text-[9px] font-semibold text-slate-450 mt-0.5">
                                              gender: {def.gender_restriction}
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                                        {def.is_unlimited ? (
                                          <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-[10px] font-semibold border border-sky-200">
                                            unlimited
                                          </span>
                                        ) : (
                                          `${def.annual_quota} days`
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
                                            <span className="text-[9px] text-slate-450 font-semibold">
                                              max: {def.carry_forward_max} days
                                            </span>
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
                                                accrualRate: parseFloat(def.accrual_rate || 1.0),
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
                                            className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg text-slate-400 hover:text-rose-500 transition-all"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs">
                                      no leave types configured. click "add definition" to set one up.
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
                            <h4 className="text-xs font-semibold text-slate-600">assigned employees</h4>
                            <p className="text-[10px] text-slate-450 mt-1">
                              personnel covered by the cycle and policy rules of this plan.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedEmployees([]);
                              setShowAssignModal(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-semibold transition-all"
                          >
                            assign employees
                          </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500">
                              <tr>
                                <th className="px-6 py-4">employee</th>
                                <th className="px-6 py-4">id</th>
                                <th className="px-6 py-4">department / designation</th>
                                <th className="px-6 py-4 text-right">status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {assignedEmployees.length > 0 ? (
                                assignedEmployees.map((emp) => (
                                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-all">
                                    <td className="px-6 py-4">
                                      <span className="text-xs font-semibold text-slate-800">
                                        {emp.first_name} {emp.last_name}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-mono text-slate-500 font-semibold">
                                      {emp.employee_id || `EMP-${(emp.id || '').toString().substring(0, 4)}`}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                      {emp.designation || 'specialist'} ·{' '}
                                      <span className="text-[10px] font-semibold text-slate-400">{emp.department_name || 'operations'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-semibold border border-emerald-200">
                                        enrolled
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs">
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
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 py-20 opacity-50">
                  <Palmtree size={48} className="text-indigo-600 opacity-70" />
                  <p className="text-xs font-semibold text-slate-800">no entitlement plan selected</p>
                  <p className="text-[10px] text-slate-500 max-w-xs text-center font-medium">
                    create a new plan in the sidebar or select an existing one to configure policies.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMainTab === 'holidays' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="filter holidays by name..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 outline-none transition-all"
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="px-8 py-5 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-xs font-semibold text-slate-600">holiday calendar</h3>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500">
                        <th className="px-8 py-4 text-left">holiday</th>
                        <th className="px-8 py-4 text-left">date</th>
                        <th className="px-8 py-4 text-left">category</th>
                        <th className="px-8 py-4 text-right">actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {holidaysLoading ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                            <p className="text-[10px] font-semibold text-slate-400 mt-2">loading calendar...</p>
                          </td>
                        </tr>
                      ) : filteredHolidays.length > 0 ? (
                        filteredHolidays.map((holiday) => (
                          <tr key={holiday.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl">
                                  <CalendarIcon size={15} />
                                </div>
                                <span className="text-xs font-semibold text-slate-800 lowercase">{holiday.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-4 text-xs font-semibold text-slate-500">
                              {new Date(holiday.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </td>
                            <td className="px-8 py-4">
                              <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-semibold text-indigo-600 lowercase">
                                {holiday.type || 'public'}
                              </span>
                            </td>
                            <td className="px-8 py-4 text-right">
                              <button
                                onClick={() => handleDeleteHolidayClick(holiday.id)}
                                className="p-2 bg-white border border-slate-200 hover:border-rose-500 hover:text-rose-500 rounded-xl transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-xs text-slate-400">
                            no holidays registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 h-fit">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-xs font-semibold text-slate-800">add holiday</h3>
                  <button
                    type="button"
                    onClick={handleAddHolidayFolder}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    + custom category
                  </button>
                </div>

                <form onSubmit={handleCreateHolidaySubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-600 outline-none transition-all"
                      placeholder="e.g. independence day"
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">date</label>
                    <input
                      required
                      type="date"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">category</label>
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
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {holidaysSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={14} />}
                    add to calendar
                  </button>
                </form>

                {feedbackMsg && (
                  <div
                    className={`p-4 rounded-2xl flex items-center gap-3 border ${
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
                    <p className="text-[10px] font-semibold">{feedbackMsg.text}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-semibold text-slate-800">{isEditingPlan ? 'update plan' : 'create new plan'}</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-500 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePlanSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 ml-1">plan name</label>
                <input
                  required
                  type="text"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. interns policy plan"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 ml-1">default cycle</label>
                <select
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                  value={newPlan.cycle}
                  onChange={(e) => setNewPlan({ ...newPlan, cycle: e.target.value })}
                >
                  <option value="Apr - Mar">april - march (financial year)</option>
                  <option value="Jan - Dec">january - december (calendar year)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] shadow-sm hover:bg-indigo-700 transition-all"
              >
                save plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Type definition modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-semibold text-slate-800">
                {isEditingType ? 'edit definition' : 'add policy definition'}
              </h2>
              <button onClick={() => setShowTypeModal(false)} className="text-slate-500 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTypeDefinition} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">leave category</label>
                    <select
                      required
                      disabled={isEditingType}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                      value={typeForm.leaveTypeId}
                      onChange={(e) => setTypeForm({ ...typeForm, leaveTypeId: e.target.value })}
                    >
                      <option value="">select category...</option>
                      {leaveTypes
                        .filter((lt) => isEditingType || !definitions.find((d) => d.leave_type_id === lt.id))
                        .map((lt) => (
                          <option key={lt.id} value={lt.id}>
                            {lt.name} ({lt.code})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">annual quota</label>
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
                        <span className="text-[9px] font-semibold text-slate-600">unlimited</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">accrual mode & rate</label>
                    <div className="flex gap-3">
                      <select
                        className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                        value={typeForm.accrualType}
                        onChange={(e) => setTypeForm({ ...typeForm, accrualType: e.target.value })}
                      >
                        <option value="none">fixed / advance allotment</option>
                        <option value="monthly">monthly accrual</option>
                        <option value="quarterly">quarterly accrual</option>
                        <option value="yearly">annual accrual</option>
                      </select>
                      {['monthly', 'quarterly'].includes(typeForm.accrualType) && (
                        <input
                          type="number"
                          step="0.1"
                          className="w-24 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                          placeholder="rate"
                          value={typeForm.accrualRate}
                          onChange={(e) => setTypeForm({ ...typeForm, accrualRate: parseFloat(e.target.value) })}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">year-end rule</label>
                    <select
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                      value={typeForm.yearEndPolicy}
                      onChange={(e) => setTypeForm({ ...typeForm, yearEndPolicy: e.target.value })}
                    >
                      <option value="reset">clear / reset balance</option>
                      <option value="carry_forward">carry forward roll-over</option>
                      <option value="encash">encashment option</option>
                    </select>
                  </div>

                  {typeForm.yearEndPolicy === 'carry_forward' && (
                    <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <label className="text-[10px] font-semibold text-slate-500 ml-1">max carry-forward</label>
                      <input
                        type="number"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                        placeholder="max days to carry over"
                        value={typeForm.carryForwardMax}
                        onChange={(e) => setTypeForm({ ...typeForm, carryForwardMax: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">gender restriction</label>
                    <div className="flex gap-2.5">
                      {['all', 'male', 'female'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setTypeForm({ ...typeForm, gender: g })}
                          className={`flex-1 py-3.5 rounded-2xl text-[10px] font-semibold border transition-all ${
                            typeForm.gender === g
                              ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100'
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
                  discard
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-semibold text-slate-800">assign employees to plan</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-500 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              <p className="text-[10px] font-semibold text-slate-500 mb-4 lowercase">
                select employees to enrol in "{selectedPlan?.name}":
              </p>

              <div className="max-h-[300px] overflow-y-auto space-y-2 mb-8 pr-2">
                {allEmployees.length > 0 ? (
                  allEmployees.map((emp) => {
                    const isAlreadyAssigned = assignedEmployees.some((ae) => ae.id === emp.id);
                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                          isAlreadyAssigned
                            ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                            : selectedEmployees.includes(emp.id)
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={isAlreadyAssigned}
                          className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-indigo-500/30"
                          checked={selectedEmployees.includes(emp.id) || isAlreadyAssigned}
                          onChange={(e) => {
                            if (isAlreadyAssigned) return;
                            if (e.target.checked) setSelectedEmployees([...selectedEmployees, emp.id]);
                            else setSelectedEmployees(selectedEmployees.filter((id) => id !== emp.id));
                          }}
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-450 mt-1">
                            {emp.employee_id || `EMP-${(emp.id || '').toString().substring(0, 4)}`} ·{' '}
                            {emp.department_name || 'operations'}
                            {isAlreadyAssigned && (
                              <span className="text-[9px] font-semibold text-indigo-600 ml-1.5">(enrolled)</span>
                            )}
                          </p>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-450 text-xs">no personnel found.</p>
                )}
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-[10px] font-semibold hover:bg-slate-50 text-slate-600 transition-all"
                >
                  discard
                </button>
                <button
                  onClick={handleAssignEmployeesSubmit}
                  disabled={selectedEmployees.length === 0}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
