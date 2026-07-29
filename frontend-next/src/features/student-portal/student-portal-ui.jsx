'use client';

/** Shared student portal surface + typography tokens (logo brand theme) */
export const sp = {
  page: 'w-full space-y-4 pt-1 pb-2',
  panel:
    'w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(11,42,91,0.03),0_2px_8px_rgba(11,42,91,0.04)]',
  panelPad: 'p-4 sm:p-5',
  sectionEyebrow: 'text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-muted',
  sectionTitle: 'text-[14px] font-semibold tracking-tight text-brand',
  body: 'text-[13px] leading-relaxed text-slate-500',
  badge:
    'inline-flex items-center rounded-full border border-slate-200/80 bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand',
  btnPrimary:
    'inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-brand-hover active:scale-[0.99]',
  btnAccent:
    'inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-accent px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-brand-accent-hover active:scale-[0.99]',
  btnGhost:
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand/30 hover:bg-brand-soft',
  empty:
    'rounded-xl border border-dashed border-slate-200 bg-brand-soft/40 px-5 py-10 text-center text-[13px] leading-relaxed text-slate-500',
  input:
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-brand outline-none transition placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/10',
  select:
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-brand outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/10',
};

export function StudentPortalPanel({ children, className = '', ...rest }) {
  return (
    <section className={`${sp.panel} ${className}`} {...rest}>
      {children}
    </section>
  );
}

export function StudentPortalPage({ children }) {
  return <div className={sp.page}>{children}</div>;
}

export function ProgressBar({ value = 0, className = '', tone = 'brand' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const bar =
    tone === 'emerald'
      ? 'bg-emerald-500'
      : tone === 'amber'
        ? 'bg-amber-500'
        : tone === 'rose'
          ? 'bg-rose-500'
          : 'bg-brand';
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} aria-hidden />;
}
