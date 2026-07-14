'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { STAGE_LABELS } from '../constants';
import { sp, StudentPortalPanel, ProgressBar } from '../student-portal-ui';

export default function StudentOverallJourney({ profile, stageList }) {
  const [filter, setFilter] = useState('all'); // all | pending | completed
  const stages = stageList?.length ? stageList : Object.keys(STAGE_LABELS);
  const currentStage = profile?.processStage || '';
  const currentIdx = stages.indexOf(currentStage);

  const itemsByStage = (profile?.checklists || []).reduce((acc, item) => {
    const stage = item.checkList?.stage;
    if (!stage) return acc;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(item);
    return acc;
  }, {});

  const hasChecklists = (profile?.checklists || []).length > 0;
  const total = profile?.totalCheckList || (profile?.checklists || []).length;
  const completed = profile?.completedCheckList || (profile?.checklists || []).filter((i) => i.completed).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const overdueCount = useMemo(() => {
    const lists = profile?.checklists || [];
    const activeItems = lists.filter((i) => i.checkList?.stage === currentStage && !i.completed);
    return activeItems.length;
  }, [profile?.checklists, currentStage]);

  return (
    <StudentPortalPanel className={`${sp.panelPad} space-y-5`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={sp.sectionEyebrow}>Counsellor managed</p>
          <h2 className={`${sp.sectionTitle} mt-1`}>Overall journey & checklist</h2>
          <p className={`${sp.body} mt-1.5`}>
            Updates here when your counsellor marks checklist items complete.
          </p>
        </div>
        {hasChecklists && (
          <div className="text-right">
            <p className="text-2xl font-semibold text-brand">{pct}%</p>
            <p className="text-[11px] text-slate-400">
              {completed}/{total} tasks
              {overdueCount > 0 ? ` · ${overdueCount} open in current stage` : ''}
            </p>
          </div>
        )}
      </div>

      {hasChecklists && (
        <>
          <ProgressBar value={pct} tone={pct === 100 ? 'emerald' : 'brand'} />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter checklist">
            {[
              { value: 'all', label: 'All stages' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed archive' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`${sp.btnGhost} ${
                  filter === f.value ? '!border-brand !bg-brand-soft !text-brand' : ''
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}

      {!hasChecklists ? (
        <p className={`${sp.empty} py-8`}>
          Your journey checklist is not set up yet. Your counsellor will assign items after your destination country is confirmed.
        </p>
      ) : (
        <ol className="space-y-3">
          {stages.map((stage, idx) => {
            const done = currentIdx > idx;
            const active = currentStage === stage;
            let stageItems = itemsByStage[stage] || [];
            if (filter === 'pending') stageItems = stageItems.filter((i) => !i.completed);
            if (filter === 'completed') stageItems = stageItems.filter((i) => i.completed);
            if (filter !== 'all' && stageItems.length === 0 && !(filter === 'pending' && active)) {
              return null;
            }

            const stageDone = (itemsByStage[stage] || []).filter((i) => i.completed).length;
            const stageTotal = (itemsByStage[stage] || []).length;

            return (
              <li
                key={stage}
                className={`overflow-hidden rounded-2xl border transition ${
                  active
                    ? 'border-brand/25 shadow-sm'
                    : done
                      ? 'border-emerald-200/80'
                      : 'border-slate-200/80'
                }`}
              >
                <div
                  className={`flex items-center gap-3 px-4 py-3.5 text-sm ${
                    active
                      ? 'bg-brand text-white'
                      : done
                        ? 'bg-emerald-50/80 text-emerald-900'
                        : 'bg-white text-slate-600'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className={`h-5 w-5 shrink-0 ${active ? 'text-white/80' : 'text-neutral-300'}`} />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium tracking-tight">
                      {idx + 1}. {STAGE_LABELS[stage] || stage.replace(/_/g, ' ')}
                    </span>
                    {active && profile && (
                      <p className={`mt-1 text-xs ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {profile.stageCompletedTask ?? stageDone} of {profile.stageTotalTask ?? stageTotal} tasks in
                        this stage
                        {profile.totalCheckList > 0 && (
                          <span className="opacity-75">
                            {' '}
                            · {profile.completedCheckList}/{profile.totalCheckList} overall
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  {stageTotal > 0 && (
                    <span className={`shrink-0 text-[11px] ${active ? 'text-white/70' : 'text-slate-400'}`}>
                      {stageDone}/{stageTotal}
                    </span>
                  )}
                </div>

                {stageItems.length > 0 && (
                  <ul className={`divide-y divide-neutral-100/80 ${active ? 'bg-neutral-50/50' : 'bg-white'}`}>
                    {stageItems.map((item) => (
                      <li key={item.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                        {item.completed ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className={item.completed ? 'text-neutral-500 line-through' : 'text-neutral-800'}>
                            {item.checkList?.name}
                          </span>
                          {item.notes && (
                            <p className="mt-0.5 text-[11px] text-neutral-400">{item.notes}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
                          {item.completed ? 'Done' : active ? 'Due now' : 'Upcoming'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </StudentPortalPanel>
  );
}
