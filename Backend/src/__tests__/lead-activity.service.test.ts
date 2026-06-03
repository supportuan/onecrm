

import { jest, describe, it, expect, afterEach } from '@jest/globals';
import { ActivityType } from '@prisma/client';

jest.unstable_mockModule('../prisma.js', () => ({
  prisma: {
    lead: {
      findFirst: jest.fn(),
    },
    leadActivity: {
      findMany: jest.fn(),
      create: jest.fn(),
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

const { prisma } = await import('../prisma.js');

const {
  getLeadActivities,
  createLeadActivity,
} = await import('../modules/marketing/services/lead-activity.service.js');

const { sendCampaignEmail } = await import(
  '../modules/marketing/services/email.service.js'
);

const { sendSMS } = await import(
  '../modules/marketing/services/sms.service.js'
);

const { sendWhatsAppMessage } = await import(
  '../modules/marketing/services/whatsapp.service.js'
);

const mockLead = {
  id: 5,
  fullName: 'Test Lead',
  email: 'lead@test.com',
  phone: '9999999999',
  deletedAt: null,
};

describe('Lead Activity Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retrieves lead activities sorted by newest first', async () => {
    const mockActivities = [
      { id: 1, leadId: 42, activityType: ActivityType.EMAIL },
      { id: 2, leadId: 42, activityType: ActivityType.SMS },
    ];

    (prisma.leadActivity.findMany as jest.Mock).mockResolvedValue(
      mockActivities
    );

    const result = await getLeadActivities(42);

    expect(prisma.leadActivity.findMany).toHaveBeenCalledWith({
      where: { leadId: 42 },
      orderBy: { createdAt: 'desc' },
    });

    expect(result).toEqual(mockActivities);
  });

  it('creates EMAIL activity and sends email only', async () => {
    const data = {
      activityType: ActivityType.EMAIL,
      comment: '',
      actorId: null,
      metadata: {},
    };

    (prisma.lead.findFirst as jest.Mock).mockResolvedValue({
      ...mockLead,
      id: 5,
    });

    (prisma.leadActivity.create as jest.Mock).mockResolvedValue({
      id: 10,
      leadId: 5,
      ...data,
    });

    const result = await createLeadActivity(5, data);

    expect(prisma.lead.findFirst).toHaveBeenCalledWith({
      where: {
        id: 5,
        deletedAt: null,
      },
    });

    expect(prisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 5,
        activityType: ActivityType.EMAIL,
        actorId: null,
        comment: '',
        metadata: {},
      },
    });

    expect(sendCampaignEmail).toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();

    expect(result.id).toBe(10);
  });

  it('creates SMS activity and sends SMS only', async () => {
    const data = {
      activityType: ActivityType.SMS,
      comment: '',
      actorId: null,
      metadata: {},
    };

    (prisma.lead.findFirst as jest.Mock).mockResolvedValue({
      ...mockLead,
      id: 6,
    });

    (prisma.leadActivity.create as jest.Mock).mockResolvedValue({
      id: 11,
      leadId: 6,
      ...data,
    });

    const result = await createLeadActivity(6, data);

    expect(prisma.lead.findFirst).toHaveBeenCalledWith({
      where: {
        id: 6,
        deletedAt: null,
      },
    });

    expect(prisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 6,
        activityType: ActivityType.SMS,
        actorId: null,
        comment: '',
        metadata: {},
      },
    });

    expect(sendSMS).toHaveBeenCalled();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();

    expect(result.id).toBe(11);
  });

  it('creates WHATSAPP activity and sends WhatsApp only', async () => {
    const data = {
      activityType: ActivityType.WHATSAPP,
      comment: '',
      actorId: null,
      metadata: {},
    };

    (prisma.lead.findFirst as jest.Mock).mockResolvedValue({
      ...mockLead,
      id: 7,
    });

    (prisma.leadActivity.create as jest.Mock).mockResolvedValue({
      id: 12,
      leadId: 7,
      ...data,
    });

    const result = await createLeadActivity(7, data);

    expect(prisma.lead.findFirst).toHaveBeenCalledWith({
      where: {
        id: 7,
        deletedAt: null,
      },
    });

    expect(prisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 7,
        activityType: ActivityType.WHATSAPP,
        actorId: null,
        comment: '',
        metadata: {},
      },
    });

    expect(sendWhatsAppMessage).toHaveBeenCalled();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();

    expect(result.id).toBe(12);
  });

  it('creates CALL activity without sending email, SMS, or WhatsApp', async () => {
    const data = {
      activityType: ActivityType.CALL,
      comment: '',
      actorId: null,
      metadata: {},
    };

    (prisma.lead.findFirst as jest.Mock).mockResolvedValue({
      ...mockLead,
      id: 8,
    });

    (prisma.leadActivity.create as jest.Mock).mockResolvedValue({
      id: 13,
      leadId: 8,
      ...data,
    });

    const result = await createLeadActivity(8, data);

    expect(prisma.lead.findFirst).toHaveBeenCalledWith({
      where: {
        id: 8,
        deletedAt: null,
      },
    });

    expect(prisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 8,
        activityType: ActivityType.CALL,
        actorId: null,
        comment: '',
        metadata: {},
      },
    });

    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();

    expect(result.id).toBe(13);
  });

  it('throws error when lead does not exist', async () => {
    const data = {
      activityType: ActivityType.EMAIL,
      comment: '',
      actorId: null,
      metadata: {},
    };

    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(createLeadActivity(999, data)).rejects.toThrow();

    expect(prisma.leadActivity.create).not.toHaveBeenCalled();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });
});