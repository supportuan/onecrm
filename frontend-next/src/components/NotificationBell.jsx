'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Settings, X } from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '@/services/notificationsApi';
import NotificationItem, { isMentionNotification } from '@/components/NotificationItem';

const POLL_MS = 60_000;

const NotificationBell = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all');
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

  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(t);
  }, [fetchCount]);

  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
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

  const handleItemClick = (n) => {
    if (!n.readAt) handleMarkRead(n.id);
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const visibleItems = useMemo(
    () => (tab === 'mentions' ? items.filter(isMentionNotification) : items),
    [items, tab]
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--ui-text-muted)] transition hover:bg-brand-soft hover:text-brand active:scale-95"
        aria-label="notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 flex w-[min(420px,calc(100vw-1.5rem))] max-h-[min(640px,calc(100vh-5rem))] flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_18px_50px_rgba(16,42,67,0.16)]">
          <div className="px-5 pt-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[22px] font-semibold tracking-tight text-neutral-900">Notifications</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800"
                aria-label="Close notifications"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>
            <div className="mt-3 flex gap-5 border-b border-neutral-200">
              {[
                { id: 'all', label: 'View all' },
                { id: 'mentions', label: 'Mentions' },
              ].map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`-mb-px pb-2.5 text-[13px] transition ${
                      active
                        ? 'border-b-2 border-neutral-900 font-semibold text-neutral-900'
                        : 'border-b-2 border-transparent font-medium text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-[13px] text-neutral-400">Loading…</div>
            ) : visibleItems.length === 0 ? (
              <div className="p-12 text-center text-[13px] text-neutral-400">
                {tab === 'mentions' ? 'No mentions yet' : 'No notifications'}
              </div>
            ) : (
              <ul>
                {visibleItems.map((n) => (
                  <NotificationItem key={n.id} n={n} onClick={() => handleItemClick(n)} />
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-5 py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Notification settings"
                title="Notification settings"
              >
                <Settings size={16} strokeWidth={1.75} />
              </Link>
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={unread === 0}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#2563eb] transition hover:text-[#1d4ed8] disabled:opacity-40"
              >
                <CheckCheck size={15} strokeWidth={2} />
                Mark all as read
              </button>
            </div>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex shrink-0 items-center rounded-lg bg-[#2563eb] px-3.5 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
