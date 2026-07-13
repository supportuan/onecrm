'use client';

import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Hourglass,
} from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ icon: Icon, label, value, sub, accent = 'text-neutral-700' }) {
  return (
    <div className="ui-panel p-4 sm:p-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-neutral-500 tracking-tight truncate">{label}</p>
        <p className="text-[22px] font-semibold text-brand mt-1.5 leading-none">{value}</p>
        {sub && <p className="text-[11px] text-neutral-500 mt-1.5 truncate">{sub}</p>}
      </div>
      <div className="shrink-0 w-9 h-9 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center">
        <Icon size={16} className={accent} />
      </div>
    </div>
  );
}

export function LeaveAnalyticsStats({ leaveSummary, attendanceSummary }) {
  const leave = leaveSummary || {
    totalQuota: 0,
    totalUsed: 0,
    totalRemaining: 0,
    totalPending: 0,
    pendingRequests: 0,
  };
  const attendance = attendanceSummary || {
    month: new Date().getMonth() + 1,
    presentDays: 0,
    lateDays: 0,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={CalendarDays}
        label="Leave remaining"
        value={leave.totalRemaining}
        sub={`of ${leave.totalQuota} days`}
        accent="text-emerald-600"
      />
      <StatCard
        icon={CalendarCheck}
        label="Leave used"
        value={leave.totalUsed}
        sub="days this year"
        accent="text-neutral-700"
      />
      <StatCard
        icon={Hourglass}
        label="Pending requests"
        value={leave.pendingRequests}
        sub={leave.totalPending ? `${leave.totalPending} day(s) awaiting` : 'awaiting approval'}
        accent="text-amber-600"
      />
      <StatCard
        icon={CalendarClock}
        label="Present this month"
        value={attendance.presentDays}
        sub={`${MONTHS[(attendance.month || 1) - 1]} · ${attendance.lateDays} late`}
        accent="text-sky-600"
      />
    </div>
  );
}

export function LeaveBalanceCards({ balances = [], className = '' }) {
  if (!balances.length) {
    return <p className="text-[13px] text-neutral-500">No leave plan assigned yet.</p>;
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {balances.map((b) => {
        const quota = b.entitled ?? b.annualQuota ?? 0;
        const usedPct = quota > 0 ? Math.min(100, Math.round((b.used / quota) * 100)) : 0;
        const quotaLabel =
          b.accrualType === 'monthly' && b.accrualRate > 0
            ? `${b.accrualRate}/mo · ${quota} available`
            : `${quota} days available`;
        return (
          <div key={b.leaveType} className="bg-neutral-50 border border-neutral-100 rounded-lg p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold text-neutral-700 truncate">{b.leaveType}</p>
              <p className="text-[11px] text-neutral-500 shrink-0">{quotaLabel}</p>
            </div>
            <p className="text-[22px] font-semibold text-brand mt-1">
              {b.remaining}
              <span className="text-[13px] font-medium text-neutral-400"> left</span>
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1.5">
              {b.used} used
              {b.pending ? ` · ${b.pending} pending` : ''}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** Analytics row + leave balance cards — used on My HR and Leave pages. */
export default function LeaveBalanceSummary({ leaveSummary, attendanceSummary, leaveBalances }) {
  return (
    <div className="space-y-4">
      <LeaveAnalyticsStats leaveSummary={leaveSummary} attendanceSummary={attendanceSummary} />
      <div className="ui-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-neutral-700" />
          <h2 className="text-[15px] font-semibold text-brand">Remaining leave</h2>
        </div>
        <LeaveBalanceCards balances={leaveBalances} />
      </div>
    </div>
  );
}
