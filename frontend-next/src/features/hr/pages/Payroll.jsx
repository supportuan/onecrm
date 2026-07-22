'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { IndianRupee, Receipt } from 'lucide-react';
import PayrollInputs from './PayrollInputs';
import PayrollDeductions from './PayrollDeductions';

const TABS = [
  { key: 'run', label: 'Payroll run', icon: IndianRupee, component: PayrollInputs },
  { key: 'deductions', label: 'Deductions', icon: Receipt, component: PayrollDeductions },
];

export default function Payroll() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'run';
  const active = TABS.some((t) => t.key === tabParam) ? tabParam : 'run';
  const Active = TABS.find((t) => t.key === active)?.component || PayrollInputs;

  const setTab = (key) => router.push(`/hr/payroll?tab=${key}`);

  return (
    <div className="ui-page">
      <div className="mb-6 flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-neutral-600 hover:text-brand hover:bg-white'
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      <Active />
    </div>
  );
}
