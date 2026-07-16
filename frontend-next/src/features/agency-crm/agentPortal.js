/**
 * Agent portal helpers — role-aware shell for AGENT / AGENCY_FREELANCER.
 * Admin partner ops stay on the same routes but different nav + guards.
 */

export const AGENT_PORTAL_ROLES = new Set(['AGENT', 'AGENCY_FREELANCER']);

export const isAgencyPartnerRole = (role) =>
  AGENT_PORTAL_ROLES.has(String(role || '').toUpperCase());

/** Admin-only agency paths agents must not open. */
export const AGENT_BLOCKED_PATHS = ['/agency-crm/agency-management'];

export const isAgentBlockedPath = (pathname) =>
  AGENT_BLOCKED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

export const AGENT_HOME_PATH = '/agency-crm/dashboard';
export const AGENT_ONBOARDING_PATH = '/agency-crm/onboarding';
export const AGENT_STUDENTS_PATH = '/agency-crm/agency-leads';

/** Canonical onboarding order (mirrors backend state machine). */
export const ONBOARDING_STAGE_ORDER = [
  'REGISTERED',
  'DOCS_SUBMITTED',
  'AGREEMENT_SIGNED',
  'VERIFIED',
  'APPROVED',
  'ACTIVE',
];

export const stageIndex = (stage) => ONBOARDING_STAGE_ORDER.indexOf(stage);

export const canSubmitOnboardingDocs = (stage) => stage === 'REGISTERED';

export const canSignAgreement = (stage) => stage === 'DOCS_SUBMITTED';

export const isAwaitingAdminReview = (stage) =>
  stage === 'AGREEMENT_SIGNED' || stage === 'VERIFIED' || stage === 'APPROVED';

/** Human next action while partner is not ACTIVE. */
export const nextOnboardingAction = (stage) => {
  if (!stage || stage === 'ACTIVE') return null;
  if (stage === 'REGISTERED') {
    return {
      title: 'Upload your documents',
      detail: 'Add ID / KYC files, then submit them to move forward.',
      cta: 'Go to setup',
      href: AGENT_ONBOARDING_PATH,
    };
  }
  if (stage === 'DOCS_SUBMITTED') {
    return {
      title: 'Sign the agency agreement',
      detail: 'Accept the partner agreement to continue verification.',
      cta: 'Sign agreement',
      href: AGENT_ONBOARDING_PATH,
    };
  }
  return {
    title: 'Waiting for admin approval',
    detail: 'Your documents and agreement are in. We will activate your account soon.',
    cta: 'View setup status',
    href: AGENT_ONBOARDING_PATH,
  };
};
