'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getMyMessages, sendMyMessage } from '@/services/communicationApi';
import { useCommunicationSocket } from '@/lib/communicationSocket';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  CHAT_VIEWPORT_CLASS,
  ChatComposer,
  ChatMessageArea,
  ChatPanel,
  ChatThreadHeader,
  LiveBadge,
} from '@/features/communication/components/ChatUi';

export default function StudentMessages() {
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const endRef = useRef(null);
  const composerRef = useRef(null);
  const userIdRef = useRef(user?.id);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const handleSocketEvent = useCallback((event) => {
    if (event.type === 'connected') {
      setLive(true);
      return;
    }

    if (event.type === 'message.new') {
      setThread((prev) => {
        if (!prev) return prev;
        if (prev.student?.id !== event.studentId) return prev;
        if (prev.messages?.some((m) => m.id === event.message.id)) return prev;
        return {
          ...prev,
          messages: [
            ...(prev.messages || []),
            {
              ...event.message,
              isMine: event.message.authorId === userIdRef.current,
            },
          ],
        };
      });
      return;
    }

    if (event.type === 'thread.read') {
      setThread((prev) => {
        if (!prev || prev.student?.id !== event.studentId) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).map((m) =>
            m.authorId === userIdRef.current ? { ...m, read: true } : m
          ),
        };
      });
    }
  }, []);

  useCommunicationSocket({ onEvent: handleSocketEvent });

  const loadThread = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyMessages();
      setThread(res.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages?.length]);

  const handleSend = async (e) => {
    e?.preventDefault?.();
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await sendMyMessage(draft.trim());
      setDraft('');
      composerRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const counsellor = thread?.student?.counsellor;
  const counsellorName = counsellor?.fullName || 'Your counsellor';

  return (
    <div className="ui-page-shell">
      <div className={CHAT_VIEWPORT_CLASS}>
        <ChatPanel className="min-h-[min(70vh,560px)] h-full">
          <ChatThreadHeader
            title={counsellorName}
            name={counsellor?.fullName || counsellorName}
            email={counsellor?.email}
            subtitle="Ask about applications, documents, and next steps"
            trailing={<LiveBadge live={live} />}
          />
          <ChatMessageArea
            loading={loading}
            error={error}
            messages={thread?.messages}
            emptyTitle="No messages yet"
            emptyDescription="Say hello to your counsellor to start the conversation."
            endRef={endRef}
          />
          <ChatComposer
            ref={composerRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onSubmit={handleSend}
            sending={sending}
          />
        </ChatPanel>
      </div>
    </div>
  );
}
