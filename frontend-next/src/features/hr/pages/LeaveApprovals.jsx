'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, X, Inbox } from 'lucide-react';
import { getLeaveApprovalQueue, processLeaveRequest } from '@/services/hrApi';

export default function LeaveApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getLeaveApprovalQueue();
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

  const handleProcess = async (id, status, stage) => {
    const note =
      status === 'REJECTED' ? prompt('Rejection reason (optional):') || undefined : undefined;
    setProcessingId(id);
    setError('');
    try {
      await processLeaveRequest(id, { status, reviewerNote: note });
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to process request');
    } finally {
      setProcessingId('');
    }
  };

  const approveLabel = (stage) => (stage === 'manager' ? 'Approve (to HR)' : 'Final approve');

  return (
    <div className="ui-page">
      <div className="ui-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-sm font-semibold text-brand flex items-center gap-2">
            <Inbox size={16} className="text-neutral-700" />
            Leave approvals
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manager reviews first, then HR gives final approval.
          </p>
        </div>
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
            {error}
          </div>
        )}
        {loading ? (
          <div className="p-10 text-center text-sm text-neutral-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center gap-2">
            <Inbox size={32} className="text-neutral-600" />
            <p className="text-sm font-medium text-neutral-600">No requests awaiting your action</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {requests.map((r) => (
              <li
                key={r.id}
                className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-brand">
                      {r.employeeName || r.employeeEmail}
                    </p>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                        r.approvalStage === 'hr'
                          ? 'bg-violet-50 text-violet-700 border-violet-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {r.approvalStage === 'hr' ? 'HR review' : 'Manager review'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">{r.employeeEmail}</p>
                  <p className="text-sm text-neutral-700 mt-2">
                    <span className="font-medium">{r.leaveTypeName}</span> · {r.fromDate} → {r.toDate}{' '}
                    · {r.days} day{r.days !== 1 ? 's' : ''}
                  </p>
                  {r.reason && <p className="text-xs text-neutral-500 mt-1">{r.reason}</p>}
                  {r.managerReviewerNote && (
                    <p className="text-xs text-neutral-400 mt-1">
                      Manager note: {r.managerReviewerNote}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={processingId === r.id}
                    onClick={() => handleProcess(r.id, 'APPROVED', r.approvalStage)}
                    className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                  >
                    {processingId === r.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    {approveLabel(r.approvalStage)}
                  </button>
                  <button
                    type="button"
                    disabled={processingId === r.id}
                    onClick={() => handleProcess(r.id, 'REJECTED', r.approvalStage)}
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
