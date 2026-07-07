import type { VisaStatus } from '@prisma/client';

export type VisaWorkflowStep = {
  key: string;
  label: string;
  suggestedStatus?: VisaStatus;
};

const normalizeCountry = (country?: string | null) => (country || '').toUpperCase();

const UK_WORKFLOW: VisaWorkflowStep[] = [
  { key: 'cas', label: 'CAS letter received', suggestedStatus: 'DOCUMENTS_GATHERING' },
  { key: 'financial', label: 'Financial evidence prepared', suggestedStatus: 'DOCUMENTS_GATHERING' },
  { key: 'application', label: 'Online visa application submitted', suggestedStatus: 'APPLIED' },
  { key: 'biometrics', label: 'Biometrics appointment completed', suggestedStatus: 'INTERVIEW_SCHEDULED' },
  { key: 'decision', label: 'Visa decision received', suggestedStatus: 'APPROVED' },
];

const US_WORKFLOW: VisaWorkflowStep[] = [
  { key: 'i20', label: 'I-20 received from university', suggestedStatus: 'DOCUMENTS_GATHERING' },
  { key: 'sevis', label: 'SEVIS fee paid', suggestedStatus: 'DOCUMENTS_GATHERING' },
  { key: 'ds160', label: 'DS-160 form completed', suggestedStatus: 'APPLIED' },
  { key: 'interview', label: 'Visa interview scheduled', suggestedStatus: 'INTERVIEW_SCHEDULED' },
  { key: 'decision', label: 'Visa stamped / decision received', suggestedStatus: 'APPROVED' },
];

const CANADA_WORKFLOW: VisaWorkflowStep[] = [
  { key: 'loa', label: 'Letter of acceptance received', suggestedStatus: 'DOCUMENTS_GATHERING' },
  { key: 'gic', label: 'GIC / proof of funds ready', suggestedStatus: 'DOCUMENTS_GATHERING' },
  { key: 'application', label: 'Study permit application submitted', suggestedStatus: 'APPLIED' },
  { key: 'biometrics', label: 'Biometrics completed', suggestedStatus: 'INTERVIEW_SCHEDULED' },
  { key: 'decision', label: 'Permit decision received', suggestedStatus: 'APPROVED' },
];

const AUSTRALIA_WORKFLOW: VisaWorkflowStep[] = [
  { key: 'coe', label: 'CoE received', suggestedStatus: 'DOCUMENTS_GATHERING' },
  { key: 'gte', label: 'GTE statement prepared', suggestedStatus: 'DOCUMENTS_GATHERING' },
  { key: 'application', label: 'Subclass 500 application lodged', suggestedStatus: 'APPLIED' },
  { key: 'biometrics', label: 'Health / biometrics completed', suggestedStatus: 'INTERVIEW_SCHEDULED' },
  { key: 'decision', label: 'Visa grant received', suggestedStatus: 'APPROVED' },
];

const GENERIC_WORKFLOW: VisaWorkflowStep[] = [
  { key: 'documents', label: 'Visa documents gathered', suggestedStatus: 'DOCUMENTS_GATHERING' },
  { key: 'application', label: 'Visa application submitted', suggestedStatus: 'APPLIED' },
  { key: 'appointment', label: 'Appointment / interview completed', suggestedStatus: 'INTERVIEW_SCHEDULED' },
  { key: 'decision', label: 'Decision received', suggestedStatus: 'APPROVED' },
];

/** Country-specific visa milestone steps for staff UI and student portal. */
export const getVisaWorkflowForCountry = (country?: string | null): VisaWorkflowStep[] => {
  const key = normalizeCountry(country);
  if (key.includes('UNITED KINGDOM') || key === 'UK' || key.includes('GREAT BRITAIN')) return UK_WORKFLOW;
  if (key.includes('UNITED STATES') || key === 'US' || key === 'USA') return US_WORKFLOW;
  if (key.includes('CANADA') || key === 'CA') return CANADA_WORKFLOW;
  if (key.includes('AUSTRALIA') || key === 'AU') return AUSTRALIA_WORKFLOW;
  return GENERIC_WORKFLOW;
};

export type VisaDocumentEntry = {
  fileUrl: string;
  filename: string;
  uploadedAt: string;
  label?: string;
};

/** Normalize legacy single-object visa documents JSON to an array. */
export const normalizeVisaDocuments = (raw: unknown): VisaDocumentEntry[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((d) => d && typeof d === 'object' && (d as VisaDocumentEntry).fileUrl);
  }
  if (typeof raw === 'object' && (raw as VisaDocumentEntry).fileUrl) {
    return [raw as VisaDocumentEntry];
  }
  return [];
};

export const appendVisaDocument = (
  existing: unknown,
  entry: VisaDocumentEntry
): VisaDocumentEntry[] => [...normalizeVisaDocuments(existing), entry];
