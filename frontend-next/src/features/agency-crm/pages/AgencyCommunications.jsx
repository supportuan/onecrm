'use client';

import { useEffect, useState } from 'react';
import { Megaphone, MessageSquare } from 'lucide-react';
import {
  listPartners,
  listPartnerActivities,
  logPartnerActivity,
  sendAgentBroadcast,
} from '@/services/agencyCrmApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';

export default function AgencyCommunications() {
  const { can } = usePermissions();
  const canManage = can('MANAGE_AGENCY_CRM');

  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState('');
  const [activities, setActivities] = useState([]);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', link: '' });
  const [logForm, setLogForm] = useState({ activityType: 'CALL', subject: '', comment: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    listPartners()
      .then((r) => setPartners(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setPartners([]));
  }, []);

  useEffect(() => {
    if (!partnerId) {
      setActivities([]);
      return;
    }
    listPartnerActivities(partnerId)
      .then((r) => setActivities(r?.data || []))
      .catch(() => setActivities([]));
  }, [partnerId]);

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      const res = await sendAgentBroadcast(broadcast);
      setMsg(`Broadcast sent to ${res?.data?.sent || 0} agents`);
      setBroadcast({ title: '', message: '', link: '' });
    } catch (err) {
      setMsg(err?.message || 'Broadcast failed');
    }
  };

  const addLog = async (e) => {
    e.preventDefault();
    if (!partnerId) return;
    try {
      await logPartnerActivity(partnerId, logForm);
      const r = await listPartnerActivities(partnerId);
      setActivities(r?.data || []);
      setLogForm({ activityType: 'CALL', subject: '', comment: '' });
      setMsg('Activity logged');
    } catch (err) {
      setMsg(err?.message || 'Failed to log');
    }
  };

  return (
    <div className="ui-container space-y-6">
      <div>
        <h1 className="ui-text-h2">Agent communications</h1>
        <p className="ui-text-body mt-1">Log calls/meetings and send bulk updates to agents.</p>
      </div>

      {msg && <div className="ui-panel p-3 text-sm">{msg}</div>}

      {canManage && (
        <form onSubmit={sendBroadcast} className="ui-panel p-6 space-y-3">
          <h2 className="ui-text-h3 flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Broadcast to agents
          </h2>
          <input
            className="ui-field"
            placeholder="Title"
            value={broadcast.title}
            onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
            required
          />
          <textarea
            className="ui-field min-h-[80px]"
            placeholder="Message"
            value={broadcast.message}
            onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
            required
          />
          <input
            className="ui-field"
            placeholder="Optional link"
            value={broadcast.link}
            onChange={(e) => setBroadcast({ ...broadcast, link: e.target.value })}
          />
          <button type="submit" className="ui-btn-primary">Send broadcast</button>
        </form>
      )}

      <div className="ui-panel p-6 space-y-4">
        <h2 className="ui-text-h3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Activity log
        </h2>
        <select
          className="ui-field ui-select"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
        >
          <option value="">Select agency</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>{p.agencyName}</option>
          ))}
        </select>

        <form onSubmit={addLog} className="grid gap-3 md:grid-cols-4">
          <select
            className="ui-field ui-select"
            value={logForm.activityType}
            onChange={(e) => setLogForm({ ...logForm, activityType: e.target.value })}
          >
            <option value="CALL">Call</option>
            <option value="EMAIL">Email</option>
            <option value="MEETING">Meeting</option>
            <option value="NOTE">Note</option>
          </select>
          <input
            className="ui-field md:col-span-1"
            placeholder="Subject"
            value={logForm.subject}
            onChange={(e) => setLogForm({ ...logForm, subject: e.target.value })}
          />
          <input
            className="ui-field md:col-span-2"
            placeholder="Notes"
            value={logForm.comment}
            onChange={(e) => setLogForm({ ...logForm, comment: e.target.value })}
            required
          />
          <button type="submit" className="ui-btn-secondary md:col-span-4" disabled={!partnerId}>
            Log activity
          </button>
        </form>

        <div className="divide-y divide-[var(--ui-border)]">
          {activities.length === 0 ? (
            <p className="ui-text-meta py-4">No activities yet</p>
          ) : (
            activities.map((a) => (
              <div key={a.id} className="py-3">
                <p className="ui-text-strong">{a.activityType} — {a.subject || '—'}</p>
                <p className="ui-text-body">{a.comment}</p>
                <p className="ui-text-meta text-xs">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
