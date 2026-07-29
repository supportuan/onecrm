'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Loader2, Megaphone, MessageSquare } from 'lucide-react';
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
import {
  CHAT_VIEWPORT_CLASS,
  ChatEmptyState,
  ChatPanel,
  UnreadBadge,
  formatListTime,
  formatWhen,
} from '@/features/communication/components/ChatUi';

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
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const r = await listAnnouncements({ activeOnly: !canManage });
      setAnnouncements(Array.isArray(r?.data) ? r.data : []);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
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

  const unreadAnnouncements = useMemo(
    () => (isAgent ? announcements.filter((a) => !a.readAt).length : 0),
    [announcements, isAgent]
  );

  const tabs = useMemo(
    () => [
      {
        id: 'announcements',
        label: unreadAnnouncements
          ? `Announcements (${unreadAnnouncements})`
          : 'Announcements',
      },
      { id: 'activity', label: 'Activity log' },
      ...(canManage ? [{ id: 'broadcast', label: 'Broadcast' }] : []),
    ],
    [canManage, unreadAnnouncements]
  );

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!canManage || busy) return;
    setBusy(true);
    try {
      const res = await sendAgentBroadcast(broadcast);
      flash(`Broadcast sent to ${res?.data?.sent || 0} agents`);
      setBroadcast({ title: '', message: '', link: '' });
    } catch (err) {
      flash(err?.message || 'Broadcast failed');
    } finally {
      setBusy(false);
    }
  };

  const publishAnnouncement = async (e) => {
    e.preventDefault();
    if (!canManage || busy) return;
    setBusy(true);
    try {
      await createAnnouncement({
        ...announceForm,
        link: announceForm.link || null,
        publish: true,
      });
      setAnnounceForm({ type: 'GENERAL', title: '', body: '', link: '' });
      flash('Announcement published');
      await loadAnnouncements();
    } catch (err) {
      flash(err?.message || 'Failed to publish');
    } finally {
      setBusy(false);
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
    if (!partnerId || busy) return;
    setBusy(true);
    try {
      await logPartnerActivity(partnerId, logForm);
      const r = await listPartnerActivities(partnerId);
      setActivities(r?.data || []);
      setLogForm({ activityType: 'CALL', subject: '', comment: '' });
      flash('Activity logged');
    } catch (err) {
      flash(err?.message || 'Failed to log');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ui-page-shell">
      {msg ? (
        <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-brand-soft px-3 py-2 text-[13px] font-medium text-brand">
          {msg}
        </div>
      ) : null}

      <div className={`grid grid-cols-1 gap-4 lg:grid-cols-12 ${CHAT_VIEWPORT_CLASS}`}>
        <ChatPanel className="min-h-[280px] lg:col-span-4 lg:h-full xl:col-span-3">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--ui-border)] px-4 py-3">
            <div>
              <h2 className="ui-text-strong">Communications</h2>
              <p className="ui-text-meta">
                {isAgent ? 'Agency inbox' : 'Partner outreach'}
              </p>
            </div>
            <UnreadBadge count={unreadAnnouncements} />
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {tabs.map((t) => {
              const active = t.id === tab;
              const Icon =
                t.id === 'broadcast' ? Megaphone : t.id === 'activity' ? MessageSquare : Bell;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex w-full items-center gap-3 rounded-[var(--ui-radius)] px-3 py-3 text-left transition ${
                    active
                      ? 'bg-[var(--ui-bg-page)] text-[var(--ui-text)]'
                      : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-page)]'
                  }`}
                >
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                      active ? 'bg-brand text-white' : 'bg-brand-soft text-brand'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className={`text-[13px] ${active ? 'font-medium' : ''}`}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </ChatPanel>

        <ChatPanel className="min-h-[420px] lg:col-span-8 lg:h-full xl:col-span-9">
          {tab === 'announcements' && (
            <>
              <div className="border-b border-[var(--ui-border)] px-4 py-3">
                <h3 className="text-[15px] font-semibold text-[var(--ui-text)]">Announcements</h3>
                <p className="text-[12px] text-[var(--ui-text-muted)]">
                  Policy updates, scholarships, and partner notices
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--ui-bg-page)]">
                {canManage && (
                  <form
                    onSubmit={publishAnnouncement}
                    className="space-y-3 border-b border-[var(--ui-border)] bg-white p-4"
                  >
                    <p className="ui-text-strong">Publish announcement</p>
                    <select
                      className="ui-field ui-select"
                      value={announceForm.type}
                      onChange={(e) =>
                        setAnnounceForm({ ...announceForm, type: e.target.value })
                      }
                    >
                      {Object.entries(TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <input
                      className="ui-field"
                      placeholder="Title"
                      value={announceForm.title}
                      onChange={(e) =>
                        setAnnounceForm({ ...announceForm, title: e.target.value })
                      }
                      required
                    />
                    <textarea
                      className="ui-field min-h-[80px] resize-none"
                      placeholder="Body"
                      value={announceForm.body}
                      onChange={(e) =>
                        setAnnounceForm({ ...announceForm, body: e.target.value })
                      }
                      required
                    />
                    <input
                      className="ui-field"
                      placeholder="Optional link"
                      value={announceForm.link}
                      onChange={(e) =>
                        setAnnounceForm({ ...announceForm, link: e.target.value })
                      }
                    />
                    <button type="submit" className="ui-btn-primary" disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish'}
                    </button>
                  </form>
                )}

                {loadingAnnouncements ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-5 w-5 animate-spin text-brand" />
                  </div>
                ) : !announcements.length ? (
                  <ChatEmptyState
                    icon={Bell}
                    title="No announcements yet"
                    description="Published notices will appear here for agents and staff."
                  />
                ) : (
                  <div className="divide-y divide-[var(--ui-border)] bg-white">
                    {announcements.map((a) => (
                      <div key={a.id} className="space-y-2 px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                              {TYPE_LABELS[a.type] || a.type}
                            </span>
                            {!a.readAt && isAgent ? <UnreadBadge count={1} /> : null}
                          </div>
                          <p className="text-[11px] text-[var(--ui-text-muted)]">
                            {a.publishedAt ? formatListTime(a.publishedAt) : 'Draft'}
                          </p>
                        </div>
                        <p className="ui-text-strong">{a.title}</p>
                        <p className="ui-text-body whitespace-pre-wrap text-[13px]">{a.body}</p>
                        {a.link ? (
                          <a
                            href={a.link}
                            className="text-[13px] font-medium text-brand hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open link
                          </a>
                        ) : null}
                        {isAgent && !a.readAt ? (
                          <button
                            type="button"
                            className="ui-btn-secondary text-xs"
                            onClick={() => markRead(a.id)}
                          >
                            Mark as read
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'broadcast' && canManage && (
            <>
              <div className="border-b border-[var(--ui-border)] px-4 py-3">
                <h3 className="text-[15px] font-semibold text-[var(--ui-text)]">
                  Broadcast to agents
                </h3>
                <p className="text-[12px] text-[var(--ui-text-muted)]">
                  Send a one-off notice to partner inboxes
                </p>
              </div>
              <form onSubmit={sendBroadcast} className="space-y-3 p-4">
                <input
                  className="ui-field"
                  placeholder="Title"
                  value={broadcast.title}
                  onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                  required
                />
                <textarea
                  className="ui-field min-h-[120px] resize-none"
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
                <button type="submit" className="ui-btn-primary" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send broadcast'}
                </button>
              </form>
            </>
          )}

          {tab === 'activity' && (
            <>
              <div className="border-b border-[var(--ui-border)] px-4 py-3">
                <h3 className="text-[15px] font-semibold text-[var(--ui-text)]">Activity log</h3>
                <p className="text-[12px] text-[var(--ui-text-muted)]">
                  Calls, emails, meetings, and notes with partners
                </p>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--ui-bg-page)] p-4">
                {!isAgent && (
                  <select
                    className="ui-field ui-select bg-white"
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                  >
                    <option value="">Select agency</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.agencyName}
                      </option>
                    ))}
                  </select>
                )}

                <form
                  onSubmit={addLog}
                  className="grid gap-3 rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-white p-3 md:grid-cols-4"
                >
                  <select
                    className="ui-field ui-select"
                    value={logForm.activityType}
                    onChange={(e) =>
                      setLogForm({ ...logForm, activityType: e.target.value })
                    }
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
                  <button
                    type="submit"
                    className="ui-btn-secondary md:col-span-4"
                    disabled={!partnerId || busy}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log activity'}
                  </button>
                </form>

                <div className="overflow-hidden rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-white">
                  {activities.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <p className="ui-text-meta">No activities yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--ui-border)]">
                      {activities.map((a) => (
                        <div key={a.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="ui-text-strong">
                              {a.activityType} — {a.subject || '—'}
                            </p>
                            <span className="shrink-0 text-[11px] text-[var(--ui-text-muted)]">
                              {formatWhen(a.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 ui-text-body text-[13px]">{a.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </ChatPanel>
      </div>
    </div>
  );
}
