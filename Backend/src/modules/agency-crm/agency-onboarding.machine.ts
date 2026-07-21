import { AgencyOnboardingStage } from '@prisma/client';
import { isAgencyPartnerUser } from './scoping.js';

/** Canonical forward-only onboarding order. */
export const ONBOARDING_STAGE_ORDER: AgencyOnboardingStage[] = [
  AgencyOnboardingStage.REGISTERED,
  AgencyOnboardingStage.DOCS_SUBMITTED,
  AgencyOnboardingStage.AGREEMENT_SIGNED,
  AgencyOnboardingStage.VERIFIED,
  AgencyOnboardingStage.APPROVED,
  AgencyOnboardingStage.ACTIVE,
];

/** Stages an agent may set on their own partner (self-service). */
export const AGENT_SELF_SERVICE_STAGES = new Set<AgencyOnboardingStage>([
  AgencyOnboardingStage.DOCS_SUBMITTED,
  AgencyOnboardingStage.AGREEMENT_SIGNED,
]);

/** Stages reserved for staff with MANAGE_AGENCY_CRM. */
export const ADMIN_ONBOARDING_STAGES = new Set<AgencyOnboardingStage>([
  AgencyOnboardingStage.VERIFIED,
  AgencyOnboardingStage.APPROVED,
  AgencyOnboardingStage.ACTIVE,
]);

export class OnboardingTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OnboardingTransitionError';
  }
}

export const stageIndex = (stage: AgencyOnboardingStage) =>
  ONBOARDING_STAGE_ORDER.indexOf(stage);

export const assertOnboardingTransition = (opts: {
  from: AgencyOnboardingStage;
  to: AgencyOnboardingStage;
  actorRole?: string;
}) => {
  const { from, to, actorRole } = opts;
  if (from === to) return;

  const fromIdx = stageIndex(from);
  const toIdx = stageIndex(to);
  if (fromIdx < 0 || toIdx < 0) {
    throw new OnboardingTransitionError('Invalid onboarding stage');
  }
  if (toIdx < fromIdx) {
    throw new OnboardingTransitionError('Cannot move onboarding backwards');
  }

  const partnerActor = isAgencyPartnerUser(actorRole);

  if (partnerActor) {
    if (!AGENT_SELF_SERVICE_STAGES.has(to)) {
      throw new OnboardingTransitionError(
        'Only administrators can advance to verification, approval, or activation'
      );
    }
    // Agents advance exactly one step at a time along the self-service path.
    if (toIdx !== fromIdx + 1) {
      throw new OnboardingTransitionError(
        `Invalid transition: complete prior steps before ${to}`
      );
    }
    return;
  }

  // Staff also advance one stage at a time so verification and approval
  // cannot be silently skipped.
  if (toIdx !== fromIdx + 1) {
    throw new OnboardingTransitionError(
      `Invalid transition: complete ${ONBOARDING_STAGE_ORDER[fromIdx + 1]} first`
    );
  }
  return;
};
