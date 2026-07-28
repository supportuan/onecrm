'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { getMyMessages, sendMyMessage } from '@/services/communicationApi';
import { useCommunicationSocket } from '@/lib/communicationSocket';
import { useAuth } from '@/lib/auth/AuthContext';
import { StudentPortalPage, StudentPortalPanel, sp } from '../student-portal-ui';

const formatWhen = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
          <span className={`text-[10px] font-extrabold uppercase tracking-wide ${message.isMine ? 'text-white/90' : 'text-brand'}`}>
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

export default function StudentMessages() {
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const endRef = useRef(null);
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
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await sendMyMessage(draft.trim());
      setDraft('');
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const counsellorName = thread?.student?.counsellor?.fullName || 'your counsellor';

  return (
    <StudentPortalPage>
      <StudentPortalPanel className={`${sp.panelPad} space-y-4`}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className={sp.sectionEyebrow}>Communication</p>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-brand">Messages</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  live ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {live ? 'Live' : 'Connecting…'}
              </span>
            </div>
            <p className={sp.body}>Chat with {counsellorName} about applications, documents, and next steps.</p>
          </div>
        </div>

        <div className="min-h-[420px] rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
          {error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : thread?.messages?.length ? (
              thread.messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
            ) : (
              <p className="py-16 text-center text-sm font-semibold text-slate-400">
                No messages yet. Say hello to your counsellor.
              </p>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your message..."
            className={`${sp.input} resize-none`}
          />
          <button type="submit" disabled={!draft.trim() || sending} className={sp.btnPrimary}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </form>
      </StudentPortalPanel>
    </StudentPortalPage>
  );
}
