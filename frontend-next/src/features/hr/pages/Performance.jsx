'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import PerformanceReviews from './PerformanceReviews';
import KPIDashboard from './KPIDashboard';

const TABS = [
  { key: 'reviews', label: 'Reviews' },
  { key: 'kpi', label: 'KPIs' },
];

export default function Performance() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'reviews';
  const active = TABS.some((t) => t.key === tabParam) ? tabParam : 'reviews';
  const Active = active === 'kpi' ? KPIDashboard : PerformanceReviews;

  return (
    <div className="ui-container">
      <div className="flex items-center gap-1 w-full border-b border-[var(--ui-border)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => router.push(`/hr/performance-reviews?tab=${t.key}`)}
            className={`px-5 py-2.5 text-[13px] transition border-b-2 -mb-px ${
              active === t.key
                ? 'border-[var(--ui-text)] font-semibold text-[var(--ui-text)]'
                : 'border-transparent text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Active />
    </div>
  );
}
