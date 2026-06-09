'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Star, Target } from 'lucide-react';
import PerformanceReviews from './PerformanceReviews';
import KPIDashboard from './KPIDashboard';

const TABS = [
  { key: 'reviews', label: 'Reviews', icon: Star, component: PerformanceReviews },
  { key: 'kpi', label: 'KPI dashboard', icon: Target, component: KPIDashboard },
];

export default function Performance() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'reviews';
  const active = TABS.some((t) => t.key === tabParam) ? tabParam : 'reviews';
  const Active = TABS.find((t) => t.key === active)?.component || PerformanceReviews;

  const setTab = (key) => router.push(`/hr/performance-reviews?tab=${key}`);

  return (
    <div className="ui-page">
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 leading-none">HR · talent</p>
            <h1 className="text-lg font-semibold text-neutral-900 mt-1">Performance</h1>
          </div>
          <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-semibold transition-all ${
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
