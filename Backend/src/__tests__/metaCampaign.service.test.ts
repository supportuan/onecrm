// import { jest, describe, beforeEach, it, expect } from '@jest/globals';
// import axios from 'axios';

// // Import the service under test
// const { uploadMediaToMeta, execute } = await import('../modules/marketing/services/metaCampaign.service.js');

// describe('Meta Campaign Service - Custom Media Upload', () => {
//   let mockPost: any;
//   let mockGet: any;

//   beforeEach(() => {
//     jest.clearAllMocks();
//     mockPost = jest.spyOn(axios, 'post');
//     mockGet = jest.spyOn(axios, 'get');
//     process.env.META_ACCESS_TOKEN = 'mock_access_token';
//     process.env.META_AD_ACCOUNT_ID = 'mock_ad_account_id';
//     process.env.META_PAGE_ID = 'mock_page_id';
//   });

//   describe('uploadMediaToMeta', () => {
//     it('should successfully upload an image to Meta Graph API', async () => {
//       const mockFile = {
//         mimetype: 'image/png',
//         originalname: 'test.png',
//         buffer: Buffer.from('mock_image_bytes'),
//       };

//       const mockResponse = {
//         data: {
//           images: {
//             'test.png': {
//               hash: 'image_hash_123',
//             },
//           },
//         },
//       };

//       mockPost.mockResolvedValueOnce(mockResponse);

//       const result = await uploadMediaToMeta(mockFile);

//       expect(mockPost).toHaveBeenCalledWith(
//         expect.stringContaining('/act_mock_ad_account_id/adimages'),
//         expect.any(Object),
//         expect.objectContaining({
//           headers: { 'Content-Type': 'multipart/form-data' },
//         })
//       );
//       expect(result).toEqual({ hash: 'image_hash_123', type: 'IMAGE' });
//     });

//     it('should successfully upload a video to Meta Graph API', async () => {
//       const mockFile = {
//         mimetype: 'video/mp4',
//         originalname: 'test.mp4',
//         buffer: Buffer.from('mock_video_bytes'),
//       };

//       const mockResponse = {
//         data: {
//           id: 'video_id_456',
//         },
//       };

//       mockPost.mockResolvedValueOnce(mockResponse);

//       const result = await uploadMediaToMeta(mockFile);

//       expect(mockPost).toHaveBeenCalledWith(
//         expect.stringContaining('/act_mock_ad_account_id/advideos'),
//         expect.any(Object),
//         expect.objectContaining({
//           headers: { 'Content-Type': 'multipart/form-data' },
//         })
//       );
//       expect(result).toEqual({ hash: 'video_id_456', type: 'VIDEO' });
//     });
//   });

//   describe('execute campaign', () => {
//     it('should use custom image hash from launchDetails and skip placeholder upload', async () => {
//       const campaign = {
//         name: 'Promo Campaign',
//         status: 'ACTIVE',
//         budget: 500,
//         launchDetails: {
//           mediaHash: 'custom_image_hash_789',
//           mediaType: 'IMAGE',
//           fileName: 'banner.png',
//         },
//       };

//       // Mock responses for: Campaign creation, Ad Set creation, Creative creation, Ad creation
//       mockPost
//         .mockResolvedValueOnce({ data: { id: 'campaign_123' } }) // Campaign
//         .mockResolvedValueOnce({ data: { id: 'adset_456' } })   // AdSet
//         .mockResolvedValueOnce({ data: { id: 'creative_789' } }) // Creative
//         .mockResolvedValueOnce({ data: { id: 'ad_101' } });       // Ad

//       const result = await execute(campaign);

//       expect(result.success).toBe(true);
//       expect(result.metaCreativeId).toBe('creative_789');
//       expect(result.metaAdId).toBe('ad_101');

//       // Verify creative payload was built with the custom image hash
//       expect(mockPost).toHaveBeenNthCalledWith(3,
//         expect.stringContaining('/act_mock_ad_account_id/adcreatives'),
//         expect.objectContaining({
//           object_story_spec: expect.objectContaining({
//             link_data: expect.objectContaining({
//               image_hash: 'custom_image_hash_789',
//             }),
//           }),
//         })
//       );
//     });

//     it('should use custom video ID and build a video creative when mediaType is VIDEO', async () => {
//       const campaign = {
//         name: 'Video Promo',
//         status: 'ACTIVE',
//         budget: 500,
//         launchDetails: {
//           mediaHash: 'custom_video_id_999',
//           mediaType: 'VIDEO',
//           fileName: 'clip.mp4',
//         },
//       };

//       // Mock responses
//       mockPost
//         .mockResolvedValueOnce({ data: { id: 'campaign_123' } }) // Campaign
//         .mockResolvedValueOnce({ data: { id: 'adset_456' } })   // AdSet
//         .mockResolvedValueOnce({ data: { id: 'creative_789' } }) // Creative
//         .mockResolvedValueOnce({ data: { id: 'ad_101' } });       // Ad

//       const result = await execute(campaign);

//       expect(result.success).toBe(true);

//       // Verify creative payload was built with video_data containing the video ID
//       expect(mockPost).toHaveBeenNthCalledWith(3,
//         expect.stringContaining('/act_mock_ad_account_id/adcreatives'),
//         expect.objectContaining({
//           object_story_spec: expect.objectContaining({
//             video_data: expect.objectContaining({
//               video_id: 'custom_video_id_999',
//             }),
//           }),
//         })
//       );
//     });
//   });
// });


import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import axios from 'axios';

jest.unstable_mockModule('../modules/marketing/services/socialMediaTemplate.service.js', () => ({
  buildSocialMediaPostTemplate: jest.fn(() => ({
    headline: 'Promo Campaign - Apply Now',
    primaryText: 'Start your study abroad journey with expert admission guidance.',
    ctaButtonText: 'LEARN_MORE',
    landingPageUrl: 'https://applyuninow.com',
  })),
}));

const { uploadMediaToMeta, execute } = await import(
  '../modules/marketing/services/metaCampaign.service.js'
);

describe('Meta Campaign Service - Custom Media Upload', () => {
  let mockPost: any;
  let mockGet: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPost = jest.spyOn(axios, 'post');
    mockGet = jest.spyOn(axios, 'get');

    process.env.META_ACCESS_TOKEN = 'mock_access_token';
    process.env.META_AD_ACCOUNT_ID = 'mock_ad_account_id';
    process.env.META_PAGE_ID = 'mock_page_id';
  });

  describe('uploadMediaToMeta', () => {
    it('should successfully upload an image to Meta Graph API', async () => {
      const mockFile = {
        mimetype: 'image/png',
        originalname: 'test.png',
        buffer: Buffer.from('mock_image_bytes'),
      };

      mockPost.mockResolvedValueOnce({
        data: {
          images: {
            'test.png': {
              hash: 'image_hash_123',
            },
          },
        },
      });

      const result = await uploadMediaToMeta(mockFile);

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/act_mock_ad_account_id/adimages'),
        expect.any(Object),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );

      expect(result).toEqual({ hash: 'image_hash_123', type: 'IMAGE' });
    });

    it('should successfully upload a video to Meta Graph API', async () => {
      const mockFile = {
        mimetype: 'video/mp4',
        originalname: 'test.mp4',
        buffer: Buffer.from('mock_video_bytes'),
      };

      mockPost.mockResolvedValueOnce({
        data: {
          id: 'video_id_456',
        },
      });

      const result = await uploadMediaToMeta(mockFile);

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/act_mock_ad_account_id/advideos'),
        expect.any(Object),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );

      expect(result).toEqual({ hash: 'video_id_456', type: 'VIDEO' });
    });
  });

  describe('execute campaign', () => {
    it('should use custom image hash from launchDetails and skip placeholder upload', async () => {
      const campaign = {
        name: 'Promo Campaign',
        status: 'ACTIVE',
        budget: 500,
        launchDetails: {
          mediaHash: 'custom_image_hash_789',
          mediaType: 'IMAGE',
          fileName: 'banner.png',
        },
      };

      mockPost
        .mockResolvedValueOnce({ data: { id: 'campaign_123' } })
        .mockResolvedValueOnce({ data: { id: 'adset_456' } })
        .mockResolvedValueOnce({ data: { id: 'creative_789' } })
        .mockResolvedValueOnce({ data: { id: 'ad_101' } });

      const result = await execute(campaign);

      expect(result.success).toBe(true);
      expect(result.metaCreativeId).toBe('creative_789');
      expect(result.metaAdId).toBe('ad_101');

      const creativeCall = mockPost.mock.calls[2];

      expect(creativeCall[0]).toContain('/act_mock_ad_account_id/adcreatives');
      expect(creativeCall[1]).toBeInstanceOf(URLSearchParams);
      expect(creativeCall[2]).toEqual({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const creativeParams = creativeCall[1] as URLSearchParams;

      const objectStorySpec = JSON.parse(
        creativeParams.get('object_story_spec') || '{}'
      );

      expect(objectStorySpec).toEqual(
        expect.objectContaining({
          page_id: 'mock_page_id',
          link_data: expect.objectContaining({
            image_hash: 'custom_image_hash_789',
          }),
        })
      );
    });

    it('should use custom video ID and build a video creative when mediaType is VIDEO', async () => {
      const campaign = {
        name: 'Video Promo',
        status: 'ACTIVE',
        budget: 500,
        launchDetails: {
          mediaHash: 'custom_video_id_999',
          mediaType: 'VIDEO',
          fileName: 'clip.mp4',
        },
      };

      mockPost
        .mockResolvedValueOnce({ data: { id: 'campaign_123' } })
        .mockResolvedValueOnce({ data: { id: 'adset_456' } })
        .mockResolvedValueOnce({ data: { id: 'creative_789' } })
        .mockResolvedValueOnce({ data: { id: 'ad_101' } });

      const result = await execute(campaign);

      expect(result.success).toBe(true);

      const creativeCall = mockPost.mock.calls[2];

      expect(creativeCall[0]).toContain('/act_mock_ad_account_id/adcreatives');
      expect(creativeCall[1]).toBeInstanceOf(URLSearchParams);

      const creativeParams = creativeCall[1] as URLSearchParams;

      const objectStorySpec = JSON.parse(
        creativeParams.get('object_story_spec') || '{}'
      );

      expect(objectStorySpec).toEqual(
        expect.objectContaining({
          page_id: 'mock_page_id',
          video_data: expect.objectContaining({
            video_id: 'custom_video_id_999',
          }),
        })
      );
    });
  });
});
