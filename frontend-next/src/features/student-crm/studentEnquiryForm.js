import { toNumOrNull } from './studyFormOptions';

const ENQUIRY_KEYS = [
  'address',
  'countryOption2Id',
  'course1',
  'course2',
  'sslcMark',
  'overallMark',
  'diplomaCourse',
  'diplomaYear',
  'examType',
  'englishPercent',
  'hasPassport',
  'travelledOutside',
  'studiedAbroad',
  'banned',
  'visaRefused',
  'appliedOtherAgent',
  'ukVisa',
  'visaType',
  'visaFees',
  'innerLondon',
  'outerLondon',
  'officeDate',
  'place',
];

export const emptyEnquiryForm = () => ({
  fullName: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dob: '',
  address: '',
  source: '',
  contactId: '',
  sslcMark: '',
  overallMark: '',
  diplomaCourse: '',
  diplomaYear: '',
  workExperience: '',
  level: '',
  examType: '',
  englishPercent: '',
  countryId: '',
  preferredCountry: '',
  countryOption2Id: '',
  industryId: '',
  subIndustryId: '',
  studyAreaId: '',
  intakeMonth: '',
  intakeYear: '',
  course1: '',
  course2: '',
  hasPassport: '',
  travelledOutside: '',
  studiedAbroad: '',
  banned: '',
  visaRefused: '',
  appliedOtherAgent: '',
  ukVisa: '',
  visaType: '',
  visaFees: '',
  innerLondon: '',
  outerLondon: '',
  officeNotes: '',
  officeDate: '',
  place: '',
});

const splitName = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
};

const pickEnquiry = (raw) => {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const key of ENQUIRY_KEYS) out[key] = src[key] ?? '';
  return out;
};

export const enquiryFormFromStudent = (student = {}) => {
  const extras = pickEnquiry(student.enquiryDetails);
  const fullName = student.fullName || [student.firstName, student.lastName].filter(Boolean).join(' ');
  return {
    ...emptyEnquiryForm(),
    ...extras,
    fullName,
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    email: student.email || '',
    phone: student.phone || '',
    dob: student.dob ? String(student.dob).slice(0, 10) : extras.dob || '',
    source: student.source || '',
    contactId: student.contactId != null ? String(student.contactId) : '',
    workExperience: student.workExperience || extras.workExperience || '',
    level: student.level || '',
    countryId: student.countryId != null ? String(student.countryId) : extras.countryId ? String(extras.countryId) : '',
    preferredCountry: student.preferredCountry || '',
    countryOption2Id: extras.countryOption2Id != null && extras.countryOption2Id !== '' ? String(extras.countryOption2Id) : '',
    industryId: student.industryId != null ? String(student.industryId) : extras.industryId ? String(extras.industryId) : '',
    subIndustryId: student.subIndustryId != null ? String(student.subIndustryId) : '',
    studyAreaId: student.studyAreaId != null ? String(student.studyAreaId) : '',
    intakeMonth: student.intakeMonth || '',
    intakeYear: student.intakeYear || '',
    course1: extras.course1 || student.preferredCourse || '',
    officeNotes: student.notes || '',
    examType: extras.examType || student.asstExamSections?.[0]?.type || '',
  };
};

export const enquiryFormToStudentPayload = (form) => {
  const names = splitName(form.fullName || [form.firstName, form.lastName].filter(Boolean).join(' '));
  const enquiryDetails = {};
  for (const key of ENQUIRY_KEYS) {
    const value = form[key];
    enquiryDetails[key] = value === '' || value == null ? null : value;
  }
  return {
    firstName: names.firstName || null,
    lastName: names.lastName || null,
    fullName: String(form.fullName || '').trim() || null,
    email: form.email,
    phone: form.phone || null,
    dob: form.dob || null,
    preferredCountry: form.preferredCountry || null,
    level: form.level || null,
    countryId: toNumOrNull(form.countryId),
    industryId: toNumOrNull(form.industryId),
    subIndustryId: toNumOrNull(form.subIndustryId),
    studyAreaId: toNumOrNull(form.studyAreaId),
    intakeMonth: form.intakeMonth || null,
    intakeYear: form.intakeYear || null,
    workExperience: form.workExperience || null,
    preferredCourse: form.course1 || null,
    contactId: form.contactId === '' ? null : Number(form.contactId),
    source: form.source || null,
    notes: form.officeNotes || null,
    enquiryDetails,
    asstExamSections: form.examType
      ? [{ type: form.examType, overall_score: form.englishPercent || '', label: '' }]
      : [],
  };
};
