import type { WorkflowFieldType, WorkflowSectionType } from '@prisma/client';

export type WorkflowTemplateSeed = {
  name: string;
  description: string;
  stages: Array<{
    key: string;
    label: string;
    iconKey: string;
    sectionType: WorkflowSectionType;
    isRequired?: boolean;
    metadata?: Record<string, unknown>;
    fields?: Array<{
      fieldKey: string;
      label: string;
      fieldType: WorkflowFieldType;
      required?: boolean;
      placeholder?: string;
      helpText?: string;
      defaultValue?: unknown;
      optionsJson?: unknown;
      metadata?: Record<string, unknown>;
    }>;
    checklists?: Array<{
      itemKey: string;
      label: string;
      required?: boolean;
      metadata?: Record<string, unknown>;
    }>;
  }>;
};

/** Bump when the canonical stage/field/checklist spec below changes. */
export const DEFAULT_WORKFLOW_SEED_VERSION = 4;

export type CountryProfile = 'uk' | 'usa' | 'canada' | 'australia' | 'generic';

export const resolveCountryProfile = (countryName?: string | null): CountryProfile => {
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

const COUNTRY_CONTENT: Record<
  CountryProfile,
  {
    currencyHint: string;
    livingHelp: string;
    visaItems: string[];
    departureItems: string[];
    arrivalItems: string[];
  }
> = {
  uk: {
    currencyHint: 'Specify fee in Pound £',
    livingHelp: 'Inside London (£1334 * 9)',
    visaItems: [
      'CAS Documents',
      'IHS Confirmation',
      'IHS Application',
      'UKVI Document Checklist',
      'UKVI Visa Application',
      'VFS Appointment',
      'VFS Receipt',
    ],
    departureItems: ['Visa Vignette', 'Visa Confirmation Letter', 'Flight Ticket', 'Additional Information'],
    arrivalItems: ['BRP - Biometric Residence Permit', 'NI - National Insurance', 'School ID'],
  },
  usa: {
    currencyHint: 'Specify fee in USD $',
    livingHelp: 'Estimated living cost for the academic year',
    visaItems: ['I-20 Document', 'SEVIS Fee Receipt', 'DS-160 Confirmation', 'Visa Interview Appointment', 'Visa Stamp / Decision'],
    departureItems: ['I-20 travel signature', 'Flight Ticket', 'Accommodation proof', 'Additional Information'],
    arrivalItems: ['I-94 record', 'SSN (if eligible)', 'Student ID'],
  },
  canada: {
    currencyHint: 'Specify fee in CAD $',
    livingHelp: 'IRCC proof-of-funds living cost',
    visaItems: ['Letter of Acceptance', 'GIC / Proof of funds', 'PAL (if applicable)', 'Study Permit Application', 'Biometrics'],
    departureItems: ['Study permit approval', 'Flight Ticket', 'Accommodation proof', 'Additional Information'],
    arrivalItems: ['SIN', 'Provincial health card', 'Student ID'],
  },
  australia: {
    currencyHint: 'Specify fee in AUD $',
    livingHelp: 'Home Affairs living cost estimate',
    visaItems: ['CoE', 'GTE statement', 'Subclass 500 application', 'Health / biometrics', 'Visa grant'],
    departureItems: ['Visa grant letter', 'Flight Ticket', 'OSH C confirmation', 'Additional Information'],
    arrivalItems: ['TFN', 'Medicare (if eligible)', 'Student ID'],
  },
  generic: {
    currencyHint: 'Specify fee in local currency',
    livingHelp: 'Estimated living cost for the programme',
    visaItems: ['Visa documents', 'Visa application submitted', 'Appointment / interview', 'Visa decision'],
    departureItems: ['Visa confirmation', 'Flight Ticket', 'Accommodation proof', 'Additional Information'],
    arrivalItems: ['Residence permit / visa card', 'Student ID'],
  },
};

const slugify = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const checklist = (kind: string, labels: string[]) =>
  labels.map((label, index) => ({
    itemKey: `${kind}_${index + 1}_${slugify(label) || 'item'}`,
    label,
    required: false,
  }));

export const DEFAULT_WORKFLOW_ICON_KEYS = {
  STUDENT_INFO: 'User',
  DISCUSSIONS: 'MessageSquare',
  APPLICATION_PROCESS: 'ListChecks',
  UNIVERSITY_APPLICATION: 'School',
  SELECTION_OF_UNIVERSITY: 'CheckCircle2',
  FINANCE_CALCULATOR: 'Calculator',
  PRE_CAS_PROCESS: 'FileBadge2',
  VISA_APPLICATION: 'Plane',
  PRE_DEPARTURE: 'PlaneTakeoff',
  ON_ARRIVAL: 'MapPinCheck',
  ENROLMENT_CONFIRMATION: 'BadgeCheck',
  LOGS_INFO: 'History',
} as const;

export const buildDefaultWorkflowTemplateSeed = (countryName: string): WorkflowTemplateSeed => {
  const prefix = slugify(countryName) || 'country';
  const profile = resolveCountryProfile(countryName);
  const content = COUNTRY_CONTENT[profile];
  const stages: WorkflowTemplateSeed['stages'] = [
      {
        key: `${prefix}_student_info`,
        label: 'Students info',
        iconKey: DEFAULT_WORKFLOW_ICON_KEYS.STUDENT_INFO,
        sectionType: 'STUDENT_INFO',
        fields: [
          { fieldKey: 'study_destination', label: 'Study Designation', fieldType: 'TEXT', required: true },
          {
            fieldKey: 'level_of_study',
            label: 'Level Of Study',
            fieldType: 'SELECT',
            required: true,
            optionsJson: ['Certificate', 'Diploma', 'Bachelor', 'Master', 'PhD'],
          },
          { fieldKey: 'student_name', label: 'Student Name', fieldType: 'TEXT', required: true },
          { fieldKey: 'phone_number', label: 'Phone Number', fieldType: 'TEXT' },
          { fieldKey: 'email_id', label: 'E-mail Id', fieldType: 'TEXT' },
          { fieldKey: 'study_industry', label: 'Study Industry', fieldType: 'TEXT' },
          { fieldKey: 'lead_date', label: 'Lead Date', fieldType: 'DATE' },
          { fieldKey: 'intake', label: 'Intake', fieldType: 'TEXT', placeholder: 'Fall 2023' },
          { fieldKey: 'student_date', label: 'Student Date', fieldType: 'DATE' },
          { fieldKey: 'poc_name_phone', label: 'POC Name & Phone', fieldType: 'TEXT' },
        ],
      },
      {
        key: `${prefix}_finance_calculator`,
        label: 'Service fees',
        iconKey: DEFAULT_WORKFLOW_ICON_KEYS.FINANCE_CALCULATOR,
        sectionType: 'FINANCE_CALCULATOR',
        metadata: { hint: content.currencyHint },
        fields: [
          { fieldKey: 'tuition_fees', label: 'Tuition fees', fieldType: 'CURRENCY' },
          { fieldKey: 'deposits', label: 'Deposits', fieldType: 'CURRENCY' },
          { fieldKey: 'remaining_fee', label: 'Remaining fee', fieldType: 'CURRENCY' },
          { fieldKey: 'living_cost', label: 'Living cost', fieldType: 'CURRENCY', helpText: content.livingHelp },
          { fieldKey: 'total_funds_required', label: 'Total funds Required', fieldType: 'CURRENCY' },
        ],
      },
      {
        key: `${prefix}_application_process`,
        label: 'Application Process',
        iconKey: DEFAULT_WORKFLOW_ICON_KEYS.APPLICATION_PROCESS,
        sectionType: 'APPLICATION_PROCESS',
        metadata: { checklistTitle: 'Gathering Checklists' },
        checklists: checklist('application', [
          'Secondary School Certificate',
          'Higher Secondary Certificate',
          'UG Consolidated Memos',
          'UG PC/ OD/ Course Completion',
          'Letter of Recommendation #2',
          'Medium Of Instruction Certificate',
          'English R.....W.....L.....S',
          'Updated CV or Resume',
          'Work Experience',
          'Status of Purpose',
          'Passport#',
        ]),
      },
      {
        key: `${prefix}_university_application`,
        label: 'University Application',
        iconKey: DEFAULT_WORKFLOW_ICON_KEYS.UNIVERSITY_APPLICATION,
        sectionType: 'UNIVERSITY_APPLICATION',
        fields: [
          { fieldKey: 'select_university', label: 'Select University', fieldType: 'TEXT' },
          { fieldKey: 'received_offer_letters', label: 'Received Offer Letters', fieldType: 'NUMBER', defaultValue: 0 },
          {
            fieldKey: 'application_status',
            label: 'Application Status',
            fieldType: 'SELECT',
            optionsJson: [
              'University Shortlisted',
              'Application Submitted',
              'Offer Letter Received',
              'Offer Letter Rejected',
            ],
          },
          { fieldKey: 'last_updated_status', label: 'Last Updated Status', fieldType: 'TEXT' },
          { fieldKey: 'course_link', label: 'Course link', fieldType: 'URL', placeholder: 'Link...' },
        ],
      },
  ];

  if (profile === 'uk') {
    stages.push({
      key: `${prefix}_pre_cas_process`,
      label: 'Pre-CAS Process',
      iconKey: DEFAULT_WORKFLOW_ICON_KEYS.PRE_CAS_PROCESS,
      sectionType: 'PRE_CAS_PROCESS',
      metadata: { countryProfiles: ['uk'] },
      checklists: checklist('pre_cas', [
        'Unconditional Offer',
        'Pre-CAS Deposit',
        'Credibility Interview',
        'Medical Report',
        'Financial Evidence',
        'ATAS (if applicable)',
      ]),
    });
  }

  stages.push(
      {
        key: `${prefix}_visa_application`,
        label: 'Visa Application',
        iconKey: DEFAULT_WORKFLOW_ICON_KEYS.VISA_APPLICATION,
        sectionType: 'VISA_APPLICATION',
        checklists: checklist('visa', content.visaItems),
      },
      {
        key: `${prefix}_pre_departure`,
        label: 'Pre-Departure',
        iconKey: DEFAULT_WORKFLOW_ICON_KEYS.PRE_DEPARTURE,
        sectionType: 'PRE_DEPARTURE',
        checklists: checklist('pre_departure', content.departureItems),
      },
      {
        key: `${prefix}_on_arrival`,
        label: 'On Arrival',
        iconKey: DEFAULT_WORKFLOW_ICON_KEYS.ON_ARRIVAL,
        sectionType: 'ON_ARRIVAL',
        checklists: checklist('arrival', content.arrivalItems),
      },
      {
        key: `${prefix}_enrolment_confirmation`,
        label: 'Enrolment confirmation',
        iconKey: DEFAULT_WORKFLOW_ICON_KEYS.ENROLMENT_CONFIRMATION,
        sectionType: 'ENROLMENT_CONFIRMATION',
        checklists: checklist('enrolment', [
          'Enrolment Confirmation',
          'Received ID card from University',
        ]),
      },
      {
        key: `${prefix}_discussions`,
        label: 'Notes',
        iconKey: DEFAULT_WORKFLOW_ICON_KEYS.DISCUSSIONS,
        sectionType: 'DISCUSSIONS',
        fields: [
          {
            fieldKey: 'discussion_summary',
            label: 'Note summary',
            fieldType: 'TEXTAREA',
            placeholder: 'Type Something here...',
          },
        ],
      },
      {
        key: `${prefix}_logs_info`,
        label: 'Logs info',
        iconKey: DEFAULT_WORKFLOW_ICON_KEYS.LOGS_INFO,
        sectionType: 'LOGS_INFO',
      },
  );

  return {
    name: `${countryName} Student Workflow`,
    description: `Default editable workflow for ${countryName} student applications.`,
    stages,
  };
};
