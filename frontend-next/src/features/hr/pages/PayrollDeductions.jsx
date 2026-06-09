'use client';

import { useState, useEffect } from 'react';
import {
  Receipt, Plus, Save, CheckCircle2, X, DollarSign, Calendar,
  AlertTriangle, TrendingDown, Users
} from 'lucide-react';
import { getPayrollDeductions, upsertPayrollDeduction, getSalaryStructures } from '@/services/hrApi';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const emptyForm = {
  employeeId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
  leaveDays: 0, leaveDeduction: 0, taxAmount: 0, otherDeductions: 0,
};

export default function PayrollDeductions() {
  const [deductions, setDeductions] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => { fetchData(); }, [filterMonth, filterYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dedRes, strRes] = await Promise.all([
        getPayrollDeductions(filterMonth, filterYear),
        getSalaryStructures()
      ]);
      if (dedRes.success) setDeductions(dedRes.data || []);
      if (strRes.success) setStructures(strRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const selectedEmployee = structures.find(s => s.employeeId === form.employeeId);
  const dailyRate = selectedEmployee ? (selectedEmployee.basicSalary / 26) : 0;
  const autoLeaveDeduction = form.leaveDays > 0 ? Math.round(dailyRate * form.leaveDays) : 0;

  const handleSave = async () => {
    if (!form.employeeId) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        month: Number(form.month),
        year: Number(form.year),
        leaveDays: Number(form.leaveDays),
        leaveDeduction: autoLeaveDeduction,
        taxAmount: Number(form.taxAmount),
        otherDeductions: Number(form.otherDeductions),
      };
      const res = await upsertPayrollDeduction(payload);
      if (res.success) {
        fetchData();
        setShowModal(false);
        setForm(emptyForm);
        flash('Payroll deduction saved');
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const totalTax = deductions.reduce((s, d) => s + d.taxAmount, 0);
  const totalLeaveDeduction = deductions.reduce((s, d) => s + d.leaveDeduction, 0);
  const totalOther = deductions.reduce((s, d) => s + d.otherDeductions, 0);
  const grandTotal = deductions.reduce((s, d) => s + d.totalDeductions, 0);

  return (
    <div className="ui-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-amber-600" />
            Payroll Deductions
          </h1>
          <p className="text-sm text-gray-500 mt-1">Apply leave and tax deductions; auto-update net pay</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700"
        >
          <Plus className="w-4 h-4" /> Add Deduction
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Period Filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Leave Deductions', value: totalLeaveDeduction, icon: Users, color: 'blue' },
          { label: 'Tax Deductions', value: totalTax, icon: TrendingDown, color: 'red' },
          { label: 'Other Deductions', value: totalOther, icon: AlertTriangle, color: 'yellow' },
          { label: 'Total Deductions', value: grandTotal, icon: DollarSign, color: 'gray' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 text-${card.color}-500`} />
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              </div>
              <p className="text-xl font-bold text-gray-900">
                ₹{new Intl.NumberFormat('en-IN').format(card.value)}
              </p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading deductions...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Employee', 'Period', 'Leave Days', 'Leave Deduction', 'Tax', 'Other', 'Total Deduction', 'Net Impact'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deductions.map(d => {
                const struct = structures.find(s => s.employeeId === d.employeeId);
                const baseNet = struct ? (struct.basicSalary + struct.allowances - struct.deductions) : null;
                const adjustedNet = baseNet !== null ? baseNet - d.leaveDeduction - d.taxAmount - d.otherDeductions : null;
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.employeeName}</td>
                    <td className="px-4 py-3 text-gray-600">{MONTHS[d.month - 1]} {d.year}</td>
                    <td className="px-4 py-3 text-gray-700">{d.leaveDays}</td>
                    <td className="px-4 py-3 text-red-500 font-medium">-₹{d.leaveDeduction.toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-500 font-medium">-₹{d.taxAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-500 font-medium">-₹{d.otherDeductions.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-red-600">-₹{d.totalDeductions.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      {adjustedNet !== null ? (
                        <span className="font-semibold text-gray-800">₹{adjustedNet.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!deductions.length && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    No deductions for {MONTHS[filterMonth - 1]} {filterYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Deduction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Add Payroll Deduction</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Employee</label>
                <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">Select employee...</option>
                  {structures.map(s => <option key={s.employeeId} value={s.employeeId}>{s.name}</option>)}
                </select>
              </div>
              {selectedEmployee && (
                <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
                  Basic Salary: ₹{selectedEmployee.basicSalary.toLocaleString()} · Daily Rate: ₹{Math.round(dailyRate).toLocaleString()}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Month</label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Year</label>
                  <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Leave Days Taken</label>
                <input type="number" min="0" value={form.leaveDays} onChange={e => setForm(f => ({ ...f, leaveDays: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                {form.leaveDays > 0 && selectedEmployee && (
                  <p className="text-xs text-amber-600 mt-1">Auto-calculated deduction: ₹{autoLeaveDeduction.toLocaleString()}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Tax Amount (₹)</label>
                <input type="number" min="0" value={form.taxAmount} onChange={e => setForm(f => ({ ...f, taxAmount: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Other Deductions (₹)</label>
                <input type="number" min="0" value={form.otherDeductions} onChange={e => setForm(f => ({ ...f, otherDeductions: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm flex justify-between">
                <span className="text-gray-600">Total Deduction:</span>
                <span className="font-bold text-red-600">
                  -₹{(autoLeaveDeduction + Number(form.taxAmount) + Number(form.otherDeductions)).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleSave} disabled={submitting}
                className="flex-1 bg-amber-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Deduction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
