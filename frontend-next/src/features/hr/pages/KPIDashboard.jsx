'use client';

import { useState, useEffect } from 'react';
import {
  Target, Plus, TrendingUp, TrendingDown, BarChart2, Users,
  Megaphone, ChevronUp, ChevronDown, X, Save, CheckCircle2, Edit2, Trash2
} from 'lucide-react';
import {
  getKPIDefinitions, createKPIDefinition, updateKPIDefinition, deleteKPIDefinition,
  getKPIMetrics, recordKPIMetric,
  getMarketingPerformance, addMarketingPerformance,
  getCounsellorPerformance, addCounsellorPerformance,
  getProcessingMetrics, addProcessingMetric
} from '@/services/hrApi';

const ROLE_TABS = ['HR', 'COUNSELLOR', 'MARKETING'];
const ROLE_COLORS = { HR: 'blue', COUNSELLOR: 'purple', MARKETING: 'orange' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const emptyKPIDef = { role: 'HR', name: '', description: '', target: '', unit: '%', frequency: 'MONTHLY', isActive: true };

export default function KPIDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | definitions | processing
  const [activeRole, setActiveRole] = useState('HR');
  const [kpiDefs, setKpiDefs] = useState([]);
  const [kpiMetrics, setKpiMetrics] = useState([]);
  const [marketingPerf, setMarketingPerf] = useState([]);
  const [counsellorPerf, setCounsellorPerf] = useState([]);
  const [processingMetrics, setProcessingMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDefModal, setShowDefModal] = useState(false);
  const [defForm, setDefForm] = useState(emptyKPIDef);
  const [editingDef, setEditingDef] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [period, setPeriod] = useState('2026-05');

  useEffect(() => { fetchAll(); }, [period]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [defs, metrics, marketing, counsellors, processing] = await Promise.all([
        getKPIDefinitions(),
        getKPIMetrics(undefined, period),
        getMarketingPerformance(period),
        getCounsellorPerformance(period),
        getProcessingMetrics(),
      ]);
      if (defs.success) setKpiDefs(defs.data || []);
      if (metrics.success) setKpiMetrics(metrics.data || []);
      if (marketing.success) setMarketingPerf(marketing.data || []);
      if (counsellors.success) setCounsellorPerf(counsellors.data || []);
      if (processing.success) setProcessingMetrics(processing.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveDef = async () => {
    if (!defForm.name || !defForm.target) return;
    setSubmitting(true);
    try {
      const payload = { ...defForm, target: Number(defForm.target) };
      const res = editingDef
        ? await updateKPIDefinition(editingDef.id, payload)
        : await createKPIDefinition(payload);
      if (res.success) {
        setKpiDefs(prev => editingDef ? prev.map(k => k.id === editingDef.id ? res.data : k) : [...prev, res.data]);
        setShowDefModal(false);
        setDefForm(emptyKPIDef);
        setEditingDef(null);
        flash(editingDef ? 'KPI updated' : 'KPI created');
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleDeleteDef = async (id) => {
    try {
      const res = await deleteKPIDefinition(id);
      if (res.success) { setKpiDefs(prev => prev.filter(k => k.id !== id)); flash('KPI deleted'); }
    } catch (e) { console.error(e); }
  };

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const getAchievementColor = (actual, target) => {
    const pct = target > 0 ? (actual / target) * 100 : 0;
    if (pct >= 100) return 'text-green-600';
    if (pct >= 80) return 'text-yellow-600';
    return 'text-red-500';
  };

  const totalMarketingLeads = marketingPerf.reduce((s, m) => s + m.leadsGenerated, 0);
  const avgCostPerLead = marketingPerf.length ? Math.round(marketingPerf.reduce((s, m) => s + m.costPerLead, 0) / marketingPerf.length) : 0;
  const totalConversions = marketingPerf.reduce((s, m) => s + m.conversions, 0);

  const totalLeadsHandled = counsellorPerf.reduce((s, c) => s + c.leadsHandled, 0);
  const totalRevenue = counsellorPerf.reduce((s, c) => s + c.revenue, 0);
  const avgConversionRate = counsellorPerf.length ? (counsellorPerf.reduce((s, c) => s + c.conversionRate, 0) / counsellorPerf.length).toFixed(1) : 0;

  const latestProcessing = processingMetrics[0];
  const accuracyRate = latestProcessing ? ((latestProcessing.accurateApplications / latestProcessing.processedApplications) * 100).toFixed(1) : 0;

  return (
    <div className="ui-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-7 h-7 text-rose-600" />
            KPI Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Role-based performance tracking and measurement</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
            {['2026-06', '2026-05', '2026-04', '2026-03'].map(p => (
              <option key={p} value={p}>{MONTHS[parseInt(p.split('-')[1]) - 1]} {p.split('-')[0]}</option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'definitions', label: 'KPI Definitions' },
          { key: 'processing', label: 'Processing Metrics' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading KPI data...</div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Total Leads (Marketing)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalMarketingLeads}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{totalConversions} conversions</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Avg Cost Per Lead</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₹{avgCostPerLead}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Across all channels</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Counsellor Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₹{(totalRevenue / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-gray-400 mt-0.5">{avgConversionRate}% avg conversion</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Application Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{accuracyRate}%</p>
                  <p className="text-xs text-gray-400 mt-0.5">{latestProcessing?.avgTurnaroundDays}d avg turnaround</p>
                </div>
              </div>

              {/* Role Tabs */}
              <div className="flex gap-2 mb-4">
                {ROLE_TABS.map(role => (
                  <button key={role} onClick={() => setActiveRole(role)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeRole === role ? `bg-${ROLE_COLORS[role]}-600 text-white` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {role}
                  </button>
                ))}
              </div>

              {/* Marketing Performance */}
              {activeRole === 'MARKETING' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-orange-500" />
                    <h3 className="font-semibold text-gray-800 text-sm">Marketing Performance — {period}</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Channel', 'Leads Generated', 'Cost Per Lead', 'Total Budget', 'Conversions', 'Conv. Rate'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {marketingPerf.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{m.channel}</td>
                          <td className="px-4 py-3 text-gray-700">{m.leadsGenerated}</td>
                          <td className="px-4 py-3 text-gray-700">₹{m.costPerLead}</td>
                          <td className="px-4 py-3 text-gray-700">₹{(m.totalBudget / 100000).toFixed(1)}L</td>
                          <td className="px-4 py-3 text-gray-700">{m.conversions}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-emerald-600">
                              {((m.conversions / m.leadsGenerated) * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!marketingPerf.length && (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No marketing data for this period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Counsellor Performance */}
              {activeRole === 'COUNSELLOR' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <h3 className="font-semibold text-gray-800 text-sm">Counsellor Performance — {period}</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Counsellor', 'Leads Handled', 'Conversions', 'Conv. Rate', 'Revenue'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {counsellorPerf.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{c.counsellorName}</td>
                          <td className="px-4 py-3 text-gray-700">{c.leadsHandled}</td>
                          <td className="px-4 py-3 text-gray-700">{c.conversions}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                                <div className="h-1.5 bg-purple-500 rounded-full" style={{ width: `${Math.min(c.conversionRate, 100)}%` }} />
                              </div>
                              <span className={`text-xs font-semibold ${c.conversionRate >= 40 ? 'text-green-600' : 'text-yellow-600'}`}>
                                {c.conversionRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800">₹{(c.revenue / 100000).toFixed(1)}L</td>
                        </tr>
                      ))}
                      {!counsellorPerf.length && (
                        <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No counsellor data for this period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* HR KPI Metrics */}
              {activeRole === 'HR' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-gray-800 text-sm">HR KPI Metrics — {period}</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {kpiMetrics.filter(m => m.userRole === 'HR').map(metric => {
                      const pct = metric.targetValue > 0 ? Math.min((metric.actualValue / metric.targetValue) * 100, 100) : 0;
                      return (
                        <div key={metric.id} className="px-5 py-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{metric.kpiName || 'KPI'}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-48">
                                <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getAchievementColor(metric.actualValue, metric.targetValue)}`}>
                              {metric.actualValue}{metric.unit}
                            </p>
                            <p className="text-xs text-gray-400">Target: {metric.targetValue}{metric.unit}</p>
                          </div>
                        </div>
                      );
                    })}
                    {!kpiMetrics.filter(m => m.userRole === 'HR').length && (
                      <p className="text-center py-8 text-gray-400 text-sm">No HR KPI data for this period</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Definitions Tab */}
          {activeTab === 'definitions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">{kpiDefs.length} KPI definitions configured</p>
                <button onClick={() => { setDefForm(emptyKPIDef); setEditingDef(null); setShowDefModal(true); }}
                  className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700">
                  <Plus className="w-4 h-4" /> Add KPI
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['KPI Name', 'Role', 'Target', 'Frequency', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {kpiDefs.map(def => (
                      <tr key={def.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{def.name}</p>
                          {def.description && <p className="text-xs text-gray-400">{def.description}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-${ROLE_COLORS[def.role] || 'gray'}-100 text-${ROLE_COLORS[def.role] || 'gray'}-700`}>
                            {def.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-700">{def.target} {def.unit}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{def.frequency}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${def.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {def.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingDef(def); setDefForm({ ...def, target: String(def.target) }); setShowDefModal(true); }}
                              className="text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteDef(def.id)}
                              className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!kpiDefs.length && (
                      <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No KPI definitions yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Processing Metrics Tab */}
          {activeTab === 'processing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {processingMetrics.map(m => {
                  const accuracy = m.processedApplications ? ((m.accurateApplications / m.processedApplications) * 100).toFixed(1) : 0;
                  const reviewCompletion = (m.reviewsCompleted + m.pendingReviews) ? ((m.reviewsCompleted / (m.reviewsCompleted + m.pendingReviews)) * 100).toFixed(0) : 0;
                  return (
                    <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-700 mb-4">{MONTHS[parseInt(m.period.split('-')[1]) - 1]} {m.period.split('-')[0]}</p>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Total Applications</span>
                          <span className="font-semibold text-gray-800">{m.totalApplications}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Processed</span>
                          <span className="font-semibold text-gray-800">{m.processedApplications}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Accuracy Rate</span>
                          <span className={`font-semibold ${parseFloat(accuracy) >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>{accuracy}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Avg Turnaround</span>
                          <span className="font-semibold text-gray-800">{m.avgTurnaroundDays}d</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Reviews Completion</span>
                          <span className={`font-semibold ${parseInt(reviewCompletion) >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>{reviewCompletion}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Pending Reviews</span>
                          <span className={`font-semibold ${m.pendingReviews > 5 ? 'text-red-500' : 'text-gray-800'}`}>{m.pendingReviews}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!processingMetrics.length && (
                  <div className="col-span-3 text-center py-16 text-gray-400 text-sm">No processing metrics data available.</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* KPI Definition Modal */}
      {showDefModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{editingDef ? 'Edit KPI' : 'New KPI Definition'}</h2>
              <button onClick={() => { setShowDefModal(false); setEditingDef(null); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Role</label>
                <select value={defForm.role} onChange={e => setDefForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
                  {['HR', 'COUNSELLOR', 'MARKETING', 'ADMIN', 'AGENT'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">KPI Name</label>
                <input value={defForm.name} onChange={e => setDefForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Lead Conversion Rate"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                <input value={defForm.description} onChange={e => setDefForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Target Value</label>
                  <input type="number" value={defForm.target} onChange={e => setDefForm(f => ({ ...f, target: e.target.value }))}
                    placeholder="e.g. 80"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Unit</label>
                  <input value={defForm.unit} onChange={e => setDefForm(f => ({ ...f, unit: e.target.value }))}
                    placeholder="e.g. %, count, INR"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Frequency</label>
                <select value={defForm.frequency} onChange={e => setDefForm(f => ({ ...f, frequency: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
                  {['DAILY', 'WEEKLY', 'MONTHLY'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowDefModal(false); setEditingDef(null); }}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleSaveDef} disabled={submitting}
                className="flex-1 bg-rose-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {editingDef ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
