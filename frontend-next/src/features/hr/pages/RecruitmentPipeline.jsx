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
    description: 'Postings, applicants, and pipeline stages.',
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
    <div className="min-h-full">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-white/85 backdrop-blur-md border-b border-neutral-200/80">
        <nav
          role="tablist"
          aria-label="Recruitment sections"
          className="flex gap-1 overflow-x-auto pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className={`relative flex items-center gap-2 px-4 py-3 ui-text-strong whitespace-nowrap transition-all ${
                  isActive ? 'text-neutral-900' : '!text-neutral-500 hover:!text-neutral-800'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-neutral-900' : 'text-neutral-400'} />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.short}</span>
                <span
                  className={`absolute left-3 right-3 -bottom-px h-[2px] rounded-full transition-all ${
                    isActive ? 'bg-neutral-900' : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </nav>
        <p className="ui-text-meta pb-3 pt-2">{activeTab.description}</p>
      </div>

      <div className="pt-6">
        <Active />
      </div>
    </div>
  );
}
