

// import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// // Mock BEFORE imports
// const mockCreate = (jest.fn() as any).mockResolvedValue({ id: 1 });

// const mockBuildCampaignEmailTemplate = jest
//   .fn()
//   .mockReturnValue('<html>mock email</html>');

// jest.unstable_mockModule('../../../prisma.js', () => ({
//   prisma: {
//     campaign: {
//       create: mockCreate,
//     },
//   },
// }));

// jest.unstable_mockModule('./emailTemplate.service.js', () => ({
//   buildCampaignEmailTemplate: mockBuildCampaignEmailTemplate,
// }));

// // Import AFTER mocking
// const { createCampaign } = await import('../modules/marketing/services/marketing.service.js');

// describe('Marketing Service - createCampaign', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should generate emailContent when campaign type is EMAIL', async () => {
//     const payload = {
//       name: 'Test Email',
//       type: 'EMAIL',
//       budget: 100,
//     };

//     const result = await createCampaign(payload as any);

//     expect(mockBuildCampaignEmailTemplate).toHaveBeenCalled();

//     expect(mockCreate).toHaveBeenCalled();

//     expect(result).toEqual({ id: 1 });
//   });

//   it('should generate metaAdId when campaign type is SOCIAL_MEDIA', async () => {
//     const payload = {
//       name: 'Test Social',
//       type: 'SOCIAL_MEDIA',
//       budget: 200,
//     };

//     const result = await createCampaign(payload as any);

//     expect(mockBuildCampaignEmailTemplate).not.toHaveBeenCalled();

//     expect(mockCreate).toHaveBeenCalled();

//     expect(result).toEqual({ id: 1 });
//   });

//   it('should not add emailContent or metaAdId for SMS campaign', async () => {
//     const payload = {
//       name: 'Test SMS',
//       type: 'SMS',
//       budget: 50,
//     };

//     const result = await createCampaign(payload as any);

//     expect(mockBuildCampaignEmailTemplate).not.toHaveBeenCalled();

//     expect(mockCreate).toHaveBeenCalled();

//     expect(result).toEqual({ id: 1 });
//   });
// });

import { jest, describe, it, expect, beforeEach } from '@jest/globals';


const mockPost = jest.fn();
const mockGet = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: {
    post: mockPost,
    get: mockGet,
  },
}));

// Dynamic import AFTER mocks are registered
const { execute, uploadMediaToMeta } = await import('../modules/marketing/services/metaCampaign.service.js');

describe('Meta Campaign Service - Custom Media Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.META_ACCESS_TOKEN = 'mock_access_token';
    process.env.META_AD_ACCOUNT_ID = 'mock_ad_account_id';
    process.env.META_PAGE_ID = 'mock_page_id';
    process.env.DEFAULT_LANDING_PAGE_URL = 'https://applyuninow.com';

    mockPost.mockResolvedValue({ data: { id: 'default_id' } });
  });

  describe('uploadMediaToMeta', () => {
    it('should successfully upload an image to Meta Graph API', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          images: {
            'test.png': {
              hash: 'image_hash_123',
            },
          },
        },
      });

      const result = await uploadMediaToMeta({
        mimetype: 'image/png',
        originalname: 'test.png',
        buffer: Buffer.from('mock-image'),
      });

      expect(result).toEqual({
        hash: 'image_hash_123',
        type: 'IMAGE',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/act_mock_ad_account_id/adimages'),
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
    });

    it('should successfully upload a video to Meta Graph API', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          id: 'video_id_456',
        },
      });

      const result = await uploadMediaToMeta({
        mimetype: 'video/mp4',
        originalname: 'video.mp4',
        buffer: Buffer.from('mock-video'),
      });

      expect(result).toEqual({
        hash: 'video_id_456',
        type: 'VIDEO',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/act_mock_ad_account_id/advideos'),
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
    });
  });

  describe('execute campaign', () => {
    it('should use custom image hash from launchDetails and skip placeholder upload', async () => {
      mockPost
        .mockResolvedValueOnce({ data: { id: 'campaign_123' } })
        .mockResolvedValueOnce({ data: { id: 'adset_456' } })
        .mockResolvedValueOnce({ data: { id: 'creative_789' } })
        .mockResolvedValueOnce({ data: { id: 'ad_101' } });

      const result = await execute({
        name: 'Promo Campaign',
        budget: 500,
        status: 'ACTIVE',
        launchDetails: {
          mediaHash: 'custom_image_hash_789',
          mediaType: 'IMAGE',
          targetCountry: 'IN',
          platform: 'FACEBOOK',
        },
      });

      expect(result.success).toBe(true);
      expect(result.metaCampaignId).toBe('campaign_123');
      expect(result.metaAdSetId).toBe('adset_456');
      expect(result.metaCreativeId).toBe('creative_789');
      expect(result.metaAdId).toBe('ad_101');

      expect(mockPost).toHaveBeenCalledTimes(4);

      expect(mockPost).not.toHaveBeenCalledWith(
        expect.stringContaining('/adimages'),
        expect.anything()
      );

      const creativeCall = mockPost.mock.calls[2];

      expect(creativeCall[0]).toContain('/act_mock_ad_account_id/adcreatives');
      expect(creativeCall[1]).toBeInstanceOf(URLSearchParams);
      expect(creativeCall[2]).toEqual({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const creativeForm = creativeCall[1] as URLSearchParams;
      const objectStorySpec = JSON.parse(
        creativeForm.get('object_story_spec') || '{}'
      );

      expect(creativeForm.get('name')).toBe('Promo Campaign Creative');
      expect(creativeForm.get('access_token')).toBe('mock_access_token');

      expect(objectStorySpec).toEqual(
        expect.objectContaining({
          page_id: 'mock_page_id',
          link_data: expect.objectContaining({
            image_hash: 'custom_image_hash_789',
            link: 'https://applyuninow.com',
            call_to_action: expect.objectContaining({
              type: 'LEARN_MORE',
            }),
          }),
        })
      );
    });

    it('should use custom video ID and build a video creative when mediaType is VIDEO', async () => {
      mockPost
        .mockResolvedValueOnce({ data: { id: 'campaign_123' } })
        .mockResolvedValueOnce({ data: { id: 'adset_456' } })
        .mockResolvedValueOnce({ data: { id: 'creative_789' } })
        .mockResolvedValueOnce({ data: { id: 'ad_101' } });

      const result = await execute({
        name: 'Video Promo',
        budget: 500,
        status: 'ACTIVE',
        launchDetails: {
          mediaHash: 'custom_video_id_999',
          mediaType: 'VIDEO',
          targetCountry: 'IN',
          platform: 'FACEBOOK',
        },
      });

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalledTimes(4);

      const creativeCall = mockPost.mock.calls[2];

      expect(creativeCall[0]).toContain('/act_mock_ad_account_id/adcreatives');
      expect(creativeCall[1]).toBeInstanceOf(URLSearchParams);

      const creativeForm = creativeCall[1] as URLSearchParams;
      const objectStorySpec = JSON.parse(
        creativeForm.get('object_story_spec') || '{}'
      );

      expect(objectStorySpec).toEqual(
        expect.objectContaining({
          page_id: 'mock_page_id',
          video_data: expect.objectContaining({
            video_id: 'custom_video_id_999',
            call_to_action: expect.objectContaining({
              type: 'LEARN_MORE',
            }),
          }),
        })
      );

      expect(objectStorySpec.video_data.video_id).toBe('custom_video_id_999');
    });

    it('should upload placeholder image when no custom mediaHash is provided', async () => {
      mockPost
        .mockResolvedValueOnce({ data: { id: 'campaign_123' } })
        .mockResolvedValueOnce({ data: { id: 'adset_456' } })
        .mockResolvedValueOnce({
          data: {
            images: {
              'https://via.placeholder.com/1200x628.png': {
                hash: 'placeholder_hash_123',
              },
            },
          },
        })
        .mockResolvedValueOnce({ data: { id: 'creative_789' } })
        .mockResolvedValueOnce({ data: { id: 'ad_101' } });

      const result = await execute({
        name: 'Fallback Image Campaign',
        budget: 100,
        status: 'ACTIVE',
        launchDetails: {
          mediaType: 'IMAGE',
          targetCountry: 'IN',
        },
      });

      expect(result.success).toBe(true);

      expect(mockPost).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('/act_mock_ad_account_id/adimages'),
        expect.objectContaining({
          url: 'https://via.placeholder.com/1200x628.png',
          access_token: 'mock_access_token',
        })
      );

      const creativeCall = mockPost.mock.calls[3];
      const creativeForm = creativeCall[1] as URLSearchParams;
      const objectStorySpec = JSON.parse(
        creativeForm.get('object_story_spec') || '{}'
      );

      expect(objectStorySpec.link_data.image_hash).toBe('placeholder_hash_123');
    });

    it('should return failed response when Meta config is missing', async () => {
      delete process.env.META_ACCESS_TOKEN;

      const result = await execute({
        name: 'No Config Campaign',
        budget: 100,
        status: 'ACTIVE',
      });

      expect(result).toEqual({
        success: false,
        channel: 'SOCIAL_MEDIA',
        message: 'Meta Ads account is not configured',
      });

      expect(mockPost).not.toHaveBeenCalled();
    });
  });
});