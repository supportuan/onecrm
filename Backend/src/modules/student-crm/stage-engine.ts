import type { ApplicationProcessStage } from '@prisma/client';

/** Country-specific stage order. UK/EU include Pre-CAS; USA skips it. */
const DEFAULT_STAGES: ApplicationProcessStage[] = [
  'GATHERING_CHECKLIST',
  'UNIVERSITY_APPLICATION',
  'FINANCIAL_EVIDENCE',
  'AFTER_I20',
  'PRE_CAS_PROCESS',
  'VISA_APPLICATION',
  'PRE_DEPARTURE',
  'ON_ARRIVAL',
  'PRE_REQUISITE',
];

const USA_STAGES: ApplicationProcessStage[] = DEFAULT_STAGES.filter((s) => s !== 'PRE_CAS_PROCESS');

export const getStagesForCountry = (countryName?: string | null): ApplicationProcessStage[] => {
  const key = (countryName || '').toUpperCase();
  if (key.includes('UNITED STATES') || key === 'US' || key === 'USA') return USA_STAGES;
  return DEFAULT_STAGES;
};

export const computeProcessProgress = (
  items: { completed: boolean; checkList: { stage: ApplicationProcessStage; required: boolean } }[],
  countryName?: string | null
) => {
  const total = items.length;
  const completed = items.filter((i) => i.completed).length;

  const byStage = new Map<ApplicationProcessStage, { total: number; done: number }>();
  for (const item of items) {
    const stage = item.checkList.stage;
    const cur = byStage.get(stage) || { total: 0, done: 0 };
    cur.total += 1;
    if (item.completed) cur.done += 1;
    byStage.set(stage, cur);
  }

  const stageOrder = getStagesForCountry(countryName);
  let processStage: ApplicationProcessStage = stageOrder[0] || 'GATHERING_CHECKLIST';

  for (const stage of stageOrder) {
    const counts = byStage.get(stage);
    if (!counts) continue;
    if (counts.done < counts.total) {
      processStage = stage;
      break;
    }
    processStage = stage;
  }

  const stageTotalTask = byStage.get(processStage)?.total ?? 0;
  const stageCompletedTask = byStage.get(processStage)?.done ?? 0;

  return {
    totalCheckList: total,
    completedCheckList: completed,
    processStage,
    stageTotalTask,
    stageCompletedTask,
  };
};
