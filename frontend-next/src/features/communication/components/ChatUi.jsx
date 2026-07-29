'use client';

import { forwardRef } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { initials } from '@/lib/layout-shell';

/** Shared height for staff / student / agent chat shells */
export const CHAT_VIEWPORT_CLASS =
  'lg:h-[calc(100vh-8.5rem)] lg:min-h-0';

export const formatWhen = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const formatListTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const dayMs = 24 * 60 * 60 * 1000;
  if (diffMs < dayMs && date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffMs < 7 * dayMs) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export function ChatAvatar({ name, email, size = 'md', active = false }) {
  const sizeCls = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-9 w-9 text-[11px]';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeCls} ${
        active ? 'bg-brand text-white' : 'bg-brand-soft text-brand'
      }`}
    >
      {initials(name, email)}
    </span>
  );
}

export function LiveBadge({ live }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        live
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-[var(--ui-bg-page)] text-[var(--ui-text-muted)]'
      }`}
      title={live ? 'Realtime connected' : 'Connecting…'}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
      {live ? 'Live' : '…'}
    </span>
  );
}

export function UnreadBadge({ count }) {
  if (!count || count < 1) return null;
  return (
    <span className="shrink-0 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}

export function MessageBubble({ message }) {
  return (
    <div className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[min(85%,28rem)] rounded-2xl px-3.5 py-2.5 border ${
          message.isMine
            ? 'bg-brand border-brand text-white rounded-br-md'
            : 'bg-white border-[var(--ui-border)] text-[var(--ui-text)] rounded-bl-md'
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-3">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide ${
              message.isMine ? 'text-white/85' : 'text-brand'
            }`}
          >
            {message.isMine ? 'You' : message.authorName}
          </span>
          <span
            className={`text-[10px] ${
              message.isMine ? 'text-white/65' : 'text-[var(--ui-text-muted)]'
            }`}
          >
            {formatWhen(message.createdAt)}
          </span>
        </div>
        <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap break-words">
          {message.message}
        </p>
      </div>
    </div>
  );
}

export function ChatPanel({ children, className = '' }) {
  return (
    <section className={`ui-panel flex flex-col overflow-hidden ${className}`}>{children}</section>
  );
}

export function ChatThreadHeader({ title, subtitle, name, email, trailing = null }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--ui-border)] px-4 py-3">
      <ChatAvatar name={name || title} email={email} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-semibold text-[var(--ui-text)]">
          {title || 'Conversation'}
        </h3>
        {subtitle ? (
          <p className="truncate text-[12px] text-[var(--ui-text-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}

export function ChatEmptyState({
  icon: Icon = MessageSquare,
  title,
  description,
  className = '',
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      {title ? <p className="ui-text-strong">{title}</p> : null}
      {description ? <p className="ui-text-meta max-w-xs">{description}</p> : null}
    </div>
  );
}

export function ChatMessageArea({
  loading,
  error,
  messages,
  emptyTitle = 'No messages yet',
  emptyDescription = 'Send the first note to start this thread.',
  endRef,
}) {
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[var(--ui-bg-page)] px-4 py-4">
      {error ? (
        <div className="rounded-[var(--ui-radius)] border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        </div>
      ) : messages?.length ? (
        messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
          <p className="ui-text-meta">{emptyTitle}</p>
          {emptyDescription ? (
            <p className="text-[12px] text-[var(--ui-text-muted)]">{emptyDescription}</p>
          ) : null}
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

export const ChatComposer = forwardRef(function ChatComposer(
  {
    value,
    onChange,
    onSubmit,
    sending = false,
    disabled = false,
    placeholder = 'Write a message… (Enter to send, Shift+Enter for new line)',
  },
  ref
) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!value?.trim() || sending || disabled) return;
      onSubmit?.(e);
    }
  };

  return (
    <form onSubmit={onSubmit} className="border-t border-[var(--ui-border)] bg-white p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          rows={2}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="ui-field min-h-[2.75rem] flex-1 resize-none !py-2.5"
        />
        <button
          type="submit"
          disabled={!value?.trim() || sending || disabled}
          className="ui-btn-primary inline-flex h-10 w-10 shrink-0 items-center justify-center !px-0"
          title="Send"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </div>
    </form>
  );
});

export function ModuleTabBar({ tabs, activeId, onChange }) {
  return (
    <div className="flex gap-1 border-b border-[var(--ui-border)] px-2 pt-1">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative px-3 py-2.5 text-[13px] transition ${
              active
                ? 'font-medium text-brand'
                : 'font-normal text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]'
            }`}
          >
            {tab.label}
            {active ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
