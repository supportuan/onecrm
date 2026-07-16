import { describe, it, expect } from '@jest/globals';
import {
  createReferralSchema,
  createPayoutSchema,
  parseBody,
  createAnnouncementSchema,
} from '../modules/agency-crm/agency-crm.validation.js';
import { hasCapability, mergeCapabilities, DEFAULT_AGENT_CAPABILITIES } from '../modules/agency-crm/agency-capabilities.js';
import { isAgencyPartnerUser, hasFullAgencyAccess } from '../modules/agency-crm/scoping.js';

describe('agency-crm validation', () => {
  it('requires a target entity for referrals', () => {
    expect(() => parseBody(createReferralSchema, { agencyPartnerId: 1 })).toThrow();
  });

  it('accepts studentId referral payload', () => {
    const body = parseBody(createReferralSchema, { agencyPartnerId: 1, studentId: 9 });
    expect(body.studentId).toBe(9);
  });

  it('requires commission ids for payout batches', () => {
    expect(() => parseBody(createPayoutSchema, { commissionIds: [] })).toThrow();
    const body = parseBody(createPayoutSchema, { commissionIds: [1, 2], period: '2026-Q1' });
    expect(body.commissionIds).toEqual([1, 2]);
  });

  it('validates announcement title/body', () => {
    const body = parseBody(createAnnouncementSchema, {
      title: 'Policy update',
      body: 'New commission policy effective next month',
      type: 'POLICY',
    });
    expect(body.type).toBe('POLICY');
  });
});

describe('agency capabilities', () => {
  it('defaults canPayFees to false', () => {
    expect(DEFAULT_AGENT_CAPABILITIES.canPayFees).toBe(false);
    expect(hasCapability(null, 'canPayFees')).toBe(false);
  });

  it('merges capability overrides', () => {
    const caps = mergeCapabilities({ canPayFees: true, countries: ['UK'] });
    expect(caps.canPayFees).toBe(true);
    expect(caps.countries).toEqual(['UK']);
    expect(caps.canViewCommission).toBe(true);
  });
});

describe('agency scoping helpers', () => {
  it('treats AGENT and AGENCY_FREELANCER as partner users', () => {
    expect(isAgencyPartnerUser('AGENT')).toBe(true);
    expect(isAgencyPartnerUser('AGENCY_FREELANCER')).toBe(true);
    expect(isAgencyPartnerUser('GLOBAL_ADMIN')).toBe(false);
  });

  it('grants full access only to platform/tenant admins', () => {
    expect(hasFullAgencyAccess('SUPER_ADMIN')).toBe(true);
    expect(hasFullAgencyAccess('GLOBAL_ADMIN')).toBe(true);
    expect(hasFullAgencyAccess('AGENT')).toBe(false);
  });
});
