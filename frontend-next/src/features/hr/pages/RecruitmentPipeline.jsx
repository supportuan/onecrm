'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Briefcase, Calendar, FileText, ClipboardList } from 'lucide-react';
import JobPostings from './JobPostings';
import InterviewScheduling from './InterviewScheduling';
import OfferLetters from './OfferLetters';
import OnboardingChecklist from './OnboardingChecklist';

const TABS = [
  {
    key: 'pipeline',
    label: 'Jobs & pipeline',
    short: 'Pipeline',
    description: 'Postings, applicants, and stage progression.',
    icon: Briefcase,
    component: JobPostings,
  },
  {
    key: 'interviews',
    label: 'Interviews',
    short: 'Interviews',
    description: 'Schedules and feedback for candidate conversations.',
    icon: Calendar,
    component: InterviewScheduling,
  },
  {
    key: 'offers',
    label: 'Offer letters',
    short: 'Offers',
    description: 'Draft, send, and track offer responses.',
    icon: FileText,
    component: OfferLetters,
  },
  {
    key: 'onboarding',
    label: 'Onboarding',
    short: 'Onboarding',
    description: 'Checklists for new joiners getting up to speed.',
    icon: ClipboardList,
    component: OnboardingChecklist,
  },
];

export default function RecruitmentPipeline() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'pipeline';
  const active = TABS.some((t) => t.key === tabParam) ? tabParam : 'pipeline';
  const activeTab = TABS.find((t) => t.key === active) || TABS[0];
  const Active = activeTab.component;

  const setTab = (key) => {
    router.push(`/hr/recruitment-tracker?tab=${key}`);
  };

  return (
    <div className="ui-page max-w-full min-h-full">
      <div className="mb-6">
        <h1 className="ui-text-h1 text-brand">Recruitment tracker</h1>
        <p className="ui-text-body mt-1">
          Hire end-to-end — postings, pipeline, interviews, offers, and onboarding.
        </p>
      </div>

      <div className="sticky top-0 z-20 -mx-1 mb-6 rounded-2xl border border-[var(--ui-border)] bg-white/90 p-1.5 shadow-sm backdrop-blur-md">
        <nav
          role="tablist"
          aria-label="Recruitment sections"
          className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <Icon size={15} className="shrink-0 opacity-90" />
                <span className="hidden sm:inline truncate">{t.label}</span>
                <span className="sm:hidden">{t.short}</span>
              </button>
            );
          })}
        </nav>
        <p className="ui-text-meta px-3 pb-2 pt-2.5">{activeTab.description}</p>
      </div>

      <Active />
    </div>
  );
}
