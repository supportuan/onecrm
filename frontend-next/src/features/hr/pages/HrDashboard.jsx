'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isHrSelfServiceOnly } from '@/features/hr/routing';
import {
  Fingerprint,
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Users,
  Briefcase,
  CalendarCheck,
  Search,
  Star,
  DollarSign,
  TrendingUp,
  MapPin,
  Wifi,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { hasPermission } from '@/lib/auth/rbac';
import {
  submitRemoteClockIn,
  getAttendanceEvents,
  getHrDashboardSummary,
} from '@/services/hrApi';

const QUICK_LINKS = [
  { label: 'My HR', path: '/hr/me', icon: Fingerprint, perm: 'VIEW_HR', selfServiceOnly: true },
  { label: 'Recruitment', path: '/hr/recruitment-tracker', icon: Search, perm: 'MANAGE_EMPLOYEES' },
  { label: 'Employee directory', path: '/hr/employee-directory', icon: Users, perm: 'VIEW_ALL_EMPLOYEES' },
  { label: 'Attendance', path: '/hr/attendance', icon: Clock, perm: 'VIEW_ATTENDANCE' },
  { label: 'Leave', path: '/hr/leave-management', icon: CalendarCheck, perm: 'VIEW_LEAVE' },
  { label: 'Performance', path: '/hr/performance-reviews', icon: Star, perm: 'VIEW_REPORTS' },
  { label: 'Payroll', path: '/hr/payroll', icon: DollarSign, perm: 'MANAGE_PAYROLL' },
];

export default function HrDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const role = user?.role;

  const can = (perm) => hasPermission(role, perm);

  useEffect(() => {
    if (role && isHrSelfServiceOnly(role)) {
      router.replace('/hr/me');
    }
  }, [role, router]);

  const [clockState, setClockState] = useState({ status: 'unknown', lastEvent: null });
  const [clockBusy, setClockBusy] = useState(false);
  const [toast, setToast] = useState({ kind: '', msg: '' });

  const [kpi, setKpi] = useState({
    openPositions: null,
    candidatesInPipeline: null,
    pendingLeaveRequests: null,
    pendingRegularizations: null,
    employeeCount: null,
    scheduledInterviews: null,
    todayClockIns: null,
  });

  const showToast = (kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast({ kind: '', msg: '' }), 3000);
  };

  // Load my latest attendance event so the widget shows correct state
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getAttendanceEvents();
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          const todayStr = new Date().toISOString().split('T')[0];
          const mine = res.data
            .filter((e) => (e.employeeId || e.email) === user?.email)
            .sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0));
          const latest = mine[0] || null;
          const isToday = latest && (latest.timestamp || latest.createdAt || '').startsWith(todayStr);
          const status = isToday ? (latest.eventType === 'CHECK_OUT' || latest.isCheckOut ? 'clocked_out' : 'clocked_in') : 'not_clocked_in';
          setClockState({ status, lastEvent: latest });
          const todayCount = res.data.filter((e) => (e.timestamp || e.createdAt || '').startsWith(todayStr)).length;
          setKpi((k) => ({ ...k, todayClockIns: todayCount }));
        }
      } catch (_) {
        // backend may be down; widget still works for clock-in attempts
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  useEffect(() => {
    if (!can('VIEW_HR')) return;
    let mounted = true;
    (async () => {
      try {
        const res = await getHrDashboardSummary().catch(() => null);
        if (!mounted || !res?.success || !res?.data) return;
        setKpi((k) => ({
          ...k,
          openPositions: res.data.openPositions ?? 0,
          candidatesInPipeline: res.data.candidatesInPipeline ?? 0,
          pendingLeaveRequests: res.data.pendingLeaveRequests ?? 0,
          pendingRegularizations: res.data.pendingRegularizations ?? 0,
          employeeCount: res.data.employeeCount ?? 0,
          scheduledInterviews: res.data.scheduledInterviews ?? 0,
        }));
      } catch (_) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

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
        setClockState({ status: isCheckOut ? 'clocked_out' : 'clocked_in', lastEvent: res.data });
        showToast('ok', isCheckOut ? 'Clocked out successfully' : 'clocked in successfully');
      } else {
        showToast('err', res?.error || 'clock-in failed');
      }
    } catch (err) {
      showToast('err', err?.message || 'clock-in failed');
    } finally {
      setClockBusy(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '—';
    }
  };

  const operator = !isHrSelfServiceOnly(role);
  const allowedLinks = QUICK_LINKS.filter((l) => {
    if (!can(l.perm)) return false;
    if (l.selfServiceOnly) return !operator;
    return operator;
  });

  const showKpiRow = can('VIEW_HR');
  const showApprovals = can('MANAGE_LEAVE') || can('MANAGE_ATTENDANCE');

  return (
    <div className="ui-page text-neutral-800 font-sans">
      {toast.msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold text-white ${
            toast.kind === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="ui-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">HR dashboard</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Welcome back, {user?.name || 'team member'} — manage attendance, recruitment, and people operations.
            </p>
          </div>
          <span className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-[10px] font-semibold text-neutral-600 self-start md:self-auto">
            Role · {(role || 'unknown').toLowerCase()}
          </span>
        </div>

        {/* Top row: Clock-in widget + (optional) primary KPI tiles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Remote Clock-In Widget */}
          {can('VIEW_ATTENDANCE') && (
            <div className="lg:col-span-1 ui-panel p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                    <Fingerprint size={16} className="text-neutral-700" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-500 leading-none">Remote attendance</p>
                    <h3 className="text-sm font-semibold text-neutral-900 mt-1">Clock in / out</h3>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-[9px] font-extrabold tracking-wide rounded-lg border ${
                    clockState.status === 'clocked_in'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : clockState.status === 'clocked_out'
                      ? 'bg-neutral-50 border-neutral-200 text-neutral-600'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  {clockState.status === 'clocked_in' ? 'On the clock' : clockState.status === 'clocked_out' ? 'Clocked out' : 'Not yet today'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleClock(false)}
                  disabled={clockBusy || clockState.status === 'clocked_in'}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <LogIn size={14} />
                  Clock in
                </button>
                <button
                  onClick={() => handleClock(true)}
                  disabled={clockBusy || clockState.status !== 'clocked_in'}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg text-xs font-semibold bg-white border border-neutral-200 text-neutral-700 hover:border-rose-300 hover:text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <LogOut size={14} />
                  Clock out
                </button>
              </div>

              <div className="border-t border-neutral-200 pt-4 grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <span className="block font-semibold text-neutral-500">Last action</span>
                  <span className="font-semibold text-neutral-700 flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-neutral-500" />
                    {formatTime(clockState.lastEvent?.timestamp || clockState.lastEvent?.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="block font-semibold text-neutral-500">Network</span>
                  <span className="font-semibold text-neutral-700 flex items-center gap-1 mt-0.5">
                    <Wifi size={11} className="text-neutral-500" />
                    Remote
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* KPI tiles (HR operators) */}
          {showKpiRow && (
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <KpiTile label="Employees" value={kpi.employeeCount} icon={Users} visible={can('VIEW_ALL_EMPLOYEES')} />
              <KpiTile label="Open positions" value={kpi.openPositions} icon={Briefcase} visible={can('MANAGE_EMPLOYEES')} />
              <KpiTile label="Candidates" value={kpi.candidatesInPipeline} icon={Search} visible={can('MANAGE_EMPLOYEES')} />
              <KpiTile label="Pending leave" value={kpi.pendingLeaveRequests} icon={CalendarCheck} visible={can('MANAGE_LEAVE')} href="/hr/leave-management?tab=approvals" />
              <KpiTile label="Pending regularizations" value={kpi.pendingRegularizations} icon={Clock} visible={can('MANAGE_ATTENDANCE')} href="/hr/attendance" />
              <KpiTile label="Today's clock-ins" value={kpi.todayClockIns} icon={TrendingUp} visible={can('VIEW_ATTENDANCE')} />
            </div>
          )}
        </div>

        {showApprovals && (kpi.pendingLeaveRequests > 0 || kpi.pendingRegularizations > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-amber-900 font-medium">
              {kpi.pendingLeaveRequests > 0 && `${kpi.pendingLeaveRequests} leave request(s) pending. `}
              {kpi.pendingRegularizations > 0 && `${kpi.pendingRegularizations} regularization(s) pending.`}
            </p>
            <div className="flex gap-2">
              {kpi.pendingLeaveRequests > 0 && can('MANAGE_LEAVE') && (
                <Link href="/hr/leave-management?tab=approvals" className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl">
                  Review leave
                </Link>
              )}
              {kpi.pendingRegularizations > 0 && can('MANAGE_ATTENDANCE') && (
                <Link href="/hr/attendance" className="px-4 py-2 bg-white border border-neutral-200 text-xs font-semibold rounded-xl text-neutral-700">
                  Review attendance
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Quick Links */}
        {allowedLinks.length > 0 && (
          <div className="ui-panel p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Quick access</h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">Jump into any HR module you have access to.</p>
              </div>
              <span className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] font-semibold text-neutral-600">
                {allowedLinks.length} modules available
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allowedLinks.map(({ label, path, icon: Icon }) => (
                <Link
                  key={path}
                  href={path}
                  className="group flex items-center gap-3 px-4 py-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-200 rounded-lg transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-neutral-200 group-hover:border-neutral-400 flex items-center justify-center transition-all">
                    <Icon size={14} className="text-neutral-600 group-hover:text-neutral-700" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-700 group-hover:text-neutral-900">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for users with no access beyond clock-in */}
        {allowedLinks.length === 0 && (
          <div className="ui-panel p-10 text-center">
            <MapPin size={28} className="text-neutral-700 mx-auto opacity-70" />
            <p className="text-xs font-semibold text-neutral-800 mt-3">No additional modules available</p>
            <p className="text-[10px] text-neutral-500 mt-1">You can clock in and out from the widget above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const KpiTile = ({ label, value, icon: Icon, visible, href }) => {
  if (!visible) return null;
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold text-neutral-500 tracking-widest">{label}</span>
        <div className="w-7 h-7 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center">
          <Icon size={12} className="text-neutral-700" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-neutral-900">{value === null ? '—' : value}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="ui-panel p-5 space-y-3 hover:border-neutral-200 transition block">
        {inner}
      </Link>
    );
  }
  return <div className="ui-panel p-5 space-y-3">{inner}</div>;
};
