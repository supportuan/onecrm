'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Briefcase, Calendar, FileText, ClipboardList } from 'lucide-react';
import JobPostings from './JobPostings';
import InterviewScheduling from './InterviewScheduling';
import OfferLetters from './OfferLetters';
import OnboardingChecklist from './OnboardingChecklist';

const TABS = [
  { key: 'pipeline', label: 'Jobs & pipeline', icon: Briefcase, component: JobPostings },
  { key: 'interviews', label: 'Interviews', icon: Calendar, component: InterviewScheduling },
  { key: 'offers', label: 'Offer letters', icon: FileText, component: OfferLetters },
  { key: 'onboarding', label: 'Onboarding', icon: ClipboardList, component: OnboardingChecklist },
];

export default function RecruitmentPipeline() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'pipeline';
  const active = TABS.some((t) => t.key === tabParam) ? tabParam : 'pipeline';
  const Active = TABS.find((t) => t.key === active)?.component || JobPostings;

  const setTab = (key) => {
    router.push(`/hr/recruitment-tracker?tab=${key}`);
  };

  return (
    <div className="ui-page">
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="px-6 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 leading-none">HR · talent</p>
            <h1 className="text-lg font-semibold text-neutral-900 mt-1">Recruitment</h1>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              jobs, candidates, interviews, offers, and onboarding in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold transition-all ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
                  }`}
                >
                  <Icon size={12} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <Active />
    </div>
  );
}
