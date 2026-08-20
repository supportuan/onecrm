import {
  BadgeCheck,
  Calculator,
  CheckCircle2,
  FileBadge2,
  GraduationCap,
  History,
  ListChecks,
  MapPinCheck,
  MessageSquare,
  NotebookPen,
  Plane,
  PlaneTakeoff,
  School,
  User,
} from 'lucide-react';

export const WORKFLOW_ICON_MAP = {
  User,
  MessageSquare,
  ListChecks,
  School,
  CheckCircle2,
  Calculator,
  FileBadge2,
  Plane,
  PlaneTakeoff,
  MapPinCheck,
  BadgeCheck,
  History,
  GraduationCap,
  NotebookPen,
};

export const WORKFLOW_ICON_OPTIONS = [
  'User',
  'MessageSquare',
  'ListChecks',
  'School',
  'CheckCircle2',
  'Calculator',
  'FileBadge2',
  'Plane',
  'PlaneTakeoff',
  'MapPinCheck',
  'BadgeCheck',
  'History',
  'GraduationCap',
  'NotebookPen',
];

export const getWorkflowIcon = (iconKey) => WORKFLOW_ICON_MAP[iconKey] || ListChecks;

/** Blood-orange accent for workflow steps 9 and 10 (by display order). */
export const getWorkflowStageIconClass = (stepNumber) => {
  if (stepNumber === 9) return 'bg-[#FFEBE0] text-[#CC5500]';
  if (stepNumber === 10) return 'bg-[#FFE4D6] text-[#BF360C]';
  return 'bg-neutral-100 text-neutral-600';
};

export const SERVICE_FEE_EFFECT = {
  BASE: 'base',
  ADD: 'add',
  DEDUCT: 'deduct',
  TOTAL: 'total',
};

export const getServiceFeeEffect = (field) => {
  const effect = field?.metadata?.feeEffect;
  if (
    effect === SERVICE_FEE_EFFECT.BASE ||
    effect === SERVICE_FEE_EFFECT.DEDUCT ||
    effect === SERVICE_FEE_EFFECT.TOTAL
  ) {
    return effect;
  }
  if (field?.fieldKey === 'total_funds_required') return SERVICE_FEE_EFFECT.TOTAL;
  if (field?.fieldKey === 'tuition_fees') return SERVICE_FEE_EFFECT.BASE;
  if (field?.fieldKey === 'deposits') return SERVICE_FEE_EFFECT.DEDUCT;
  return SERVICE_FEE_EFFECT.ADD;
};

const amountForField = (fieldValues, field) => {
  const amount = Number(fieldValues[field.id]);
  return Number.isFinite(amount) ? amount : 0;
};

/** Total fees − Deposit + Remaining fees + Living cost = Result */
export const SERVICE_FEE_FORMULA_LABEL =
  'Total fees − Deposit + Remaining fees + Living cost = Result';

export const computeServiceFeeTotal = (fieldValues = {}, fields = []) => {
  const byKey = Object.fromEntries(
    fields.filter((field) => field.fieldType === 'CURRENCY').map((field) => [field.fieldKey, field])
  );

  const totalFees = byKey.tuition_fees ? amountForField(fieldValues, byKey.tuition_fees) : 0;
  const deposit = byKey.deposits ? amountForField(fieldValues, byKey.deposits) : 0;
  const remaining = byKey.remaining_fee ? amountForField(fieldValues, byKey.remaining_fee) : 0;
  const living = byKey.living_cost ? amountForField(fieldValues, byKey.living_cost) : 0;

  if (byKey.tuition_fees || byKey.deposits || byKey.remaining_fee || byKey.living_cost) {
    const result = totalFees - deposit + remaining + living;
    return Math.max(0, Math.round(result * 100) / 100);
  }

  let total = 0;
  fields.forEach((field) => {
    if (field.fieldType !== 'CURRENCY') return;
    const amount = amountForField(fieldValues, field);
    const effect = getServiceFeeEffect(field);
    if (effect === SERVICE_FEE_EFFECT.BASE || effect === SERVICE_FEE_EFFECT.ADD) total += amount;
    if (effect === SERVICE_FEE_EFFECT.DEDUCT) total -= amount;
  });
  return Math.max(0, Math.round(total * 100) / 100);
};

export const SERVICE_FEE_TEMPLATE_FIELDS = [
  {
    fieldKey: 'tuition_fees',
    label: 'Total fees',
    fieldType: 'CURRENCY',
    required: true,
    placeholder: 'Amount',
    metadata: { feeEffect: SERVICE_FEE_EFFECT.BASE },
  },
  {
    fieldKey: 'deposits',
    label: 'Deposit',
    fieldType: 'CURRENCY',
    required: true,
    placeholder: 'Amount',
    metadata: { feeEffect: SERVICE_FEE_EFFECT.DEDUCT },
  },
  {
    fieldKey: 'remaining_fee',
    label: 'Remaining fees',
    fieldType: 'CURRENCY',
    required: true,
    placeholder: 'Amount',
    metadata: { feeEffect: SERVICE_FEE_EFFECT.ADD },
  },
  {
    fieldKey: 'living_cost',
    label: 'Living cost',
    fieldType: 'CURRENCY',
    required: true,
    placeholder: 'Amount',
    helpText: 'Enter manually — included in result when filled',
    metadata: { feeEffect: SERVICE_FEE_EFFECT.ADD, manualOnly: true },
  },
  {
    fieldKey: 'total_funds_required',
    label: 'Result',
    fieldType: 'CURRENCY',
    required: true,
    placeholder: '',
    metadata: { feeEffect: SERVICE_FEE_EFFECT.TOTAL },
  },
  {
    fieldKey: 'service_fees_verified',
    label: 'Verified',
    fieldType: 'CHECKBOX',
    required: true,
    helpText: 'Staff must confirm these figures before this step turns green',
  },
];

export const EXAM_SCORE_TEMPLATE_FIELDS = [
  { fieldKey: 'ielts_score', label: 'IELTS', fieldType: 'NUMBER', required: true, placeholder: 'Score' },
  { fieldKey: 'toefl_score', label: 'TOEFL', fieldType: 'NUMBER', required: true, placeholder: 'Score' },
  { fieldKey: 'gre_score', label: 'GRE', fieldType: 'NUMBER', required: true, placeholder: 'Score' },
  { fieldKey: 'gmat_score', label: 'GMAT', fieldType: 'NUMBER', required: true, placeholder: 'Score' },
  {
    fieldKey: 'exam_name',
    label: 'Exam',
    fieldType: 'SELECT',
    required: true,
    optionsJson: ['IELTS', 'TOEFL', 'PTE', 'GRE', 'GMAT', 'Duolingo', 'Other'],
  },
  { fieldKey: 'exam_overall', label: 'Overall', fieldType: 'NUMBER', required: true, placeholder: 'Overall score' },
  { fieldKey: 'exam_reading', label: 'Reading', fieldType: 'NUMBER', required: true },
  { fieldKey: 'exam_writing', label: 'Writing', fieldType: 'NUMBER', required: true },
  { fieldKey: 'exam_speaking', label: 'Speaking', fieldType: 'NUMBER', required: true },
  { fieldKey: 'exam_listening', label: 'Listening', fieldType: 'NUMBER', required: true },
];

const STAGE_DISPLAY_ORDER = [
  'STUDENT_INFO',
  'FINANCE_CALCULATOR',
  'APPLICATION_PROCESS',
  'UNIVERSITY_APPLICATION',
  'PRE_CAS_PROCESS',
  'VISA_APPLICATION',
  'PRE_DEPARTURE',
  'ON_ARRIVAL',
  'ENROLMENT_CONFIRMATION',
  'DISCUSSIONS',
  'LOGS_INFO',
];

const STAGE_DISPLAY_LABELS = {
  FINANCE_CALCULATOR: 'Service fees',
  DISCUSSIONS: 'Notes',
};

export const displayStageLabel = (stage) =>
  STAGE_DISPLAY_LABELS[stage?.sectionType] || stage?.label || 'Step';

export const sortWorkflowStages = (stages = []) =>
  [...stages].sort((a, b) => {
    const aIndex = STAGE_DISPLAY_ORDER.indexOf(a.sectionType);
    const bIndex = STAGE_DISPLAY_ORDER.indexOf(b.sectionType);
    const left = aIndex === -1 ? STAGE_DISPLAY_ORDER.length : aIndex;
    const right = bIndex === -1 ? STAGE_DISPLAY_ORDER.length : bIndex;
    if (left !== right) return left - right;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

export const workflowSectionTypeLabel = (type) =>
  STAGE_DISPLAY_LABELS[type] ||
  String(type || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');

export const resolveCountryProfile = (countryName) => {
  const key = String(countryName || '').toUpperCase();
  if (
    key.includes('UNITED KINGDOM') ||
    key === 'UK' ||
    key.includes('GREAT BRITAIN') ||
    key.includes('ENGLAND') ||
    key.includes('SCOTLAND') ||
    key.includes('WALES')
  ) {
    return 'uk';
  }
  if (key.includes('UNITED STATES') || key === 'US' || key === 'USA' || key.includes('AMERICA')) return 'usa';
  if (key.includes('CANADA')) return 'canada';
  if (key.includes('AUSTRALIA')) return 'australia';
  return 'generic';
};

/** Hide country-only modules (e.g. Pre-CAS is UK) unless the stage belongs to this destination. */
export const stageAppliesToCountry = (stage, countryName) => {
  const profile = resolveCountryProfile(countryName);
  const allowed = stage?.metadata?.countryProfiles;
  if (Array.isArray(allowed) && allowed.length) {
    return allowed.includes(profile) || allowed.includes('*');
  }
  if (stage?.sectionType === 'PRE_CAS_PROCESS') return profile === 'uk';
  return true;
};

const hasValue = (value) => {
  if (value == null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim() !== '' && String(value).trim() !== 'Invalid Date';
};

export const isTemplateFieldSubmitted = (field, fieldValues = {}, stage) => {
  const verifiedField = (stage?.fields || []).find((entry) => entry.fieldKey === 'service_fees_verified');
  const verified = verifiedField ? hasValue(fieldValues[verifiedField.id]) : true;
  if (field?.fieldKey === 'service_fees_verified') return verified;
  if (getServiceFeeEffect(field) === SERVICE_FEE_EFFECT.TOTAL) {
    return hasValue(fieldValues[field.id]);
  }
  if (verifiedField && stage?.sectionType === 'FINANCE_CALCULATOR') {
    return verified && hasValue(fieldValues[field.id]);
  }
  return hasValue(fieldValues[field.id]);
};

const normalizeLabel = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const documentUploaded = (doc) => Boolean(doc?.fileUrl) || ['UPLOADED', 'VERIFIED'].includes(doc?.status);

/** Green when the step has the data it needs; red when staff still need to fill it. */
export const isWorkflowStageComplete = (stage, app) => {
  const type = stage?.sectionType;
  const student = app?.student;
  if (type === 'STUDENT_INFO') {
    return Boolean(student?.fullName && (student?.email || student?.phone));
  }
  if (type === 'FINANCE_CALCULATOR') {
    const verifiedField = (stage?.fields || []).find((field) => field.fieldKey === 'service_fees_verified');
    if (verifiedField) {
      const saved = (app?.workflowFieldValues || []).find((item) => item.fieldTemplateId === verifiedField.id)?.valueJson;
      return hasValue(saved);
    }
    return false;
  }
  if (type === 'UNIVERSITY_APPLICATION') {
    return (student?.universities || []).length > 0;
  }
  if (type === 'DISCUSSIONS') {
    return (app?.comments || []).length > 0;
  }
  if (type === 'LOGS_INFO') return (app?.stageEvents || []).length > 0;

  const checklist = stage?.checklists || [];
  if (checklist.length) {
    const docs = app?.documents || [];
    return checklist.every((item) => {
      const doc = docs.find((entry) => normalizeLabel(entry.name) === normalizeLabel(item.label));
      return documentUploaded(doc);
    });
  }

  const fields = stage?.fields || [];
  if (!fields.length) return false;
  const values = app?.workflowFieldValues || [];
  const required = fields.filter((field) => field.required);
  const targets = required.length ? required : fields;
  return targets.every((field) => {
    const saved = values.find((item) => item.fieldTemplateId === field.id)?.valueJson;
    return hasValue(saved);
  });
};

