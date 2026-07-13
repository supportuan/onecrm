'use client';

import { useEffect, useState } from 'react';
import { Calendar, Loader2, Send, X } from 'lucide-react';
import { getLeaveTypes, getMyLeaveRequests, createLeaveRequest, cancelLeaveRequest, getHrMe } from '@/services/hrApi';
import LeaveBalanceSummary from '../components/LeaveBalanceSummary';

const STATUS_STYLE = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  CANCELLED: 'bg-neutral-50 text-neutral-600 border-neutral-200',
};

export default function LeaveMyRequests() {
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [hrMe, setHrMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leaveTypeName: '',
    fromDate: '',
    toDate: '',
    days: 1,
    reason: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [reqRes, typesRes, meRes] = await Promise.all([
        getMyLeaveRequests(),
        getLeaveTypes(),
        getHrMe(),
      ]);
      if (reqRes.success) setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
      if (meRes.success) setHrMe(meRes.data);
      if (typesRes.success) {
        const types = typesRes.types || typesRes.data || [];
        setLeaveTypes(types);
        if (types.length && !form.leaveTypeName) {
          setForm((f) => ({ ...f, leaveTypeName: types[0].name || types[0].code || '' }));
        }
      }
    } catch (_) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leaveTypeName || !form.fromDate || !form.toDate) return;
    setSubmitting(true);
    try {
      const res = await createLeaveRequest(form);
      if (res.success) {
        setForm({ leaveTypeName: leaveTypes[0]?.name || '', fromDate: '', toDate: '', days: 1, reason: '' });
        await load();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await cancelLeaveRequest(id);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="ui-container space-y-6">
      <LeaveBalanceSummary
        leaveSummary={hrMe?.leaveSummary}
        attendanceSummary={hrMe?.attendanceSummary}
        leaveBalances={hrMe?.leaveBalances}
      />

      <div className="ui-panel p-6">
        <h2 className="text-[15px] font-semibold text-brand flex items-center gap-2">
          <Send size={16} className="text-neutral-700" />
          Apply for leave
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-neutral-500 tracking-wide">Leave type</label>
            <select
              value={form.leaveTypeName}
              onChange={(e) => setForm({ ...form, leaveTypeName: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-xl focus:border-neutral-700 outline-none"
            >
              {leaveTypes.length === 0 && <option value="">Casual leave</option>}
              {leaveTypes.map((t) => (
                <option key={t.id || t.code} value={t.name || t.code}>
                  {t.name || t.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-neutral-500 tracking-wide">From</label>
            <input
              type="date"
              required
              value={form.fromDate}
              onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-xl focus:border-neutral-700 outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-neutral-500 tracking-wide">To</label>
            <input
              type="date"
              required
              value={form.toDate}
              onChange={(e) => setForm({ ...form, toDate: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-xl focus:border-neutral-700 outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-neutral-500 tracking-wide">Days</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={form.days}
              onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
              className="mt-1 w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-xl focus:border-neutral-700 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold text-neutral-500 tracking-wide">Reason</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="optional"
              className="mt-1 w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-xl focus:border-neutral-700 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-[15px] font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit request
            </button>
          </div>
        </form>
      </div>

      <div className="ui-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center gap-2">
          <Calendar size={16} className="text-neutral-700" />
          <h2 className="text-[15px] font-semibold text-brand">My requests</h2>
        </div>
        {loading ? (
          <div className="p-10 text-center text-[13px] text-neutral-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-neutral-500">No leave requests yet.</div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {requests.map((r) => (
              <li key={r.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-neutral-800">{r.leaveTypeName}</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">
                    {r.fromDate} → {r.toDate} · {r.days} day{r.days !== 1 ? 's' : ''}
                  </p>
                  {r.reason && <p className="text-[13px] text-neutral-500 mt-1">{r.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${
                      STATUS_STYLE[r.status] || STATUS_STYLE.PENDING
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleCancel(r.id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
