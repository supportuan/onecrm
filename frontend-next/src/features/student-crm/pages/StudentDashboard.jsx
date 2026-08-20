'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ClipboardList,
  GraduationCap,
  Loader2,
  PauseCircle,
  Plane,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Timer,
  Users,
} from 'lucide-react';
import { getStatistics, listApplications, listStudents } from '@/services/studentCrmApi';
import {
  buildApplicationPipeline,
  countForStage,
  getStageLabel,
  stageBadgeClass,
} from '@/features/student-crm/constants';

const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN').format(Number(value || 0));

const unwrapList = (res) => {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export default function StudentDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, studentsRes, appsRes] = await Promise.all([
        getStatistics(),
        listStudents({ limit: 8 }),
        listApplications({ limit: 8 }),
      ]);
      setStats(statsRes?.data || statsRes || null);
      setStudents(unwrapList(studentsRes).slice(0, 8));
      setApplications(unwrapList(appsRes).slice(0, 8));
    } catch (err) {
      console.error(err);
      setError('Could not load the student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const dashboard = useMemo(() => {
    const byStage = Array.isArray(stats?.applicationsByStage) ? stats.applicationsByStage : [];
    const pipeline = buildApplicationPipeline(byStage);
    const totalApplications = pipeline.reduce((sum, row) => sum + Number(row.count || 0), 0);
    return {
      totalStudents: Number(stats?.totalStudents || 0),
      enrolled: Number(stats?.enrolled || 0),
      totalApplications,
      visaProcess: countForStage(byStage, 'VISA_PROCESS'),
      documentsPending: countForStage(byStage, 'DOCUMENTS_PENDING'),
      onHold: countForStage(byStage, 'ON_HOLD'),
      deferred: countForStage(byStage, 'DEFERRED'),
      visaGranted: countForStage(byStage, 'VISA_GRANTED'),
      visaRefused: countForStage(byStage, 'VISA_REFUSED'),
      pipeline,
    };
  }, [stats]);

  return (
    <div className="ui-container space-y-6">
      <div className="app-glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
        <p className="text-sm font-medium text-neutral-500">
          Live counts from students and applications
        </p>
        <button
          type="button"
          onClick={fetchDashboard}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-sm transition active:scale-95"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Students"
          value={formatNumber(dashboard.totalStudents)}
          trend="Active student records"
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-sky-50 text-sky-600"
          onClick={() => router.push('/student-crm/student-management')}
        />
        <KpiCard
          title="Enrolled"
          value={formatNumber(dashboard.enrolled)}
          trend="Students marked enrolled"
          icon={<GraduationCap className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
          onClick={() => router.push('/student-crm/applications?stage=ENROLLED')}
        />
        <KpiCard
          title="Applications"
          value={formatNumber(dashboard.totalApplications)}
          trend="All application files"
          icon={<ClipboardList className="h-5 w-5" />}
          iconClass="bg-indigo-50 text-indigo-600"
          onClick={() => router.push('/student-crm/applications')}
        />
        <KpiCard
          title="Visa in process"
          value={formatNumber(dashboard.visaProcess)}
          trend={`${formatNumber(dashboard.documentsPending)} waiting on documents`}
          icon={<Plane className="h-5 w-5" />}
          iconClass="bg-amber-50 text-amber-600"
          onClick={() => router.push('/student-crm/applications?stage=VISA_PROCESS')}
        />
        <KpiCard
          title="On hold"
          value={formatNumber(dashboard.onHold)}
          trend="Paused application files"
          icon={<PauseCircle className="h-5 w-5" />}
          iconClass="bg-slate-100 text-slate-600"
          onClick={() => router.push('/student-crm/applications?stage=ON_HOLD')}
        />
        <KpiCard
          title="Deferred"
          value={formatNumber(dashboard.deferred)}
          trend="Deferred to a later intake"
          icon={<Timer className="h-5 w-5" />}
          iconClass="bg-violet-50 text-violet-600"
          onClick={() => router.push('/student-crm/applications?stage=DEFERRED')}
        />
        <KpiCard
          title="Visa granted"
          value={formatNumber(dashboard.visaGranted)}
          trend="Visa approved applications"
          icon={<ShieldCheck className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
          onClick={() => router.push('/student-crm/applications?stage=VISA_GRANTED')}
        />
        <KpiCard
          title="Visa refused"
          value={formatNumber(dashboard.visaRefused)}
          trend="Visa refused applications"
          icon={<ShieldX className="h-5 w-5" />}
          iconClass="bg-rose-50 text-rose-600"
          onClick={() => router.push('/student-crm/applications?stage=VISA_REFUSED')}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <Panel title="Application pipeline" subtitle="Counts by current stage" height="min-h-[420px]">
          {dashboard.pipeline.every((row) => row.count === 0) ? (
            <EmptyText text="No applications in the pipeline yet." />
          ) : (
            dashboard.pipeline.map((row) => (
              <JourneyBar
                key={row.key}
                label={row.label}
                value={row.count}
                total={dashboard.totalApplications}
                onClick={() => router.push(`/student-crm/applications?stage=${row.key}`)}
              />
            ))
          )}
        </Panel>

        <div className="app-glass-card flex min-h-[420px] flex-col justify-between rounded-2xl p-6">
          <div>
            <h2 className="text-[17px] font-extrabold text-brand">Quick actions</h2>
            <p className="mt-1 text-[12px] font-medium text-neutral-500">
              Jump into day-to-day Student Hub work
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <QuickButton
                title="Students"
                icon={<Users className="mb-1.5 h-5 w-5" />}
                onClick={() => router.push('/student-crm/student-management')}
              />
              <QuickButton
                title="Applications"
                icon={<ClipboardList className="mb-1.5 h-5 w-5" />}
                onClick={() => router.push('/student-crm/applications')}
              />
              <QuickButton
                title="Visa"
                icon={<Plane className="mb-1.5 h-5 w-5" />}
                onClick={() => router.push('/student-crm/visa-management')}
              />
              <QuickButton
                title="Settings"
                icon={<GraduationCap className="mb-1.5 h-5 w-5" />}
                onClick={() => router.push('/student-crm/settings')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recent students" subtitle="Latest student records" height="h-[420px]">
          {students.length === 0 ? (
            <EmptyText text="No students yet." />
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => router.push(`/student-crm/student-management?student=${student.id}`)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-left transition hover:border-brand/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-brand">{student.fullName}</p>
                    <p className="truncate text-xs font-semibold text-neutral-500">
                      {student.email || student.preferredCountry || 'No contact'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-neutral-500">
                    {student.isEnrolled ? 'Enrolled' : student.status || 'Active'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent applications" subtitle="Newest files in the tracker" height="h-[420px]">
          {applications.length === 0 ? (
            <EmptyText text="No applications yet." />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => router.push(`/student-crm/applications/${app.id}`)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-left transition hover:border-brand/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-brand">
                      {app.student?.fullName || app.university || `Application #${app.id}`}
                    </p>
                    <p className="truncate text-xs font-semibold text-neutral-500">
                      {[app.university, app.course, app.country].filter(Boolean).join(' · ') || app.applicationCode}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${stageBadgeClass(app.stage)}`}>
                    {getStageLabel(app.stage)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function KpiCard({ title, value, trend, icon, iconClass = 'bg-brand-soft text-brand', onClick }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`app-glass-card group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:border-brand/40' : ''
      }`}
    >
      <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-neutral-50 opacity-80 transition-transform duration-300 group-hover:scale-110" />
      <div className="relative flex items-center justify-between">
        <span className="text-[13px] font-bold tracking-normal text-neutral-500">{title}</span>
        <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
          {icon}
        </div>
      </div>
      <div className="relative mt-4">
        <h3 className="text-[28px] font-extrabold tracking-tight text-brand">{value}</h3>
        <p className="mt-3 text-[13px] font-medium text-[var(--ui-text-muted)]">{trend}</p>
      </div>
    </Wrapper>
  );
}

function Panel({ title, subtitle, children, height = 'h-auto' }) {
  return (
    <div className={`app-glass-card flex flex-col overflow-hidden rounded-2xl ${height}`}>
      <div className="border-b border-neutral-100 px-6 py-5">
        <h2 className="text-[17px] font-extrabold text-brand">{title}</h2>
        {subtitle ? <p className="mt-1 text-[12px] font-medium text-neutral-500">{subtitle}</p> : null}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">{children}</div>
    </div>
  );
}

function JourneyBar({ label, value, total, onClick }) {
  const pct = total > 0 ? Math.round((Number(value || 0) / total) * 100) : 0;
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper type={onClick ? 'button' : undefined} onClick={onClick} className={`w-full text-left ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[12px] font-bold">
        <span className="text-neutral-600">{label}</span>
        <span className="text-brand">{formatNumber(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </Wrapper>
  );
}

function QuickButton({ title, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-3 py-4 text-[12px] font-bold text-[var(--ui-text-secondary)] transition hover:border-brand/60 hover:bg-brand-soft hover:text-brand"
    >
      {icon}
      {title}
    </button>
  );
}

function EmptyText({ text }) {
  return <p className="text-sm font-medium text-neutral-500">{text}</p>;
}
