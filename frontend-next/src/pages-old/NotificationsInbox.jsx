'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Inbox, Trash2, RefreshCw, Filter } from 'lucide-react';
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification as deleteNotificationApi,
} from '@/services/notificationsApi';

const CHANNEL_BADGE = {
  EMAIL: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  SMS: 'bg-sky-50 border-sky-200 text-sky-700',
  WHATSAPP: 'bg-lime-50 border-lime-200 text-lime-700',
  IN_APP: 'bg-indigo-50 border-indigo-200 text-indigo-700',
};

const STATUS_BADGE = {
  PENDING: 'bg-amber-50 border-amber-200 text-amber-700',
  SENT: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  FAILED: 'bg-rose-50 border-rose-200 text-rose-700',
  READ: 'bg-slate-50 border-slate-200 text-slate-600',
};

const formatRelative = (createdAt) => {
  if (!createdAt) return '';
  const diff = Date.now() - new Date(createdAt).getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const days = Math.floor(hr / 24);
  if (days > 0) return `${days}d ago`;
  if (hr > 0) return `${hr}h ago`;
  if (min > 0) return `${min}m ago`;
  return 'just now';
};

export default function NotificationsInbox() {
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

  const handleDelete = async (id) => {
    try {
      await deleteNotificationApi(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (_) {}
  };

  const unreadCount = items.filter((n) => !n.readAt).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-900 flex items-center gap-3">
            <Bell size={24} className="text-indigo-600" />
            notifications
          </h1>
          <p className="text-slate-500 text-sm mt-1">your full notification history across every module.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setUnreadOnly((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all border ${
              unreadOnly
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
            }`}
          >
            <Filter size={12} /> {unreadOnly ? 'unread only' : 'all'}
          </button>
          <button
            onClick={fetchItems}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition-all"
          >
            <RefreshCw size={12} /> refresh
          </button>
          <button
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCheck size={12} /> mark all read
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">loading...</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <Inbox size={36} className="text-slate-300" />
            <p className="text-xs font-semibold">{unreadOnly ? 'no unread notifications' : 'nothing here yet'}</p>
            <p className="text-[10px] text-slate-500">notifications you receive will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => {
              const isRead = !!n.readAt;
              return (
                <li
                  key={n.id}
                  className={`p-5 hover:bg-slate-50/50 transition flex items-start gap-4 ${isRead ? '' : 'bg-indigo-50/20'}`}
                >
                  <div className="mt-1.5">
                    <span className={`block w-2.5 h-2.5 rounded-full ${isRead ? 'bg-slate-300' : 'bg-indigo-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm ${isRead ? 'font-medium text-slate-600' : 'font-semibold text-slate-900'}`}>
                        {n.title}
                      </p>
                      <span
                        className={`px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest rounded border ${
                          CHANNEL_BADGE[n.channel] || 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {n.channel}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest rounded border ${
                          STATUS_BADGE[n.status] || 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {n.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{n.body}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{formatRelative(n.createdAt)}</span>
                      {n.link && (
                        <a href={n.link} className="text-indigo-600 hover:text-indigo-700 font-semibold">
                          open →
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 rounded-xl text-[10px] font-semibold transition"
                      >
                        mark read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                      aria-label="delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
