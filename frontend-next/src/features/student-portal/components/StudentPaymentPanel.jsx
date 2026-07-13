'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Lock, Download } from 'lucide-react';
import { createPaymentOrder, verifyPayment } from '@/services/studentCrmApi';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuth } from '@/lib/auth/AuthContext';
import { sp, StudentPortalPanel } from '../student-portal-ui';

const formatInr = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((paise || 0) / 100);

const feeIsPaid = (fee, payments = []) =>
  payments.find((p) => p.feeId === fee.id && p.status === 'PAID') || null;

export default function StudentPaymentPanel({ app, readiness, onPaid }) {
  const { user } = useAuth();
  const [payingFeeId, setPayingFeeId] = useState(null);
  const [error, setError] = useState('');

  const fees = app?.fees || [];
  const payments = app?.payments || [];

  if (!fees.length) {
    return (
      <StudentPortalPanel className={`${sp.panelPad} space-y-2`}>
        <h2 className={sp.sectionTitle}>Fees & payments</h2>
        <p className={sp.body}>No fees have been assigned to this application yet.</p>
      </StudentPortalPanel>
    );
  }

  const handlePay = async (fee) => {
    if (!app?.id || feeIsPaid(fee, payments)) return;
    setError('');
    setPayingFeeId(fee.id);
    try {
      const orderRes = await createPaymentOrder(app.id, fee.id);
      const order = orderRes?.data;
      if (!order?.keyId || !order?.orderId) {
        throw new Error('Could not start payment');
      }

      await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        description: order.feeLabel || fee.label,
        prefill: { name: user?.fullName, email: user?.email },
        onSuccess: async (rzpRes) => {
          await verifyPayment(app.id, {
            razorpay_order_id: rzpRes.razorpay_order_id,
            razorpay_payment_id: rzpRes.razorpay_payment_id,
            razorpay_signature: rzpRes.razorpay_signature,
          });
          onPaid?.();
        },
      });
    } catch (e) {
      if (e?.message !== 'Payment cancelled') {
        setError(e?.message || 'Payment failed');
      }
    } finally {
      setPayingFeeId(null);
    }
  };

  return (
    <StudentPortalPanel className={`${sp.panelPad} space-y-5`}>
      <div>
        <h2 className={sp.sectionTitle}>Fees & payments</h2>
        <p className={`${sp.body} mt-1.5`}>
          Upload all required documents first, then pay securely via Razorpay.
        </p>
        {fees.some((f) => !feeIsPaid(f, payments)) && (
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            Test mode: card <span className="font-mono">4111 1111 1111 1111</span>, any future expiry, any CVV.
          </p>
        )}
      </div>

      {!readiness?.canPay && readiness?.missingDocuments?.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Upload all required documents before payment unlocks.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {fees.map((fee) => {
          const paidPayment = feeIsPaid(fee, payments);
          const paid = Boolean(paidPayment);
          const canPay = readiness?.canPay && !paid;
          return (
            <li
              key={fee.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/40 px-4 py-3.5"
            >
              <div>
                <p className="text-sm font-semibold text-brand">{fee.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{formatInr(fee.amountPaise)}</p>
              </div>
              {paid ? (
                <div className="flex flex-col items-end gap-2">
                  <span className={sp.badge}>
                    <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                    Paid
                  </span>
                  {paidPayment?.id && (
                    <Link
                      href={`/applicant/payments/${paidPayment.id}/receipt`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={sp.btnGhost}
                    >
                      <Download className="h-3 w-3" />
                      Receipt
                    </Link>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!canPay || payingFeeId === fee.id}
                  onClick={() => handlePay(fee)}
                  className={`${sp.btnPrimary} text-xs py-2 disabled:opacity-50`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {payingFeeId === fee.id ? 'Processing…' : 'Pay now'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </StudentPortalPanel>
  );
}
