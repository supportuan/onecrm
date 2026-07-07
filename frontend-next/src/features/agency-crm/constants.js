export const PARTNER_STATUS_LABELS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  BLACKLISTED: 'Blacklisted',
};

export const ONBOARDING_STAGE_LABELS = {
  REGISTERED: 'Registered',
  DOCS_SUBMITTED: 'Documents submitted',
  AGREEMENT_SIGNED: 'Agreement signed',
  VERIFIED: 'Verified',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
};

export const COMMISSION_STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export const partnerStatusClass = (status) => {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700';
  if (status === 'BLACKLISTED' || status === 'SUSPENDED') return 'bg-red-50 text-red-700';
  if (status === 'VERIFIED' || status === 'APPROVED') return 'bg-blue-50 text-blue-700';
  if (status === 'INACTIVE') return 'bg-neutral-100 text-neutral-600';
  return 'bg-amber-50 text-amber-700';
};

export const commissionStatusClass = (status) => {
  if (status === 'PAID') return 'bg-emerald-50 text-emerald-700';
  if (status === 'APPROVED') return 'bg-blue-50 text-blue-700';
  if (status === 'CANCELLED') return 'bg-neutral-100 text-neutral-600';
  return 'bg-amber-50 text-amber-700';
};
