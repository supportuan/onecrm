'use client';

import { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { createPaymentOrder, verifyPayment } from '@/services/studentCrmApi';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuth } from '@/lib/auth/AuthContext';

const formatInr = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((paise || 0) / 100);

const feeIsPaid = (fee, payments = []) =>
  payments.some((p) => p.feeId === fee.id && p.status === 'PAID');

export default function StudentPaymentPanel({ app, readiness, onPaid }) {
  const { user } = useAuth();
  const [payingFeeId, setPayingFeeId] = useState(null);
  const [error, setError] = useState('');

  const fees = app?.fees || [];
  const payments = app?.payments || [];

  if (!fees.length) {
    return (
      <section className="ui-panel p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Fees & payments</h2>
        <p className="text-sm text-neutral-500 mt-2">No fees have been assigned to this application yet.</p>
      </section>
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
    <section className="ui-panel p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Fees & payments</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Upload all required documents first, then pay your application fees securely via Razorpay.
        </p>
        {fees.some((f) => !feeIsPaid(f, payments)) && (
          <p className="text-xs text-neutral-400 mt-2">
            Test mode: pay with card <span className="font-mono">4111 1111 1111 1111</span>, any future expiry, any CVV.
            UPI QR is disabled in test checkout because it often returns &quot;invalid UPI id&quot;.
          </p>
        )}
      </div>

      {!readiness?.canPay && readiness?.missingDocuments?.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Upload all required documents before payment unlocks.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <ul className="divide-y divide-neutral-100 border border-neutral-100 rounded-lg overflow-hidden">
        {fees.map((fee) => {
          const paid = feeIsPaid(fee, payments);
          const canPay = readiness?.canPay && !paid;
          return (
            <li key={fee.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white">
              <div>
                <p className="text-sm font-medium text-neutral-900">{fee.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{formatInr(fee.amountPaise)}</p>
              </div>
              {paid ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Paid
                </span>
              ) : (
                <button
                  type="button"
                  disabled={!canPay || payingFeeId === fee.id}
                  onClick={() => handlePay(fee)}
                  className="ui-btn-primary inline-flex items-center gap-2 text-xs py-2 disabled:opacity-50"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {payingFeeId === fee.id ? 'Processing…' : 'Pay now'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
