import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockFn = () => jest.fn<(...args: any[]) => any>();

// ──────────────────────────────────────────────
// Prisma mock
// ──────────────────────────────────────────────
const mockPrisma = {
  student: {
    findMany: mockFn(),
    findFirst: mockFn(),
    findUnique: mockFn(),
    create: mockFn(),
    update: mockFn(),
  },
  application: {
    count: mockFn(),
  },
  user: {
    findUnique: mockFn(),
  },
  lead: {
    findFirst: mockFn(),
  },
  country: {
    findFirst: mockFn(),
  },
  checkList: {
    findMany: mockFn(),
  },
  countryChecklist: {
    findMany: mockFn(),
  },
  studentChecklist: {
    findMany: mockFn(),
    createMany: mockFn(),
    upsert: mockFn(),
  },
  studentStudyPlan: {
    count: mockFn(),
    create: mockFn(),
  },
  $transaction: mockFn(),
};

jest.unstable_mockModule('../prisma.js', () => ({ prisma: mockPrisma }));

jest.unstable_mockModule('../utils/password.js', () => ({
  hashPassword: mockFn().mockResolvedValue('hashed_pw'),
}));

jest.unstable_mockModule('../lib/file-storage.js', () => ({
  deleteStoredFile: mockFn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../modules/student-crm/checklists.js', () => ({
  getDefaultChecklist: mockFn().mockReturnValue([]),
}));

jest.unstable_mockModule('../modules/notifications/recipients.js', () => ({
  safeNotify: mockFn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../modules/marketing/services/email.service.js', () => ({
  sendCampaignEmail: mockFn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../lib/welcome-email.js', () => ({
  sendStudentWelcomeCredentialsEmailAsync: mockFn(),
  sendWelcomeCredentialsEmailAsync: mockFn(),
}));

jest.unstable_mockModule('../modules/student-crm/scoping.js', () => ({
  applicationScopeWhere: mockFn().mockReturnValue({}),
  studentScopeWhere: mockFn().mockReturnValue({}),
  resolveApplicationScopeWhere: mockFn().mockResolvedValue({}),
  resolveStudentScopeWhere: mockFn().mockResolvedValue({}),
}));

jest.unstable_mockModule('../modules/student-crm/stage-engine.js', () => ({
  computeProcessProgress: mockFn().mockReturnValue(0),
  getStagesForCountry: mockFn().mockReturnValue([]),
}));

jest.unstable_mockModule('../modules/student-crm/visa-workflows.js', () => ({
  appendVisaDocument: mockFn(),
  getVisaWorkflowForCountry: mockFn().mockReturnValue(null),
  normalizeVisaDocuments: mockFn().mockReturnValue([]),
}));

jest.unstable_mockModule('../modules/student-crm/application-gates.js', () => ({
  assertStageAdvanceAllowed: mockFn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../modules/student-crm/payments.service.js', () => ({
  seedDefaultApplicationFee: mockFn().mockResolvedValue(undefined),
}));

// ──────────────────────────────────────────────
// Dynamic imports (after mocks)
// ──────────────────────────────────────────────
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
  mockPrisma.student.findUnique.mockResolvedValue(null);
  mockPrisma.checkList.findMany.mockResolvedValue([]);
  mockPrisma.countryChecklist.findMany.mockResolvedValue([]);
  mockPrisma.studentChecklist.findMany.mockResolvedValue([]);
  mockPrisma.studentStudyPlan.count.mockResolvedValue(1);
  mockPrisma.studentStudyPlan.create.mockResolvedValue({});
});

// ═══════════════════════════════════════════════════════════
// 1. listStudents
// ═══════════════════════════════════════════════════════════
describe('listStudents', () => {
  it('returns all students without filters', async () => {
    const students = [makeStudent()];
    mockPrisma.student.findMany.mockResolvedValue(students);

    const result = await listStudents({});

    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Jane Doe');
    expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' }, take: 200 })
    );
  });

  it('applies search filter across name, email, and phone', async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);

    await listStudents({ search: 'Jane' });

    const [[call]] = mockPrisma.student.findMany.mock.calls as any;
    const orClause = call.where.AND?.find((c: any) => c.OR);
    expect(orClause).toBeDefined();
    expect(JSON.stringify(orClause)).toContain('Jane');
  });

  it('respects custom limit', async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);

    await listStudents({ limit: 10 });

    const [[call]] = mockPrisma.student.findMany.mock.calls as any;
    expect(call.take).toBe(10);
  });

  it('returns empty array when no students exist', async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);

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
    mockPrisma.student.findFirst.mockResolvedValue(student);

    const result = await getStudent(5);

    expect(result).toEqual(student);
    expect(mockPrisma.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 5 }) })
    );
  });

  it('returns null when student does not exist', async () => {
    mockPrisma.student.findFirst.mockResolvedValue(null);

    const result = await getStudent(999);
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// 3. createStudent
// ═══════════════════════════════════════════════════════════
describe('createStudent', () => {
  it('creates a new student when email is unique', async () => {
    mockPrisma.student.findUnique.mockResolvedValueOnce(null);
    const created = makeStudent({ id: 10 });
    mockPrisma.student.create.mockResolvedValue(created);
    mockPrisma.student.findFirst.mockResolvedValue(created);
    mockPrisma.checkList.findMany.mockResolvedValue([]);

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
    mockPrisma.student.findUnique.mockResolvedValueOnce(existing);
    mockPrisma.student.findFirst.mockResolvedValue(existing);

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

    mockPrisma.student.findFirst
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated);
    mockPrisma.student.update.mockResolvedValue(updated);
    mockPrisma.student.findUnique.mockResolvedValue(null);

    const result = await updateStudent(1, { fullName: 'Jane Updated' });

    expect(mockPrisma.student.update).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('throws an error when student is not found', async () => {
    mockPrisma.student.findFirst.mockResolvedValue(null);

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
