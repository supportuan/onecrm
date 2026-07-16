import { jest, describe, it, expect, afterEach } from '@jest/globals';
import { ActivityType } from '@prisma/client';

// ──────────────────────────────────────────────
// Prisma mock
// ──────────────────────────────────────────────
jest.unstable_mockModule('../prisma.js', () => ({
  prisma: {
    lead: {
      findFirst: jest.fn(),
    },
    leadActivity: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.unstable_mockModule('../modules/marketing/services/email.service.js', () => ({
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../modules/marketing/services/sms.service.js', () => ({
  sendSMS: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../modules/marketing/services/whatsapp.service.js', () => ({
  sendWhatsAppMessage: jest.fn().mockResolvedValue(undefined),
}));

// ──────────────────────────────────────────────
// Dynamic imports (after mocks)
// ──────────────────────────────────────────────
const { prisma } = await import('../prisma.js');

const {
  getLeadActivities,
  createLeadActivity,
  deleteLeadActivity,
  getLeadActivityById,
} = await import('../modules/marketing/services/lead-activity.service.js');

const { sendCampaignEmail } = await import('../modules/marketing/services/email.service.js');
const { sendSMS } = await import('../modules/marketing/services/sms.service.js');
const { sendWhatsAppMessage } = await import('../modules/marketing/services/whatsapp.service.js');

// ──────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────
const mockLeadWithEmailAndPhone = {
  id: 5,
  fullName: 'Test Lead',
  email: 'lead@test.com',
  phone: '9999999999',
  deletedAt: null,
};

const mockLeadNoEmail = {
  id: 6,
  fullName: 'No Email Lead',
  email: null,
  phone: '8888888888',
  deletedAt: null,
};

const mockLeadNoPhone = {
  id: 7,
  fullName: 'No Phone Lead',
  email: 'nophone@test.com',
  phone: null,
  deletedAt: null,
};

afterEach(() => {
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════
// 1. getLeadActivities
// ═══════════════════════════════════════════════════════════
describe('getLeadActivities', () => {
  it('returns activities ordered by newest first', async () => {
    const activities = [
      { id: 1, leadId: 42, activityType: ActivityType.EMAIL },
      { id: 2, leadId: 42, activityType: ActivityType.SMS },
    ];
    (prisma.leadActivity.findMany as jest.Mock).mockResolvedValue(activities);

    const result = await getLeadActivities(42);

    expect(prisma.leadActivity.findMany).toHaveBeenCalledWith({
      where: { leadId: 42 },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual(activities);
  });

  it('returns empty array when lead has no activities', async () => {
    (prisma.leadActivity.findMany as jest.Mock).mockResolvedValue([]);
    const result = await getLeadActivities(99);
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════
// 2. createLeadActivity — EMAIL
// ═══════════════════════════════════════════════════════════
describe('createLeadActivity - EMAIL', () => {
  it('creates EMAIL activity and sends email', async () => {
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLeadWithEmailAndPhone);
    (prisma.leadActivity.create as jest.Mock).mockResolvedValue({ id: 10, leadId: 5, activityType: ActivityType.EMAIL, comment: '', metadata: {} });

    const result = await createLeadActivity(5, {
      activityType: ActivityType.EMAIL,
      comment: 'Follow-up',
      metadata: { subject: 'Hello' },
    });

    expect(sendCampaignEmail).toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
    expect(result.id).toBe(10);
  });

  it('throws if lead has no email when activity type is EMAIL', async () => {
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLeadNoEmail);

    await expect(
      createLeadActivity(6, { activityType: ActivityType.EMAIL, comment: '' })
    ).rejects.toThrow('Lead email not found');

    expect(prisma.leadActivity.create).not.toHaveBeenCalled();
  });

  it('uses custom subject from metadata', async () => {
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLeadWithEmailAndPhone);
    (prisma.leadActivity.create as jest.Mock).mockResolvedValue({ id: 11, leadId: 5, activityType: ActivityType.EMAIL });

    await createLeadActivity(5, {
      activityType: ActivityType.EMAIL,
      comment: 'Hello',
      metadata: { subject: 'Custom Subject' },
    });

    const [[call]] = (sendCampaignEmail as jest.Mock).mock.calls as any;
    expect(call.subject).toBe('Custom Subject');
  });

  it('falls back to default subject when metadata.subject is absent', async () => {
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLeadWithEmailAndPhone);
    (prisma.leadActivity.create as jest.Mock).mockResolvedValue({ id: 12, leadId: 5, activityType: ActivityType.EMAIL });

    await createLeadActivity(5, { activityType: ActivityType.EMAIL, comment: '' });

    const [[call]] = (sendCampaignEmail as jest.Mock).mock.calls as any;
    expect(call.subject).toBe('Lead Follow-up');
  });
});

// ═══════════════════════════════════════════════════════════
// 3. createLeadActivity — SMS
// ═══════════════════════════════════════════════════════════
describe('createLeadActivity - SMS', () => {
  it('creates SMS activity and sends SMS', async () => {
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLeadWithEmailAndPhone);
    (prisma.leadActivity.create as jest.Mock).mockResolvedValue({ id: 20, leadId: 5, activityType: ActivityType.SMS });

    const result = await createLeadActivity(5, { activityType: ActivityType.SMS, comment: 'Hi there' });

    expect(sendSMS).toHaveBeenCalledWith({ to: '9999999999', message: 'Hi there' });
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
    expect(result.id).toBe(20);
  });

  it('throws if lead has no phone when activity type is SMS', async () => {
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLeadNoPhone);

    await expect(
      createLeadActivity(7, { activityType: ActivityType.SMS, comment: 'Hello' })
    ).rejects.toThrow('Lead phone number not found');

    expect(prisma.leadActivity.create).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════
// 4. createLeadActivity — WHATSAPP
// ═══════════════════════════════════════════════════════════
describe('createLeadActivity - WHATSAPP', () => {
  it('creates WHATSAPP activity and sends WhatsApp message', async () => {
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLeadWithEmailAndPhone);
    (prisma.leadActivity.create as jest.Mock).mockResolvedValue({ id: 30, leadId: 5, activityType: ActivityType.WHATSAPP });

    await createLeadActivity(5, {
      activityType: ActivityType.WHATSAPP,
      metadata: { templateName: 'hello_world' },
    });

    expect(sendWhatsAppMessage).toHaveBeenCalledWith({ phone: '9999999999', templateName: 'hello_world' });
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();
  });

  it('uses default template when templateName is absent', async () => {
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLeadWithEmailAndPhone);
    (prisma.leadActivity.create as jest.Mock).mockResolvedValue({ id: 31, leadId: 5, activityType: ActivityType.WHATSAPP });

    await createLeadActivity(5, { activityType: ActivityType.WHATSAPP });

    const [[call]] = (sendWhatsAppMessage as jest.Mock).mock.calls as any;
    expect(call.templateName).toBe('hello_world');
  });

  it('throws if lead has no phone when activity type is WHATSAPP', async () => {
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLeadNoPhone);

    await expect(
      createLeadActivity(7, { activityType: ActivityType.WHATSAPP })
    ).rejects.toThrow('Lead phone number not found');
  });
});

// ═══════════════════════════════════════════════════════════
// 5. createLeadActivity — CALL / MEETING / NOTE (no external sends)
// ═══════════════════════════════════════════════════════════
describe.each([
  ActivityType.CALL,
  ActivityType.MEETING,
  ActivityType.NOTE,
] as const)('createLeadActivity - %s (no external messaging)', (actType) => {
  it(`creates ${actType} activity without sending email, SMS, or WhatsApp`, async () => {
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLeadWithEmailAndPhone);
    (prisma.leadActivity.create as jest.Mock).mockResolvedValue({ id: 40, leadId: 5, activityType: actType });

    const result = await createLeadActivity(5, { activityType: actType, comment: 'logged' });

    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
    expect(result.id).toBe(40);
  });
});

// ═══════════════════════════════════════════════════════════
// 6. createLeadActivity — lead not found
// ═══════════════════════════════════════════════════════════
describe('createLeadActivity - lead not found', () => {
  it('throws and does not create activity or send messages', async () => {
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      createLeadActivity(999, { activityType: ActivityType.EMAIL, comment: '' })
    ).rejects.toThrow('Lead not found');

    expect(prisma.leadActivity.create).not.toHaveBeenCalled();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════
// 7. deleteLeadActivity
// ═══════════════════════════════════════════════════════════
describe('deleteLeadActivity', () => {
  it('deletes activity by id', async () => {
    (prisma.leadActivity.delete as jest.Mock).mockResolvedValue({ id: 10 });

    const result = await deleteLeadActivity(10);

    expect(prisma.leadActivity.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    expect(result.id).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════
// 8. getLeadActivityById
// ═══════════════════════════════════════════════════════════
describe('getLeadActivityById', () => {
  it('returns the activity when found', async () => {
    const activity = { id: 15, leadId: 5, activityType: ActivityType.CALL };
    (prisma.leadActivity.findUnique as jest.Mock).mockResolvedValue(activity);

    const result = await getLeadActivityById(15);

    expect(prisma.leadActivity.findUnique).toHaveBeenCalledWith({ where: { id: 15 } });
    expect(result).toEqual(activity);
  });

  it('returns null when activity does not exist', async () => {
    (prisma.leadActivity.findUnique as jest.Mock).mockResolvedValue(null);
    const result = await getLeadActivityById(999);
    expect(result).toBeNull();
  });
});