import { jest } from '@jest/globals';
import { createCampaign } from './marketing.service.js';
import { prisma } from '../../../prisma.js';
import { buildCampaignEmailTemplate } from './emailTemplate.service.js';

// Mock dependencies
jest.mock('../../../prisma.js', () => ({
  prisma: {
    campaign: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
  },
}));

jest.mock('./emailTemplate.service.js', () => ({
  buildCampaignEmailTemplate: jest.fn().mockReturnValue('<html>mock email</html>'),
}));

describe('Marketing Service - createCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate emailContent when campaign type is EMAIL', async () => {
    const payload = {
      name: 'Test Email',
      type: 'EMAIL',
      budget: 100,
    };

    const result = await createCampaign(payload);

    expect(buildCampaignEmailTemplate).toHaveBeenCalledWith(payload, {});
    expect(prisma.campaign.create).toHaveBeenCalledWith({
      data: {
        ...payload,
        emailContent: '<html>mock email</html>',
        metaAdId: undefined,
      },
    });
    expect(result).toEqual({ id: 1 });
  });

  it('should generate metaAdId when campaign type is SOCIAL_MEDIA', async () => {
    const payload = {
      name: 'Test Social',
      type: 'SOCIAL_MEDIA',
      budget: 200,
    };

    const result = await createCampaign(payload);

    expect(buildCampaignEmailTemplate).not.toHaveBeenCalled();
    expect(prisma.campaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ...payload,
          emailContent: undefined,
          metaAdId: expect.stringMatching(/^act_mock_ad_\d+$/),
        }),
      })
    );
    expect(result).toEqual({ id: 1 });
  });

  it('should not add emailContent or metaAdId for other types', async () => {
    const payload = {
      name: 'Test SMS',
      type: 'SMS',
      budget: 50,
    };

    const result = await createCampaign(payload);

    expect(buildCampaignEmailTemplate).not.toHaveBeenCalled();
    expect(prisma.campaign.create).toHaveBeenCalledWith({
      data: {
        ...payload,
        emailContent: undefined,
        metaAdId: undefined,
      },
    });
    expect(result).toEqual({ id: 1 });
  });
});
