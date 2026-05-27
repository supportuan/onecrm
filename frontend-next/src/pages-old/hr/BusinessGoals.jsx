'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Link2, Loader2, X } from 'lucide-react';
import { getBusinessGoals, createBusinessGoal, linkBusinessGoalToHr } from '../../services/hrApi';

export default function BusinessGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', targetMetric: 'enrolments' });
  const [linking, setLinking] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await getBusinessGoals();
      if (res.success) setGoals(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createBusinessGoal(form);
      if (res.success) {
        setShowModal(false);
        setForm({ name: '', description: '', targetMetric: 'enrolments' });
        await fetchGoals();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLink = async (goalId) => {
    setLinking(goalId);
    try {
      const res = await linkBusinessGoalToHr(goalId);
      if (res.success) await fetchGoals();
    } catch (err) {
      alert(err.message);
    } finally {
      setLinking(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">Business Goals</h1>
          <p className="text-slate-500 text-sm mt-1">Align HR operations with institutional admissions and revenue targets.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold bg-indigo-600 text-white shadow-md hover:bg-indigo-700">
          <Plus size={14} /> New Goal
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-600" size={28} /></div>
        ) : (
          <div className="space-y-4">
            {goals.map((g) => (
              <div key={g.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Target size={18} /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{g.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{g.description}</p>
                    <p className="text-[10px] font-semibold text-indigo-600 mt-2">Metric: {g.targetMetric}</p>
                    {g.linkedModules?.includes('HR') && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-semibold rounded-lg border border-emerald-200">Linked to HR</span>
                    )}
                  </div>
                </div>
                {!g.linkedModules?.includes('HR') && (
                  <button onClick={() => handleLink(g.id)} disabled={linking === g.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-semibold hover:bg-indigo-700 disabled:opacity-50 shrink-0">
                    <Link2 size={12} /> {linking === g.id ? 'Linking...' : 'Link HR Module'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-xl">
            <div className="flex justify-between mb-6">
              <h2 className="text-sm font-semibold">New Business Goal</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input required placeholder="Goal name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none h-20 resize-none" />
              <select value={form.targetMetric} onChange={(e) => setForm({ ...form, targetMetric: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
                <option value="enrolments">Enrolments</option>
                <option value="revenue">Revenue</option>
                <option value="applications">Applications</option>
              </select>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Create Goal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
