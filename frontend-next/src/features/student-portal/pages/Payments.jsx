'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock } from 'lucide-react';
import { listMyPayments } from '@/services/studentCrmApi';

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

  if (loading) return <p className="text-sm text-neutral-500">Loading payments…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">My payments</h1>
        <p className="text-sm text-neutral-500 mt-1">Receipts for fees paid through the student portal.</p>
      </div>

      {payments.length === 0 ? (
        <div className="ui-panel p-10 text-center text-sm text-neutral-500">
          No payments yet. Complete document uploads on your application, then pay any assigned fees.
        </div>
      ) : (
        <div className="ui-panel overflow-hidden">
          <ul className="divide-y divide-neutral-100">
            {payments.map((p) => (
              <li key={p.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {p.fee?.label || 'Application fee'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {p.application?.applicationCode} · {p.application?.university}
                  </p>
                  {p.receiptNumber && (
                    <p className="text-xs text-neutral-400 mt-1">Receipt {p.receiptNumber}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-900">{formatInr(p.amountPaise)}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 flex items-center justify-end gap-1">
                    {p.status === 'PAID' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {formatDate(p.paidAt)}
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        {p.status}
                      </>
                    )}
                  </p>
                  {p.application?.id && (
                    <Link
                      href={`/applicant/applications/${p.application.id}`}
                      className="text-xs text-neutral-600 hover:text-neutral-900 mt-1 inline-block"
                    >
                      View application
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
