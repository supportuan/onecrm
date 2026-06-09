'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, X, Inbox } from 'lucide-react';
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
        className="relative text-neutral-500 hover:text-neutral-700 transition"
        aria-label="notifications"
      >
        <Bell className="h-5 w-5 stroke-[1.5]" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-1 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[380px] max-h-[540px] bg-white border border-neutral-200 rounded-lg shadow-lg z-50 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-neutral-800">Notifications</h3>
              <p className="text-[10px] text-neutral-500">{unread} unread</p>
            </div>
            <button
              onClick={handleMarkAll}
              disabled={unread === 0}
              className="flex items-center gap-1 text-[10px] font-medium text-neutral-700 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCheck size={12} /> Mark all read
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-10 text-center text-[11px] text-neutral-500">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-10 text-center text-neutral-500 flex flex-col items-center gap-2">
                <Inbox size={28} className="text-neutral-600" />
                <p className="text-[11px] font-semibold">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {items.map((n) => {
                  const isRead = !!n.readAt;
                  return (
                    <li
                      key={n.id}
                      className={`group p-4 hover:bg-neutral-50 transition cursor-pointer flex items-start gap-3 ${
                        isRead ? '' : 'bg-neutral-50'
                      }`}
                      onClick={() => handleItemClick(n)}
                    >
                      <div className="mt-1.5">
                        <span
                          className={`block w-2 h-2 rounded-full ${
                            isRead ? 'bg-neutral-300' : 'bg-neutral-900'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${isRead ? 'font-medium text-neutral-600' : 'font-semibold text-neutral-900'} truncate`}>
                          {n.title}
                        </p>
                        <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[9px] text-neutral-500 mt-1.5">{formatRelative(n.createdAt)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-500 transition p-1"
                        aria-label="dismiss"
                      >
                        <X size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50">
            <a
              href="/notifications"
              className="block text-center text-[10px] font-medium text-neutral-700 hover:text-neutral-900"
            >
              view all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
