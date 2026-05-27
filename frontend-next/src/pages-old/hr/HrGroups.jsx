'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Loader2, X } from 'lucide-react';
import { getGroups, createGroup } from '../../services/hrApi';

export default function HrGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await getGroups();
      if (res.success) setGroups(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await createGroup(form);
      if (res.success) {
        setForm({ name: '', description: '' });
        setShowModal(false);
        await fetchGroups();
      }
    } catch (err) {
      alert(err.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">HR Groups</h1>
          <p className="text-slate-500 text-sm mt-1">Organize teams into functional groups for permissions and reporting.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all"
        >
          <Plus size={14} /> Create New Group
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-600" size={28} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((g) => (
              <div key={g.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={18} /></div>
                  <h3 className="text-sm font-semibold text-slate-800">{g.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">{g.description || 'No description'}</p>
                <p className="text-[10px] font-semibold text-slate-400">{g.memberIds?.length || 0} members</p>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="text-sm text-slate-400 col-span-full text-center py-12">No groups yet. Create your first group.</p>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-slate-800">Create New Group</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 ml-1">Group Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 ml-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 h-24 resize-none" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
