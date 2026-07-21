'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Mail, Phone, Upload, User } from 'lucide-react';
import { getStudent, getApplication, uploadApplicationDocument } from '@/services/studentCrmApi';
import {
  getUniversityContact,
  getMyPartner,
  createAgentPaymentOrder,
  verifyAgentPayment,
} from '@/services/agencyCrmApi';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuth } from '@/lib/auth/AuthContext';
import { getStageLabel, stageBadgeClass } from '@/features/student-crm/constants';

const formatMoney = (paise, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format((paise || 0) / 100);

const DOC_STATUS = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  UPLOADED: 'bg-blue-50 text-blue-800 border-blue-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-800 border-red-200',
};

const feeIsPaid = (fee, payments = []) =>
  payments.find((p) => p.feeId === fee.id && p.status === 'PAID');

function ApplicationPanel({ app, canPayFees }) {
  const { user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [poc, setPoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [payingFeeId, setPayingFeeId] = useState(null);
  const [msg, setMsg] = useState('');

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, pocRes] = await Promise.all([
        getApplication(app.id),
        getUniversityContact({ university: app.university, country: app.country }).catch(() => null),
      ]);
      setDetail(appRes?.data || null);
      setPoc(pocRes?.data || null);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [app.id, app.university, app.country]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const uploadDoc = async (docId, file) => {
    if (!file) return;
    setUploadingId(docId);
    setMsg('');
    try {
      await uploadApplicationDocument(app.id, docId, file);
      setMsg('Document uploaded');
      await loadDetail();
    } catch (e) {
      setMsg(e?.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const payFee = async (fee) => {
    if (!canPayFees || !fee?.id) return;
    setPayingFeeId(fee.id);
    setMsg('');
    try {
      const orderRes = await createAgentPaymentOrder(app.id, fee.id);
      const order = orderRes?.data;
      if (!order?.keyId || !order?.orderId) throw new Error('Could not start payment');

      await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        description: order.feeLabel || fee.label,
        prefill: { name: user?.fullName, email: user?.email },
        onSuccess: async (rzpRes) => {
          await verifyAgentPayment(app.id, {
            razorpay_order_id: rzpRes.razorpay_order_id,
            razorpay_payment_id: rzpRes.razorpay_payment_id,
            razorpay_signature: rzpRes.razorpay_signature,
          });
          setMsg('Payment successful');
          await loadDetail();
        },
      });
    } catch (e) {
      if (e?.message !== 'Payment cancelled') {
        setMsg(e?.message || 'Payment failed');
      }
    } finally {
      setPayingFeeId(null);
    }
  };

  const documents = detail?.documents || [];
  const payments = detail?.payments || [];
  const fees = detail?.fees || [];

  return (
    <div className="ui-panel overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-3 bg-neutral-50/70">
        <div>
          <p className="text-xs font-mono text-neutral-500">{app.applicationCode}</p>
          <p className="text-sm font-semibold text-brand mt-0.5">
            {app.university} · {app.course}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {app.country}
            {app.intake ? ` · ${app.intake}` : ''}
          </p>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${stageBadgeClass(app.stage)}`}>
          {getStageLabel(app.stage)}
        </span>
      </div>

      {loading ? (
        <p className="p-5 text-sm text-neutral-500">Loading application details…</p>
      ) : (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-800">Documents</h3>
            {!documents.length ? (
              <p className="text-sm text-neutral-500">No documents listed yet.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{doc.name}</p>
                        <span
                          className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            DOC_STATUS[doc.status] || 'bg-neutral-50 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          {doc.status}
                        </span>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block mt-1 text-xs text-brand hover:underline"
                          >
                            View file
                          </a>
                        )}
                      </div>
                      <label className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-neutral-700 cursor-pointer hover:text-brand">
                        <Upload size={14} />
                        {uploadingId === doc.id ? 'Uploading…' : 'Attach'}
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploadingId === doc.id}
                          onChange={(e) => uploadDoc(doc.id, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {msg && <p className="text-xs text-neutral-600">{msg}</p>}
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">University POC</h3>
              {poc?.pocName || poc?.pocEmail || poc?.pocPhone ? (
                <div className="mt-2 rounded-lg border border-neutral-200 bg-white p-3 text-sm space-y-1.5">
                  {poc.pocName && <p className="font-medium text-neutral-800">{poc.pocName}</p>}
                  {poc.pocEmail && (
                    <a
                      href={`mailto:${poc.pocEmail}`}
                      className="flex items-center gap-1.5 text-brand hover:underline"
                    >
                      <Mail size={14} />
                      {poc.pocEmail}
                    </a>
                  )}
                  {poc.pocPhone && (
                    <a href={`tel:${poc.pocPhone}`} className="flex items-center gap-1.5 text-neutral-700">
                      <Phone size={14} />
                      {poc.pocPhone}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 mt-2">No university contact on file yet.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-800">Fees & payments</h3>
              {!canPayFees && (
                <p className="text-xs text-neutral-600 mt-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                  Paying fees is not enabled on your partner account. Fee status is shown for tracking; staff
                  collect payments unless your coordinator turns on fee payment for you.
                </p>
              )}
              {!fees.length && !payments.length ? (
                <p className="text-sm text-neutral-500 mt-2">No payment records yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {fees.map((fee) => {
                    const paid = feeIsPaid(fee, payments);
                    return (
                      <div key={fee.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-neutral-800">{fee.label}</p>
                            <p className="text-neutral-700 whitespace-nowrap mt-0.5">
                              {formatMoney(fee.amountPaise, fee.currency)}
                            </p>
                          </div>
                          {paid ? (
                            <span className="text-xs font-semibold text-emerald-700">Paid</span>
                          ) : canPayFees ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
                              disabled={payingFeeId === fee.id}
                              onClick={() => payFee(fee)}
                            >
                              <CreditCard size={14} />
                              {payingFeeId === fee.id ? 'Processing…' : 'Pay now'}
                            </button>
                          ) : (
                            <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg max-w-[14rem] text-right">
                              Fee payment is managed by UniNow staff — ask your coordinator if a payment is needed.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {payments.filter((p) => p.status === 'PAID').map((payment) => (
                    <div key={payment.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <p className="font-medium text-neutral-800">{payment.status}</p>
                        <p className="text-neutral-700 whitespace-nowrap">
                          {formatMoney(payment.amountPaise, payment.currency)}
                        </p>
                      </div>
                      {payment.paidAt && (
                        <p className="text-xs text-neutral-500 mt-1">
                          Paid {new Date(payment.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function AgentStudentView() {
  const params = useParams();
  const studentId = Number(params?.id);
  const [profile, setProfile] = useState(null);
  const [canPayFees, setCanPayFees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!Number.isFinite(studentId)) {
      setError('Invalid student');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [studentRes, partnerRes] = await Promise.all([
        getStudent(studentId),
        getMyPartner().catch(() => null),
      ]);
      setProfile(studentRes?.data || null);
      const caps = partnerRes?.data?.capabilities || {};
      setCanPayFees(Boolean(caps.canPayFees));
    } catch (e) {
      setError(e?.message || 'Unable to load student');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="ui-page">
      <div className="ui-container space-y-6">
        <Link
          href="/agency-crm/agency-leads"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-brand"
        >
          <ArrowLeft size={16} />
          Back to agency leads
        </Link>

        {loading ? (
          <div className="ui-panel p-8">
            <p className="text-sm text-neutral-500">Loading student…</p>
          </div>
        ) : error ? (
          <div className="ui-panel p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Link href="/agency-crm/agency-leads" className="ui-btn-secondary text-xs mt-4 inline-flex">
              Return to leads
            </Link>
          </div>
        ) : (
          <>
            <div className="ui-panel p-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                  <User size={22} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold text-brand truncate">{profile.fullName}</h1>
                  <p className="text-sm text-neutral-600 mt-0.5">{profile.email}</p>
                  {profile.phone && <p className="text-sm text-neutral-500">{profile.phone}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.preferredCountry && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                        Destination: {profile.preferredCountry}
                      </span>
                    )}
                    {profile.isEnrolled && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Enrolled
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                      {profile.applications?.length || 0} application
                      {(profile.applications?.length || 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-neutral-800">Applications</h2>
              {!profile.applications?.length ? (
                <div className="ui-panel p-8 text-center">
                  <p className="text-sm text-neutral-500">No applications yet for this student.</p>
                </div>
              ) : (
                profile.applications.map((app) => (
                  <ApplicationPanel key={app.id} app={app} canPayFees={canPayFees} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
