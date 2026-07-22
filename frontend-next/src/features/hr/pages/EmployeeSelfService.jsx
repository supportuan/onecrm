'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  Wallet,
  FileText,
  Fingerprint,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getHrMe, submitRemoteClockIn } from '@/services/hrApi';
import { sentenceCase } from '@/lib/text';
import { LeaveAnalyticsStats, LeaveBalanceCards } from '../components/LeaveBalanceSummary';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function EmployeeSelfService() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockBusy, setClockBusy] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getHrMe();
      if (res.success) setData(res.data);
    } catch (_) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showToast = (msg, ok = true) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const clockStatus = () => {
    const att = data?.todayAttendance;
    if (!att) return 'not_clocked_in';
    if (att.checkOut) return 'clocked_out';
    if (att.checkIn) return 'clocked_in';
    return 'not_clocked_in';
  };

  const handleClock = async (isCheckOut) => {
    setClockBusy(true);
    try {
      const res = await submitRemoteClockIn({
        ip: '0.0.0.0',
        coordinates: '',
        isCheckOut,
      });
      if (res?.success) {
        showToast(isCheckOut ? 'Clocked out' : 'Clocked in');
        await load();
      } else {
        showToast(res?.error || 'Clock action failed', false);
      }
    } catch (err) {
      showToast(err?.message || 'Clock action failed', false);
    } finally {
      setClockBusy(false);
    }
  };

  const status = clockStatus();

  if (loading) {
    return (
      <div className="ui-page flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-700" size={28} />
      </div>
    );
  }

  return (
    <div className="ui-page text-neutral-800 font-sans">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand text-white px-4 py-2.5 rounded-xl text-[13px] font-medium shadow-lg">
          {toast}
        </div>
      )}

      <div className="ui-container">
        {/* Analytics */}
        <LeaveAnalyticsStats
          leaveSummary={data?.leaveSummary}
          attendanceSummary={data?.attendanceSummary}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clock */}
          <div className="ui-panel p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Fingerprint size={18} className="text-neutral-700" />
              <h2 className="text-[15px] font-semibold text-brand">Attendance today</h2>
            </div>
            <span
              className={`inline-block px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-lg border ${
                status === 'clocked_in'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : status === 'clocked_out'
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              {status === 'clocked_in' ? 'On the clock' : status === 'clocked_out' ? 'Clocked out' : 'Not clocked in'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleClock(false)}
                disabled={clockBusy || status === 'clocked_in'}
                className="flex items-center justify-center gap-2 py-3 rounded-lg bg-brand text-white text-[13px] font-semibold disabled:opacity-40"
              >
                <LogIn size={14} /> Clock in
              </button>
              <button
                type="button"
                onClick={() => handleClock(true)}
                disabled={clockBusy || status !== 'clocked_in'}
                className="flex items-center justify-center gap-2 py-3 rounded-lg border border-neutral-200 text-[13px] font-semibold disabled:opacity-40"
              >
                <LogOut size={14} /> Clock out
              </button>
            </div>
            {data?.todayAttendance?.checkIn && (
              <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                <Clock size={12} />
                In: {new Date(data.todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {data.todayAttendance.checkOut &&
                  ` · Out: ${new Date(data.todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            )}
            <Link
              href="/hr/attendance"
              className="block text-center text-[11px] font-semibold text-neutral-700 hover:text-brand pt-2"
            >
              View full attendance →
            </Link>
          </div>

          {/* Leave balances */}
          <div className="lg:col-span-2 ui-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-neutral-700" />
                <h2 className="text-[15px] font-semibold text-brand">Leave balance</h2>
              </div>
              <Link
                href="/hr/leave-management"
                className="text-[11px] font-semibold text-neutral-700 hover:text-brand"
              >
                Apply for leave →
              </Link>
            </div>
            <LeaveBalanceCards balances={data?.leaveBalances} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent leave */}
          <div className="ui-panel overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
              <Calendar size={16} className="text-neutral-700" />
              <h2 className="text-[15px] font-semibold">Recent leave requests</h2>
            </div>
            {data?.recentLeaveRequests?.length > 0 ? (
              <ul className="divide-y divide-neutral-100">
                {data.recentLeaveRequests.map((r) => (
                  <li key={r.id} className="px-5 py-3 flex justify-between items-center gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-800">{r.leaveTypeName}</p>
                      <p className="text-[11px] text-neutral-500">
                        {r.fromDate} → {r.toDate}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-neutral-500">{sentenceCase(r.status)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-8 text-center text-[13px] text-neutral-500">No leave requests yet.</p>
            )}
          </div>

          {/* Payslips */}
          <div className="ui-panel overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-neutral-700" />
                <h2 className="text-[15px] font-semibold">My payslips</h2>
              </div>
              <Link href="/hr/payroll?tab=run" className="text-[11px] font-semibold text-neutral-700">
                View all →
              </Link>
            </div>
            {data?.recentPayslips?.length > 0 ? (
              <ul className="divide-y divide-neutral-100">
                {data.recentPayslips.map((p) => (
                  <li key={p.id} className="px-5 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-neutral-500" />
                      <span className="text-[13px] font-medium text-neutral-800">
                        {MONTHS[(p.month || 1) - 1]} {p.year}
                      </span>
                    </div>
                    <span className="text-[15px] font-semibold text-brand">
                      {typeof p.netSalary === 'number' ? p.netSalary.toLocaleString() : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-8 text-center text-[13px] text-neutral-500">No payslips available yet.</p>
            )}
          </div>
        </div>

        {(data?.pendingRegularizations > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <p className="text-[13px] text-amber-900">
              you have {data.pendingRegularizations} pending regularization request(s).{' '}
              <Link href="/hr/attendance" className="font-semibold text-brand underline">
                view attendance
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
