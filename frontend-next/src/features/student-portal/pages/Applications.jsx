'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, FileText, CreditCard, Clock } from 'lucide-react';
import { getMyStudent, listMyApplications, getProcessStages, getApplicationReadiness } from '@/services/studentCrmApi';
import { formatDate } from '@/features/student-crm/components/ApplicationParts';
import { getStageLabel } from '@/features/student-crm/constants';
import StudentWorkflowGuide, { resolveStudentWorkflow } from '../components/StudentWorkflowGuide';
import StudentOverallJourney from '../components/StudentOverallJourney';
import { StudentPageHeader } from '../layout/StudentPortalLayoutContext';
import { sp, StudentPortalPage, StudentPortalPanel } from '../student-portal-ui';

const docProgress = (app) => {
  const docs = app.documents || [];
  const required = docs.filter((d) => d.required);
  const done = required.filter((d) => ['UPLOADED', 'VERIFIED'].includes(d.status)).length;
  const rejected = docs.filter((d) => d.status === 'REJECTED').length;
  return { required: required.length, done, rejected };
};

export default function ApplicationsPage() {
  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);
  const [readinessMap, setReadinessMap] = useState({});
  const [processStages, setProcessStages] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <StudentPortalPage>
        <p className={sp.body}>Loading application…</p>
      </StudentPortalPage>
    );
  }

  return (
    <StudentPortalPage>
      <StudentPageHeader
        title="Applications"
        description="Upload documents, pay fees, then your counsellor handles university submission."
      />

      {primaryApp && primaryWorkflow?.nextAction && (
        <StudentPortalPanel className={`${sp.panelPad} border-l-[3px] border-l-neutral-900`}>
          <p className={sp.sectionEyebrow}>What to do next</p>
          <p className="text-base font-semibold tracking-tight text-neutral-900 mt-2">
            {primaryWorkflow.nextAction.title}
          </p>
          <p className={`${sp.body} mt-1.5`}>{primaryWorkflow.nextAction.detail}</p>
          <Link href={`/applicant/applications/${primaryApp.id}`} className={`${sp.btnPrimary} mt-5`}>
            Continue application <ChevronRight size={14} />
          </Link>
        </StudentPortalPanel>
      )}

      {primaryApp && <StudentWorkflowGuide app={primaryApp} readiness={primaryReadiness} />}

      <StudentOverallJourney profile={profile} stageList={stageList} />

      <section className="space-y-4">
        <div>
          <p className={sp.sectionEyebrow}>Your universities</p>
          <h2 className={`${sp.sectionTitle} mt-1`}>Application list</h2>
        </div>

        {apps.length === 0 ? (
          <div className={sp.empty}>No applications linked yet. Your counsellor will add these.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {apps.map((a) => {
              const readiness = readinessMap[a.id];
              const { nextAction } = resolveStudentWorkflow(a, readiness);
              const { required, done, rejected } = docProgress(a);
              const overdue = a.deadline && new Date(a.deadline) < new Date();
              const feesPaid = readiness?.feesPaid;

              return (
                <StudentPortalPanel
                  key={a.id}
                  className={`${sp.panelPad} flex flex-col gap-4 transition hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={sp.sectionEyebrow}>{a.applicationCode}</p>
                      <h3 className="text-base font-semibold tracking-tight text-neutral-900 mt-1">{a.university}</h3>
                      <p className={`${sp.body} mt-1`}>{a.course}</p>
                      <p className="text-xs text-neutral-400 mt-1">{a.country}</p>
                    </div>
                    <span className={sp.badge}>{getStageLabel(a.stage)}</span>
                  </div>

                  <StudentWorkflowGuide app={a} readiness={readiness} compact />

                  <div className="flex flex-wrap gap-2">
                    <span className={sp.badge}>
                      <FileText size={12} className="mr-1 text-neutral-400" />
                      {required > 0 ? `${done}/${required} docs` : 'No checklist'}
                      {rejected > 0 && <span className="text-rose-600 ml-1">· {rejected} rejected</span>}
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
                    <p className="text-xs leading-relaxed text-neutral-500 border-t border-neutral-100 pt-3">
                      <span className="font-medium text-neutral-700">Next · </span>
                      {nextAction.title}
                    </p>
                  )}

                  <Link href={`/applicant/applications/${a.id}`} className={`${sp.btnPrimary} mt-auto w-full`}>
                    Open application <ChevronRight size={14} />
                  </Link>
                </StudentPortalPanel>
              );
            })}
          </div>
        )}
      </section>
    </StudentPortalPage>
  );
}
