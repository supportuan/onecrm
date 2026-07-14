'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Download, Search } from 'lucide-react';
import { listMyPayments } from '@/services/studentCrmApi';
import { StudentPageHeader } from '../layout/StudentPortalLayoutContext';
import {
  sp,
  StudentPortalPage,
  StudentPortalPanel,
  SkeletonBlock,
} from '../student-portal-ui';

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

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
];

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    listMyPayments()
      .then((r) => setPayments(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const paid = payments.filter((p) => p.status === 'PAID');
    const pending = payments.filter((p) => p.status === 'PENDING' || p.status === 'CREATED');
    const paidTotal = paid.reduce((s, p) => s + (p.amountPaise || 0), 0);
    const pendingTotal = pending.reduce((s, p) => s + (p.amountPaise || 0), 0);
    return {
      paidCount: paid.length,
      pendingCount: pending.length,
      paidTotal,
      pendingTotal,
    };
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'PENDING') {
          if (!['PENDING', 'CREATED'].includes(p.status)) return false;
        } else if (p.status !== statusFilter) return false;
      }
      if (!q) return true;
      return [
        p.fee?.label,
        p.application?.applicationCode,
        p.application?.university,
        p.receiptNumber,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [payments, statusFilter, search]);

  if (loading) {
    return (
      <StudentPortalPage>
        <div className="grid gap-3 sm:grid-cols-3">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>
        <SkeletonBlock className="h-40" />
      </StudentPortalPage>
    );
  }

  return (
    <StudentPortalPage>
      <StudentPageHeader
        title="Payments"
        description="Fee status, upcoming dues, and downloadable receipts for portal payments."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StudentPortalPanel className={`${sp.panelPad} space-y-1`}>
          <p className={sp.sectionEyebrow}>Paid</p>
          <p className="text-xl font-semibold text-brand">{formatInr(summary.paidTotal)}</p>
          <p className="text-xs text-slate-400">{summary.paidCount} receipt{summary.paidCount === 1 ? '' : 's'}</p>
        </StudentPortalPanel>
        <StudentPortalPanel className={`${sp.panelPad} space-y-1`}>
          <p className={sp.sectionEyebrow}>Upcoming dues</p>
          <p className="text-xl font-semibold text-brand">{formatInr(summary.pendingTotal)}</p>
          <p className="text-xs text-slate-400">
            {summary.pendingCount > 0
              ? `${summary.pendingCount} awaiting payment`
              : 'No open dues in payment history'}
          </p>
        </StudentPortalPanel>
        <StudentPortalPanel className={`${sp.panelPad} space-y-1`}>
          <p className={sp.sectionEyebrow}>Transactions</p>
          <p className="text-xl font-semibold text-brand">{payments.length}</p>
          <p className="text-xs text-slate-400">Total in history</p>
        </StudentPortalPanel>
      </div>

      {payments.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fee, university, receipt…"
              className={`${sp.input} pl-9`}
              aria-label="Search payments"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`${sp.btnGhost} ${
                  statusFilter === f.value ? '!border-brand !bg-brand-soft !text-brand' : ''
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <div className={sp.empty}>
          No payments yet. Complete document uploads on your application, then pay any assigned fees.
          <div className="mt-4">
            <Link href="/applicant/applications" className={sp.btnPrimary}>
              Go to applications
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className={sp.empty}>No payments match your search or filters.</div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <StudentPortalPanel className={`${sp.panelPad} flex flex-wrap items-center justify-between gap-4`}>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold tracking-tight text-brand">
                    {p.fee?.label || 'Application fee'}
                  </p>
                  <p className={`${sp.body} mt-1`}>
                    {p.application?.applicationCode} · {p.application?.university}
                  </p>
                  {p.receiptNumber && (
                    <p className="mt-2 text-xs text-neutral-400">Receipt {p.receiptNumber}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 text-right">
                  <p className="text-lg font-semibold tracking-tight text-brand">
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
                        className="text-xs font-medium text-neutral-500 transition hover:text-brand"
                      >
                        {p.status === 'PAID' ? 'View application' : 'Pay on application'}
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
