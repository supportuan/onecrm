import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  CommissionPayoutStatus,
  CommissionStatus,
  CommissionRuleType,
  CommissionTrigger,
} from '@prisma/client';

const mockPrisma = {
  agencyPartner: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  agencyReferral: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  application: {
    findUnique: jest.fn(),
  },
  student: {
    update: jest.fn(),
  },
  agencyCommission: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  agencyCommissionRule: {
    findMany: jest.fn(),
  },
  commissionPayout: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  commissionPayoutLine: {
    deleteMany: jest.fn(),
  },
  course: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.unstable_mockModule('../prisma.js', () => ({
  prisma: mockPrisma,
}));

jest.unstable_mockModule('../modules/notifications/recipients.js', () => ({
  safeNotify: jest.fn(() => Promise.resolve()),
}));

const { resolveStudentScopeWhere } = await import('../modules/student-crm/scoping.js');
const { assertAgentOwnsApplication } = await import('../modules/agency-crm/agency-crm.service.js');
const {
  createReferralWithDedup,
  AgencyReferralConflictError,
} = await import('../modules/agency-crm/agency-referral.service.js');
const {
  createPayoutBatch,
  updatePayoutStatus,
  verifyCommission,
} = await import('../modules/agency-crm/agency-payout.service.js');
const {
  computeCommissionAmount,
  getCommissionStatement,
} = await import('../modules/agency-crm/agency-commission.engine.js');
const { hasCapability } = await import('../modules/agency-crm/agency-capabilities.js');
const {
  assertAgentPaymentAction,
  isAgentPaymentActionAllowed,
} = await import('../modules/agency-crm/agency-payment-policy.js');
const {
  isAllowedAgencyDocument,
  AGENCY_DOC_MAX_BYTES,
} = await import('../modules/agency-crm/agency.upload.js');
const {
  assertOnboardingTransition,
  OnboardingTransitionError,
} = await import('../modules/agency-crm/agency-onboarding.machine.js');
const { AgencyOnboardingStage } = await import('@prisma/client');

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (callback: any) => callback(mockPrisma));
});

describe('Phase 5 — agent isolation', () => {
  it('scopes agent A students to their own referrals only', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue({ id: 11, agencyCode: 'AGT-A' });

    const where = await resolveStudentScopeWhere({ id: 101, role: 'AGENT' });

    expect(where).toEqual({
      deletedAt: null,
      OR: [
        { agencyReferrals: { some: { agencyPartnerId: 11 } } },
        { source: 'AGT-A' },
      ],
    });
  });

  it('returns impossible id filter when agent has no partner profile', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(null);
    const where = await resolveStudentScopeWhere({ id: 102, role: 'AGENCY_FREELANCER' });
    expect(where).toEqual({ deletedAt: null, id: -1 });
  });

  it('blocks agent B from paying on agent A application', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue({
      id: 22,
      capabilities: { canPayFees: true },
    });
    mockPrisma.application.findUnique.mockResolvedValue({
      id: 500,
      studentId: 9,
      student: { userId: 900 },
    });
    mockPrisma.agencyReferral.findFirst.mockResolvedValue(null);

    await expect(
      assertAgentOwnsApplication({ id: 202, role: 'AGENT' }, 500)
    ).rejects.toThrow('forbidden');
  });

  it('allows owning agent to access referred application', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue({
      id: 11,
      capabilities: { canPayFees: true },
    });
    mockPrisma.application.findUnique.mockResolvedValue({
      id: 500,
      studentId: 9,
      student: { userId: 900 },
    });
    mockPrisma.agencyReferral.findFirst.mockResolvedValue({
      id: 1,
      agencyPartnerId: 11,
      applicationId: 500,
    });

    const result = await assertAgentOwnsApplication({ id: 101, role: 'AGENT' }, 500);
    expect(result.partner.id).toBe(11);
    expect(result.application.id).toBe(500);
  });
});

describe('Phase 5 — duplicate referral claims', () => {
  it('rejects student claim already owned by another agent', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue({
      id: 11,
      agencyCode: 'AGT-A',
    });
    mockPrisma.agencyReferral.findFirst.mockResolvedValue({
      id: 99,
      agencyPartnerId: 22,
      studentId: 9,
    });

    await expect(
      createReferralWithDedup({ agencyPartnerId: 11, studentId: 9 })
    ).rejects.toThrow(AgencyReferralConflictError);
  });

  it('rejects lead claim already owned by another agent', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue({
      id: 11,
      agencyCode: 'AGT-A',
    });
    mockPrisma.agencyReferral.findFirst.mockResolvedValue({
      id: 88,
      agencyPartnerId: 22,
      leadId: 44,
    });

    await expect(
      createReferralWithDedup({ agencyPartnerId: 11, leadId: 44 })
    ).rejects.toThrow(/already attributed/);
  });

  it('updates existing own referral instead of duplicating', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue({
      id: 11,
      agencyCode: 'AGT-A',
    });
    mockPrisma.agencyReferral.findFirst.mockResolvedValue({
      id: 77,
      agencyPartnerId: 11,
      studentId: 9,
      applicationId: null,
      status: 'REFERRED',
      notes: null,
    });
    mockPrisma.agencyReferral.update.mockResolvedValue({ id: 77, agencyPartnerId: 11 });

    const row = await createReferralWithDedup({
      agencyPartnerId: 11,
      studentId: 9,
      applicationId: 500,
    });
    expect(row.id).toBe(77);
    expect(mockPrisma.agencyReferral.create).not.toHaveBeenCalled();
    expect(mockPrisma.agencyReferral.update).toHaveBeenCalled();
  });
});

describe('Phase 5 — onboarding transitions', () => {
  it('blocks agent from admin stages and backwards moves', () => {
    expect(() =>
      assertOnboardingTransition({
        from: AgencyOnboardingStage.AGREEMENT_SIGNED,
        to: AgencyOnboardingStage.ACTIVE,
        actorRole: 'AGENT',
      })
    ).toThrow(OnboardingTransitionError);

    expect(() =>
      assertOnboardingTransition({
        from: AgencyOnboardingStage.VERIFIED,
        to: AgencyOnboardingStage.DOCS_SUBMITTED,
        actorRole: 'GLOBAL_ADMIN',
      })
    ).toThrow(OnboardingTransitionError);
  });
});

describe('Phase 5 — commission engine + payout reconciliation', () => {
  it('computes percentage commission from tuition base', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue({
      id: 11,
      commissionRate: 10,
    });
    mockPrisma.agencyCommissionRule.findMany.mockResolvedValue([
      {
        id: 1,
        agencyPartnerId: 11,
        country: null,
        university: null,
        ruleType: CommissionRuleType.PERCENTAGE,
        amount: 12,
        trigger: CommissionTrigger.ENROLLED,
        isActive: true,
      },
    ]);
    mockPrisma.course.findFirst.mockResolvedValue({ tuitionFee: '₹1,00,000' });

    const amount = await computeCommissionAmount({
      agencyPartnerId: 11,
      trigger: CommissionTrigger.ENROLLED,
      university: 'Oxford',
      course: 'MBA',
    });
    expect(amount).toBe(12000);
  });

  it('uses FIXED rule amount when configured', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue({
      id: 11,
      commissionRate: 10,
    });
    mockPrisma.agencyCommissionRule.findMany.mockResolvedValue([
      {
        id: 2,
        agencyPartnerId: 11,
        country: null,
        university: null,
        ruleType: CommissionRuleType.FIXED,
        amount: 2500,
        trigger: CommissionTrigger.ENROLLED,
        isActive: true,
      },
    ]);
    mockPrisma.course.findFirst.mockResolvedValue(null);

    const amount = await computeCommissionAmount({
      agencyPartnerId: 11,
      trigger: CommissionTrigger.ENROLLED,
    });
    expect(amount).toBe(2500);
  });

  it('aggregates statement totals by status', async () => {
    mockPrisma.agencyCommission.findMany.mockResolvedValue([
      { amount: 1000, status: CommissionStatus.PENDING },
      { amount: 2000, status: CommissionStatus.APPROVED },
      { amount: 500, status: CommissionStatus.PAID },
    ]);

    const statement = await getCommissionStatement({ agencyPartnerId: 11 });
    expect(statement.totals).toEqual({
      count: 3,
      amount: 3500,
      paid: 500,
      pending: 1000,
      approved: 2000,
    });
  });

  it('creates payout batch only for APPROVED unpaid commissions and sums totals', async () => {
    mockPrisma.agencyCommission.findMany.mockResolvedValue([
      { id: 1, amount: 1000, currency: 'INR', agencyPartnerId: 11 },
      { id: 2, amount: 500, currency: 'INR', agencyPartnerId: 11 },
    ]);
    mockPrisma.commissionPayout.create.mockResolvedValue({
      id: 10,
      totalAmount: 1500,
      lines: [{ commissionId: 1 }, { commissionId: 2 }],
    });

    const payout = await createPayoutBatch({
      commissionIds: [1, 2],
      period: '2026-Q3',
      createdById: 1,
    });

    expect(payout.totalAmount).toBe(1500);
    expect(mockPrisma.commissionPayout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 1500,
          currency: 'INR',
          status: CommissionPayoutStatus.DRAFT,
        }),
      })
    );
  });

  it('rejects payout when commission set is incomplete or mixed currency', async () => {
    mockPrisma.agencyCommission.findMany.mockResolvedValue([
      { id: 1, amount: 1000, currency: 'INR', agencyPartnerId: 11 },
    ]);
    await expect(createPayoutBatch({ commissionIds: [1, 2] })).rejects.toThrow(
      /missing, not APPROVED/
    );

    mockPrisma.agencyCommission.findMany.mockResolvedValue([
      { id: 1, amount: 1000, currency: 'INR', agencyPartnerId: 11 },
      { id: 2, amount: 500, currency: 'GBP', agencyPartnerId: 11 },
    ]);
    await expect(createPayoutBatch({ commissionIds: [1, 2] })).rejects.toThrow(
      /same currency/
    );
  });

  it('marks commissions PAID when payout is marked paid', async () => {
    mockPrisma.commissionPayout.findUnique.mockResolvedValue({
      id: 10,
      status: CommissionPayoutStatus.DRAFT,
      notes: null,
      paidAt: null,
      lines: [{ commissionId: 1 }, { commissionId: 2 }],
    });
    mockPrisma.commissionPayout.update.mockResolvedValue({
      id: 10,
      status: CommissionPayoutStatus.PAID,
      lines: [],
    });

    await updatePayoutStatus(10, CommissionPayoutStatus.PAID);

    expect(mockPrisma.agencyCommission.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] } },
      data: expect.objectContaining({ status: CommissionStatus.PAID }),
    });
  });

  it('does not re-verify paid commissions', async () => {
    mockPrisma.agencyCommission.findUnique.mockResolvedValue({
      id: 1,
      status: CommissionStatus.PAID,
      description: null,
      agencyPartner: null,
    });
    await expect(verifyCommission(1, 99, { approve: true })).rejects.toThrow(
      /cannot be re-verified/
    );
  });
});

describe('Phase 5 — payment ACL & refund denial', () => {
  it('defaults canPayFees to false', () => {
    expect(hasCapability(null, 'canPayFees')).toBe(false);
    expect(hasCapability({ canPayFees: true }, 'canPayFees')).toBe(true);
  });

  it('allows only create-order and verify for agents', () => {
    expect(isAgentPaymentActionAllowed('create-order')).toBe(true);
    expect(isAgentPaymentActionAllowed('verify')).toBe(true);
    expect(isAgentPaymentActionAllowed('refund')).toBe(false);
    expect(() => assertAgentPaymentAction('refund')).toThrow(
      /cannot perform this payment action/
    );
    expect(() => assertAgentPaymentAction('capture')).toThrow();
  });
});

describe('Phase 5 — upload type / size limits', () => {
  it('enforces 20MB max upload size', () => {
    expect(AGENCY_DOC_MAX_BYTES).toBe(20 * 1024 * 1024);
  });

  it('allows common document types', () => {
    expect(isAllowedAgencyDocument('passport.pdf', 'application/pdf')).toBe(true);
    expect(isAllowedAgencyDocument('id.PNG', 'image/png')).toBe(true);
    expect(isAllowedAgencyDocument('agreement.docx')).toBe(true);
  });

  it('rejects executables, scripts, and path tricks', () => {
    expect(isAllowedAgencyDocument('malware.exe')).toBe(false);
    expect(isAllowedAgencyDocument('payload.pdf.exe')).toBe(false);
    expect(isAllowedAgencyDocument('note.html')).toBe(false);
    expect(isAllowedAgencyDocument('../secret.pdf')).toBe(false);
    expect(isAllowedAgencyDocument('folder/file.pdf')).toBe(false);
    expect(isAllowedAgencyDocument('photo.svg', 'image/svg+xml')).toBe(false);
  });

  it('rejects disallowed MIME even when extension looks valid', () => {
    expect(isAllowedAgencyDocument('file.pdf', 'application/x-msdownload')).toBe(false);
  });
});
