'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { useAuthStore } from '../lib/stores/authStore';
import { hasPermission } from '../lib/auth/rbac';
import {
  submitRemoteClockIn,
  getAttendanceEvents,
  getJobPostings,
  getCandidates,
  getLeavePlans,
} from '../services/hrApi';

const QUICK_LINKS = [
  { label: 'recruitment tracker', path: '/hr/recruitment-tracker', icon: Search, perm: 'MANAGE_EMPLOYEES' },
  { label: 'employee directory', path: '/hr/employee-directory', icon: Users, perm: 'VIEW_ALL_EMPLOYEES' },
  { label: 'attendance', path: '/hr/attendance', icon: Clock, perm: 'VIEW_ATTENDANCE' },
  { label: 'leave management', path: '/hr/leave-management', icon: CalendarCheck, perm: 'VIEW_LEAVE' },
  { label: 'performance', path: '/hr/performance-reviews', icon: Star, perm: 'VIEW_REPORTS' },
  { label: 'payroll', path: '/hr/payroll', icon: DollarSign, perm: 'MANAGE_PAYROLL' },
];

const HR = () => {
  const { user } = useAuthStore();
  const role = user?.role;

  const can = (perm) => hasPermission(role, perm);

  const [clockState, setClockState] = useState({ status: 'unknown', lastEvent: null });
  const [clockBusy, setClockBusy] = useState(false);
  const [toast, setToast] = useState({ kind: '', msg: '' });

  const [kpi, setKpi] = useState({
    openPositions: null,
    candidates: null,
    leavePlans: null,
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

  // Load KPI counts for HR operators
  useEffect(() => {
    if (!can('VIEW_REPORTS') && !can('MANAGE_EMPLOYEES')) return;
    let mounted = true;
    (async () => {
      try {
        const [jobs, cands, plans] = await Promise.all([
          getJobPostings().catch(() => ({ success: false, data: [] })),
          getCandidates().catch(() => ({ success: false, data: [] })),
          getLeavePlans().catch(() => ({ success: false, data: [] })),
        ]);
        if (!mounted) return;
        setKpi((k) => ({
          ...k,
          openPositions: Array.isArray(jobs.data) ? jobs.data.filter((j) => (j.status || '').toUpperCase() === 'OPEN').length : 0,
          candidates: Array.isArray(cands.data) ? cands.data.length : 0,
          leavePlans: Array.isArray(plans.data) ? plans.data.length : 0,
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
        showToast('ok', isCheckOut ? 'clocked out successfully' : 'clocked in successfully');
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

  const allowedLinks = QUICK_LINKS.filter((l) => can(l.perm));

  const showKpiRow = can('VIEW_REPORTS') || can('MANAGE_EMPLOYEES') || can('VIEW_ATTENDANCE');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      {toast.msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold text-white ${
            toast.kind === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">hr dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              welcome back, {user?.name || 'team member'} — manage attendance, recruitment, and people operations.
            </p>
          </div>
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600 self-start md:self-auto">
            role · {(role || 'unknown').toLowerCase()}
          </span>
        </div>

        {/* Top row: Clock-in widget + (optional) primary KPI tiles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Remote Clock-In Widget */}
          {can('VIEW_ATTENDANCE') && (
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-center justify-center">
                    <Fingerprint size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 leading-none">remote attendance</p>
                    <h3 className="text-sm font-semibold text-slate-900 mt-1">clock in / out</h3>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-lg border ${
                    clockState.status === 'clocked_in'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : clockState.status === 'clocked_out'
                      ? 'bg-slate-50 border-slate-200 text-slate-600'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  {clockState.status === 'clocked_in' ? 'on the clock' : clockState.status === 'clocked_out' ? 'clocked out' : 'not yet today'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleClock(false)}
                  disabled={clockBusy || clockState.status === 'clocked_in'}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <LogIn size={14} />
                  clock in
                </button>
                <button
                  onClick={() => handleClock(true)}
                  disabled={clockBusy || clockState.status !== 'clocked_in'}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <LogOut size={14} />
                  clock out
                </button>
              </div>

              <div className="border-t border-slate-150 pt-4 grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <span className="block font-semibold text-slate-400">last action</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-slate-400" />
                    {formatTime(clockState.lastEvent?.timestamp || clockState.lastEvent?.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-400">network</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                    <Wifi size={11} className="text-slate-400" />
                    remote
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* KPI tiles (HR operators) */}
          {showKpiRow && (
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiTile
                label="open positions"
                value={kpi.openPositions}
                icon={Briefcase}
                visible={can('MANAGE_EMPLOYEES') || can('VIEW_REPORTS')}
              />
              <KpiTile
                label="candidates in pipeline"
                value={kpi.candidates}
                icon={Users}
                visible={can('MANAGE_EMPLOYEES') || can('VIEW_REPORTS')}
              />
              <KpiTile
                label="leave plans"
                value={kpi.leavePlans}
                icon={CalendarCheck}
                visible={can('VIEW_LEAVE')}
              />
              <KpiTile
                label="today's clock-ins"
                value={kpi.todayClockIns}
                icon={TrendingUp}
                visible={can('VIEW_ATTENDANCE')}
              />
            </div>
          )}
        </div>

        {/* Quick Links */}
        {allowedLinks.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">quick access</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">jump into any hr module you have access to.</p>
              </div>
              <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600">
                {allowedLinks.length} modules available
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allowedLinks.map(({ label, path, icon: Icon }) => (
                <Link
                  key={path}
                  href={path}
                  className="group flex items-center gap-3 px-4 py-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-150 hover:border-indigo-200 rounded-2xl transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 group-hover:border-indigo-300 flex items-center justify-center transition-all">
                    <Icon size={14} className="text-slate-600 group-hover:text-indigo-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for users with no access beyond clock-in */}
        {allowedLinks.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm text-center">
            <MapPin size={28} className="text-indigo-600 mx-auto opacity-70" />
            <p className="text-xs font-semibold text-slate-800 mt-3">no additional modules available</p>
            <p className="text-[10px] text-slate-500 mt-1">you can clock in and out from the widget above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const KpiTile = ({ label, value, icon: Icon, visible }) => {
  if (!visible) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold text-slate-450 uppercase tracking-widest">{label}</span>
        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center">
          <Icon size={12} className="text-indigo-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value === null ? '—' : value}</p>
    </div>
  );
};

export default HR;
