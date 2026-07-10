'use client';

/** Shared student portal surface + typography tokens */
export const sp = {
  page: 'mx-auto w-full max-w-5xl space-y-8 pt-2 pb-2',
  panel:
    'rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_rgba(15,23,42,0.03)]',
  panelPad: 'p-6 sm:p-7',
  sectionEyebrow: 'text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400',
  sectionTitle: 'text-[15px] font-semibold tracking-tight text-neutral-900',
  body: 'text-sm leading-relaxed text-neutral-500',
  badge:
    'inline-flex items-center rounded-full border border-neutral-200/80 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600',
  btnPrimary:
    'inline-flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.99]',
  btnGhost:
    'inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50',
  empty:
    'rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-12 text-center text-sm leading-relaxed text-neutral-500',
};

export function StudentPortalPanel({ children, className = '' }) {
  return <section className={`${sp.panel} ${className}`}>{children}</section>;
}

export function StudentPortalPage({ children }) {
  return <div className={sp.page}>{children}</div>;
}
