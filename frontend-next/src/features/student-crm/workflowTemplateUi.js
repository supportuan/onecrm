import {
  BadgeCheck,
  Calculator,
  CheckCircle2,
  FileBadge2,
  History,
  ListChecks,
  MapPinCheck,
  MessageSquare,
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
];

export const getWorkflowIcon = (iconKey) => WORKFLOW_ICON_MAP[iconKey] || ListChecks;

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
    return (app?.fees || []).length > 0;
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

