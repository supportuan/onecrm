'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MessageSquare, Search, Send } from 'lucide-react';
import {
  getStudentThread,
  listConversations,
  sendStudentMessage,
} from '@/services/communicationApi';
import { useCommunicationSocket } from '@/lib/communicationSocket';
import { useAuth } from '@/lib/auth/AuthContext';

const formatWhen = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

function MessageBubble({ message }) {
  return (
    <div className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border ${
          message.isMine
            ? 'bg-brand border-brand text-white rounded-br-md'
            : 'bg-white border-slate-200 text-slate-700 rounded-bl-md'
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-3">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wide ${
              message.isMine ? 'text-white/90' : 'text-brand'
            }`}
          >
            {message.isMine ? 'You' : message.authorName}
          </span>
          <span className={`text-[10px] font-semibold ${message.isMine ? 'text-white/70' : 'text-slate-400'}`}>
            {formatWhen(message.createdAt)}
          </span>
        </div>
        <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
      </div>
    </div>
  );
}

export default function CommunicationCenter() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(() => {
    const fromUrl = Number(searchParams.get('studentId'));
    return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : null;
  });
  const [thread, setThread] = useState(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const endRef = useRef(null);
  const selectedIdRef = useRef(selectedId);
  const userIdRef = useRef(user?.id);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const upsertConversationPreview = useCallback((studentId, message, fromUserId) => {
    setConversations((prev) => {
      const idx = prev.findIndex((row) => row.studentId === studentId);
      if (idx === -1) return prev;

      const row = prev[idx];
      const isActive = selectedIdRef.current === studentId;
      const isMine = fromUserId === userIdRef.current;
      const unreadCount = isActive || isMine ? 0 : (row.unreadCount || 0) + 1;

      const updated = {
        ...row,
        lastMessage: message.message,
        lastMessageAt: message.createdAt,
        unreadCount,
      };

      const next = [...prev];
      next.splice(idx, 1);
      next.unshift(updated);
      return next;
    });
  }, []);

  const appendThreadMessage = useCallback((studentId, message) => {
    setThread((prev) => {
      if (!prev || prev.student?.id !== studentId) return prev;
      if (prev.messages?.some((m) => m.id === message.id)) return prev;
      return {
        ...prev,
        messages: [
          ...(prev.messages || []),
          {
            ...message,
            isMine: message.authorId === userIdRef.current,
          },
        ],
      };
    });
  }, []);

  const handleSocketEvent = useCallback(
    (event) => {
      if (event.type === 'connected') {
        setLive(true);
        return;
      }

      if (event.type === 'message.new') {
        const { studentId, message } = event;
        upsertConversationPreview(studentId, message, message.authorId);
        appendThreadMessage(studentId, message);
        return;
      }

      if (event.type === 'thread.read') {
        if (event.readerId === userIdRef.current) return;
        setConversations((prev) =>
          prev.map((row) =>
            row.studentId === event.studentId ? { ...row, unreadCount: 0 } : row
          )
        );
        setThread((prev) => {
          if (!prev || prev.student?.id !== event.studentId) return prev;
          return {
            ...prev,
            messages: (prev.messages || []).map((m) =>
              m.authorId !== userIdRef.current ? { ...m, read: true } : m
            ),
          };
        });
      }
    },
    [appendThreadMessage, upsertConversationPreview]
  );

  const { subscribe } = useCommunicationSocket({ onEvent: handleSocketEvent });

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setError('');
    try {
      const res = await listConversations();
      const rows = res.data || [];
      setConversations(rows);
      setSelectedId((current) => current ?? rows[0]?.studentId ?? null);
    } catch (err) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(async (studentId) => {
    if (!studentId) return;
    setLoadingThread(true);
    setError('');
    try {
      const res = await getStudentThread(studentId);
      setThread(res.data || null);
      setConversations((prev) =>
        prev.map((row) =>
          row.studentId === studentId ? { ...row, unreadCount: 0 } : row
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to load messages');
      setThread(null);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    const fromUrl = Number(searchParams.get('studentId'));
    if (Number.isFinite(fromUrl) && fromUrl > 0) {
      setSelectedId(fromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedId) {
      loadThread(selectedId);
      subscribe(selectedId);
    }
  }, [selectedId, loadThread, subscribe]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages?.length]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (row) =>
        row.fullName?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q) ||
        row.phone?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    try {
      await sendStudentMessage(selectedId, draft.trim());
      setDraft('');
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ui-page-shell">
      <div className="ui-panel overflow-hidden">
        <div className="grid min-h-[70vh] lg:grid-cols-[320px_1fr]">
          <aside className="border-b border-slate-100 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand" strokeWidth={1.75} />
                <h2 className="ui-text-h3">Students</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    live ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {live ? 'Live' : 'Connecting…'}
                </span>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loadingList ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-brand" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs font-semibold text-slate-400">
                  No students assigned yet.
                </p>
              ) : (
                filtered.map((row) => (
                  <button
                    key={row.studentId}
                    type="button"
                    onClick={() => setSelectedId(row.studentId)}
                    className={`mb-1 w-full rounded-xl px-3 py-3 text-left transition ${
                      selectedId === row.studentId
                        ? 'bg-brand-soft text-brand'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{row.fullName}</p>
                        <p className="truncate text-[11px] text-slate-400">{row.email || row.phone || 'No contact'}</p>
                        {row.lastMessage && (
                          <p className="mt-1 truncate text-[11px] font-medium text-slate-500">{row.lastMessage}</p>
                        )}
                      </div>
                      {row.unreadCount > 0 && (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                          {row.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="flex min-h-[60vh] flex-col">
            {!selectedId ? (
              <div className="flex flex-1 items-center justify-center p-8 text-sm font-semibold text-slate-400">
                Select a student to start messaging.
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="text-base font-semibold text-slate-800">{thread?.student?.fullName || 'Student'}</h3>
                  <p className="text-xs font-medium text-slate-400">
                    {thread?.student?.email || '—'}
                    {thread?.student?.counsellor?.fullName
                      ? ` · Counsellor: ${thread.student.counsellor.fullName}`
                      : ''}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50/50 px-5 py-5 space-y-3">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                      {error}
                    </div>
                  )}
                  {loadingThread ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-brand" />
                    </div>
                  ) : thread?.messages?.length ? (
                    thread.messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
                  ) : (
                    <p className="py-16 text-center text-xs font-semibold text-slate-400">
                      No messages yet. Send the first note to this student.
                    </p>
                  )}
                  <div ref={endRef} />
                </div>

                <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-4">
                  <div className="flex items-end gap-2">
                    <textarea
                      rows={2}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Write a message to the student..."
                      className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || sending}
                      className="rounded-xl bg-brand p-2.5 text-white shadow-sm transition hover:bg-brand-hover disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
