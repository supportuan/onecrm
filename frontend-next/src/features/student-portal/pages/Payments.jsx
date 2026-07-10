'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Download } from 'lucide-react';
import { listMyPayments } from '@/services/studentCrmApi';
import { StudentPageHeader } from '../layout/StudentPortalLayoutContext';
import { sp, StudentPortalPage, StudentPortalPanel } from '../student-portal-ui';

const formatInr = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((paise || 0) / 100);

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyPayments()
      .then((r) => setPayments(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <StudentPortalPage>
        <p className={sp.body}>Loading payments…</p>
      </StudentPortalPage>
    );
  }

  return (
    <StudentPortalPage>
      <StudentPageHeader
        title="Payments"
        description="Receipts for fees paid through the student portal."
      />

      {payments.length === 0 ? (
        <div className={sp.empty}>
          No payments yet. Complete document uploads on your application, then pay any assigned fees.
        </div>
      ) : (
        <ul className="space-y-3">
          {payments.map((p) => (
            <li key={p.id}>
              <StudentPortalPanel className={`${sp.panelPad} flex flex-wrap items-center justify-between gap-4`}>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold tracking-tight text-neutral-900">
                    {p.fee?.label || 'Application fee'}
                  </p>
                  <p className={`${sp.body} mt-1`}>
                    {p.application?.applicationCode} · {p.application?.university}
                  </p>
                  {p.receiptNumber && (
                    <p className="text-xs text-neutral-400 mt-2">Receipt {p.receiptNumber}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 text-right">
                  <p className="text-lg font-semibold tracking-tight text-neutral-900">
                    {formatInr(p.amountPaise)}
                  </p>
                  <span className={sp.badge}>
                    {p.status === 'PAID' ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                        Paid · {formatDate(p.paidAt)}
                      </>
                    ) : (
                      <>
                        <Clock className="mr-1 h-3 w-3" />
                        {p.status}
                      </>
                    )}
                  </span>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {p.application?.id && (
                      <Link
                        href={`/applicant/applications/${p.application.id}`}
                        className="text-xs font-medium text-neutral-500 transition hover:text-neutral-900"
                      >
                        View application
                      </Link>
                    )}
                    {p.status === 'PAID' && (
                      <Link
                        href={`/applicant/payments/${p.id}/receipt`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={sp.btnGhost}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Receipt
                      </Link>
                    )}
                  </div>
                </div>
              </StudentPortalPanel>
            </li>
          ))}
        </ul>
      )}
    </StudentPortalPage>
  );
}
