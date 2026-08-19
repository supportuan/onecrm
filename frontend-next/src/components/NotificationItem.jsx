import { Download } from 'lucide-react';
import { initials } from '@/lib/layout-shell';

const AVATAR_TONES = [
  'bg-[#dbeafe] text-[#1d4ed8]',
  'bg-[#fce7f3] text-[#be185d]',
  'bg-[#dcfce7] text-[#15803d]',
  'bg-[#fef3c7] text-[#b45309]',
  'bg-[#e0e7ff] text-[#4338ca]',
  'bg-brand-soft text-brand',
];

export const notificationVars = (n) =>
  n?.vars && typeof n.vars === 'object' && !Array.isArray(n.vars) ? n.vars : {};

export const notificationActor = (n) => {
  const vars = notificationVars(n);
  return vars.studentName || vars.leadName || vars.counsellorName || vars.actorName || vars.fromName || '';
};

export const isMentionNotification = (n) => {
  const key = String(n?.templateKey || '');
  return /assigned|task|comment|mention/i.test(key) || /\byou\b/i.test(`${n?.title || ''} ${n?.body || ''}`);
};

export const formatNoticeDayTime = (createdAt) => {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(' ', '');
  return `${weekday} ${time}`;
};

export const formatNoticeDate = (createdAt) => {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const avatarTone = (label) => {
  const str = String(label || '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash + str.charCodeAt(i)) % AVATAR_TONES.length;
  return AVATAR_TONES[hash];
};

const isDocumentNotice = (n) => {
  const key = String(n?.templateKey || '');
  return /document_uploaded|document_missing|offer/i.test(key);
};

export default function NotificationItem({ n, onClick }) {
  const vars = notificationVars(n);
  const actor = notificationActor(n);
  const isRead = !!n.readAt;
  const fileName = vars.documentName || vars.filename || vars.fileName || vars.taskTitle || '';
  const showFile = isDocumentNotice(n) && fileName;
  const showQuote = Boolean(n.body) && !showFile;

  return (
    <li>
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className="group flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-neutral-50"
      >
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${avatarTone(
            actor || n.title
          )}`}
          aria-hidden
        >
          {initials(actor || n.title, n.title)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] leading-snug text-neutral-800">
            {actor ? (
              <>
                <span className="font-semibold">{actor}</span>
                <span className="text-neutral-600"> {n.title}</span>
              </>
            ) : (
              <span className="font-semibold">{n.title}</span>
            )}
          </p>

          {showQuote && (
            <div className="mt-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-neutral-600">
              {n.body}
            </div>
          )}

          {showFile && (
            <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                FILE
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-neutral-800">{fileName}</p>
                <p className="text-[11px] text-neutral-400">{vars.applicationCode || 'Attachment'}</p>
              </div>
              <Download className="h-4 w-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-neutral-400">
            <span>{formatNoticeDayTime(n.createdAt)}</span>
            <span>{formatNoticeDate(n.createdAt)}</span>
          </div>
        </div>

        <div className="flex h-10 w-4 shrink-0 items-start justify-center pt-1.5">
          {!isRead ? <span className="mt-1 h-2 w-2 rounded-full bg-[#2563eb]" aria-label="Unread" /> : null}
        </div>
      </div>
    </li>
  );
}
