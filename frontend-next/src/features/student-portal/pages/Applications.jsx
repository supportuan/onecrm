'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  FileText,
  CreditCard,
  Clock,
  Upload,
  UserRound,
  Mail,
  AlertCircle,
  Search,
} from 'lucide-react';
import { getMyStudent, listMyApplications, getProcessStages, getApplicationReadiness } from '@/services/studentCrmApi';
import { formatDate } from '@/features/student-crm/components/ApplicationParts';
import { getStageLabel } from '@/features/student-crm/constants';
import { STAGE_LABELS } from '../constants';
import StudentWorkflowGuide, { resolveStudentWorkflow } from '../components/StudentWorkflowGuide';
import StudentOverallJourney from '../components/StudentOverallJourney';
import { StudentPageHeader } from '../layout/StudentPortalLayoutContext';
import {
  sp,
  StudentPortalPage,
  StudentPortalPanel,
  ProgressBar,
  SkeletonBlock,
} from '../student-portal-ui';

const STAGE_FILTERS = [
  { value: 'all', label: 'All stages' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'DOCUMENTS_PENDING', label: 'Documents pending' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'OFFER_RECEIVED', label: 'Offer received' },
  { value: 'OFFER_ACCEPTED', label: 'Accepted' },
  { value: 'OFFER_REJECTED', label: 'Rejected' },
  { value: 'VISA_PROCESS', label: 'Visa' },
  { value: 'ENROLLED', label: 'Enrolled' },
];

const SORT_OPTIONS = [
  { value: 'updated', label: 'Last updated' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'university', label: 'University' },
  { value: 'status', label: 'Status' },
];

const docProgress = (app) => {
  const docs = app.documents || [];
  const required = docs.filter((d) => d.required);
  const done = required.filter((d) => ['UPLOADED', 'VERIFIED'].includes(d.status)).length;
  const rejected = docs.filter((d) => d.status === 'REJECTED').length;
  const pending = required.filter((d) => d.status === 'PENDING' || d.status === 'REJECTED');
  return { required: required.length, done, rejected, pending, pct: required.length ? Math.round((done / required.length) * 100) : 0 };
};

const workflowProgressPct = (app, readiness) => {
  const { steps } = resolveStudentWorkflow(app, readiness);
  const done = steps.filter((s) => s.status === 'done').length;
  const active = steps.some((s) => s.status === 'active') ? 0.5 : 0;
  return Math.round(((done + active) / steps.length) * 100);
};

const firstName = (fullName) => {
  if (!fullName) return 'there';
  return fullName.trim().split(/\s+/)[0];
};

export default function ApplicationsPage() {
  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);
  const [readinessMap, setReadinessMap] = useState({});
  const [processStages, setProcessStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([getMyStudent(), listMyApplications()]);
      const p = pRes?.data || null;
      const items = Array.isArray(aRes?.data) ? aRes.data : [];
      setProfile(p);
      setApps(items);

      const readinessEntries = await Promise.all(
        items.map(async (app) => {
          try {
            const res = await getApplicationReadiness(app.id);
            return [app.id, res?.data || null];
          } catch {
            return [app.id, null];
          }
        })
      );
      setReadinessMap(Object.fromEntries(readinessEntries));

      const country = p?.country?.name || p?.preferredCountry || items[0]?.country;
      if (country) {
        const stagesRes = await getProcessStages(country);
        setProcessStages(stagesRes?.data?.stages || []);
      } else {
        setProcessStages([]);
      }
    } catch {
      /* keep prior state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadData]);

  const stageList = processStages;
  const primaryApp = apps[0] || null;
  const primaryReadiness = primaryApp ? readinessMap[primaryApp.id] : null;
  const primaryWorkflow = primaryApp ? resolveStudentWorkflow(primaryApp, primaryReadiness) : null;

  const overallProgress = useMemo(() => {
    if (profile?.totalCheckList > 0) {
      return Math.round((profile.completedCheckList / profile.totalCheckList) * 100);
    }
    if (!apps.length) return 0;
    const vals = apps.map((a) => workflowProgressPct(a, readinessMap[a.id]));
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }, [apps, readinessMap, profile]);

  const pendingDocs = useMemo(() => {
    const rows = [];
    apps.forEach((app) => {
      const { pending } = docProgress(app);
      pending.forEach((d) => {
        rows.push({
          id: `${app.id}-${d.id}`,
          name: d.name,
          status: d.status,
          university: app.university,
          appId: app.id,
        });
      });
    });
    return rows.slice(0, 6);
  }, [apps]);

  const upcomingDeadlines = useMemo(() => {
    return apps
      .filter((a) => a.deadline)
      .map((a) => ({
        id: a.id,
        university: a.university,
        deadline: a.deadline,
        overdue: new Date(a.deadline) < new Date(),
        code: a.applicationCode,
      }))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);
  }, [apps]);

  const visaSummary = useMemo(() => {
    const withVisa = apps.find((a) => a.visaTracking || ['VISA_PROCESS', 'OFFER_ACCEPTED', 'ENROLLED'].includes(a.stage));
    if (!withVisa) return null;
    return {
      appId: withVisa.id,
      university: withVisa.university,
      status: withVisa.visaTracking?.status || withVisa.stage,
      appointment: withVisa.visaTracking?.appointmentDate,
    };
  }, [apps]);

  const counsellor = profile?.contact || primaryApp?.assignedTo || null;

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = apps.filter((a) => {
      if (stageFilter !== 'all' && a.stage !== stageFilter) return false;
      if (!q) return true;
      return [a.university, a.course, a.country, a.applicationCode, a.intake]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'university') return (a.university || '').localeCompare(b.university || '');
      if (sortBy === 'status') return (a.stage || '').localeCompare(b.stage || '');
      if (sortBy === 'deadline') {
        const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return ad - bd;
      }
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
    return list;
  }, [apps, search, stageFilter, sortBy]);

  if (loading) {
    return (
      <StudentPortalPage>
        <div className="space-y-4">
          <SkeletonBlock className="h-28" />
          <div className="grid gap-4 sm:grid-cols-3">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
          </div>
          <SkeletonBlock className="h-48" />
        </div>
      </StudentPortalPage>
    );
  }

  return (
    <StudentPortalPage>
      <StudentPageHeader
        title="Applications"
        description="Upload documents, pay fees, then your counsellor handles university submission."
      />

      {/* Welcome + overall progress */}
      <StudentPortalPanel className={`${sp.panelPad} space-y-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={sp.sectionEyebrow}>Welcome back</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-brand sm:text-2xl">
              Hi, {firstName(profile?.fullName)}
            </h2>
            <p className={`${sp.body} mt-1.5 w-full`}>
              Here is an overview of your study abroad journey
              {profile?.country?.name || profile?.preferredCountry
                ? ` for ${profile?.country?.name || profile?.preferredCountry}`
                : ''}
              .
            </p>
          </div>
          <div className="min-w-[160px] text-right">
            <p className="text-3xl font-semibold tracking-tight text-brand">{overallProgress}%</p>
            <p className="text-xs text-slate-400">Overall progress</p>
          </div>
        </div>
        <ProgressBar value={overallProgress} />
        {profile?.totalCheckList > 0 && (
          <p className="text-xs text-slate-400">
            {profile.completedCheckList} of {profile.totalCheckList} checklist tasks complete
            {profile.processStage
              ? ` · ${STAGE_LABELS[profile.processStage] || profile.processStage.replace(/_/g, ' ')}`
              : ''}
          </p>
        )}
      </StudentPortalPanel>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction
          href={primaryApp ? `/applicant/applications/${primaryApp.id}` : '/applicant/applications'}
          icon={Upload}
          label="Upload document"
          disabled={!primaryApp}
        />
        <QuickAction href="#applications-list" icon={FileText} label="View applications" />
        <QuickAction href="/applicant/payments" icon={CreditCard} label="Payments" />
        {counsellor?.email ? (
          <a
            href={`mailto:${counsellor.email}?subject=Student enquiry`}
            className={`${sp.panel} ${sp.panelPad} flex flex-col items-start gap-2 transition hover:border-brand/30 hover:shadow-sm`}
          >
            <Mail className="h-4 w-4 text-brand" strokeWidth={1.75} />
            <span className="text-sm font-medium text-brand">Contact counsellor</span>
            <span className="text-[11px] text-slate-400 truncate w-full">{counsellor.fullName}</span>
          </a>
        ) : (
          <QuickAction href="/applicant/profile/view" icon={UserRound} label="View profile" />
        )}
      </div>

      {/* Next task + pending docs + visa + deadlines */}
      <div className="grid gap-4 lg:grid-cols-2">
        {primaryApp && primaryWorkflow?.nextAction && (
          <StudentPortalPanel className={`${sp.panelPad} border-l-[3px] border-l-brand`}>
            <p className={sp.sectionEyebrow}>Next upcoming task</p>
            <p className="mt-2 text-base font-semibold tracking-tight text-brand">
              {primaryWorkflow.nextAction.title}
            </p>
            <p className={`${sp.body} mt-1.5`}>{primaryWorkflow.nextAction.detail}</p>
            <Link href={`/applicant/applications/${primaryApp.id}`} className={`${sp.btnPrimary} mt-5`}>
              Continue application <ChevronRight size={14} />
            </Link>
          </StudentPortalPanel>
        )}

        <StudentPortalPanel className={`${sp.panelPad} space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <p className={sp.sectionEyebrow}>Pending documents</p>
            {pendingDocs.length > 0 && (
              <span className={`${sp.badge} border-amber-200 bg-amber-50 text-amber-800`}>
                {pendingDocs.length} waiting
              </span>
            )}
          </div>
          {pendingDocs.length === 0 ? (
            <p className={`${sp.body} py-4`}>No pending uploads right now.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingDocs.map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand">{d.name}</p>
                    <p className="text-[11px] text-slate-400">{d.university}</p>
                  </div>
                  <Link
                    href={`/applicant/applications/${d.appId}`}
                    className="shrink-0 text-xs font-medium text-brand hover:underline"
                  >
                    {d.status === 'REJECTED' ? 'Replace' : 'Upload'}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </StudentPortalPanel>

        {visaSummary && (
          <StudentPortalPanel className={`${sp.panelPad} space-y-3`}>
            <p className={sp.sectionEyebrow}>Visa status</p>
            <p className="text-base font-semibold tracking-tight text-brand">{visaSummary.university}</p>
            <p className={sp.body}>
              {(visaSummary.status || '').replace(/_/g, ' ')}
              {visaSummary.appointment
                ? ` · Appointment ${formatDate(visaSummary.appointment)}`
                : ''}
            </p>
            <Link href={`/applicant/applications/${visaSummary.appId}`} className={`${sp.btnGhost} mt-1`}>
              View visa details
            </Link>
          </StudentPortalPanel>
        )}

        <StudentPortalPanel className={`${sp.panelPad} space-y-3`}>
          <p className={sp.sectionEyebrow}>Upcoming deadlines</p>
          {upcomingDeadlines.length === 0 ? (
            <p className={`${sp.body} py-4`}>No deadlines set on your applications.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingDeadlines.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/applicant/applications/${d.id}`}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition hover:border-brand/30 ${
                      d.overdue ? 'border-rose-200 bg-rose-50/60' : 'border-slate-100 bg-brand-soft/30'
                    }`}
                  >
                    <span className="min-w-0 truncate font-medium text-brand">{d.university}</span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 text-xs ${
                        d.overdue ? 'text-rose-700' : 'text-slate-500'
                      }`}
                    >
                      {d.overdue ? <AlertCircle size={12} /> : <Clock size={12} />}
                      {formatDate(d.deadline)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </StudentPortalPanel>
      </div>

      {primaryApp && <StudentWorkflowGuide app={primaryApp} readiness={primaryReadiness} />}

      <StudentOverallJourney profile={profile} stageList={stageList} />

      <section id="applications-list" className="scroll-mt-24 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={sp.sectionEyebrow}>Your universities</p>
            <h2 className={`${sp.sectionTitle} mt-1`}>Application list</h2>
          </div>
          <p className="text-xs text-slate-400">
            {filteredApps.length} of {apps.length} shown
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search university, course, country…"
              className={`${sp.input} pl-9`}
              aria-label="Search applications"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className={sp.select}
            aria-label="Filter by stage"
          >
            {STAGE_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={sp.select}
            aria-label="Sort applications"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
        </div>

        {apps.length === 0 ? (
          <div className={sp.empty}>No applications linked yet. Your counsellor will add these.</div>
        ) : filteredApps.length === 0 ? (
          <div className={sp.empty}>No applications match your search or filters.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredApps.map((a) => {
              const readiness = readinessMap[a.id];
              const { nextAction } = resolveStudentWorkflow(a, readiness);
              const { required, done, rejected, pct } = docProgress(a);
              const overdue = a.deadline && new Date(a.deadline) < new Date();
              const feesPaid = readiness?.feesPaid;
              const progress = workflowProgressPct(a, readiness);

              return (
                <StudentPortalPanel
                  key={a.id}
                  className={`${sp.panelPad} flex flex-col gap-4 transition hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={sp.sectionEyebrow}>{a.applicationCode}</p>
                      <h3 className="mt-1 text-base font-semibold tracking-tight text-brand">{a.university}</h3>
                      <p className={`${sp.body} mt-1`}>{a.course}</p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {[a.country, a.intake].filter(Boolean).join(' · ')}
                      </p>
                      {a.assignedTo?.fullName && (
                        <p className="mt-1 text-xs text-slate-400">Counsellor · {a.assignedTo.fullName}</p>
                      )}
                    </div>
                    <span className={sp.badge}>{getStageLabel(a.stage)}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Application progress</span>
                      <span className="font-medium text-brand">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} />
                  </div>

                  <StudentWorkflowGuide app={a} readiness={readiness} compact />

                  <div className="flex flex-wrap gap-2">
                    <span className={sp.badge}>
                      <FileText size={12} className="mr-1 text-neutral-400" />
                      {required > 0 ? `${done}/${required} docs (${pct}%)` : 'No checklist'}
                      {rejected > 0 && <span className="ml-1 text-rose-600">· {rejected} rejected</span>}
                    </span>
                    <span className={sp.badge}>
                      <CreditCard size={12} className="mr-1 text-neutral-400" />
                      {feesPaid ? 'Fee paid' : readiness?.canPay ? 'Payment due' : 'Fee pending'}
                    </span>
                    {a.deadline && (
                      <span className={`${sp.badge} ${overdue ? 'border-rose-200 bg-rose-50 text-rose-700' : ''}`}>
                        <Clock size={12} className="mr-1" />
                        {formatDate(a.deadline)}
                      </span>
                    )}
                  </div>

                  {nextAction && (
                    <p className="border-t border-neutral-100 pt-3 text-xs leading-relaxed text-neutral-500">
                      <span className="font-medium text-neutral-700">Next · </span>
                      {nextAction.title}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link href={`/applicant/applications/${a.id}`} className={`${sp.btnPrimary} flex-1`}>
                      Open application <ChevronRight size={14} />
                    </Link>
                    {a.offerLetter?.fileUrl && (
                      <a
                        href={a.offerLetter.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={sp.btnGhost}
                      >
                        Offer letter
                      </a>
                    )}
                  </div>
                </StudentPortalPanel>
              );
            })}
          </div>
        )}
      </section>
    </StudentPortalPage>
  );
}

function QuickAction({ href, icon: Icon, label, disabled }) {
  const className = `${sp.panel} ${sp.panelPad} flex flex-col items-start gap-2 transition ${
    disabled ? 'pointer-events-none opacity-50' : 'hover:border-brand/30 hover:shadow-sm'
  }`;
  if (disabled) {
    return (
      <div className={className} aria-disabled>
        <Icon className="h-4 w-4 text-brand" strokeWidth={1.75} />
        <span className="text-sm font-medium text-brand">{label}</span>
      </div>
    );
  }
  return (
    <Link href={href} className={className}>
      <Icon className="h-4 w-4 text-brand" strokeWidth={1.75} />
      <span className="text-sm font-medium text-brand">{label}</span>
    </Link>
  );
}
