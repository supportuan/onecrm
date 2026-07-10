'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { STAGE_LABELS } from '../constants';
import { sp, StudentPortalPanel } from '../student-portal-ui';

export default function StudentOverallJourney({ profile, stageList }) {
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

  return (
    <StudentPortalPanel className={`${sp.panelPad} space-y-5`}>
      <div>
        <p className={sp.sectionEyebrow}>Counsellor managed</p>
        <h2 className={`${sp.sectionTitle} mt-1`}>Overall journey</h2>
        <p className={`${sp.body} mt-1.5`}>
          Updates here when your counsellor marks checklist items complete.
        </p>
      </div>

      {!hasChecklists ? (
        <p className={`${sp.empty} py-8`}>
          Your journey checklist is not set up yet. Your counsellor will assign items after your destination country is confirmed.
        </p>
      ) : (
        <ol className="space-y-3">
          {stages.map((stage, idx) => {
            const done = currentIdx > idx;
            const active = currentStage === stage;
            const stageItems = itemsByStage[stage] || [];
            const stageDone = stageItems.filter((i) => i.completed).length;
            const stageTotal = stageItems.length;

            return (
              <li
                key={stage}
                className={`rounded-2xl border overflow-hidden transition ${
                  active
                    ? 'border-neutral-900/20 shadow-sm'
                    : done
                      ? 'border-emerald-200/80'
                      : 'border-neutral-200/80'
                }`}
              >
                <div
                  className={`flex items-center gap-3 px-4 py-3.5 text-sm ${
                    active
                      ? 'bg-neutral-900 text-white'
                      : done
                        ? 'bg-emerald-50/80 text-emerald-900'
                        : 'bg-white text-neutral-600'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className={`h-5 w-5 shrink-0 ${active ? 'text-white/80' : 'text-neutral-300'}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium tracking-tight">
                      {idx + 1}. {STAGE_LABELS[stage] || stage.replace(/_/g, ' ')}
                    </span>
                    {active && profile && (
                      <p className={`text-xs mt-1 ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {profile.stageCompletedTask ?? stageDone} of {profile.stageTotalTask ?? stageTotal} tasks in this stage
                        {profile.totalCheckList > 0 && (
                          <span className="opacity-75"> · {profile.completedCheckList}/{profile.totalCheckList} overall</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {stageItems.length > 0 && (
                  <ul className={`divide-y divide-neutral-100/80 ${active ? 'bg-neutral-50/50' : 'bg-white'}`}>
                    {stageItems.map((item) => (
                      <li key={item.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                        {item.completed ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-neutral-300 mt-0.5" />
                        )}
                        <span className={item.completed ? 'text-neutral-500 line-through' : 'text-neutral-800'}>
                          {item.checkList?.name}
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
