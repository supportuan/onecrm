'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Calendar, 
  X, 
  Save,
  Loader2,
  ChevronRight
} from 'lucide-react';

type InnerTab = 'configuration' | 'employees' | 'year-end';

export default function LeaveManagementTab() {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [activeInnerTab, setActiveInnerTab] = useState<InnerTab>('configuration');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<any[]>([]);

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes, eRes] = await Promise.all([
        fetch('/api/leave/plans'),
        fetch('/api/leave/types'),
        fetch('/api/employees')
      ]);
      const [pData, tData, eData] = await Promise.all([pRes.json(), tRes.json(), eRes.json()]);
      if (pData.success) {
        setPlans(pData.plans);
        if (pData.plans.length > 0) {
          setSelectedPlan(pData.plans[0]);
          fetchPlanDetails(pData.plans[0].id);
        }
      }
      if (tData.success) setLeaveTypes(tData.types);
      if (eData.success) setAllEmployees(eData.employees);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchPlanDetails = async (planId: string) => {
    try {
      const [dRes, eRes] = await Promise.all([
        fetch(`/api/leave/plans/${planId}/definitions`),
        fetch(`/api/leave/plans/${planId}/employees`)
      ]);
      const dData = await dRes.json();
      const eData = await eRes.json();
      if (dData.success) setDefinitions(dData.definitions);
      if (eData.success) setAssignedEmployees(eData.employees);
    } catch (err) { console.error(err); }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/leave/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPlan)
    });
    const data = await res.json();
    if (data.success) {
      setPlans([...plans, data.plan]);
      setNewPlan({ name: '', cycle: 'Apr - Mar' });
      setShowPlanModal(false);
    }
  };

  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const res = await fetch('/api/leave/plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedPlan.id, name: selectedPlan.name })
    });
    const data = await res.json();
    if (data.success) {
      setPlans(plans.map(p => p.id === data.plan.id ? data.plan : p));
      setShowPlanModal(false);
      setIsEditingPlan(false);
    }
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const res = await fetch(`/api/leave/plans/${selectedPlan.id}/definitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(typeForm)
    });
    if ((await res.json()).success) {
      fetchPlanDetails(selectedPlan.id);
      setShowTypeModal(false);
    }
  };

  const handleAssignEmployees = async () => {
    if (!selectedPlan || selectedEmployees.length === 0) return;
    try {
      const res = await fetch(`/api/leave/plans/${selectedPlan.id}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds: selectedEmployees })
      });
      if (res.ok) {
        fetchPlanDetails(selectedPlan.id);
        setShowAssignModal(false);
        setSelectedEmployees([]);
      }
    } catch (err) { console.error(err); }
  };

  const filteredPlans = plans.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading && plans.length === 0) return <div className="p-20 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading Plans...</div>;

  return (
    <div className="flex gap-8 h-[calc(100vh-280px)] min-h-[600px] animate-in fade-in">
      {/* Sidebar for Plans */}
      <div className="w-72 bg-white border border-border rounded-3xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-50 bg-gray-50/50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Entitlement Plans</h4>
            <button onClick={() => { setIsEditingPlan(false); setNewPlan({ name: '', cycle: 'Apr - Mar' }); setShowPlanModal(true); }} className="text-primary hover:bg-primary/10 p-1.5 rounded-xl transition-all">
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Filter plans..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:border-primary transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredPlans.map(plan => (
            <button
              key={plan.id}
              onClick={() => { setSelectedPlan(plan); fetchPlanDetails(plan.id); }}
              className={`w-full p-5 text-left border-b border-gray-50 transition-all flex justify-between items-center group ${selectedPlan?.id === plan.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-gray-50'}`}
            >
              <div>
                <p className={`text-xs font-bold uppercase tracking-tight ${selectedPlan?.id === plan.id ? 'text-primary' : 'text-foreground'}`}>{plan.name}</p>
                <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Default Cycle</p>
              </div>
              <ChevronRight size={14} className={`transition-transform ${selectedPlan?.id === plan.id ? 'text-primary' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white border border-border rounded-3xl flex flex-col overflow-hidden shadow-sm">
        {selectedPlan ? (
          <>
            <header className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">{selectedPlan.name}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <Calendar size={12} className="text-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cycle: {selectedPlan.cycle || 'Apr - Mar'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setIsEditingPlan(true); setShowPlanModal(true); }} className="px-4 py-2 border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all">Edit</button>
                <button className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Set Default</button>
              </div>
            </header>

            <nav className="px-8 flex gap-8 border-b border-gray-50">
              {['configuration', 'employees', 'year-end'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveInnerTab(tab as InnerTab)}
                  className={`py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeInnerTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {tab.replace('-', ' ')}
                </button>
              ))}
            </nav>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/10 no-scrollbar">
              {activeInnerTab === 'configuration' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type Definitions</h4>
                    <button onClick={() => { setIsEditingType(false); setShowTypeModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all">
                      <Plus size={14} /> Add Type
                    </button>
                  </div>
                  <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50 border-b border-border">
                        <tr className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Quota</th>
                          <th className="px-6 py-4">Policy</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {definitions.map(def => (
                          <tr key={def.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">{def.type_code}</div>
                                <span className="text-xs font-bold uppercase tracking-tight text-foreground">{def.type_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-xs font-bold text-muted-foreground">{def.is_unlimited ? '∞' : `${def.annual_quota} Days`}</td>
                            <td className="px-6 py-5 text-[10px] font-bold uppercase text-muted-foreground opacity-60 tracking-widest">{def.accrual_type}</td>
                            <td className="px-8 py-5 text-right">
                               <div className="flex justify-end gap-2">
                                  <button onClick={() => {
                                    setTypeForm({
                                      leaveTypeId: def.leave_type_id, annualQuota: parseFloat(def.annual_quota),
                                      isUnlimited: !!def.is_unlimited, accrualType: def.accrual_type,
                                      yearEndPolicy: def.year_end_policy, carryForwardMax: parseFloat(def.carry_forward_max),
                                      minDays: parseFloat(def.min_days_per_request), maxDays: parseFloat(def.max_days_per_request || 30),
                                      gender: def.gender_restriction, accrualRate: parseFloat(def.accrual_rate || 0)
                                    });
                                    setIsEditingType(true);
                                    setShowTypeModal(true);
                                  }} className="p-1.5 text-muted-foreground hover:text-primary transition-all"><Edit2 size={14} /></button>
                                  <button onClick={() => fetch(`/api/leave/plans/${selectedPlan.id}/definitions`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leaveTypeId: def.leave_type_id }) }).then(() => fetchPlanDetails(selectedPlan.id))} className="p-1.5 text-muted-foreground hover:text-destructive transition-all"><Trash2 size={14} /></button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeInnerTab === 'employees' && (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assigned Coverage</h4>
                       <button onClick={() => setShowAssignModal(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Assign Staff</button>
                    </div>
                    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                       <table className="w-full text-left">
                          <thead className="bg-gray-50/50 border-b border-border text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                             <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">ID</th><th className="px-6 py-4 text-right">Status</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {assignedEmployees.map(emp => (
                               <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-5 text-xs font-bold uppercase tracking-tight">{emp.first_name} {emp.last_name}</td>
                                  <td className="px-6 py-5 text-[10px] font-mono font-bold text-muted-foreground">{emp.employee_id}</td>
                                  <td className="px-6 py-5 text-right"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase">Active</span></td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-30 grayscale">
             <Calendar size={64} />
             <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Select Plan Context</p>
          </div>
        )}
      </div>

      {/* Modals for Leave Management */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 animate-in fade-in">
           <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in">
              <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                 <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">{isEditingPlan ? 'Update' : 'Register'} Plan</h2>
                 <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <form onSubmit={isEditingPlan ? handleEditPlan : handleCreatePlan} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Plan Descriptor</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-5 py-3 bg-muted border border-border rounded-2xl text-sm font-bold uppercase tracking-tight outline-none focus:border-primary transition-all"
                      placeholder="E.G. INTERN TRACK"
                      value={isEditingPlan ? selectedPlan?.name || '' : newPlan.name}
                      onChange={(e) => {
                        if (isEditingPlan && selectedPlan) setSelectedPlan({...selectedPlan, name: e.target.value});
                        else setNewPlan({...newPlan, name: e.target.value});
                      }}
                    />
                 </div>
                 <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20">Commit Plan</button>
              </form>
           </div>
        </div>
      )}

      {showTypeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
           <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in">
              <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                 <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Entitlement Logic</h2>
                 <button onClick={() => setShowTypeModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveType} className="p-10 grid grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-muted-foreground">Category</label>
                       <select required disabled={isEditingType} className="w-full px-5 py-3 bg-muted border border-border rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-primary transition-all" value={typeForm.leaveTypeId} onChange={(e) => setTypeForm({...typeForm, leaveTypeId: e.target.value})}>
                          <option value="">Select...</option>
                          {leaveTypes.filter(lt => isEditingType || !definitions.find(d => d.leave_type_id === lt.id)).map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-muted-foreground">Annual Limit</label>
                       <div className="flex gap-4">
                          <input type="number" disabled={typeForm.isUnlimited} className="flex-1 px-5 py-3 bg-muted border border-border rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all" value={typeForm.annualQuota} onChange={(e) => setTypeForm({...typeForm, annualQuota: parseFloat(e.target.value)})} />
                          <label className="flex items-center gap-2 cursor-pointer bg-muted px-4 rounded-2xl border border-border"><input type="checkbox" checked={typeForm.isUnlimited} onChange={(e) => setTypeForm({...typeForm, isUnlimited: e.target.checked})} /><span className="text-[8px] font-bold uppercase">∞</span></label>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-muted-foreground">Accrual Loop</label>
                       <div className="flex gap-3">
                          <select className="flex-1 px-5 py-3 bg-muted border border-border rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary transition-all" value={typeForm.accrualType} onChange={(e) => setTypeForm({...typeForm, accrualType: e.target.value})}>
                             <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Annual</option><option value="none">Fixed</option>
                          </select>
                          {['monthly', 'quarterly'].includes(typeForm.accrualType) && <input type="number" step="0.1" className="w-20 px-4 py-3 bg-muted border border-border rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all" placeholder="R" value={typeForm.accrualRate} onChange={(e) => setTypeForm({...typeForm, accrualRate: parseFloat(e.target.value)})} />}
                       </div>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-muted-foreground">Transition Rule</label>
                       <select className="w-full px-5 py-3 bg-muted border border-border rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary transition-all" value={typeForm.yearEndPolicy} onChange={(e) => setTypeForm({...typeForm, yearEndPolicy: e.target.value})}>
                          <option value="reset">Clear Balance</option><option value="carry_forward">Carry Forward</option><option value="encash">Encashment</option>
                       </select>
                    </div>
                    {typeForm.yearEndPolicy === 'carry_forward' && <input type="number" className="w-full px-5 py-3 bg-muted border border-border rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all" placeholder="Max Carry" value={typeForm.carryForwardMax} onChange={(e) => setTypeForm({...typeForm, carryForwardMax: parseFloat(e.target.value)})} />}
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-muted-foreground">Gender Filter</label>
                       <div className="flex gap-2">
                          {['all', 'male', 'female'].map(g => <button key={g} type="button" onClick={() => setTypeForm({...typeForm, gender: g})} className={`flex-1 py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest border transition-all ${typeForm.gender === g ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10' : 'bg-muted border-border text-muted-foreground'}`}>{g}</button>)}
                       </div>
                    </div>
                 </div>
                 <button type="submit" className="col-span-2 py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20"><Save size={14} className="inline mr-2" /> Commit Entitlement</button>
              </form>
           </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 animate-in fade-in">
           <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl scale-100 animate-in zoom-in">
              <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                 <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Bulk Staff Assignment</h2>
                 <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="p-8">
                 <div className="max-h-[300px] overflow-y-auto space-y-2 mb-8 pr-2 no-scrollbar">
                    {allEmployees.map(emp => (
                       <label key={emp.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border hover:bg-gray-50 cursor-pointer transition-all">
                          <input type="checkbox" className="w-4 h-4 rounded text-primary" checked={selectedEmployees.includes(emp.id)} onChange={(e) => e.target.checked ? setSelectedEmployees([...selectedEmployees, emp.id]) : setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id))} />
                          <div><p className="text-xs font-bold uppercase tracking-tight text-foreground">{emp.first_name} {emp.last_name}</p><p className="text-[9px] font-bold text-muted-foreground uppercase">{emp.employee_id} · {emp.department_name}</p></div>
                       </label>
                    ))}
                 </div>
                 <button onClick={handleAssignEmployees} className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20">Authorize Assignment</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

