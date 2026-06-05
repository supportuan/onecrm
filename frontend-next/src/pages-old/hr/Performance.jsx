'use client';

import { useState } from 'react';
import { Star, Target } from 'lucide-react';
import PerformanceReviews from './PerformanceReviews';
import KPIDashboard from './KPIDashboard';

const TABS = [
  { key: 'reviews', label: 'reviews', icon: Star, component: PerformanceReviews },
  { key: 'kpi', label: 'kpi', icon: Target, component: KPIDashboard },
];

export default function Performance() {
  const [active, setActive] = useState('reviews');
  const Active = TABS.find((t) => t.key === active)?.component || PerformanceReviews;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 leading-none">hr · performance</p>
            <h1 className="text-lg font-semibold text-indigo-900 mt-1">performance</h1>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-indigo-700 hover:bg-white'
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
