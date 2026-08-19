'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Inbox, RefreshCw } from 'lucide-react';
import { getNotifications, markRead, markAllRead } from '@/services/notificationsApi';
import NotificationItem from '@/components/NotificationItem';

export default function NotificationsInbox() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ limit: 100, unreadOnly });
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString(), status: 'READ' } : n)));
    } catch (_) {}
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      await fetchItems();
    } catch (_) {}
  };

  const unreadCount = items.filter((n) => !n.readAt).length;

  const handleItemClick = (n) => {
    if (!n.readAt) handleMarkRead(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="ui-page text-neutral-800">
      <div className="ui-container max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
              <Bell size={18} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Notifications</h1>
              <p className="mt-0.5 text-sm text-neutral-500">Everything sent to your inbox.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUnreadOnly((v) => !v)}
              className={`rounded-lg border px-3 py-2 text-[12.5px] font-medium transition ${
                unreadOnly
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
              }`}
            >
              {unreadOnly ? 'Unread only' : 'View all'}
            </button>
            <button
              type="button"
              onClick={fetchItems}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
              aria-label="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-40"
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_30px_rgba(16,42,67,0.06)]">
          {loading ? (
            <div className="p-16 text-center text-[13px] text-neutral-400">Loading…</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-16 text-center text-neutral-400">
              <Inbox size={28} />
              <p className="text-sm font-medium text-neutral-600">
                {unreadOnly ? 'No unread notifications' : 'Nothing here yet'}
              </p>
              <p className="text-[12.5px]">Notifications you receive will appear here.</p>
            </div>
          ) : (
            <ul>
              {items.map((n) => (
                <NotificationItem key={n.id} n={n} onClick={() => handleItemClick(n)} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
