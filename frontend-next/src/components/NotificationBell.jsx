'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification as deleteNotificationApi,
} from '@/services/notificationsApi';

const POLL_MS = 60_000;

const formatRelative = (createdAt) => {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'just now';
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const days = Math.floor(hr / 24);
  if (days > 0) return `${days}d ago`;
  if (hr > 0) return `${hr}h ago`;
  if (min > 0) return `${min}m ago`;
  return 'just now';
};

const NotificationBell = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnread(res?.data?.count ?? 0);
    } catch (_) {
      // silent — bell shouldn't show error toasts
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ limit: 20 });
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial badge load + polling.
  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(t);
  }, [fetchCount]);

  // When the dropdown opens, fetch the list.
  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString(), status: 'READ' } : n)));
      setUnread((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString(), status: 'READ' })));
      setUnread(0);
    } catch (_) {}
  };

  const handleDelete = async (id) => {
    const removed = items.find((n) => n.id === id);
    try {
      await deleteNotificationApi(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      if (removed && !removed.readAt) setUnread((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const handleItemClick = (n) => {
    if (!n.readAt) handleMarkRead(n.id);
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ui-btn-ghost !p-2 text-[var(--ui-text-muted)]"
        aria-label="notifications"
      >
        <Bell className="h-[16px] w-[16px]" strokeWidth={1.5} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--ui-text)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-h-[480px] bg-white border border-[var(--ui-border)] rounded-[var(--ui-radius)] z-50 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--ui-border)] flex items-center justify-between">
            <h3 className="ui-text-strong">Notifications</h3>
            <button
              onClick={handleMarkAll}
              disabled={unread === 0}
              className="ui-text-meta hover:text-[var(--ui-text)] disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center ui-text-meta">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center ui-text-meta">No notifications</div>
            ) : (
              <ul className="divide-y divide-[var(--ui-border)]">
                {items.map((n) => {
                  const isRead = !!n.readAt;
                  return (
                    <li
                      key={n.id}
                      className={`group px-4 py-3 hover:bg-[var(--ui-bg-page)] transition cursor-pointer ${
                        isRead ? '' : 'bg-[var(--ui-bg-page)]/50'
                      }`}
                      onClick={() => handleItemClick(n)}
                    >
                      <p className={`text-[13px] truncate ${isRead ? 'text-[var(--ui-text-secondary)]' : 'font-medium text-[var(--ui-text)]'}`}>
                        {n.title}
                      </p>
                      <p className="ui-text-meta mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="ui-text-caption normal-case tracking-normal mt-1.5">{formatRelative(n.createdAt)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[var(--ui-border)]">
            <a href="/notifications" className="block text-center ui-link">
              View all
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
