/** Application workflow stages — matches Prisma ApplicationStage enum */
export const APPLICATION_STAGES = [
  { key: 'DRAFT', label: 'Draft', order: 1 },
  { key: 'DOCUMENTS_PENDING', label: 'Documents pending', order: 2 },
  { key: 'SUBMITTED', label: 'Submitted to university', order: 3 },
  { key: 'UNDER_REVIEW', label: 'Under review', order: 4 },
  { key: 'OFFER_RECEIVED', label: 'Offer received', order: 5 },
  { key: 'OFFER_ACCEPTED', label: 'Offer accepted', order: 6, branch: 'accept' },
  { key: 'OFFER_REJECTED', label: 'Offer rejected', order: 6, branch: 'reject' },
  { key: 'VISA_PROCESS', label: 'Visa process', order: 7 },
  { key: 'ENROLLED', label: 'Enrolled', order: 8 },
];

export const LINEAR_STAGE_KEYS = [
  'DRAFT',
  'DOCUMENTS_PENDING',
  'SUBMITTED',
  'UNDER_REVIEW',
  'OFFER_RECEIVED',
  'OFFER_ACCEPTED',
  'VISA_PROCESS',
  'ENROLLED',
];

export const STAGE_INDEX = Object.fromEntries(
  LINEAR_STAGE_KEYS.map((key, i) => [key, i])
);

export const getNextStage = (current) => {
  const idx = STAGE_INDEX[current];
  if (idx === undefined || idx >= LINEAR_STAGE_KEYS.length - 1) return null;
  return LINEAR_STAGE_KEYS[idx + 1];
};

export const getStageLabel = (key) =>
  APPLICATION_STAGES.find((s) => s.key === key)?.label || key?.replace(/_/g, ' ');

export const DOC_STATUSES = ['PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED'];
export const VISA_STATUSES = [
  'NOT_STARTED',
  'DOCUMENTS_GATHERING',
  'APPLIED',
  'INTERVIEW_SCHEDULED',
  'APPROVED',
  'REJECTED',
];

export const VISA_STATUS_LABELS = {
  NOT_STARTED: 'Not started',
  DOCUMENTS_GATHERING: 'Documents in progress',
  APPLIED: 'Submitted',
  INTERVIEW_SCHEDULED: 'Appointment scheduled',
  APPROVED: 'Approved',
  REJECTED: 'Refused',
};

export const getVisaStatusLabel = (key) =>
  VISA_STATUS_LABELS[key] || key?.replace(/_/g, ' ').toLowerCase();
export const OFFER_DECISION = ['PENDING', 'ACCEPTED', 'REJECTED'];

export const stageBadgeClass = (stageKey) => {
  if (stageKey === 'ENROLLED') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (stageKey === 'OFFER_REJECTED') return 'bg-rose-50 border-rose-200 text-rose-700';
  if (stageKey?.startsWith('OFFER')) return 'bg-amber-50 border-amber-200 text-amber-700';
  if (stageKey === 'DOCUMENTS_PENDING') return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-neutral-100 border-neutral-200 text-neutral-900';
};
