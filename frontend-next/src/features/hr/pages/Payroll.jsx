'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Wallet, Receipt } from 'lucide-react';
import PayrollInputs from './PayrollInputs';
import PayrollDeductions from './PayrollDeductions';

const TABS = [
  { key: 'run', label: 'Payroll run', icon: Wallet, component: PayrollInputs },
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
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 leading-none">HR · compensation</p>
            <h1 className="text-lg font-semibold text-brand mt-1">Payroll</h1>
            <p className="text-[11px] text-neutral-500 mt-0.5">salary structures, payroll execution, payslips, and deductions.</p>
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
        </div>
      </div>

      <Active />
    </div>
  );
}
