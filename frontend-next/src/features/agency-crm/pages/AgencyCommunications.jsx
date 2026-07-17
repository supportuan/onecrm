'use client';

import { useEffect, useState } from 'react';
import { Bell, Megaphone, MessageSquare } from 'lucide-react';
import {
  listPartners,
  listPartnerActivities,
  logPartnerActivity,
  sendAgentBroadcast,
  listAnnouncements,
  createAnnouncement,
  markAnnouncementRead,
  getMyPartner,
} from '@/services/agencyCrmApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { isAgencyPartnerRole } from '../agentPortal';

const TYPE_LABELS = {
  GENERAL: 'General',
  POLICY: 'Policy',
  SCHOLARSHIP: 'Scholarship',
  UNIVERSITY_UPDATE: 'University update',
};

export default function AgencyCommunications() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can('MANAGE_AGENCY_CRM');
  const isAgent = isAgencyPartnerRole(user?.role);

  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState('');
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', link: '' });
  const [announceForm, setAnnounceForm] = useState({
    type: 'GENERAL',
    title: '',
    body: '',
    link: '',
  });
  const [logForm, setLogForm] = useState({ activityType: 'CALL', subject: '', comment: '' });
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('announcements');

  const loadAnnouncements = async () => {
    const r = await listAnnouncements({ activeOnly: !canManage });
    setAnnouncements(Array.isArray(r?.data) ? r.data : []);
  };

  useEffect(() => {
    loadAnnouncements().catch(() => setAnnouncements([]));
    if (isAgent) {
      getMyPartner()
        .then((r) => {
          if (r?.data?.id) setPartnerId(String(r.data.id));
        })
        .catch(() => {});
      return;
    }
    listPartners()
      .then((r) => setPartners(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setPartners([]));
  }, [isAgent, canManage]);

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

  const publishAnnouncement = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      await createAnnouncement({
        ...announceForm,
        link: announceForm.link || null,
        publish: true,
      });
      setAnnounceForm({ type: 'GENERAL', title: '', body: '', link: '' });
      setMsg('Announcement published');
      await loadAnnouncements();
    } catch (err) {
      setMsg(err?.message || 'Failed to publish');
    }
  };

  const markRead = async (id) => {
    try {
      await markAnnouncementRead(id);
      await loadAnnouncements();
    } catch {
      /* ignore */
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
        <h1 className="ui-text-h2">{isAgent ? 'Notifications & activity' : 'Agent communications'}</h1>
        <p className="ui-text-body mt-1">
          Announcements, policy updates, and activity logs.
        </p>
      </div>

      {msg && <div className="ui-panel p-3 text-sm">{msg}</div>}

      <div className="flex gap-2 border-b border-neutral-200">
        {[
          { id: 'announcements', label: 'Announcements' },
          { id: 'activity', label: 'Activity log' },
          ...(canManage ? [{ id: 'broadcast', label: 'Broadcast' }] : []),
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id
                ? 'border-brand text-brand'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'announcements' && (
        <div className="space-y-4">
          {canManage && (
            <form onSubmit={publishAnnouncement} className="ui-panel p-6 space-y-3">
              <h2 className="ui-text-h3 flex items-center gap-2">
                <Bell className="h-4 w-4" /> Publish announcement
              </h2>
              <select
                className="ui-field ui-select"
                value={announceForm.type}
                onChange={(e) => setAnnounceForm({ ...announceForm, type: e.target.value })}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                className="ui-field"
                placeholder="Title"
                value={announceForm.title}
                onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                required
              />
              <textarea
                className="ui-field min-h-[80px]"
                placeholder="Body"
                value={announceForm.body}
                onChange={(e) => setAnnounceForm({ ...announceForm, body: e.target.value })}
                required
              />
              <input
                className="ui-field"
                placeholder="Optional link"
                value={announceForm.link}
                onChange={(e) => setAnnounceForm({ ...announceForm, link: e.target.value })}
              />
              <button type="submit" className="ui-btn-primary">Publish</button>
            </form>
          )}

          <div className="ui-panel divide-y divide-[var(--ui-border)]">
            {!announcements.length ? (
              <p className="p-6 ui-text-meta">No announcements yet.</p>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="p-5 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                        {TYPE_LABELS[a.type] || a.type}
                      </span>
                      {!a.readAt && isAgent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand text-white">New</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400">
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : 'Draft'}
                    </p>
                  </div>
                  <p className="font-semibold text-neutral-900">{a.title}</p>
                  <p className="text-sm text-neutral-600 whitespace-pre-wrap">{a.body}</p>
                  {a.link && (
                    <a href={a.link} className="text-sm text-brand hover:underline" target="_blank" rel="noreferrer">
                      Open link
                    </a>
                  )}
                  {isAgent && !a.readAt && (
                    <button type="button" className="ui-btn-secondary text-xs" onClick={() => markRead(a.id)}>
                      Mark as read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'broadcast' && canManage && (
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

      {tab === 'activity' && (
        <div className="ui-panel p-6 space-y-4">
          <h2 className="ui-text-h3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Activity log
          </h2>
          {!isAgent && (
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
          )}

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
              className="ui-field"
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
      )}
    </div>
  );
}
