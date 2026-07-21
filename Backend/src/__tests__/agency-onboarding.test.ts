import { describe, it, expect } from '@jest/globals';
import { AgencyOnboardingStage } from '@prisma/client';
import {
  assertOnboardingTransition,
  OnboardingTransitionError,
  AGENT_SELF_SERVICE_STAGES,
  ADMIN_ONBOARDING_STAGES,
} from '../modules/agency-crm/agency-onboarding.machine.js';

describe('agency onboarding state machine', () => {
  it('allows agent to move REGISTERED → DOCS_SUBMITTED', () => {
    expect(() =>
      assertOnboardingTransition({
        from: AgencyOnboardingStage.REGISTERED,
        to: AgencyOnboardingStage.DOCS_SUBMITTED,
        actorRole: 'AGENT',
      })
    ).not.toThrow();
  });

  it('blocks agent from skipping to AGREEMENT_SIGNED', () => {
    expect(() =>
      assertOnboardingTransition({
        from: AgencyOnboardingStage.REGISTERED,
        to: AgencyOnboardingStage.AGREEMENT_SIGNED,
        actorRole: 'AGENT',
      })
    ).toThrow(OnboardingTransitionError);
  });

  it('blocks agent from VERIFIED / APPROVED / ACTIVE', () => {
    for (const to of ADMIN_ONBOARDING_STAGES) {
      expect(() =>
        assertOnboardingTransition({
          from: AgencyOnboardingStage.AGREEMENT_SIGNED,
          to,
          actorRole: 'AGENCY_FREELANCER',
        })
      ).toThrow(OnboardingTransitionError);
    }
  });

  it('allows admin to advance to VERIFIED from AGREEMENT_SIGNED', () => {
    expect(() =>
      assertOnboardingTransition({
        from: AgencyOnboardingStage.AGREEMENT_SIGNED,
        to: AgencyOnboardingStage.VERIFIED,
        actorRole: 'GLOBAL_ADMIN',
      })
    ).not.toThrow();
  });

  it('blocks admin from skipping verification and approval', () => {
    expect(() =>
      assertOnboardingTransition({
        from: AgencyOnboardingStage.AGREEMENT_SIGNED,
        to: AgencyOnboardingStage.ACTIVE,
        actorRole: 'GLOBAL_ADMIN',
      })
    ).toThrow(OnboardingTransitionError);
  });

  it('blocks moving backwards', () => {
    expect(() =>
      assertOnboardingTransition({
        from: AgencyOnboardingStage.AGREEMENT_SIGNED,
        to: AgencyOnboardingStage.DOCS_SUBMITTED,
        actorRole: 'GLOBAL_ADMIN',
      })
    ).toThrow(OnboardingTransitionError);
  });

  it('treats AGENT and AGENCY_FREELANCER the same for self-service stages', () => {
    expect(AGENT_SELF_SERVICE_STAGES.has(AgencyOnboardingStage.DOCS_SUBMITTED)).toBe(true);
    expect(AGENT_SELF_SERVICE_STAGES.has(AgencyOnboardingStage.AGREEMENT_SIGNED)).toBe(true);
  });
});
