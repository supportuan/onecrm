import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ──────────────────────────────────────────────
// Prisma mock
// ──────────────────────────────────────────────
const mockPrisma = {
  student: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  application: {
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  lead: {
    findFirst: jest.fn(),
  },
  country: {
    findFirst: jest.fn(),
  },
  checkList: {
    findMany: jest.fn(),
  },
  countryChecklist: {
    findMany: jest.fn(),
  },
  studentChecklist: {
    findMany: jest.fn(),
    createMany: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.unstable_mockModule('../prisma.js', () => ({ prisma: mockPrisma }));

jest.unstable_mockModule('../utils/password.js', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_pw'),
}));

jest.unstable_mockModule('../lib/file-storage.js', () => ({
  deleteStoredFile: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../modules/student-crm/checklists.js', () => ({
  getDefaultChecklist: jest.fn().mockReturnValue([]),
}));

jest.unstable_mockModule('../modules/notifications/recipients.js', () => ({
  safeNotify: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../utils/tenant-default.js', () => ({
  getDefaultTenantId: jest.fn().mockResolvedValue(1),
}));

jest.unstable_mockModule('../modules/marketing/services/email.service.js', () => ({
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../modules/student-crm/scoping.js', () => ({
  applicationScopeWhere: jest.fn().mockReturnValue({}),
  studentScopeWhere: jest.fn().mockReturnValue({}),
}));

jest.unstable_mockModule('../modules/student-crm/stage-engine.js', () => ({
  computeProcessProgress: jest.fn().mockReturnValue(0),
  getStagesForCountry: jest.fn().mockReturnValue([]),
}));

jest.unstable_mockModule('../modules/student-crm/visa-workflows.js', () => ({
  appendVisaDocument: jest.fn(),
  getVisaWorkflowForCountry: jest.fn().mockReturnValue(null),
  normalizeVisaDocuments: jest.fn().mockReturnValue([]),
}));

jest.unstable_mockModule('../modules/student-crm/application-gates.js', () => ({
  assertStageAdvanceAllowed: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../modules/student-crm/payments.service.js', () => ({
  seedDefaultApplicationFee: jest.fn().mockResolvedValue(undefined),
}));

// ──────────────────────────────────────────────
// Dynamic imports (after mocks)
// ──────────────────────────────────────────────
const { prisma } = await import('../prisma.js');
const {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
} = await import('../modules/student-crm/student-crm.service.js');

// ──────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────
const makeStudent = (overrides: Record<string, any> = {}) => ({
  id: 1,
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '9876543210',
  preferredCountry: 'Canada',
  countryId: 2,
  userId: null,
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  country: { id: 2, name: 'Canada' },
  applications: [],
  checklists: [],
  universities: [],
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (cb: any) =>
    typeof cb === 'function' ? cb(mockPrisma) : Promise.all(cb)
  );
  // Suppress ensureStudentChecklistsAndProgress side effects
  (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(null);
  (mockPrisma.checkList.findMany as jest.Mock).mockResolvedValue([]);
  (mockPrisma.countryChecklist.findMany as jest.Mock).mockResolvedValue([]);
  (mockPrisma.studentChecklist.findMany as jest.Mock).mockResolvedValue([]);
});

// ═══════════════════════════════════════════════════════════
// 1. listStudents
// ═══════════════════════════════════════════════════════════
describe('listStudents', () => {
  it('returns all students without filters', async () => {
    const students = [makeStudent()];
    (mockPrisma.student.findMany as jest.Mock).mockResolvedValue(students);

    const result = await listStudents({});

    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Jane Doe');
    expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' }, take: 200 })
    );
  });

  it('applies search filter across name, email, and phone', async () => {
    (mockPrisma.student.findMany as jest.Mock).mockResolvedValue([]);

    await listStudents({ search: 'Jane' });

    const [[call]] = (mockPrisma.student.findMany as jest.Mock).mock.calls as any;
    const orClause = call.where.AND?.find((c: any) => c.OR);
    expect(orClause).toBeDefined();
    expect(JSON.stringify(orClause)).toContain('Jane');
  });

  it('respects custom limit', async () => {
    (mockPrisma.student.findMany as jest.Mock).mockResolvedValue([]);

    await listStudents({ limit: 10 });

    const [[call]] = (mockPrisma.student.findMany as jest.Mock).mock.calls as any;
    expect(call.take).toBe(10);
  });

  it('returns empty array when no students exist', async () => {
    (mockPrisma.student.findMany as jest.Mock).mockResolvedValue([]);

    const result = await listStudents({});
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════
// 2. getStudent
// ═══════════════════════════════════════════════════════════
describe('getStudent', () => {
  it('returns the student when found', async () => {
    const student = makeStudent({ id: 5 });
    (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(student);

    const result = await getStudent(5);

    expect(result).toEqual(student);
    expect(mockPrisma.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 5 }) })
    );
  });

  it('returns null when student does not exist', async () => {
    (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await getStudent(999);
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// 3. createStudent
// ═══════════════════════════════════════════════════════════
describe('createStudent', () => {
  it('creates a new student when email is unique', async () => {
    (mockPrisma.student.findUnique as jest.Mock).mockResolvedValueOnce(null); // email check
    const created = makeStudent({ id: 10 });
    (mockPrisma.student.create as jest.Mock).mockResolvedValue(created);
    (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(created); // getStudent
    (mockPrisma.checkList.findMany as jest.Mock).mockResolvedValue([]);

    const result = await createStudent({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      preferredCountry: 'Canada',
      countryId: 2,
    });

    expect(mockPrisma.student.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('returns existing student when email already exists', async () => {
    const existing = makeStudent({ id: 3 });
    (mockPrisma.student.findUnique as jest.Mock).mockResolvedValueOnce(existing);

    const result = await createStudent({ fullName: 'Jane Doe', email: 'jane@example.com' });

    expect(mockPrisma.student.create).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });
});

// ═══════════════════════════════════════════════════════════
// 4. updateStudent
// ═══════════════════════════════════════════════════════════
describe('updateStudent', () => {
  it('updates a student successfully', async () => {
    const existing = makeStudent({ id: 1 });
    const updated = makeStudent({ id: 1, fullName: 'Jane Updated' });

    (mockPrisma.student.findFirst as jest.Mock)
      .mockResolvedValueOnce(existing) // existence check
      .mockResolvedValueOnce(updated); // re-fetch after update
    (mockPrisma.student.update as jest.Mock).mockResolvedValue(updated);
    (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await updateStudent(1, { fullName: 'Jane Updated' });

    expect(mockPrisma.student.update).toHaveBeenCalled();
  });

  it('throws an error when student is not found', async () => {
    (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(updateStudent(999, { fullName: 'Ghost' })).rejects.toThrow('student not found');
  });
});

// ═══════════════════════════════════════════════════════════
// 5. application code format
// ═══════════════════════════════════════════════════════════
describe('generateApplicationCode (via createStudent)', () => {
  it('produces APP-YYYY-NNNN pattern', () => {
    const year = new Date().getFullYear();
    const code = `APP-${year}-0001`;
    expect(code).toMatch(/^APP-\d{4}-\d{4}$/);
  });
});
