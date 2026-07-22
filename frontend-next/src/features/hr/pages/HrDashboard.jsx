'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  IndianRupee,
  TrendingUp,
  MapPin,
  Wifi,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { hasPermission } from '@/lib/auth/rbac';
import {
  getMyAttendance,
  submitRemoteClockIn,
  getHrDashboardSummary,
} from '@/services/hrApi';

const QUICK_LINKS = [
  { label: 'Employee directory', path: '/hr/employee-directory', icon: Users, perm: 'VIEW_ALL_EMPLOYEES' },
  { label: 'My HR', path: '/hr/me', icon: Fingerprint, perm: 'VIEW_HR', selfServiceOnly: true },
  { label: 'Recruitment', path: '/hr/recruitment-tracker', icon: Search, perm: 'MANAGE_EMPLOYEES' },
  { label: 'Attendance', path: '/hr/attendance', icon: Clock, perm: 'VIEW_ATTENDANCE' },
  { label: 'Leave', path: '/hr/leave-management', icon: CalendarCheck, perm: 'VIEW_LEAVE' },
  { label: 'Performance', path: '/hr/performance-reviews', icon: Star, perm: 'VIEW_REPORTS' },
  { label: 'Payroll', path: '/hr/payroll', icon: IndianRupee, perm: 'MANAGE_PAYROLL' },
];

export default function HrDashboard() {
  const { user } = useAuth();
  const role = user?.role;

  const can = (perm) => hasPermission(role, perm);

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
    upcomingHolidays: [],
  });

  const showToast = (kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast({ kind: '', msg: '' }), 3000);
  };

  // Load today's clock state for the signed-in user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getMyAttendance();
        if (!mounted || !res?.success) return;
        const state = res.data?.clockState || 'not_clocked_in';
        const today = res.data?.today;
        setClockState({
          status: state,
          lastEvent: today?.checkIn ? { checkIn: today.checkIn, checkOut: today.checkOut } : null,
        });
      } catch (_) {
        // backend may be down; widget still works for clock-in attempts
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

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
          upcomingHolidays: Array.isArray(res.data.upcomingHolidays) ? res.data.upcomingHolidays : [],
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
        ip: '0.0.0.0',
        coordinates: '',
        isCheckOut,
      });
      if (res?.success) {
        const refresh = await getMyAttendance();
        const state = refresh?.data?.clockState || (isCheckOut ? 'clocked_out' : 'clocked_in');
        setClockState({
          status: state,
          lastEvent: refresh?.data?.today || res.data,
        });
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
    // My HR is for staff self-service; other links show for anyone with the permission.
    if (l.selfServiceOnly) return !operator;
    return true;
  });

  const showKpiRow = can('VIEW_HR');
  const showApprovals = can('MANAGE_LEAVE') || can('MANAGE_ATTENDANCE');

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  const displayName = user?.fullName || user?.name || '';

  return (
    <div className="text-brand">
      {toast.msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[13px] font-medium text-white ${
            toast.kind === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        {/* Compact greeting strip — replaces duplicate page title */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-[13px] text-neutral-500 tracking-tight">
            {greeting}
            {displayName ? (
              <>
                , <span className="font-semibold text-brand">{displayName}</span>
              </>
            ) : null}{' '}
            · here&apos;s what needs your attention today.
          </p>
          <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-full text-[10.5px] font-medium text-neutral-500 tracking-wide capitalize">
            {(role || 'unknown').toLowerCase().replace(/_/g, ' ')}
          </span>
        </div>

        {/* Top row: clock card + KPI grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {can('VIEW_ATTENDANCE') && (
            <div className="app-glass-card lg:col-span-1 rounded-2xl p-6 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10.5px] font-medium text-neutral-400 tracking-wide uppercase">Today</p>
                  <h3 className="text-[18px] font-semibold tracking-tight text-brand mt-1">
                    {clockState.status === 'clocked_in'
                      ? 'On the clock'
                      : clockState.status === 'clocked_out'
                      ? 'Clocked out'
                      : 'Not yet clocked in'}
                  </h3>
                  <p className="text-[12px] text-neutral-500 mt-1.5">
                    {clockState.lastEvent?.checkIn || clockState.lastEvent?.timestamp
                      ? `Last action · ${formatTime(clockState.lastEvent.checkIn || clockState.lastEvent.timestamp)}`
                      : 'No activity recorded yet.'}
                  </p>
                </div>
                <div className="app-gradient-icon">
                  <Fingerprint size={16} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleClock(false)}
                  disabled={clockBusy || clockState.status === 'clocked_in'}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-[12.5px] font-medium bg-brand text-white hover:bg-brand-hover disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed transition-all"
                >
                  <LogIn size={13} /> Clock in
                </button>
                <button
                  onClick={() => handleClock(true)}
                  disabled={clockBusy || clockState.status !== 'clocked_in'}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-[12.5px] font-medium bg-neutral-50 border border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <LogOut size={13} /> Clock out
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-neutral-500">
                  <Wifi size={12} /> Remote
                </span>
                <span className="flex items-center gap-1.5 text-neutral-500">
                  <Clock size={12} /> {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          )}

          {showKpiRow && (
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 gap-3.5 ${
                can('VIEW_ATTENDANCE') ? 'lg:col-span-2' : 'lg:col-span-3'
              }`}
            >
              <KpiTile label="Employees" value={kpi.employeeCount} icon={Users} visible={can('VIEW_ALL_EMPLOYEES')} />
              <KpiTile label="Open positions" value={kpi.openPositions} icon={Briefcase} visible={can('MANAGE_EMPLOYEES')} />
              <KpiTile label="Candidates" value={kpi.candidatesInPipeline} icon={Search} visible={can('MANAGE_EMPLOYEES')} />
              <KpiTile
                label="Pending leave"
                value={kpi.pendingLeaveRequests}
                icon={CalendarCheck}
                visible={can('MANAGE_LEAVE')}
                href="/hr/leave-management?tab=approvals"
                accent={kpi.pendingLeaveRequests > 0}
              />
              <KpiTile
                label="Regularizations"
                value={kpi.pendingRegularizations}
                icon={Clock}
                visible={can('MANAGE_ATTENDANCE')}
                href="/hr/attendance"
                accent={kpi.pendingRegularizations > 0}
              />
              <KpiTile label="Today's check-ins" value={kpi.todayClockIns} icon={TrendingUp} visible={can('VIEW_ATTENDANCE')} />
            </div>
          )}
        </div>

        {showApprovals && (kpi.pendingLeaveRequests > 0 || kpi.pendingRegularizations > 0) && (
          <div className="app-glass-card rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle size={15} className="text-amber-600" />
              </div>
              <p className="text-[13px] text-neutral-800 tracking-tight">
                {kpi.pendingLeaveRequests > 0 && `${kpi.pendingLeaveRequests} leave request${kpi.pendingLeaveRequests === 1 ? '' : 's'} pending. `}
                {kpi.pendingRegularizations > 0 && `${kpi.pendingRegularizations} regularization${kpi.pendingRegularizations === 1 ? '' : 's'} pending.`}
              </p>
            </div>
            <div className="flex gap-2">
              {kpi.pendingLeaveRequests > 0 && can('MANAGE_LEAVE') && (
                <Link
                  href="/hr/leave-management?tab=approvals"
                  className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white text-[12px] font-medium rounded-lg transition-all"
                >
                  Review leave
                </Link>
              )}
              {kpi.pendingRegularizations > 0 && can('MANAGE_ATTENDANCE') && (
                <Link
                  href="/hr/attendance"
                  className="px-3.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-[12px] font-medium rounded-lg text-neutral-700 transition-all"
                >
                  Review attendance
                </Link>
              )}
            </div>
          </div>
        )}

        {showKpiRow && kpi.upcomingHolidays.length > 0 && (
          <div className="app-glass-card relative rounded-2xl overflow-hidden">
            <div className="relative z-10 px-6 pt-6 pb-4 flex items-end justify-between gap-4 border-b border-neutral-100">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-brand">Upcoming holidays</h3>
                <p className="text-[12px] text-neutral-500 mt-1">Public and restricted holidays in the next 90 days.</p>
              </div>
              {can('VIEW_ATTENDANCE') && (
                <Link
                  href="/hr/leave-management?tab=holidays"
                  className="text-[12px] font-medium text-neutral-600 hover:text-brand"
                >
                  Manage calendar
                </Link>
              )}
            </div>
            <div className="relative z-10 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {kpi.upcomingHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-neutral-100 bg-neutral-50/50"
                >
                  <div className="app-gradient-icon">
                    <CalendarDays size={15} className="text-neutral-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-brand truncate">{holiday.name}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {new Date(`${holiday.date}T12:00:00`).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {holiday.is_restricted && (
                        <span className="ml-1.5 text-amber-600 font-medium">Restricted</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="holiday-illustration" aria-hidden="true">
              <CalendarDays className="holiday-illustration-calendar" strokeWidth={1.25} />
              <span className="holiday-illustration-leaf" />
            </div>
          </div>
        )}

        {/* Quick access */}
        {allowedLinks.length > 0 && (
          <div className="app-glass-card rounded-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex items-end justify-between gap-4 border-b border-neutral-100">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-brand">Quick access</h3>
                <p className="text-[12px] text-neutral-500 mt-1">Jump into any HR module you have access to.</p>
              </div>
              <span className="text-[11px] font-medium text-neutral-400 whitespace-nowrap">
                {allowedLinks.length} module{allowedLinks.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {allowedLinks.map(({ label, path, icon: Icon }) => (
                <Link
                  key={path}
                  href={path}
                  className="group flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-neutral-50 transition-all"
                >
                  <div className="app-gradient-icon transition-all group-hover:scale-105">
                    <Icon size={15} />
                  </div>
                  <span className="text-[13px] font-medium text-neutral-800 tracking-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {allowedLinks.length === 0 && (
          <div className="app-glass-card rounded-2xl p-12 text-center">
            <div className="app-gradient-icon mx-auto">
              <MapPin size={18} />
            </div>
            <p className="text-[13px] font-medium text-neutral-800 mt-4">No additional modules available</p>
            <p className="text-[12px] text-neutral-500 mt-1">You can clock in and out from the widget above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const KpiTile = ({ label, value, icon: Icon, visible, href, accent }) => {
  if (!visible) return null;
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-medium text-neutral-500 tracking-tight">{label}</span>
        <div className={`app-gradient-icon transition-all ${accent ? 'ring-2 ring-amber-300/70' : ''}`}>
          <Icon size={12} />
        </div>
      </div>
      <p className="text-[26px] font-semibold text-brand tracking-tight leading-none mt-2">
        {value === null ? '—' : value}
      </p>
    </>
  );
  const base = 'app-glass-card rounded-2xl px-5 py-4 transition-all';
  if (href) {
    return (
      <Link href={href} className={`${base} hover:border-neutral-300 hover:-translate-y-0.5 block`}>
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
};
