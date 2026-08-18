'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, MessageSquare, Pencil, Send, Trash2, X } from 'lucide-react';
import {
  createApplicationComment,
  deleteApplicationComment,
  listApplicationComments,
  updateApplicationComment,
} from '@/services/studentCrmApi';

const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

const relativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'A few seconds ago';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
};

export default function DiscussionThread({ applicationId, canManage, currentUserId, initialComments }) {
  const [comments, setComments] = useState(() => initialComments || []);
  const [loading, setLoading] = useState(!initialComments);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState('');
  const endRef = useRef(null);

  const load = useCallback(async () => {
    if (!applicationId) return;
    try {
      const res = await listApplicationComments(applicationId);
      setComments(Array.isArray(res?.data) ? res.data : []);
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to load discussions');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (initialComments) {
      setComments(initialComments);
      setLoading(false);
      return;
    }
    load();
  }, [initialComments, load]);

  const sorted = useMemo(
    () => [...comments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [comments]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [sorted.length]);

  const submit = async (e) => {
    e?.preventDefault?.();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await createApplicationComment(applicationId, { body: text });
      setBody('');
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to post message');
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async (commentId) => {
    const text = editBody.trim();
    if (!text) return;
    try {
      await updateApplicationComment(applicationId, commentId, { body: text });
      setEditingId(null);
      setEditBody('');
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to update message');
    }
  };

  const remove = async (commentId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteApplicationComment(applicationId, commentId);
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to delete message');
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={15} className="text-brand" />
          <h4 className="text-sm font-semibold text-brand">Notes</h4>
        </div>
        <span className="text-xs text-neutral-500">
          {sorted.length} message{sorted.length === 1 ? '' : 's'}
        </span>
      </div>

      {error ? (
        <p className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</p>
      ) : null}

      <div className="max-h-96 space-y-4 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading notes…</p>
        ) : !sorted.length ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            No notes yet. Add the first one below.
          </p>
        ) : (
          sorted.map((comment) => {
            const mine = currentUserId && comment.author?.id === currentUserId;
            const isEditing = editingId === comment.id;
            return (
              <div key={comment.id} className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold text-brand">
                  {initials(comment.author?.fullName)}
                </div>
                <div className={`min-w-0 max-w-[80%] ${mine ? 'items-end text-right' : ''}`}>
                  <div className={`flex items-center gap-2 ${mine ? 'justify-end' : ''}`}>
                    <span className="text-xs font-semibold text-brand">
                      {comment.author?.fullName || 'Unknown user'}
                    </span>
                    <span className="text-[11px] text-neutral-400">{relativeTime(comment.createdAt)}</span>
                  </div>

                  {isEditing ? (
                    <div className="mt-1.5 space-y-2">
                      <textarea
                        rows={3}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-brand focus:outline-none"
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                        >
                          <X size={12} /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(comment.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-hover"
                        >
                          <Check size={12} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`mt-1.5 whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm ${
                          mine
                            ? 'bg-brand text-white'
                            : 'border border-neutral-200 bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        {comment.body}
                      </div>
                      {mine && canManage ? (
                        <div className="mt-1 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditBody(comment.body);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-brand"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(comment.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-rose-600"
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {canManage ? (
        <form onSubmit={submit} className="flex items-end gap-2 border-t border-neutral-100 px-4 py-3">
          <textarea
            rows={2}
            className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-brand focus:outline-none"
            placeholder="Type Something here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submit(e);
            }}
          />
          <button
            type="submit"
            disabled={!body.trim() || sending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-all hover:bg-brand-hover disabled:opacity-40"
            aria-label="Add note"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </form>
      ) : null}
    </div>
  );
}
