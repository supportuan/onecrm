'use client';

import { useState } from 'react';
import { Wallet, Receipt } from 'lucide-react';
import PayrollInputs from './PayrollInputs';
import PayrollDeductions from './PayrollDeductions';

const TABS = [
  { key: 'inputs', label: 'inputs', icon: Wallet, component: PayrollInputs },
  { key: 'deductions', label: 'deductions', icon: Receipt, component: PayrollDeductions },
];

export default function Payroll() {
  const [active, setActive] = useState('inputs');
  const Active = TABS.find((t) => t.key === active)?.component || PayrollInputs;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 leading-none">hr · compensation</p>
            <h1 className="text-lg font-semibold text-indigo-900 mt-1">payroll</h1>
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
