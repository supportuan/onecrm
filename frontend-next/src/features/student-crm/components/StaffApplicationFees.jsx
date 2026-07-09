'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { upsertApplicationFee } from '@/services/studentCrmApi';

const formatInr = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((paise || 0) / 100);

export default function StaffApplicationFees({ app, canManage, onSaved }) {
  const [label, setLabel] = useState('Application processing fee');
  const [amountInr, setAmountInr] = useState('5000');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!app) return null;

  const fees = app.fees || [];
  const payments = app.payments || [];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError('');
    try {
      await upsertApplicationFee(app.id, {
        label: label.trim(),
        amountInr: Number(amountInr),
        feeType: 'APPLICATION_FEE',
        required: true,
      });
      onSaved?.();
      setLabel('Application processing fee');
      setAmountInr('5000');
    } catch (err) {
      setError(err?.message || 'Failed to save fee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="ui-panel p-5 space-y-4">
      <div>
        <h3 className="ui-text-h3">Application fees</h3>
        <p className="ui-text-meta mt-0.5">Students pay these via Razorpay after uploading required documents.</p>
      </div>

      {fees.length > 0 ? (
        <ul className="divide-y divide-neutral-100 border border-neutral-100 rounded-lg overflow-hidden">
          {fees.map((fee) => {
            const paid = payments.some((p) => p.feeId === fee.id && p.status === 'PAID');
            return (
              <li key={fee.id} className="flex justify-between gap-3 px-4 py-3 text-sm bg-white">
                <span className="font-medium text-neutral-900">{fee.label}</span>
                <span className={paid ? 'text-emerald-700 font-medium' : 'text-neutral-600'}>
                  {formatInr(fee.amountPaise)} {paid ? '· Paid' : '· Unpaid'}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">No fees assigned yet.</p>
      )}

      {canManage && (
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 border-t border-neutral-100 pt-4">
          <label className="block min-w-[200px] flex-1">
            <span className="ui-label">Fee label</span>
            <input className="ui-field" value={label} onChange={(e) => setLabel(e.target.value)} required />
          </label>
          <label className="block w-36">
            <span className="ui-label">Amount (INR)</span>
            <input
              type="number"
              min="1"
              step="1"
              className="ui-field"
              value={amountInr}
              onChange={(e) => setAmountInr(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={saving} className="ui-btn-primary inline-flex items-center gap-2">
            <Plus size={14} /> {saving ? 'Saving…' : 'Add fee'}
          </button>
          {error && <p className="w-full text-sm text-rose-600">{error}</p>}
        </form>
      )}
    </section>
  );
}
