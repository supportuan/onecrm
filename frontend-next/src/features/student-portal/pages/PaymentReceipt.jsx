'use client';

import { use, useEffect, useState } from 'react';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { getPaymentReceipt } from '@/services/studentCrmApi';

export default function PaymentReceiptPage({ params }) {
  const { id } = use(params);
  const [html, setHtml] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getPaymentReceipt(id);
        if (!alive) return;
        setHtml(res?.data?.html || '');
        setMeta(res?.data?.payment || null);
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to load receipt');
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const handleDownloadHtml = () => {
    if (!html || !meta) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meta.receiptNumber || `receipt-${meta.id}`}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-brand">
      <div className="print:hidden sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-brand"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <p className="text-xs text-neutral-500 truncate hidden sm:block">
            {meta?.receiptNumber || 'Payment receipt'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadHtml}
              disabled={!html}
              className="flex items-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              <Download size={13} /> Download
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!html}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-medium disabled:opacity-50"
            >
              <Printer size={13} /> Save PDF
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 print:p-0 print:max-w-none">
        {error && (
          <div className="ui-panel p-8 text-center">
            <p className="text-sm font-semibold text-rose-700">Could not load receipt</p>
            <p className="text-sm text-neutral-500 mt-1">{error}</p>
          </div>
        )}
        {!error && (
          <article
            className="bg-white shadow-sm print:shadow-none rounded-xl print:rounded-none overflow-hidden"
            dangerouslySetInnerHTML={{ __html: html ?? '<p style="padding:40px;color:#a3a3a3;">Loading receipt…</p>' }}
          />
        )}
      </main>

      <style jsx global>{`
        @media print {
          @page {
            margin: 12mm;
          }
          body {
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
