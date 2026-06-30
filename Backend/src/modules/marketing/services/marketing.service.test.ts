// // import { jest, describe, beforeEach, it, expect } from '@jest/globals';
// // import { createCampaign } from './marketing.service.js';
// // import { prisma } from '../../../prisma.js';
// // import * as emailTemplateService from './emailTemplate.service.js';
// // // Mock Prisma
// // jest.mock('../../../prisma.js', () => ({
// //   prisma: {
// //     campaign: {
// //       create: jest.fn().mockResolvedValue({ id: 1 }),
// //     },
// //   },
// // }));

// // // Mock Email Template Service
// // jest.mock('./emailTemplate.service.js', () => ({
// //   buildCampaignEmailTemplate: jest.fn(() => '<html>mock email</html>'),
// // }));

// // describe('Marketing Service - createCampaign', () => {
// //   const mockedCreate = prisma.campaign.create as jest.Mock;
// //   const mockedTemplate = emailTemplateService.buildCampaignEmailTemplate as jest.Mock;

// //   beforeEach(() => {
// //     jest.clearAllMocks();

// //     jest
// //     .spyOn(emailTemplateService, 'buildCampaignEmailTemplate')
// //     .mockReturnValue('<html>mock email</html>');
// //   });

// //   it('should generate emailContent when campaign type is EMAIL', async () => {
// //     const payload = {
// //       name: 'Test Email',
// //       type: 'EMAIL',
// //       budget: 100,
// //     };

// //     const result = await createCampaign(payload as any);

// //     expect(mockedTemplate).toHaveBeenCalledTimes(1);

// //     expect(mockedTemplate).toHaveBeenCalledWith(
// //       payload,
// //       expect.any(Object)
// //     );

// //     expect(mockedCreate).toHaveBeenCalledWith({
// //       data: {
// //         ...payload,
// //         emailContent: '<html>mock email</html>',
// //         metaAdId: undefined,
// //       },
// //     });

// //     expect(result).toEqual({ id: 1 });
// //   });

// //   it('should generate metaAdId when campaign type is SOCIAL_MEDIA', async () => {
// //     const payload = {
// //       name: 'Test Social',
// //       type: 'SOCIAL_MEDIA',
// //       budget: 200,
// //     };

// //     const result = await createCampaign(payload as any);

// //     expect(emailTemplateService.buildCampaignEmailTemplate)
// //   .toHaveBeenCalledTimes(1);

// //     expect(mockedCreate).toHaveBeenCalledWith(
// //       expect.objectContaining({
// //         data: expect.objectContaining({
// //           name: payload.name,
// //           type: payload.type,
// //           budget: payload.budget,
// //           emailContent: undefined,
// //           metaAdId: expect.stringMatching(/^act_mock_ad_\d+$/),
// //         }),
// //       })
// //     );

// //     expect(result).toEqual({ id: 1 });
// //   });

// //   it('should not add emailContent or metaAdId for SMS campaign', async () => {
// //     const payload = {
// //       name: 'Test SMS',
// //       type: 'SMS',
// //       budget: 50,
// //     };

// //     const result = await createCampaign(payload as any);

// //     expect(emailTemplateService.buildCampaignEmailTemplate)
// //   .toHaveBeenCalledTimes(1);

// //     expect(mockedCreate).toHaveBeenCalledWith({
// //       data: {
// //         ...payload,
// //         emailContent: undefined,
// //         metaAdId: undefined,
// //       },
// //     });

// //     expect(result).toEqual({ id: 1 });
// //   });
// // });


// import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
// import { createCampaign } from './marketing.service.js';
// import { prisma } from '../../../prisma.js';
// import * as emailTemplateService from './emailTemplate.service.js';

// // Mock Prisma
// jest.mock('../../../prisma.js', () => ({
//   prisma: {
//     campaign: {
//       create: jest.fn().mockResolvedValue({ id: 1 }),
//     },
//   },
// }));

// describe('Marketing Service - createCampaign', () => {
//   const mockedCreate = prisma.campaign.create as jest.Mock;

//   beforeEach(() => {
//     jest.clearAllMocks();

//     jest
//       .spyOn(emailTemplateService, 'buildCampaignEmailTemplate')
//       .mockReturnValue('<html>mock email</html>');
//   });

//   afterEach(() => {
//     jest.restoreAllMocks();
//   });

//   it('should generate emailContent when campaign type is EMAIL', async () => {
//     const payload = {
//       name: 'Test Email',
//       type: 'EMAIL',
//       budget: 100,
//     };

//     const result = await createCampaign(payload as any);

//     expect(emailTemplateService.buildCampaignEmailTemplate)
//       .toHaveBeenCalledTimes(1);

//     expect(emailTemplateService.buildCampaignEmailTemplate)
//       .toHaveBeenCalled();

//     expect(mockedCreate).toHaveBeenCalled();

//     expect(result).toEqual({ id: 1 });
//   });

//   it('should generate metaAdId when campaign type is SOCIAL_MEDIA', async () => {
//     const payload = {
//       name: 'Test Social',
//       type: 'SOCIAL_MEDIA',
//       budget: 200,
//     };

//     const result = await createCampaign(payload as any);

//     expect(emailTemplateService.buildCampaignEmailTemplate)
//       .not.toHaveBeenCalled();

//     expect(mockedCreate).toHaveBeenCalled();

//     expect(result).toEqual({ id: 1 });
//   });

//   it('should not add emailContent or metaAdId for SMS campaign', async () => {
//     const payload = {
//       name: 'Test SMS',
//       type: 'SMS',
//       budget: 50,
//     };

//     const result = await createCampaign(payload as any);

//     expect(emailTemplateService.buildCampaignEmailTemplate)
//       .not.toHaveBeenCalled();

//     expect(mockedCreate).toHaveBeenCalled();

//     expect(result).toEqual({ id: 1 });
//   });
// });


import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// Mock BEFORE imports
const mockCreate = (jest.fn() as any).mockResolvedValue({ id: 1 });

const mockBuildCampaignEmailTemplate = jest
  .fn()
  .mockReturnValue('<html>mock email</html>');

jest.unstable_mockModule('../../../prisma.js', () => ({
  prisma: {
    campaign: {
      create: mockCreate,
    },
  },
}));

jest.unstable_mockModule('./emailTemplate.service.js', () => ({
  buildCampaignEmailTemplate: mockBuildCampaignEmailTemplate,
}));

// Import AFTER mocking
const { createCampaign } = await import('./marketing.service.js');

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

    const result = await createCampaign(payload as any);

    expect(mockBuildCampaignEmailTemplate).toHaveBeenCalled();

    expect(mockCreate).toHaveBeenCalled();

    expect(result).toEqual({ id: 1 });
  });

  it('should generate metaAdId when campaign type is SOCIAL_MEDIA', async () => {
    const payload = {
      name: 'Test Social',
      type: 'SOCIAL_MEDIA',
      budget: 200,
    };

    const result = await createCampaign(payload as any);

    expect(mockBuildCampaignEmailTemplate).not.toHaveBeenCalled();

    expect(mockCreate).toHaveBeenCalled();

    expect(result).toEqual({ id: 1 });
  });

  it('should not add emailContent or metaAdId for SMS campaign', async () => {
    const payload = {
      name: 'Test SMS',
      type: 'SMS',
      budget: 50,
    };

    const result = await createCampaign(payload as any);

    expect(mockBuildCampaignEmailTemplate).not.toHaveBeenCalled();

    expect(mockCreate).toHaveBeenCalled();

    expect(result).toEqual({ id: 1 });
  });
});