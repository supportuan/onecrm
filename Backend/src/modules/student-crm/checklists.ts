/**
 * Default document checklists per destination country.
 *
 * Used when an application is created and no university-specific override
 * exists in `DocumentChecklistTemplate`. Real deployments will seed
 * country/university combinations in the DB and override these.
 */
export type ChecklistItem = { name: string; required: boolean; description?: string };

const COMMON: ChecklistItem[] = [
  { name: 'Passport copy', required: true },
  { name: 'Academic transcripts', required: true },
  { name: 'Statement of purpose (SOP)', required: true },
  { name: 'Letters of recommendation', required: true, description: 'Usually 2-3 LORs' },
  { name: 'Updated CV / Resume', required: true },
];

const ENGLISH_PROFICIENCY: ChecklistItem[] = [
  { name: 'IELTS / TOEFL / Duolingo score', required: true, description: 'English proficiency' },
];

const FINANCIAL: ChecklistItem[] = [
  { name: 'Bank statement / financial proof', required: true, description: 'Last 3-6 months' },
  { name: 'Affidavit of support', required: false },
];

export const DEFAULT_COUNTRY_CHECKLISTS: Record<string, ChecklistItem[]> = {
  US: [
    ...COMMON,
    ...ENGLISH_PROFICIENCY,
    { name: 'GRE / GMAT score', required: false },
    ...FINANCIAL,
    { name: 'I-20 form', required: false, description: 'Issued by university after admission' },
  ],
  UK: [
    ...COMMON,
    ...ENGLISH_PROFICIENCY,
    ...FINANCIAL,
    { name: 'CAS letter', required: false, description: 'Issued by university for visa' },
  ],
  CANADA: [
    ...COMMON,
    ...ENGLISH_PROFICIENCY,
    ...FINANCIAL,
    { name: 'GIC certificate', required: false },
    { name: "Letter of acceptance (LOA)", required: false },
  ],
  AUSTRALIA: [
    ...COMMON,
    ...ENGLISH_PROFICIENCY,
    ...FINANCIAL,
    { name: 'GTE statement', required: true, description: 'Genuine temporary entrant statement' },
    { name: 'CoE (Confirmation of Enrolment)', required: false },
  ],
  GERMANY: [
    ...COMMON,
    ...ENGLISH_PROFICIENCY,
    ...FINANCIAL,
    { name: 'APS certificate', required: false, description: 'For some countries' },
    { name: 'Blocked account proof', required: false },
  ],
};

const normalizeCountry = (country: string) =>
  (country || '').toUpperCase().replace(/\s+/g, '').replace(/UNITEDSTATES.*/, 'US').replace(/UNITEDKINGDOM.*/, 'UK');

export const getDefaultChecklist = (country: string): ChecklistItem[] => {
  const key = normalizeCountry(country);
  return DEFAULT_COUNTRY_CHECKLISTS[key] || [...COMMON, ...ENGLISH_PROFICIENCY, ...FINANCIAL];
};
