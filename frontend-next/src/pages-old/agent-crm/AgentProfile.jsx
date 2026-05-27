'use client';

import { useEffect, useState } from 'react';
import { getAgentProfile, updateAgentProfile } from '@/services/agentApi';

const AgentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAgentProfile();
        setProfile(res.data);
        setPhone(res.data.phone || '');
        setCompany(res.data.company || '');
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await updateAgentProfile({ phone, company });
      setProfile(res.data);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading profile...</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">My profile</h1>
        <p className="mt-2 text-sm text-slate-600">Access and update your own agent profile.</p>
      </section>

      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 max-w-xl">
        <div>
          <label className="text-xs font-semibold text-slate-600">Name</label>
          <p className="mt-1 text-sm text-slate-900">{profile?.name}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Email</label>
          <p className="mt-1 text-sm text-slate-900">{profile?.email}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Agent code</label>
          <p className="mt-1 text-sm text-slate-900">{profile?.agentCode}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Contract tier</label>
          <p className="mt-1 text-sm text-slate-900">{profile?.contractTier}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Company</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          />
        </div>
        <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">
          Save changes
        </button>
        {message && <p className="text-xs text-slate-600">{message}</p>}
      </form>
    </div>
  );
};

export default AgentProfile;
