'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MessageSquare, Search } from 'lucide-react';
import {
  getStudentThread,
  listConversations,
  sendStudentMessage,
} from '@/services/communicationApi';
import { useCommunicationSocket } from '@/lib/communicationSocket';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  CHAT_VIEWPORT_CLASS,
  ChatAvatar,
  ChatComposer,
  ChatEmptyState,
  ChatMessageArea,
  ChatPanel,
  ChatThreadHeader,
  LiveBadge,
  UnreadBadge,
  formatListTime,
} from '../components/ChatUi';

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
  const composerRef = useRef(null);
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

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, row) => sum + (row.unreadCount || 0), 0),
    [conversations]
  );

  const handleSend = async (e) => {
    e?.preventDefault?.();
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    try {
      await sendStudentMessage(selectedId, draft.trim());
      setDraft('');
      composerRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const student = thread?.student;

  return (
    <div className="ui-page-shell">
      <div className={`grid grid-cols-1 gap-4 lg:grid-cols-12 ${CHAT_VIEWPORT_CLASS}`}>
        <ChatPanel className="min-h-[320px] lg:col-span-4 lg:h-full xl:col-span-3">
          <div className="space-y-2.5 border-b border-[var(--ui-border)] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="ui-text-strong">Inbox</h2>
                <span className="ui-text-meta">{conversations.length}</span>
                <UnreadBadge count={unreadTotal} />
              </div>
              <LiveBadge live={live} />
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="ui-field pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-neutral-300" strokeWidth={1.5} />
                <p className="ui-text-meta">
                  {search.trim() ? 'No matching students.' : 'No students assigned yet.'}
                </p>
              </div>
            ) : (
              filtered.map((row) => {
                const active = selectedId === row.studentId;
                return (
                  <button
                    key={row.studentId}
                    type="button"
                    onClick={() => setSelectedId(row.studentId)}
                    className={`flex w-full items-start gap-3 border-b border-[var(--ui-border)] px-3 py-3 text-left transition hover:bg-[var(--ui-bg-page)] ${
                      active ? 'bg-[var(--ui-bg-page)]' : ''
                    }`}
                  >
                    <ChatAvatar name={row.fullName} email={row.email} active={active} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`truncate text-[13px] ${
                            active
                              ? 'font-medium text-[var(--ui-text)]'
                              : 'text-[var(--ui-text-secondary)]'
                          }`}
                        >
                          {row.fullName}
                        </p>
                        <span className="shrink-0 text-[10px] text-[var(--ui-text-muted)]">
                          {formatListTime(row.lastMessageAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--ui-text-muted)]">
                        {row.lastMessage || row.email || row.phone || 'No messages yet'}
                      </p>
                    </div>
                    <UnreadBadge count={row.unreadCount} />
                  </button>
                );
              })
            )}
          </div>
        </ChatPanel>

        <ChatPanel className="min-h-[420px] lg:col-span-8 lg:h-full xl:col-span-9">
          {!selectedId ? (
            <ChatEmptyState
              title="Select a conversation"
              description="Choose a student from the inbox to view history and send a message."
            />
          ) : (
            <>
              <ChatThreadHeader
                title={student?.fullName || 'Student'}
                name={student?.fullName}
                email={student?.email}
                subtitle={[
                  student?.email || '—',
                  student?.counsellor?.fullName
                    ? `Counsellor: ${student.counsellor.fullName}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
              <ChatMessageArea
                loading={loadingThread}
                error={error}
                messages={thread?.messages}
                endRef={endRef}
              />
              <ChatComposer
                ref={composerRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onSubmit={handleSend}
                sending={sending}
              />
            </>
          )}
        </ChatPanel>
      </div>
    </div>
  );
}
