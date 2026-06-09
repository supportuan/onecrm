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
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { getHrMe, submitRemoteClockIn } from '@/services/hrApi';
import { sentenceCase } from '@/lib/text';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function EmployeeSelfService() {
  const { user } = useAuthStore();
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
        employeeId: user?.email,
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

  const emp = data?.employee;

  return (
    <div className="ui-page text-neutral-800 font-sans">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <div className="ui-container">
        <div>
          <p className="text-[10px] font-semibold text-neutral-500 tracking-wide">My HR</p>
          <h1 className="text-2xl font-semibold text-neutral-900 mt-1">
            Hello, {emp?.name || user?.fullName || user?.name || 'there'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Attendance, leave, and payslips in one place.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clock */}
          <div className="ui-panel p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Fingerprint size={18} className="text-neutral-700" />
              <h2 className="text-sm font-semibold text-neutral-900">Attendance today</h2>
            </div>
            <span
              className={`inline-block px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-lg border ${
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
                className="flex items-center justify-center gap-2 py-3 rounded-lg bg-neutral-900 text-white text-xs font-semibold disabled:opacity-40"
              >
                <LogIn size={14} /> Clock in
              </button>
              <button
                type="button"
                onClick={() => handleClock(true)}
                disabled={clockBusy || status !== 'clocked_in'}
                className="flex items-center justify-center gap-2 py-3 rounded-lg border border-neutral-200 text-xs font-semibold disabled:opacity-40"
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
              className="block text-center text-[11px] font-semibold text-neutral-700 hover:text-neutral-900 pt-2"
            >
              View full attendance →
            </Link>
          </div>

          {/* Leave balances */}
          <div className="lg:col-span-2 ui-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-neutral-700" />
                <h2 className="text-sm font-semibold text-neutral-900">Leave balance</h2>
              </div>
              <Link
                href="/hr/leave-management"
                className="text-[11px] font-semibold text-neutral-700 hover:text-neutral-900"
              >
                Apply for leave →
              </Link>
            </div>
            {data?.leaveBalances?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.leaveBalances.map((b) => (
                  <div key={b.leaveType} className="bg-neutral-50 border border-neutral-100 rounded-lg p-4">
                    <p className="text-xs font-semibold text-neutral-700">{b.leaveType}</p>
                    <p className="text-2xl font-semibold text-neutral-900 mt-1">{b.remaining}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      of {b.annualQuota} days · {b.used} used
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No leave plan assigned yet.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent leave */}
          <div className="ui-panel overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
              <Calendar size={16} className="text-neutral-700" />
              <h2 className="text-sm font-semibold">Recent leave requests</h2>
            </div>
            {data?.recentLeaveRequests?.length > 0 ? (
              <ul className="divide-y divide-neutral-100">
                {data.recentLeaveRequests.map((r) => (
                  <li key={r.id} className="px-5 py-3 flex justify-between items-center gap-2">
                    <div>
                      <p className="text-xs font-semibold text-neutral-800">{r.leaveTypeName}</p>
                      <p className="text-[10px] text-neutral-500">
                        {r.fromDate} → {r.toDate}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-neutral-500">{sentenceCase(r.status)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-8 text-center text-sm text-neutral-500">No leave requests yet.</p>
            )}
          </div>

          {/* Payslips */}
          <div className="ui-panel overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-neutral-700" />
                <h2 className="text-sm font-semibold">My payslips</h2>
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
                      <span className="text-xs font-medium text-neutral-800">
                        {MONTHS[(p.month || 1) - 1]} {p.year}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">
                      {typeof p.netSalary === 'number' ? p.netSalary.toLocaleString() : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-8 text-center text-sm text-neutral-500">No payslips available yet.</p>
            )}
          </div>
        </div>

        {(data?.pendingRegularizations > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-900">
              you have {data.pendingRegularizations} pending regularization request(s).{' '}
              <Link href="/hr/attendance" className="font-semibold text-neutral-900 underline">
                view attendance
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
