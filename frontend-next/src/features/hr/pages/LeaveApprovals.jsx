'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, X, Inbox } from 'lucide-react';
import { getPendingLeaveRequests, processLeaveRequest } from '@/services/hrApi';

export default function LeaveApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPendingLeaveRequests();
      if (res.success) setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (_) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleProcess = async (id, status) => {
    const note =
      status === 'REJECTED' ? prompt('Rejection reason (optional):') || undefined : undefined;
    setProcessingId(id);
    try {
      await processLeaveRequest(id, { status, reviewerNote: note });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="ui-page">
      <div className="ui-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <Inbox size={16} className="text-neutral-700" />
            Pending approvals
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">Review and approve or reject leave requests.</p>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-neutral-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center gap-2">
            <Inbox size={32} className="text-neutral-600" />
            <p className="text-sm font-medium text-neutral-600">No pending requests</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {requests.map((r) => (
              <li key={r.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{r.employeeName || r.employeeEmail}</p>
                  <p className="text-xs text-neutral-500">{r.employeeEmail}</p>
                  <p className="text-sm text-neutral-700 mt-2">
                    <span className="font-medium">{r.leaveTypeName}</span> · {r.fromDate} → {r.toDate} ·{' '}
                    {r.days} day{r.days !== 1 ? 's' : ''}
                  </p>
                  {r.reason && <p className="text-xs text-neutral-500 mt-1">{r.reason}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={processingId === r.id}
                    onClick={() => handleProcess(r.id, 'APPROVED')}
                    className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                  >
                    {processingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    approve
                  </button>
                  <button
                    type="button"
                    disabled={processingId === r.id}
                    onClick={() => handleProcess(r.id, 'REJECTED')}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-xl disabled:opacity-50"
                  >
                    <X size={12} />
                    reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
