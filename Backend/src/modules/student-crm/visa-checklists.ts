/**
 * Default visa document checklists per destination country.
 * Seeded onto VisaTracking when first created; overridable via VisaDocumentChecklistTemplate.
 */
import type { ChecklistItem } from './checklists.js';

const COMMON_VISA: ChecklistItem[] = [
  { name: 'Passport (valid)', required: true },
  { name: 'Passport-size photographs', required: true },
  { name: 'Offer / acceptance letter', required: true },
  { name: 'Financial proof / bank statements', required: true },
];

export const DEFAULT_VISA_CHECKLISTS: Record<string, ChecklistItem[]> = {
  US: [
    ...COMMON_VISA,
    { name: 'I-20 form', required: true },
    { name: 'SEVIS fee receipt', required: true },
    { name: 'DS-160 confirmation', required: true },
    { name: 'Visa interview appointment letter', required: false },
  ],
  UK: [
    ...COMMON_VISA,
    { name: 'CAS letter', required: true },
    { name: 'TB test certificate (if required)', required: false },
    { name: 'English language evidence', required: true },
  ],
  CANADA: [
    ...COMMON_VISA,
    { name: 'Letter of acceptance (LOA)', required: true },
    { name: 'GIC certificate', required: true },
    { name: 'Study permit application forms', required: true },
    { name: 'Biometrics appointment confirmation', required: false },
  ],
  AUSTRALIA: [
    ...COMMON_VISA,
    { name: 'CoE (Confirmation of Enrolment)', required: true },
    { name: 'GTE statement', required: true },
    { name: 'OSHC health cover proof', required: true },
    { name: 'Health examination results', required: false },
  ],
  GERMANY: [
    ...COMMON_VISA,
    { name: 'Blocked account proof', required: true },
    { name: 'APS certificate (if required)', required: false },
    { name: 'Health insurance proof', required: true },
  ],
};

const normalizeCountry = (country: string) =>
  (country || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/UNITEDSTATES.*/, 'US')
    .replace(/UNITEDKINGDOM.*/, 'UK')
    .replace(/CANADA.*/, 'CANADA')
    .replace(/AUSTRALIA.*/, 'AUSTRALIA')
    .replace(/GERMANY.*/, 'GERMANY');

export const getDefaultVisaChecklist = (country: string): ChecklistItem[] => {
  const key = normalizeCountry(country);
  return DEFAULT_VISA_CHECKLISTS[key] || [...COMMON_VISA];
};
