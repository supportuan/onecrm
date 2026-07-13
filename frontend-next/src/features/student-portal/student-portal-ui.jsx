'use client';

/** Shared student portal surface + typography tokens (logo brand theme) */
export const sp = {
  page: 'mx-auto w-full max-w-5xl space-y-8 pt-2 pb-2',
  panel:
    'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(11,42,91,0.04),0_4px_16px_rgba(11,42,91,0.05)]',
  panelPad: 'p-6 sm:p-7',
  sectionEyebrow: 'text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted',
  sectionTitle: 'text-[15px] font-semibold tracking-tight text-brand',
  body: 'text-sm leading-relaxed text-slate-500',
  badge:
    'inline-flex items-center rounded-full border border-slate-200/80 bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand',
  btnPrimary:
    'inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-hover active:scale-[0.99]',
  btnAccent:
    'inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-accent-hover active:scale-[0.99]',
  btnGhost:
    'inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand/30 hover:bg-brand-soft',
  empty:
    'rounded-2xl border border-dashed border-slate-200 bg-brand-soft/40 px-6 py-12 text-center text-sm leading-relaxed text-slate-500',
};

export function StudentPortalPanel({ children, className = '' }) {
  return <section className={`${sp.panel} ${className}`}>{children}</section>;
}

export function StudentPortalPage({ children }) {
  return <div className={sp.page}>{children}</div>;
}
