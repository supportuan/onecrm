'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Cpu, 
  FileText, 
  Loader2, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  TrendingUp, 
  DollarSign, 
  TrendingDown, 
  Users, 
  Download, 
  Eye, 
  X, 
  Settings,
  CreditCard,
  Edit2
} from 'lucide-react';
import { 
  getSalaryStructures, 
  updateSalaryStructure, 
  getPayslips, 
  calculatePayroll 
} from '@/services/hrApi';

export default function PayrollInputs() {
  const [activeTab, setActiveTab] = useState('structures'); // 'structures' | 'execute' | 'payslips'
  
  // Data States
  const [structures, setStructures] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Execution Tab States
  const today = new Date();
  const [executionMonth, setExecutionMonth] = useState(today.getMonth() + 1);
  const [executionYear, setExecutionYear] = useState(today.getFullYear());
  const [executionHistory, setExecutionHistory] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Editing States
  const [editingStruct, setEditingStruct] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'structures') {
        const res = await getSalaryStructures();
        if (res.success) {
          setStructures(res.data || []);
        }
      } else if (activeTab === 'payslips' || activeTab === 'execute') {
        const res = await getPayslips();
        if (res.success) {
          setPayslips(res.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStructureSubmit = async (e) => {
    e.preventDefault();
    if (!editingStruct) return;
    setSubmitting(true);
    try {
      const res = await updateSalaryStructure({
        employeeId: editingStruct.employeeId,
        basicSalary: parseFloat(editingStruct.basicSalary) || 0,
        allowances: parseFloat(editingStruct.allowances) || 0,
        deductions: parseFloat(editingStruct.deductions) || 0,
        incentivePerEnrollment: parseFloat(editingStruct.incentivePerEnrollment) || 0,
        incentiveRevenueShare: parseFloat(editingStruct.incentiveRevenueShare) || 0,
      });
      if (res.success) {
        setStructures(structures.map(s => s.employeeId === editingStruct.employeeId ? { ...s, ...res.data } : s));
        setEditingStruct(null);
        setSuccessMsg('Salary structure updated successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update salary structure.');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunPayrollBatch = async (e) => {
    e.preventDefault();
    if (!confirm(`Are you sure you want to run the payroll calculation cycle for ${MONTHS[executionMonth - 1]} ${executionYear}?`)) return;
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await calculatePayroll(executionMonth, executionYear);
      if (res.success) {
        setSuccessMsg(`Payroll batch cycle completed successfully! Generated payslips for eligible profiles.`);
        const slipRes = await getPayslips();
        if (slipRes.success) {
          setPayslips(slipRes.data || []);
        }
      } else {
        setErrorMsg(res.error || 'Failed to process payroll batch.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('A connection error occurred during payroll batch processing.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const activeStructures = structures.length;
  const filteredStructures = structures.filter(s => 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredPayslips = payslips.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPayout = payslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const totalDeductions = payslips.reduce((sum, p) => sum + (p.deductions || 0), 0);

  return (
    <div className="ui-page text-neutral-800">
      {/* Premium Title */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Payroll & Financial Inputs
          </h1>
          <p className="text-slate-550 text-sm mt-1">
            Configure salary components, audit active payroll ledger cards, and execute monthly institution-wide disbursement batches.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-200/60 p-1 border border-slate-300 rounded-lg shadow-inner shrink-0">
          <button
            onClick={() => { setActiveTab('structures'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'structures'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-600 hover:text-slate-855'
            }`}
          >
            <Wallet size={14} />
            Salary Structures
          </button>
          <button
            onClick={() => { setActiveTab('execute'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'execute'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-600 hover:text-slate-855'
            }`}
          >
            <Cpu size={14} />
            Execute Batch
          </button>
          <button
            onClick={() => { setActiveTab('payslips'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'payslips'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-600 hover:text-slate-855'
            }`}
          >
            <FileText size={14} />
            Statements ledger
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Dynamic Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-lg flex items-center gap-3 animate-in fade-in duration-200">
            <CheckCircle2 size={18} />
            <span className="text-xs font-semibold">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-250 rounded-lg flex items-center gap-3 text-red-700 animate-in fade-in duration-200">
            <AlertTriangle size={18} />
            <span className="text-xs font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Salary Structures */}
        {activeTab === 'structures' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="ui-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter personnel by name or university ID..."
                  className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-800 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="px-5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[10px] font-semibold text-neutral-600">
                {activeStructures} Configured Ledgers
              </div>
            </div>

            <div className="ui-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-semibold text-neutral-500">
                      <th className="px-6 py-4">University ID</th>
                      <th className="px-6 py-4">Personnel</th>
                      <th className="px-6 py-4">Basic Component</th>
                      <th className="px-6 py-4">Variable Allowances</th>
                      <th className="px-6 py-4">Deductions (TDS/LOP)</th>
                      <th className="px-6 py-4">Net Liquidity</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-neutral-500 flex items-center justify-center gap-3">
                          <Loader2 className="animate-spin text-neutral-700" size={24} />
                          <span className="text-xs">Loading ledger catalog...</span>
                        </td>
                      </tr>
                    ) : filteredStructures.length > 0 ? (
                      filteredStructures.map((struct) => {
                        const net = (struct.basicSalary || 0) + (struct.allowances || 0) - (struct.deductions || 0);
                        return (
                          <tr key={struct.id} className="hover:bg-neutral-50/50 transition-all duration-200">
                            <td className="px-6 py-5 text-xs font-mono font-semibold text-neutral-700">
                              {struct.employeeId}
                            </td>
                            <td className="px-6 py-5">
                              <div>
                                <p className="text-xs font-semibold text-neutral-800">{struct.name}</p>
                                <p className="text-[10px] text-neutral-500 mt-0.5">{struct.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-xs font-semibold text-neutral-600">
                              ₹{(struct.basicSalary || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-5 text-xs font-semibold text-slate-655 font-semibold">
                              ₹{(struct.allowances || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-5 text-xs font-semibold text-red-600">
                              -₹{(struct.deductions || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-xs font-semibold text-emerald-600">
                                ₹{net.toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <button 
                                onClick={() => setEditingStruct(struct)}
                                className="p-2 bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-500 hover:text-neutral-700 rounded-xl transition-all"
                              >
                                <Edit2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-xs text-neutral-500 italic">
                          No salary structures found matching your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Execute Payroll Batch */}
        {activeTab === 'execute' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Batch execution controls */}
            <div className="ui-card flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-neutral-900">Launch Calculation Batch</h3>
                <p className="text-xs text-neutral-600 max-w-lg">
                  Run the background simulation engine for the active cycle. This merges biometric clock hours, leave days, and locks payslips.
                </p>
              </div>

              <form onSubmit={handleRunPayrollBatch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-neutral-50 border border-neutral-200 p-2.5 rounded-lg shrink-0">
                <select 
                  value={executionMonth} 
                  onChange={(e) => setExecutionMonth(parseInt(e.target.value))} 
                  className="bg-transparent text-xs font-semibold px-4 py-2 outline-none cursor-pointer text-neutral-800 border-none appearance-none"
                >
                  {MONTHS.map((m, i) => <option key={i} value={i + 1} className="bg-white">{m}</option>)}
                </select>
                <div className="hidden sm:block h-6 w-[1px] bg-slate-200" />
                <select 
                  value={executionYear} 
                  onChange={(e) => setExecutionYear(parseInt(e.target.value))} 
                  className="bg-transparent text-xs font-semibold px-4 py-2 outline-none cursor-pointer text-neutral-800 border-none appearance-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y} className="bg-white">{y}</option>)}
                </select>
                
                <button 
                  type="submit"
                  disabled={submitting} 
                  className="bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold text-[10px] flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  {submitting ? 'Running...' : 'Execute Ledger Cycle'}
                </button>
              </form>
            </div>

            {/* financial statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="ui-panel p-8 flex flex-col gap-4 shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-neutral-500">Monthly Net Payouts</span>
                  <TrendingUp size={20} className="text-neutral-700 opacity-60" />
                </div>
                <p className="text-3xl font-semibold text-neutral-900 tracking-tight">₹{totalPayout.toLocaleString('en-IN')}</p>
                <div className="text-[9px] font-semibold text-neutral-500 mt-1">Disbursed Funds Liquidated</div>
              </div>

              <div className="ui-panel p-8 flex flex-col gap-4 shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-neutral-500">Batch LOP Deductions</span>
                  <TrendingDown size={20} className="text-red-500 opacity-60" />
                </div>
                <p className="text-3xl font-semibold text-neutral-900 tracking-tight">₹{totalDeductions.toLocaleString('en-IN')}</p>
                <div className="text-[9px] font-semibold text-neutral-500 mt-1">Tax withheld / Unpaid Leaves</div>
              </div>

              <div className="ui-panel p-8 flex flex-col gap-4 shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-neutral-500">Disbursed Statements</span>
                  <Users size={20} className="text-emerald-500 opacity-60" />
                </div>
                <p className="text-3xl font-semibold text-neutral-900 tracking-tight">{payslips.length}</p>
                <div className="text-[9px] font-semibold text-neutral-500 mt-1">Personnel Entries Mapped</div>
              </div>
            </div>

            {/* active entries in executing cycle */}
            <div className="ui-card">
              <h3 className="text-xs font-semibold text-neutral-600 border-b border-neutral-200 pb-4 mb-6">Eligible Batches Log</h3>
              <div className="text-center py-10 opacity-40">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto animate-pulse" />
                <p className="text-xs font-semibold text-neutral-800 mt-3">Ledger Engine Live</p>
                <p className="text-[9px] font-medium text-neutral-500 w-auto text-center mt-1">Run an execution batch using the parameters panel above to calculate payouts instantly.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Statements Ledger */}
        {activeTab === 'payslips' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="ui-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search generated statements by name or employee ID..."
                  className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-slate-850 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="px-5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[10px] font-semibold text-neutral-600">
                {filteredPayslips.length} Generated Statements
              </div>
            </div>

            <div className="ui-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-semibold text-slate-550">
                      <th className="px-6 py-4">Employee ID</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Cycle Period</th>
                      <th className="px-6 py-4">Gross Earnings</th>
                      <th className="px-6 py-4">Withheld / LOP</th>
                      <th className="px-6 py-4">Net Disbursement</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Statements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-neutral-500 flex items-center justify-center gap-3">
                          <Loader2 className="animate-spin text-neutral-700" size={24} />
                          <span className="text-xs">Loading logs...</span>
                        </td>
                      </tr>
                    ) : filteredPayslips.length > 0 ? (
                      filteredPayslips.map((pay) => (
                        <tr key={pay.id} className="hover:bg-neutral-50 transition-all duration-200">
                          <td className="px-6 py-5 text-xs font-mono font-semibold text-neutral-700">
                            {pay.employeeId}
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-xs font-semibold text-neutral-800">{pay.name}</span>
                          </td>
                          <td className="px-6 py-5 text-xs font-semibold text-neutral-600">
                            {MONTHS[pay.month - 1]} {pay.year}
                          </td>
                          <td className="px-6 py-5 text-xs font-semibold text-neutral-700">
                            ₹{((pay.basicSalary || 0) + (pay.allowances || 0)).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-5 text-xs font-semibold text-red-655 font-semibold">
                            -₹{(pay.deductions || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-5 text-xs font-semibold text-emerald-600">
                            ₹{(pay.netSalary || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-semibold rounded-lg">
                              {pay.status || 'PAID'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button 
                              onClick={() => setSelectedPayslip(pay)}
                              className="p-2 bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-600 hover:text-neutral-700 rounded-xl transition-all inline-flex items-center gap-1.5 text-[9px] font-semibold"
                            >
                              <Eye size={13} /> View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-xs text-neutral-500 italic">
                          No payslip statements generated on catalog. Run a cycle batch to populate entries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editing Structure Parameters Modal */}
      {editingStruct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="ui-modal scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h2 className="text-xs font-semibold text-neutral-800">Override Salary Ledger</h2>
              <button 
                onClick={() => setEditingStruct(null)} 
                className="text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStructureSubmit} className="p-8 space-y-5">
              <p className="text-[10px] font-semibold text-neutral-500 border-b border-neutral-200 pb-2 mb-4 leading-none">
                {editingStruct.name} · {editingStruct.employeeId}
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-neutral-600 ml-1">Basic Base Salary</label>
                <input
                  type="number" 
                  required
                  value={editingStruct.basicSalary}
                  onChange={e => setEditingStruct({ ...editingStruct, basicSalary: parseFloat(e.target.value) || 0 })}
                  className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:border-neutral-900 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-neutral-600 ml-1">Fixed Variable Allowances</label>
                <input
                  type="number" 
                  required
                  value={editingStruct.allowances}
                  onChange={e => setEditingStruct({ ...editingStruct, allowances: parseFloat(e.target.value) || 0 })}
                  className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:border-neutral-900 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-neutral-600 ml-1">Incentive / Enrollment (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingStruct.incentivePerEnrollment ?? 0}
                    onChange={e => setEditingStruct({ ...editingStruct, incentivePerEnrollment: parseFloat(e.target.value) || 0 })}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:border-neutral-900 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-neutral-600 ml-1">Revenue Share (0.02 = 2%)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={editingStruct.incentiveRevenueShare ?? 0}
                    onChange={e => setEditingStruct({ ...editingStruct, incentiveRevenueShare: parseFloat(e.target.value) || 0 })}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:border-neutral-900 outline-none transition-all"
                  />
                </div>
              </div>
              <p className="text-[10px] text-neutral-500">
                Performance incentive is auto-calculated at payroll run from enrollments and revenue.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-neutral-600 ml-1">Mandatory Withholding / Deductions</label>
                <input
                  type="number" 
                  required
                  value={editingStruct.deductions}
                  onChange={e => setEditingStruct({ ...editingStruct, deductions: parseFloat(e.target.value) || 0 })}
                  className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-red-655 focus:border-neutral-900 outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 border-t border-neutral-200 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingStruct(null)}
                  className="flex-1 py-3.5 border border-neutral-200 rounded-lg text-[10px] font-semibold hover:bg-neutral-50 text-neutral-600 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-neutral-900 text-white rounded-lg font-semibold text-[10px] hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 size={12} className="animate-spin" />}
                  Deploy Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Sheet Viewer Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="ui-modal scale-100 animate-in zoom-in-95 duration-250">
            {/* Sheet header */}
            <div className="px-8 py-5 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-neutral-700 font-semibold text-[10px]">
                <CreditCard size={15} /> Payroll Account Statement
              </div>
              <button 
                onClick={() => setSelectedPayslip(null)} 
                className="text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Statement Sheet */}
            <div className="p-8 space-y-8 bg-white text-neutral-800" id="payslip-sheet">
              {/* Institution and Period */}
              <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
                <div>
                  <h3 className="text-sm font-semibold tracking-[0.2em] text-neutral-700 leading-none">UNIVERSITY INSTITUTION</h3>
                  <p className="text-[9px] font-semibold text-neutral-500 mt-1.5">Official Monthly Statement</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-neutral-800">{MONTHS[selectedPayslip.month - 1]} {selectedPayslip.year}</p>
                  <p className="text-[9px] text-neutral-500 font-semibold mt-0.5">Reference ID: {selectedPayslip.id}</p>
                </div>
              </div>

              {/* Staff mapping */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[9px] font-semibold text-neutral-500">Beneficiary Name</span>
                  <span className="font-semibold text-neutral-800">{selectedPayslip.name}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-semibold text-neutral-500">University ID</span>
                  <span className="font-mono font-semibold text-neutral-700">{selectedPayslip.employeeId}</span>
                </div>
              </div>

              {/* Earnings vs Deductions Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-neutral-200 py-6">
                {/* Left: Earnings */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-semibold text-neutral-700 border-b border-neutral-200 pb-1.5">Credit Components</h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-neutral-600">
                      <span>Basic Allocation Base</span>
                      <span className="font-semibold">₹{(selectedPayslip.basicSalary || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-600">
                      <span>Fixed Allowances</span>
                      <span className="font-semibold">
                        ₹{Math.max(0, (selectedPayslip.allowances || 0) - (selectedPayslip.performanceIncentive || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {(selectedPayslip.performanceIncentive || 0) > 0 && (
                      <div className="flex justify-between items-center text-emerald-700">
                        <span>Performance Incentive</span>
                        <span className="font-semibold">
                          ₹{(selectedPayslip.performanceIncentive || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-neutral-800 border-t border-neutral-100 pt-2">
                      <span className="font-semibold">Total Credits</span>
                      <span className="font-semibold">
                        ₹{((selectedPayslip.basicSalary || 0) + (selectedPayslip.allowances || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Deductions */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-semibold text-red-655 border-b border-neutral-200 pb-1.5">Debit Components</h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-slate-655">
                      <span>Tax Withholding (TDS)</span>
                      <span className="font-semibold">₹{(selectedPayslip.deductions || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-655">
                      <span>Loss of Pay / Unexcused LOP</span>
                      <span className="font-semibold text-red-655">-₹0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net pay summary */}
              <div className="flex justify-between items-center bg-neutral-50 border border-neutral-200 p-5 rounded-lg">
                <div>
                  <span className="block text-[9px] font-semibold text-neutral-600 tracking-[0.2em] leading-none mb-1">Total Net Liquidity Disbursed</span>
                  <span className="text-[9px] font-medium text-neutral-500 italic">Transferred to enrolled financial nodes</span>
                </div>
                <span className="text-2xl font-semibold text-emerald-600">
                  ₹{(selectedPayslip.netSalary || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Sheet footer buttons */}
            <div className="px-8 py-5 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedPayslip(null)}
                className="px-5 py-3 border border-neutral-200 rounded-lg text-[10px] font-semibold hover:bg-slate-100 text-neutral-600 transition-all"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="px-6 py-3 bg-neutral-900 text-white rounded-lg font-semibold text-[10px] shadow-sm hover:bg-neutral-800 transition-all flex items-center gap-1.5"
              >
                <Download size={13} />
                Export / Print Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
