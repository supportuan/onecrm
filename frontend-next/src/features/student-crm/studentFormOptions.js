/** Shared dropdowns for New student and application Students-info step. */
export const STUDY_LEVELS = ['Certificate', 'Diploma', 'Bachelor', 'Master', 'PhD'];

export const INTAKE_MONTHS = ['Spring', 'Summer', 'Fall', 'Winter', 'January', 'May', 'September'];

export const EXAM_TYPES = ['IELTS', 'TOEFL', 'PTE', 'GRE', 'GMAT', 'Duolingo', 'Other'];

export const YES_NO = ['Yes', 'No'];

export const VISA_TYPES = ['Student visa', 'Visitor visa', 'Dependent visa', 'Other'];

export const intakeYears = (fromYear = new Date().getFullYear()) =>
  Array.from({ length: 8 }, (_, index) => String(fromYear + index));

export const subjectOptionsForIndustry = (industry) => {
  if (!industry) return [];
  if (industry.subIndustries?.length) return industry.subIndustries;
  if (industry.studyAreas?.length) return industry.studyAreas;
  return [];
};

export const resolveFormDropdowns = (formOptions = {}) => ({
  countries: formOptions.countries || [],
  industries: formOptions.industries || [],
  leadSources: formOptions.leadSources || [],
  studyLevels: formOptions.studyLevels?.length ? formOptions.studyLevels : STUDY_LEVELS,
  intakeMonths: formOptions.intakeMonths?.length ? formOptions.intakeMonths : INTAKE_MONTHS,
  intakeYears: formOptions.intakeYears?.length ? formOptions.intakeYears : intakeYears(),
  examTypes: formOptions.examTypes?.length ? formOptions.examTypes : EXAM_TYPES,
  yesNo: formOptions.yesNo?.length ? formOptions.yesNo : YES_NO,
  visaTypes: formOptions.visaTypes?.length ? formOptions.visaTypes : VISA_TYPES,
});
