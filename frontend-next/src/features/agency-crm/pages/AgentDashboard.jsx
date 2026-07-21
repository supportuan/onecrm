'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  ClipboardList,
  GraduationCap,
  Percent,
  FileText,
  ArrowRight,
  Link2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import {
  getStatistics,
  getMyPartner,
  listAnnouncements,
  listCommissions,
  listAgencyApplications,
} from '@/services/agencyCrmApi';
import {
  isAgencyPartnerRole,
  nextOnboardingAction,
  ONBOARDING_STAGE_ORDER,
  stageIndex,
  AGENT_STUDENTS_PATH,
  AGENT_ONBOARDING_PATH,
  AGENT_REFERRAL_PATH,
  canShareReferralLink,
} from '../agentPortal';
import { useAuth } from '@/lib/auth/AuthContext';
import { getStageLabel, stageBadgeClass } from '@/features/student-crm/constants';
import { commissionStatusClass, COMMISSION_STATUS_LABELS, ONBOARDING_STAGE_LABELS } from '../constants';

export default function AgentDashboard() {
  const { user } = useAuth();
  const isAgent = isAgencyPartnerRole(user?.role);
  const [stats, setStats] = useState(null);
  const [partner, setPartner] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [apps, setApps] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, p, a, appsRes, c] = await Promise.all([
          getStatistics().catch(() => null),
          isAgent ? getMyPartner().catch(() => null) : Promise.resolve(null),
          listAnnouncements({ activeOnly: true }).catch(() => null),
          listAgencyApplications({ page: 1, limit: 5 }).catch(() => null),
          listCommissions({ page: 1, limit: 5 }).catch(() => null),
        ]);
        setStats(s?.data || null);
        setPartner(p?.data || null);
        setAnnouncements(Array.isArray(a?.data) ? a.data.slice(0, 4) : []);
        setApps(appsRes?.data?.items || []);
        setCommissions(c?.data?.items || []);
      } finally {
        setLoading(false);
      }
    })().catch(() => setLoading(false));
  }, [isAgent]);

  const unread = announcements.filter((x) => !x.readAt).length;
  const stage = partner?.onboardingStage;
  const needsOnboarding = Boolean(stage && stage !== 'ACTIVE');
  const nextAction = nextOnboardingAction(stage);
  const currentIdx = stageIndex(stage);
  const canShare = canShareReferralLink(partner);

  return (
    <div className="ui-container space-y-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="ui-text-h2">{isAgent ? 'Home' : 'Agency dashboard'}</h1>
          <p className="ui-text-body mt-1">
            {partner
              ? `${partner.agencyName} · ${partner.agencyCode}`
              : 'Overview of referrals, applications, and commissions'}
          </p>
        </div>
        {isAgent && canShare && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={AGENT_REFERRAL_PATH}
              className="ui-btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Link2 className="h-4 w-4" />
              Referral link
            </Link>
            <Link
              href={AGENT_STUDENTS_PATH}
              className="ui-btn-primary inline-flex items-center gap-2 text-sm"
            >
              My referrals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {needsOnboarding && nextAction && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Step {Math.max(1, currentIdx + 1)} of {ONBOARDING_STAGE_ORDER.length} · Setup
              </p>
              <h2 className="mt-1 text-lg font-semibold text-amber-950">{nextAction.title}</h2>
              <p className="mt-1 text-sm text-amber-900/80">{nextAction.detail}</p>
            </div>
            <Link href={nextAction.href} className="ui-btn-primary inline-flex items-center gap-2 text-sm shrink-0">
              {nextAction.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ol className="grid gap-2 sm:grid-cols-3">
            {[
              { key: 'REGISTERED', label: 'Upload documents' },
              { key: 'DOCS_SUBMITTED', label: 'Sign agreement' },
              { key: 'AGREEMENT_SIGNED', label: 'Admin activates you' },
            ].map((step) => {
              const stepIdx = stageIndex(step.key);
              const done = currentIdx > stepIdx || stage === 'ACTIVE';
              const current =
                (step.key === 'REGISTERED' && stage === 'REGISTERED') ||
                (step.key === 'DOCS_SUBMITTED' && stage === 'DOCS_SUBMITTED') ||
                (step.key === 'AGREEMENT_SIGNED' &&
                  (stage === 'AGREEMENT_SIGNED' || stage === 'VERIFIED' || stage === 'APPROVED'));
              return (
                <li
                  key={step.key}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    done
                      ? 'border-emerald-200 bg-white text-emerald-800'
                      : current
                        ? 'border-amber-300 bg-white text-amber-950 font-medium'
                        : 'border-amber-100/80 bg-amber-50/50 text-amber-800/60'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className={`h-4 w-4 shrink-0 ${current ? 'text-amber-600' : 'text-amber-300'}`} />
                  )}
                  {step.label}
                </li>
              );
            })}
          </ol>

          <p className="text-xs text-amber-900/70">
            Current status: {ONBOARDING_STAGE_LABELS[stage] || stage}. You can still explore the portal, but
            full activation needs setup complete.
          </p>
        </section>
      )}

      {isAgent && (
        <section className="grid sm:grid-cols-3 gap-3">
          <Link
            href={AGENT_ONBOARDING_PATH}
            className="ui-panel p-4 hover:bg-neutral-50 transition space-y-1"
          >
            <p className="text-sm font-semibold text-brand">1. Complete setup</p>
            <p className="text-xs text-neutral-500">Documents, agreement, activation</p>
          </Link>
          {canShare ? (
            <Link
              href={AGENT_REFERRAL_PATH}
              className="ui-panel p-4 hover:bg-neutral-50 transition space-y-1"
            >
              <p className="text-sm font-semibold text-brand">2. Share referral link</p>
              <p className="text-xs text-neutral-500">Students join under your code</p>
            </Link>
          ) : (
            <div className="ui-panel p-4 space-y-1 opacity-70">
              <p className="text-sm font-semibold text-neutral-700">2. Share referral link</p>
              <p className="text-xs text-neutral-500">
                Unlocks after your account is ACTIVE
              </p>
            </div>
          )}
          <Link
            href={AGENT_STUDENTS_PATH}
            className="ui-panel p-4 hover:bg-neutral-50 transition space-y-1"
          >
            <p className="text-sm font-semibold text-brand">3. Track my referrals</p>
            <p className="text-xs text-neutral-500">Leads, students, applications</p>
          </Link>
        </section>
      )}

      {loading ? (
        <p className="ui-text-meta">Loading dashboard…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Referrals', value: stats?.totalReferrals ?? 0, href: AGENT_STUDENTS_PATH, icon: ClipboardList },
              { label: 'Active students', value: stats?.activeStudents ?? 0, href: AGENT_STUDENTS_PATH, icon: GraduationCap },
              { label: 'Enrolled', value: stats?.enrolledStudents ?? 0, href: AGENT_STUDENTS_PATH, icon: FileText },
              {
                label: 'Commission paid',
                value: `${stats?.totalCommissionAmount != null ? Number(stats.totalCommissionAmount).toFixed(0) : 0}`,
                href: '/agency-crm/commission-management',
                icon: Percent,
              },
            ].map((card) => (
              <Link key={card.label} href={card.href} className="ui-panel p-4 hover:bg-neutral-50 transition">
                <div className="flex items-center justify-between">
                  <p className="ui-text-meta">{card.label}</p>
                  <card.icon className="h-4 w-4 text-neutral-400" />
                </div>
                <p className="text-xl font-semibold text-brand mt-1">{card.value}</p>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="ui-panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="ui-text-h3 flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Announcements
                  {unread > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand text-white">{unread}</span>
                  )}
                </h2>
                <Link href="/agency-crm/communications" className="text-xs text-brand hover:underline">
                  View all
                </Link>
              </div>
              {!announcements.length ? (
                <p className="ui-text-meta">No announcements yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--ui-border)]">
                  {announcements.map((a) => (
                    <li key={a.id} className="py-3">
                      <p className={`text-sm ${a.readAt ? 'text-neutral-700' : 'font-semibold text-neutral-900'}`}>
                        {a.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{a.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="ui-panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="ui-text-h3">Recent applications</h2>
                <Link href={AGENT_STUDENTS_PATH} className="text-xs text-brand hover:underline">
                  My students
                </Link>
              </div>
              {!apps.length ? (
                <p className="ui-text-meta">
                  No applications yet. Share your referral link after setup.
                </p>
              ) : (
                <ul className="space-y-2">
                  {apps.map((app) => (
                    <li key={app.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{app.university}</p>
                        <p className="text-xs text-neutral-500 truncate">
                          {app.student?.fullName || app.applicationCode}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded border ${stageBadgeClass(app.stage)}`}>
                        {getStageLabel(app.stage)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="ui-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="ui-text-h3">Recent commissions</h2>
              <Link href="/agency-crm/commission-management" className="text-xs text-brand hover:underline">
                View commissions
              </Link>
            </div>
            {!commissions.length ? (
              <p className="ui-text-meta">No commissions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-neutral-500 text-left">
                    <tr>
                      <th className="py-2 font-medium">Student</th>
                      <th className="py-2 font-medium">Amount</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id} className="border-t border-neutral-100">
                        <td className="py-2">{c.student?.fullName || '—'}</td>
                        <td className="py-2">
                          {c.currency} {Number(c.amount).toFixed(2)}
                        </td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${commissionStatusClass(c.status)}`}>
                            {COMMISSION_STATUS_LABELS[c.status] || c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
