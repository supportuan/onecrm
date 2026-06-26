'use client';

import { use, useEffect, useState } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { renderOfferLetter } from '@/services/hrApi';

/**
 * Standalone, print-optimised offer letter view.
 *
 * - Lives outside the normal HR layout chrome (no sidebar / topbar) so Ctrl+P
 *   produces a clean, single-page letter.
 * - On mount we hit the render endpoint, which substitutes template variables
 *   and persists the rendered HTML snapshot on the offer record.
 * - The two on-screen action buttons (Print / Back) are hidden via @media print.
 */
export default function OfferLetterPrintPage({ params }) {
  const { id } = use(params);
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await renderOfferLetter(id);
        if (!alive) return;
        if (!res?.success) {
          setError(res?.error || 'Failed to render offer letter');
          return;
        }
        setHtml(res.data?.html || '');
        setMeta(res.data?.offer || null);
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to load offer letter');
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* On-screen toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-neutral-200/80">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-neutral-600 hover:text-neutral-900 transition-all"
          >
            <ArrowLeft size={13} /> Back
          </button>
          <p className="text-[12px] text-neutral-500 hidden sm:block">
            {meta ? `${meta.candidateName} · ${meta.jobTitle}` : 'Offer letter'}
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!html}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-[12.5px] font-medium transition-all disabled:opacity-50"
          >
            <Printer size={13} /> Print / save PDF
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-10 print:p-0 print:max-w-none">
        {error && (
          <div className="ui-surface p-8 text-center">
            <p className="ui-text-strong text-rose-700">Could not render offer letter</p>
            <p className="ui-text-meta mt-1">{error}</p>
          </div>
        )}
        {!error && (
          <article
            className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] print:shadow-none rounded-2xl print:rounded-none p-10 sm:p-14 print:p-0 leading-relaxed offer-letter-body"
            dangerouslySetInnerHTML={{ __html: html ?? '<p class="text-neutral-400">Rendering…</p>' }}
          />
        )}
      </main>

      {/* Letter-paper typography. Scoped via class, not global, so it can't
          bleed into the rest of the app. */}
      <style jsx global>{`
        .offer-letter-body h1 {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin-bottom: 1.25rem;
        }
        .offer-letter-body h2 {
          font-size: 17px;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .offer-letter-body h3 {
          font-size: 14px;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #525252;
        }
        .offer-letter-body p {
          margin: 0.5rem 0 0.75rem;
          font-size: 13.5px;
          color: #262626;
        }
        .offer-letter-body ul {
          padding-left: 1.25rem;
          list-style: disc;
        }
        .offer-letter-body li {
          font-size: 13.5px;
          margin: 0.25rem 0;
        }
        @media print {
          @page { margin: 18mm 16mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
