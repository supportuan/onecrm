'use client';

import { useEffect, useState } from 'react';
import { createTuitionPayment, getAssociatedStudents, getTuitionPayments } from '@/services/agentApi';

const AgentPayments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, sRes] = await Promise.all([getTuitionPayments(), getAssociatedStudents()]);
        setPayments(pRes.data || []);
        setStudents(sRes.data || []);
        if (sRes.data?.length) setStudentId(sRes.data[0].id);
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const student = students.find((s) => s.id === studentId);
      await createTuitionPayment({
        studentId,
        university: student?.university,
        amount: Number(amount),
        currency: 'USD',
      });
      const pRes = await getTuitionPayments();
      setPayments(pRes.data || []);
      setAmount('');
      setMessage('Tuition payment initiated successfully.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading payments...</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Tuition payments</h1>
        <p className="mt-2 text-sm text-slate-600">
          Initiate university and tuition fee payments for associated students (PREMIUM contract).
        </p>
      </section>

      <form onSubmit={handlePay} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 max-w-xl">
        <h2 className="text-sm font-semibold text-slate-900">New payment</h2>
        <div>
          <label className="text-xs font-semibold text-slate-600">Student</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.university}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Amount (USD)</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          />
        </div>
        <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">
          Initiate payment
        </button>
        {message && <p className="text-xs text-slate-600">{message}</p>}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Payment history</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="py-2 pr-4">Reference</th>
                <th className="py-2 pr-4">University</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4 font-mono">{p.reference}</td>
                  <td className="py-3 pr-4">{p.university}</td>
                  <td className="py-3 pr-4">{p.currency} {p.amount}</td>
                  <td className="py-3">{p.status}</td>
                </tr>
              ))}
              {!payments.length && (
                <tr>
                  <td colSpan={4} className="py-4 text-slate-500">No payments yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AgentPayments;
