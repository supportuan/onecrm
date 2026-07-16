import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ──────────────────────────────────────────────
// Prisma mock
// ──────────────────────────────────────────────
const mockPrisma = {
  agencyPartner: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  agencyReferral: {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  agencyCommission: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  application: {
    count: jest.fn(),
  },
  student: {
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.unstable_mockModule('../prisma.js', () => ({ prisma: mockPrisma }));

jest.unstable_mockModule('../utils/password.js', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
}));

jest.unstable_mockModule('../modules/agency-crm/agency-partner.lifecycle.js', () => ({
  uniqueAgencyCode: jest.fn().mockResolvedValue('AGENCY-CODE-001'),
  syncUserAgencyDetails: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../modules/agency-crm/agency-referral.service.js', () => ({
  createReferralWithDedup: jest.fn().mockResolvedValue({ id: 1 }),
  attachReferralToLead: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../modules/agency-crm/scoping.js', () => ({
  hasFullAgencyAccess: jest.fn().mockReturnValue(true),   // default: admin has full access
  isAgencyPartnerUser: jest.fn().mockReturnValue(false),  // default: not an agency partner user
}));

const agencyCrmService = await import('../modules/agency-crm/agency-crm.service.js');
const { isAgencyPartnerUser, hasFullAgencyAccess } = await import('../modules/agency-crm/scoping.js');

// ──────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────
const mockPartner = {
  id: 1,
  agencyCode: 'ACME-001',
  agencyName: 'Acme Agency',
  userId: 10,
  status: 'ACTIVE',
  address: '123 Main St',
  city: 'Mumbai',
  country: 'IN',
  services: 'Consulting',
  user: { id: 10, fullName: 'Agency Owner', email: 'owner@acme.com', phone: null, role: 'AGENT', isActive: true },
};

beforeEach(() => {
  jest.clearAllMocks();
  // Sensible defaults for each test
  (isAgencyPartnerUser as jest.Mock).mockReturnValue(false);
  (hasFullAgencyAccess as jest.Mock).mockReturnValue(true);
  mockPrisma.$transaction.mockImplementation(async (cb: any) =>
    typeof cb === 'function' ? cb(mockPrisma) : Promise.all(cb)
  );
});

// ═══════════════════════════════════════════════════════════
// 1. getStatistics
// ═══════════════════════════════════════════════════════════
describe('getStatistics', () => {
  it('returns zero statistics when agency user has no partner', async () => {
    (isAgencyPartnerUser as jest.Mock).mockReturnValue(true);
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(null);

    const result = await agencyCrmService.getStatistics({ id: 99, role: 'AGENT' });

    expect(result.totalReferrals).toBe(0);
    expect(result.activeStudents).toBe(0);
    expect(result.totalCommissionAmount).toBe(0);
  });

  it('returns correct counts for admin user (no partner scoping)', async () => {
    (isAgencyPartnerUser as jest.Mock).mockReturnValue(false);
    mockPrisma.agencyReferral.count.mockResolvedValue(10);
    mockPrisma.agencyCommission.findMany.mockResolvedValue([
      { status: 'PAID', amount: 500, agencyPartnerId: 1 },
      { status: 'PENDING', amount: 200, agencyPartnerId: 2 },
    ]);
    mockPrisma.application.count.mockResolvedValue(15);
    mockPrisma.student.findMany.mockResolvedValue([
      { id: 1, isEnrolled: true },
      { id: 2, isEnrolled: false },
    ]);

    const result = await agencyCrmService.getStatistics({ id: 1, role: 'GLOBAL_ADMIN' });

    expect(result.totalReferrals).toBe(10);
    expect(result.totalApplications).toBe(15);
    expect(typeof result.totalCommissionAmount).toBe('number');
  });

  it('calculates paidCommissions and pendingCommissions separately', async () => {
    (isAgencyPartnerUser as jest.Mock).mockReturnValue(false);
    mockPrisma.agencyReferral.count.mockResolvedValue(5);
    mockPrisma.agencyCommission.findMany.mockResolvedValue([
      { status: 'PAID', amount: 1000, agencyPartnerId: 1 },
      { status: 'PAID', amount: 500, agencyPartnerId: 1 },
      { status: 'PENDING', amount: 250, agencyPartnerId: 1 },
    ]);
    mockPrisma.application.count.mockResolvedValue(3);
    mockPrisma.student.findMany.mockResolvedValue([]);

    const result = await agencyCrmService.getStatistics(undefined);

    expect(result.paidCommissions).toBe(2);
    expect(result.pendingCommissions).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════
// 2. getPartnerByUserId
// ═══════════════════════════════════════════════════════════
describe('getPartnerByUserId', () => {
  it('returns partner for valid userId', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(mockPartner);

    const result = await agencyCrmService.getPartnerByUserId(10);

    expect(result).toEqual(mockPartner);
    expect(mockPrisma.agencyPartner.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 10 } })
    );
  });

  it('returns null when no partner for userId', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(null);
    const result = await agencyCrmService.getPartnerByUserId(999);
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// 3. listPartners — returns a plain array (not paginated)
// ═══════════════════════════════════════════════════════════
describe('listPartners', () => {
  it('returns all partners for admin actor', async () => {
    // admin actor: isAgencyPartnerUser=false → uses findMany
    mockPrisma.agencyPartner.findMany.mockResolvedValue([mockPartner]);

    const result = await agencyCrmService.listPartners({ actor: { id: 1, role: 'GLOBAL_ADMIN' } });

    expect(Array.isArray(result)).toBe(true);
    expect((result as any[]).length).toBe(1);
  });

  it('returns empty array when no partners match', async () => {
    mockPrisma.agencyPartner.findMany.mockResolvedValue([]);

    const result = await agencyCrmService.listPartners({ actor: { id: 1, role: 'GLOBAL_ADMIN' } });

    expect(result).toEqual([]);
  });

  it('filters by status', async () => {
    mockPrisma.agencyPartner.findMany.mockResolvedValue([]);

    await agencyCrmService.listPartners({ actor: { id: 1, role: 'GLOBAL_ADMIN' }, status: 'ACTIVE' as any });

    const [[call]] = (mockPrisma.agencyPartner.findMany as jest.Mock).mock.calls as any;
    expect(call.where.status).toBe('ACTIVE');
  });

  it('applies search filter on agency name / code / email / contactPerson', async () => {
    mockPrisma.agencyPartner.findMany.mockResolvedValue([]);

    await agencyCrmService.listPartners({ actor: { id: 1, role: 'GLOBAL_ADMIN' }, search: 'Acme' });

    const [[call]] = (mockPrisma.agencyPartner.findMany as jest.Mock).mock.calls as any;
    expect(JSON.stringify(call.where)).toContain('Acme');
  });

  it('returns only own partner for agency actor (short-circuits to findUnique)', async () => {
    (isAgencyPartnerUser as jest.Mock).mockReturnValue(true);
    // getPartnerByUserId calls findUnique with { userId }
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(mockPartner);

    const result = await agencyCrmService.listPartners({ actor: { id: 10, role: 'AGENT' } });

    expect(Array.isArray(result)).toBe(true);
    expect((result as any[]).length).toBe(1);
    expect((result as any[])[0].id).toBe(1);
  });

  it('returns empty array when agency actor has no partner', async () => {
    (isAgencyPartnerUser as jest.Mock).mockReturnValue(true);
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(null);

    const result = await agencyCrmService.listPartners({ actor: { id: 10, role: 'AGENT' } });

    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════
// 4. createPartner
// ═══════════════════════════════════════════════════════════
describe('createPartner', () => {
  it('creates a partner successfully when userId is provided and no existing partner', async () => {
    // Must mock findUnique to return null so the duplicate-check passes
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(null);
    mockPrisma.agencyPartner.create.mockResolvedValue(mockPartner);

    const result = await agencyCrmService.createPartner({
      agencyName: 'Acme Agency',
      userId: 10,
    });

    expect(mockPrisma.agencyPartner.create).toHaveBeenCalled();
    expect(result).toEqual(mockPartner);
  });

  it('throws when a partner already exists for the userId', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(mockPartner);

    await expect(
      agencyCrmService.createPartner({ agencyName: 'Dup Agency', userId: 10 })
    ).rejects.toThrow('agency partner already exists for this user');
  });

  it('throws when userId is absent and required fields are missing', async () => {
    await expect(
      agencyCrmService.createPartner({ agencyName: 'New Agency' })
    ).rejects.toThrow('email, fullName, and password are required');
  });

  it('creates a new user and partner when no userId is supplied', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);           // email not taken
    mockPrisma.user.create.mockResolvedValue({ id: 99 });         // create user
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(null);  // no existing partner
    mockPrisma.agencyPartner.create.mockResolvedValue({ ...mockPartner, userId: 99 });

    const result = await agencyCrmService.createPartner({
      agencyName: 'New Agency',
      email: 'new@agency.com',
      fullName: 'New Owner',
      password: 'pass123',
    });

    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockPrisma.agencyPartner.create).toHaveBeenCalled();
    expect((result as any).userId).toBe(99);
  });

  it('throws when user email is already taken during partner creation', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 5 }); // email already taken

    await expect(
      agencyCrmService.createPartner({
        agencyName: 'Another Agency',
        email: 'taken@agency.com',
        fullName: 'Owner',
        password: 'pass',
      })
    ).rejects.toThrow('user with this email already exists');
  });

  it('propagates DB errors from prisma.create', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(null);
    mockPrisma.agencyPartner.create.mockRejectedValue(new Error('DB constraint'));

    await expect(
      agencyCrmService.createPartner({ agencyName: 'Dup Agency', userId: 10 })
    ).rejects.toThrow('DB constraint');
  });
});

// ═══════════════════════════════════════════════════════════
// 5. updatePartner
// ═══════════════════════════════════════════════════════════
describe('updatePartner', () => {
  it('updates a partner by id for an admin actor', async () => {
    (hasFullAgencyAccess as jest.Mock).mockReturnValue(true);
    // getPartner internally calls findUnique
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(mockPartner);
    mockPrisma.agencyPartner.update.mockResolvedValue({ ...mockPartner, agencyName: 'Updated Agency' });

    const result = await agencyCrmService.updatePartner(
      1,
      { agencyName: 'Updated Agency' },
      { id: 1, role: 'GLOBAL_ADMIN' }
    );

    expect((result as any).agencyName).toBe('Updated Agency');
  });

  it('throws when partner does not exist', async () => {
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(null);

    await expect(
      agencyCrmService.updatePartner(999, { agencyName: 'Ghost' }, { id: 1, role: 'GLOBAL_ADMIN' })
    ).rejects.toThrow('partner not found');
  });

  it('throws forbidden when actor has no agency access', async () => {
    (hasFullAgencyAccess as jest.Mock).mockReturnValue(false);
    (isAgencyPartnerUser as jest.Mock).mockReturnValue(false);
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(mockPartner);

    await expect(
      agencyCrmService.updatePartner(1, { agencyName: 'Hacker' }, { id: 99, role: 'COUNSELLOR' })
    ).rejects.toThrow('forbidden');
  });

  it('strips restricted fields when actor is an agency partner user', async () => {
    (isAgencyPartnerUser as jest.Mock).mockReturnValue(true);
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(mockPartner);
    mockPrisma.agencyPartner.update.mockResolvedValue({ ...mockPartner, contactPerson: 'Updated Contact' });

    const result = await agencyCrmService.updatePartner(
      1,
      { contactPerson: 'Updated Contact', commissionRate: 99, status: 'INACTIVE' as any },
      { id: 10, role: 'AGENT' }
    );

    // commissionRate and status must not be sent to update
    const updateCall = (mockPrisma.agencyPartner.update as jest.Mock).mock.calls[0][0] as any;
    expect(updateCall.data.commissionRate).toBeUndefined();
    expect(updateCall.data.status).toBeUndefined();
    expect((result as any).contactPerson).toBe('Updated Contact');
  });
});

// ═══════════════════════════════════════════════════════════
// 6. listCommissions — paginated { items, total, page, totalPages }
// ═══════════════════════════════════════════════════════════
describe('listCommissions', () => {
  it('returns all commissions for admin', async () => {
    const commissions = [
      { id: 1, amount: 500, status: 'PAID', agencyPartnerId: 1 },
      { id: 2, amount: 200, status: 'PENDING', agencyPartnerId: 2 },
    ];
    mockPrisma.agencyCommission.findMany.mockResolvedValue(commissions);
    mockPrisma.agencyCommission.count.mockResolvedValue(2);

    const result = await agencyCrmService.listCommissions({ actor: { id: 1, role: 'GLOBAL_ADMIN' } });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('filters commissions by status', async () => {
    mockPrisma.agencyCommission.findMany.mockResolvedValue([]);
    mockPrisma.agencyCommission.count.mockResolvedValue(0);

    await agencyCrmService.listCommissions({ actor: { id: 1, role: 'GLOBAL_ADMIN' }, status: 'PENDING' as any });

    const [[call]] = (mockPrisma.agencyCommission.findMany as jest.Mock).mock.calls as any;
    expect(call.where.status).toBe('PENDING');
  });

  it('returns empty list when no commissions exist', async () => {
    mockPrisma.agencyCommission.findMany.mockResolvedValue([]);
    mockPrisma.agencyCommission.count.mockResolvedValue(0);

    const result = await agencyCrmService.listCommissions({ actor: { id: 1, role: 'GLOBAL_ADMIN' } });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns zero results for agency actor with no partner', async () => {
    (isAgencyPartnerUser as jest.Mock).mockReturnValue(true);
    mockPrisma.agencyPartner.findUnique.mockResolvedValue(null); // resolvePartnerForActor returns null

    const result = await agencyCrmService.listCommissions({ actor: { id: 99, role: 'AGENT' } });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('respects pagination params', async () => {
    mockPrisma.agencyCommission.findMany.mockResolvedValue([]);
    mockPrisma.agencyCommission.count.mockResolvedValue(100);

    const result = await agencyCrmService.listCommissions({
      actor: { id: 1, role: 'GLOBAL_ADMIN' },
      page: 3,
      limit: 10,
    });

    expect(result.page).toBe(3);
    expect(result.totalPages).toBe(10);
    const [[call]] = (mockPrisma.agencyCommission.findMany as jest.Mock).mock.calls as any;
    expect(call.skip).toBe(20);
    expect(call.take).toBe(10);
  });
});
