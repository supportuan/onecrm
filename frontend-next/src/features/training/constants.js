export const PROGRAMS = [
  { value: 'IELTS_PREP', label: 'IELTS preparation' },
  { value: 'VISA_TRAINING', label: 'Visa training' },
];

export const DELIVERY_MODES = [
  { value: 'ONE_ON_ONE', label: '1-on-1' },
  { value: 'GROUP', label: 'Group' },
];

export const CLASS_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'FULL', label: 'Full' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const COURSE_CATEGORIES = [
  { value: 'IELTS_PREP', label: 'IELTS preparation' },
  { value: 'VISA_TRAINING', label: 'Visa training' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'SALES', label: 'Sales' },
  { value: 'SOFT_SKILLS', label: 'Soft skills' },
];

export const PAYMENT_LABELS = {
  UNPAID: 'Payment pending',
  PAID: 'Paid',
  WAIVED: 'Waived',
};

export const programLabel = (value) => PROGRAMS.find((item) => item.value === value)?.label || value;
export const modeLabel = (value) => DELIVERY_MODES.find((item) => item.value === value)?.label || value;
export const statusLabel = (value) => CLASS_STATUSES.find((item) => item.value === value)?.label || value;
export const categoryLabel = (value) => COURSE_CATEGORIES.find((item) => item.value === value)?.label || value;

export const rupeesToPaise = (rupees) => {
  if (rupees === '' || rupees == null) return null;
  const n = Number(rupees);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
};

export const paiseToRupees = (paise) => {
  if (paise == null || paise === '') return '';
  return String(Number(paise) / 100);
};

export const formatInrPaise = (paise) => {
  if (paise == null) return 'Fee not set';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((paise || 0) / 100);
};

export const formatWhen = (value) => {
  if (!value) return 'Schedule later';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
