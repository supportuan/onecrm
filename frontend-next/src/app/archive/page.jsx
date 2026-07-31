'use client';

import { useState } from 'react';
import ArchiveUsers from '@/features/archive/pages/ArchiveUsers';
import ArchiveLeads from '@/features/archive/pages/ArchiveLeads';
import ArchiveStudents from '@/features/archive/pages/ArchiveStudents';

const TABS = [
  { id: 'leads', label: 'Leads' },
  { id: 'students', label: 'Students' },
  { id: 'users', label: 'Users' },
];

export default function ArchivePage() {
  const [tab, setTab] = useState('leads');

  return (
    <div className="ui-page-shell space-y-4">
      <div className="inline-flex rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-panel)] p-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition ${
                active
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'leads' ? (
        <ArchiveLeads />
      ) : tab === 'students' ? (
        <ArchiveStudents />
      ) : (
        <ArchiveUsers />
      )}
    </div>
  );
}
