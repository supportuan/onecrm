import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ──────────────────────────────────────────────
// Prisma mock
// ──────────────────────────────────────────────
const mockPrisma = {
  lead: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  leadActivity: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  leadSource: {
    findMany: jest.fn(),
  },
  student: {
    findFirst: jest.fn(),
  },
  campaign: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  campaignLead: {
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.unstable_mockModule('../prisma.js', () => ({ prisma: mockPrisma }));

// ──────────────────────────────────────────────
// External service mocks
// ──────────────────────────────────────────────
jest.unstable_mockModule('../utils/validation.js', () => ({
  validateDuplicateLead: jest.fn(),
  normalizeEmail: jest.fn((v: any) => (v ? String(v).trim().toLowerCase() : v)),
  normalizePhone: jest.fn((v: any) => (v ? String(v).trim() : v)),
  normalizeValue: jest.fn((v: any) => (v ? String(v).trim().toLowerCase() : v)),
}));

jest.unstable_mockModule('../modules/marketing/services/emailTemplate.service.js', () => ({
  buildCampaignEmailTemplate: jest.fn(() => '<html>mock email</html>'),
}));

jest.unstable_mockModule('../modules/marketing/services/metaInsights.service.js', () => ({
  syncMetaCampaignInsights: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../modules/marketing/services/metaAd.service.js', () => ({
  createAd: jest.fn().mockResolvedValue('meta-ad-id-123'),
}));

jest.unstable_mockModule('../modules/notifications/recipients.js', () => ({
  safeNotify: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../utils/tenant-default.js', () => ({
  getDefaultTenantId: jest.fn().mockResolvedValue(1),
}));

// ──────────────────────────────────────────────
// Dynamic imports (after mocks are registered)
// ──────────────────────────────────────────────
const {
  getLeads,
  getLeadById,
  getSources,
  createLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
  updateLeadRating,
  assignCounsellor,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addCampaignLeads,
} = await import('../modules/marketing/services/marketing.service.js');

const { validateDuplicateLead } = await import('../utils/validation.js');
const { buildCampaignEmailTemplate } = await import('../modules/marketing/services/emailTemplate.service.js');

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const makeLead = (overrides: Record<string, any> = {}) => ({
  id: 1,
  fullName: 'Alice Smith',
  email: 'alice@example.com',
  phone: '9876543210',
  country: 'India',
  preferredCountry: 'Canada',
  preferredCourse: 'MBA',
  status: 'NEW',
  rating: 'WARM',
  source: { id: 1, name: 'Website' },
  assignedCounsellor: null,
  assignedBy: null,
  remark: null,
  isStudentLoginCreated: false,
  studentUserId: null,
  contactedAt: null,
  qualifiedAt: null,
  proposedAt: null,
  convertedAt: null,
  lostAt: null,
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  // Default $transaction: execute the callback directly
  mockPrisma.$transaction.mockImplementation(async (cbOrArr: any) => {
    if (typeof cbOrArr === 'function') return cbOrArr(mockPrisma);
    // Array form (used by getLeads, getAutomations)
    return Promise.all(cbOrArr);
  });
});

// ═══════════════════════════════════════════════════════════
// 1. getLeads
// ═══════════════════════════════════════════════════════════
describe('getLeads', () => {
  it('returns paginated leads with default params', async () => {
    const leads = [makeLead()];
    mockPrisma.lead.findMany.mockResolvedValue(leads);
    mockPrisma.lead.count.mockResolvedValue(1);

    const result = await getLeads({});

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('filters by status', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.lead.count.mockResolvedValue(0);

    await getLeads({ status: 'QUALIFIED' as any });

    const [[call]] = (mockPrisma.lead.findMany as jest.Mock).mock.calls as any;
    expect(call.where.status).toBe('QUALIFIED');
  });

  it('filters by sourceId', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.lead.count.mockResolvedValue(0);

    await getLeads({ sourceId: 5 });

    const [[call]] = (mockPrisma.lead.findMany as jest.Mock).mock.calls as any;
    expect(call.where.sourceId).toBe(5);
  });

  it('filters by country', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.lead.count.mockResolvedValue(0);

    await getLeads({ country: 'Canada' });

    const [[call]] = (mockPrisma.lead.findMany as jest.Mock).mock.calls as any;
    expect(call.where.country).toEqual({ equals: 'Canada', mode: 'insensitive' });
  });

  it('applies search across name, email, phone, country', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.lead.count.mockResolvedValue(0);

    await getLeads({ search: 'Alice' });

    const [[call]] = (mockPrisma.lead.findMany as jest.Mock).mock.calls as any;
    expect(call.where.OR).toBeDefined();
    expect(call.where.OR.length).toBeGreaterThan(0);
  });

  it('respects custom page and limit', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.lead.count.mockResolvedValue(0);

    const result = await getLeads({ page: 3, limit: 5 });

    expect(result.page).toBe(3);
    expect(result.limit).toBe(5);
    const [[call]] = (mockPrisma.lead.findMany as jest.Mock).mock.calls as any;
    expect(call.skip).toBe(10);
    expect(call.take).toBe(5);
  });

  it('builds interestedIn from course and country', async () => {
    const lead = makeLead({ preferredCourse: 'Engineering', preferredCountry: 'UK' });
    mockPrisma.lead.findMany.mockResolvedValue([lead]);
    mockPrisma.lead.count.mockResolvedValue(1);

    const result = await getLeads({});
    expect(result.items[0].interestedIn).toBe('Engineering in UK');
  });

  it('returns only country when course is absent', async () => {
    const lead = makeLead({ preferredCourse: null, preferredCountry: 'Australia' });
    mockPrisma.lead.findMany.mockResolvedValue([lead]);
    mockPrisma.lead.count.mockResolvedValue(1);

    const result = await getLeads({});
    expect(result.items[0].interestedIn).toBe('Australia');
  });
});

// ═══════════════════════════════════════════════════════════
// 2. getLeadById
// ═══════════════════════════════════════════════════════════
describe('getLeadById', () => {
  it('returns the lead when found', async () => {
    const lead = makeLead({ id: 7 });
    mockPrisma.lead.findFirst.mockResolvedValue(lead);

    const result = await getLeadById(7);
    expect(result).toEqual(lead);
    expect(mockPrisma.lead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 7, deletedAt: null }) })
    );
  });

  it('returns null for soft-deleted or non-existent lead', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    const result = await getLeadById(999);
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// 3. getSources
// ═══════════════════════════════════════════════════════════
describe('getSources', () => {
  it('returns lead sources ordered by name', async () => {
    const sources = [{ id: 1, name: 'Website' }, { id: 2, name: 'Referral' }];
    mockPrisma.leadSource.findMany.mockResolvedValue(sources);

    const result = await getSources();
    expect(result).toEqual(sources);
    expect(mockPrisma.leadSource.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
  });

  it('returns empty array when no sources exist', async () => {
    mockPrisma.leadSource.findMany.mockResolvedValue([]);
    const result = await getSources();
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════
// 4. createLead
// ═══════════════════════════════════════════════════════════
describe('createLead', () => {
  it('creates a lead when email and phone are unique', async () => {
    (validateDuplicateLead as jest.Mock).mockResolvedValue(undefined);
    const created = makeLead({ id: 10 });
    mockPrisma.lead.create.mockResolvedValue(created);

    const result = await createLead({
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      phone: '9876543210',
    });

    expect(validateDuplicateLead).toHaveBeenCalled();
    expect(mockPrisma.lead.create).toHaveBeenCalled();
    expect(result.id).toBe(10);
  });

  it('throws when duplicate lead exists', async () => {
    (validateDuplicateLead as jest.Mock).mockRejectedValue(new Error('Duplicate email'));

    await expect(
      createLead({ fullName: 'Bob', email: 'dup@example.com', phone: '1111111111' })
    ).rejects.toThrow('Duplicate email');

    expect(mockPrisma.lead.create).not.toHaveBeenCalled();
  });

  it('strips referralCode from the stored data', async () => {
    (validateDuplicateLead as jest.Mock).mockResolvedValue(undefined);
    mockPrisma.lead.create.mockResolvedValue(makeLead({ id: 11 }));

    await createLead({
      fullName: 'Carol',
      email: 'carol@example.com',
      phone: '2222222222',
      referralCode: 'REF123',
    });

    const [[call]] = (mockPrisma.lead.create as jest.Mock).mock.calls as any;
    expect(call.data.referralCode).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════
// 5. updateLead
// ═══════════════════════════════════════════════════════════
describe('updateLead', () => {
  it('updates a lead successfully', async () => {
    const existing = makeLead({ id: 1 });
    const updated = makeLead({ id: 1, fullName: 'Alice Updated', studentUserId: null });
    mockPrisma.lead.findFirst.mockResolvedValue(existing);
    (validateDuplicateLead as jest.Mock).mockResolvedValue(undefined);
    mockPrisma.lead.update.mockResolvedValue(updated);

    const result = await updateLead(1, { fullName: 'Alice Updated' });
    expect(result.fullName).toBe('Alice Updated');
  });

  it('throws when lead does not exist', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);

    await expect(updateLead(999, { fullName: 'Ghost' })).rejects.toThrow('Lead not found');
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });

  it('syncs counsellorId to user when studentUserId is set', async () => {
    const existing = makeLead({ id: 1 });
    const updated = makeLead({ id: 1, studentUserId: 42, assignedCounsellorId: 5 });
    mockPrisma.lead.findFirst.mockResolvedValue(existing);
    (validateDuplicateLead as jest.Mock).mockResolvedValue(undefined);
    mockPrisma.lead.update.mockResolvedValue(updated);
    mockPrisma.user = { update: jest.fn().mockResolvedValue({}) } as any;

    await updateLead(1, { assignedCounsellorId: 5 });
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 }, data: { counsellorId: 5 } })
    );
  });
});

// ═══════════════════════════════════════════════════════════
// 6. deleteLead (soft-delete)
// ═══════════════════════════════════════════════════════════
describe('deleteLead', () => {
  it('soft-deletes by setting deletedAt', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({ id: 1 });
    mockPrisma.lead.update.mockResolvedValue({ id: 1, deletedAt: new Date() });

    const result = await deleteLead(1);

    const [[call]] = (mockPrisma.lead.update as jest.Mock).mock.calls as any;
    expect(call.where).toEqual({ id: 1 });
    expect(call.data.deletedAt).toBeDefined();
    expect(result.deletedAt).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════
// 7. updateLeadStatus
// ═══════════════════════════════════════════════════════════
describe('updateLeadStatus', () => {
  it.each([
    ['CONTACTED', 'contactedAt'],
    ['NOT_CONTACTED', 'notContactedAt'],
    ['CALLBACK', 'callbackAt'],
    ['FOLLOW_UP', 'followUpAt'],
    ['QUALIFIED', 'qualifiedAt'],
    ['PROPOSED', 'proposedAt'],
    ['CONVERTED', 'convertedAt'],
    ['LOST', 'lostAt'],
  ] as const)('sets %s timestamp field when status is %s', async (status, field) => {
    mockPrisma.lead.findFirst.mockResolvedValue(makeLead({ status }));
    mockPrisma.student.findFirst.mockResolvedValue({ id: 1 });
    mockPrisma.lead.update.mockResolvedValue({ id: 1, status });

    await updateLeadStatus(1, status as any);

    const [[call]] = (mockPrisma.lead.update as jest.Mock).mock.calls as any;
    expect(call.data.status).toBe(status);
    expect(call.data[field]).toBeDefined();
  });

  it('does not set extra timestamps for NEW status', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(makeLead());
    mockPrisma.lead.update.mockResolvedValue({ id: 1, status: 'NEW' });

    await updateLeadStatus(1, 'NEW' as any);

    const [[call]] = (mockPrisma.lead.update as jest.Mock).mock.calls as any;
    expect(call.data.contactedAt).toBeUndefined();
    expect(call.data.qualifiedAt).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════
// 8. updateLeadRating
// ═══════════════════════════════════════════════════════════
describe('updateLeadRating', () => {
  it('promotes NEW lead to QUALIFIED when rating is HOT', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({ status: 'NEW', qualifiedAt: null });
    mockPrisma.lead.update.mockResolvedValue({ id: 1, rating: 'HOT', status: 'QUALIFIED' });

    const result = await updateLeadRating(1, 'HOT');

    const [[call]] = (mockPrisma.lead.update as jest.Mock).mock.calls as any;
    expect(call.data.status).toBe('QUALIFIED');
    expect(call.data.qualifiedAt).toBeDefined();
  });

  it('promotes CONTACTED lead to QUALIFIED when rating is WARM', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({ status: 'CONTACTED', qualifiedAt: null });
    mockPrisma.lead.update.mockResolvedValue({ id: 1, rating: 'WARM', status: 'QUALIFIED' });

    await updateLeadRating(1, 'WARM');

    const [[call]] = (mockPrisma.lead.update as jest.Mock).mock.calls as any;
    expect(call.data.status).toBe('QUALIFIED');
  });

  it('does NOT promote already-CONVERTED lead', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({ status: 'CONVERTED', qualifiedAt: new Date() });
    mockPrisma.lead.update.mockResolvedValue({ id: 1, rating: 'HOT', status: 'CONVERTED' });

    await updateLeadRating(1, 'HOT');

    const [[call]] = (mockPrisma.lead.update as jest.Mock).mock.calls as any;
    expect(call.data.status).toBeUndefined();
  });

  it('does NOT promote when rating is COLD', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({ status: 'NEW', qualifiedAt: null });
    mockPrisma.lead.update.mockResolvedValue({ id: 1, rating: 'COLD', status: 'NEW' });

    await updateLeadRating(1, 'COLD');

    const [[call]] = (mockPrisma.lead.update as jest.Mock).mock.calls as any;
    expect(call.data.status).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════
// 9. assignCounsellor
// ═══════════════════════════════════════════════════════════
describe('assignCounsellor', () => {
  it('assigns counsellor and returns updated lead', async () => {
    const lead = makeLead({ id: 1 });
    const updatedLead = makeLead({ id: 1, assignedCounsellorId: 3, studentUserId: null });
    mockPrisma.lead.findFirst.mockResolvedValue(lead);
    mockPrisma.lead.update.mockResolvedValue(updatedLead);

    const result = await assignCounsellor(1, 3, 99);
    expect(result.assignedCounsellorId).toBe(3);
  });

  it('throws when lead does not exist', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);

    await expect(assignCounsellor(999, 3, 99)).rejects.toThrow('Lead not found');
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });

  it('syncs counsellorId to student user when studentUserId exists', async () => {
    const lead = makeLead({ id: 1 });
    const updatedLead = makeLead({ id: 1, studentUserId: 55, assignedCounsellorId: 3 });
    mockPrisma.lead.findFirst.mockResolvedValue(lead);
    mockPrisma.lead.update.mockResolvedValue(updatedLead);
    (mockPrisma as any).user = { update: jest.fn().mockResolvedValue({}) };

    await assignCounsellor(1, 3, 99);

    expect((mockPrisma as any).user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 55 }, data: { counsellorId: 3 } })
    );
  });

  it('accepts null counsellorId (unassign)', async () => {
    const lead = makeLead({ id: 1 });
    const updatedLead = makeLead({ id: 1, assignedCounsellorId: null, studentUserId: null });
    mockPrisma.lead.findFirst.mockResolvedValue(lead);
    mockPrisma.lead.update.mockResolvedValue(updatedLead);

    const result = await assignCounsellor(1, null, 99);
    expect(result.assignedCounsellorId).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// 10. createCampaign
// ═══════════════════════════════════════════════════════════
describe('createCampaign', () => {
  it('builds emailContent for EMAIL campaigns', async () => {
    mockPrisma.campaign.create.mockResolvedValue({ id: 1, type: 'EMAIL', emailContent: '<html>mock email</html>' });

    const result = await createCampaign({ name: 'Newsletter', type: 'EMAIL', budget: 100 });

    expect(buildCampaignEmailTemplate).toHaveBeenCalled();
    const [[call]] = (mockPrisma.campaign.create as jest.Mock).mock.calls as any;
    expect(call.data.emailContent).toBe('<html>mock email</html>');
  });

  it('does not build emailContent for SMS campaigns', async () => {
    mockPrisma.campaign.create.mockResolvedValue({ id: 2, type: 'SMS' });

    await createCampaign({ name: 'SMS Blast', type: 'SMS', budget: 50 });

    expect(buildCampaignEmailTemplate).not.toHaveBeenCalled();
    const [[call]] = (mockPrisma.campaign.create as jest.Mock).mock.calls as any;
    expect(call.data.emailContent).toBeUndefined();
  });

  it('sets metaAdId to undefined for SOCIAL_MEDIA campaigns (does not call Meta API on create)', async () => {
    mockPrisma.campaign.create.mockResolvedValue({ id: 3, type: 'SOCIAL_MEDIA' });

    await createCampaign({ name: 'Meta Campaign', type: 'SOCIAL_MEDIA', budget: 500 });

    const [[call]] = (mockPrisma.campaign.create as jest.Mock).mock.calls as any;
    expect(call.data.metaAdId).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════
// 11. updateCampaign
// ═══════════════════════════════════════════════════════════
describe('updateCampaign', () => {
  it('calls prisma.campaign.update with correct id and data', async () => {
    mockPrisma.campaign.findFirst.mockResolvedValue({ id: 5 });
    mockPrisma.campaign.update.mockResolvedValue({ id: 5, name: 'Updated' });

    const result = await updateCampaign(5, { name: 'Updated', budget: 200 });

    expect(result.name).toBe('Updated');
    const [[call]] = (mockPrisma.campaign.update as jest.Mock).mock.calls as any;
    expect(call.where).toEqual({ id: 5 });
    expect(call.data.name).toBe('Updated');
  });
});

// ═══════════════════════════════════════════════════════════
// 12. deleteCampaign (soft-delete)
// ═══════════════════════════════════════════════════════════
describe('deleteCampaign', () => {
  it('soft-deletes campaign by setting deletedAt', async () => {
    mockPrisma.campaign.findFirst.mockResolvedValue({ id: 5 });
    mockPrisma.campaign.update.mockResolvedValue({ id: 5, deletedAt: new Date() });

    await deleteCampaign(5);

    const [[call]] = (mockPrisma.campaign.update as jest.Mock).mock.calls as any;
    expect(call.where).toEqual({ id: 5 });
    expect(call.data.deletedAt).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════
// 13. addCampaignLeads
// ═══════════════════════════════════════════════════════════
describe('addCampaignLeads', () => {
  it('bulk-creates campaign leads with skipDuplicates', async () => {
    mockPrisma.campaign.findFirst.mockResolvedValue({ id: 10 });
    mockPrisma.lead.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockPrisma.campaignLead.createMany.mockResolvedValue({ count: 2 });

    const result = await addCampaignLeads(10, [1, 2], 'SENT', 'medium');

    const [[call]] = (mockPrisma.campaignLead.createMany as jest.Mock).mock.calls as any;
    expect(call.data).toHaveLength(2);
    expect(call.data[0]).toEqual({ campaignId: 10, leadId: 1, status: 'SENT', engagement: 'medium' });
    expect(call.skipDuplicates).toBe(true);
    expect(result.count).toBe(2);
  });

  it('creates no records for empty leadIds', async () => {
    mockPrisma.campaign.findFirst.mockResolvedValue({ id: 10 });
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.campaignLead.createMany.mockResolvedValue({ count: 0 });

    await addCampaignLeads(10, []);

    const [[call]] = (mockPrisma.campaignLead.createMany as jest.Mock).mock.calls as any;
    expect(call.data).toHaveLength(0);
  });
});