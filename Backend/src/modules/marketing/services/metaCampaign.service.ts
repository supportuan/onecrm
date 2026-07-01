
import axios from 'axios';
import { buildSocialMediaPostTemplate } from './socialMediaTemplate.service.js';

const normalizeAdAccountId = (value?: string) => {
  if (!value) return '';
  return value.startsWith('act_') ? value : `act_${value}`;
};

const getLaunchDetails = (campaign: any) => {
  return campaign.launchDetails || campaign.metadata || campaign.config || {};
};

const getMetaStatus = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "ACTIVE";

    case "PAUSED":
      return "PAUSED";

    case "DRAFT":
    case "COMPLETED":
    case "CANCELLED":
    default:
      return "PAUSED";
  }
};

const normalizeCountry = (country?: string) => {
  const value = String(country || "IN").trim().toUpperCase();

  const map: Record<string, string> = {
    INDIA: "IN",
    IN: "IN",

    USA: "US",
    US: "US",

    "UNITED STATES": "US",

    UK: "GB",
    GB: "GB",

    AUSTRALIA: "AU",
    AU: "AU",

    CANADA: "CA",
    CA: "CA",
  };

  return map[value] || "IN";
};

const buildMetaAdTemplate = (campaign: any) => {
  const details = getLaunchDetails(campaign);
  const postTemplate = buildSocialMediaPostTemplate(campaign);

  return {
    targetCountry: normalizeCountry(details.targetCountry || 'IN'),
    adHeadline: postTemplate.headline || `${campaign.name} Ad`,
    primaryText: postTemplate.primaryText || `${campaign.name} - Apply Today`,
    ctaButtonText: postTemplate.ctaButtonText || 'LEARN_MORE',
    landingPageUrl:
      postTemplate.landingPageUrl ||
      process.env.DEFAULT_LANDING_PAGE_URL ||
      'https://applyuninow.com',
  };
};

export const execute = async (campaign: any, leads: any[] = []) => {
  console.log(
    `[Meta Campaign Service] Launching campaign: ${campaign.name} for social media ads`
  );

  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = normalizeAdAccountId(process.env.META_AD_ACCOUNT_ID);
  const pageId = process.env.META_PAGE_ID;
  const instagramActorId = process.env.META_INSTAGRAM_ACTOR_ID;

  if (!accessToken || !adAccountId || !pageId) {
    return {
      success: false,
      channel: 'SOCIAL_MEDIA',
      message: 'Meta Ads account is not configured',
    };
  }

  const template = buildMetaAdTemplate(campaign);
  const metaStatus = getMetaStatus(campaign.status);
  const baseUrl = 'https://graph.facebook.com/v25.0';

  console.log('META ACCOUNT ID:', adAccountId);
  console.log('META PAGE ID:', pageId);

  try {
    // ===========================
    // CREATE CAMPAIGN
    // ===========================
    const campaignPayload = {
      name: campaign.name,
      objective: 'OUTCOME_TRAFFIC',
      status: metaStatus,
      special_ad_categories: [],
      is_adset_budget_sharing_enabled: false,
      access_token: accessToken,
    };

    console.log('Campaign Payload:', JSON.stringify(campaignPayload, null, 2));

    const campaignRes = await axios.post(
      `${baseUrl}/${adAccountId}/campaigns`,
      campaignPayload
    );

    console.log('Campaign Created:', campaignRes.data);

    const metaCampaignId = campaignRes.data.id;

    // ===========================
    // CREATE ADSET
    // ===========================
    const adSetPayload = {
      name: `${campaign.name} Ad Set`,
      campaign_id: metaCampaignId,

      daily_budget: Math.max(Number(campaign.budget || 100) * 100, 10000),

      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LINK_CLICKS',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      destination_type: 'WEBSITE',

      targeting: {
        geo_locations: {
          countries: [template.targetCountry || 'IN'],
        },
        targeting_automation: {
          advantage_audience: 0,
        },
      },

      status: metaStatus,
      access_token: accessToken,
    };

    console.log('AdSet Payload:', JSON.stringify(adSetPayload, null, 2));

    const adSetRes = await axios.post(
      `${baseUrl}/${adAccountId}/adsets`,
      adSetPayload
    );

    console.log('AdSet Created:', adSetRes.data);

    const metaAdSetId = adSetRes.data.id;

    // ===========================
    // UPLOAD IMAGE / VIDEO SELECT
    // ===========================
    const details = getLaunchDetails(campaign);
    const mediaHash = details.mediaHash;
    // Normalise to uppercase so both 'VIDEO' and 'video' are accepted
    const mediaType = String(details.mediaType || '').toUpperCase();

    let imageHash = '';
    let isVideo = mediaType === 'VIDEO';

    try {
      const imageUploadRes = await axios.post(
        `${baseUrl}/${adAccountId}/adimages`,
        {
          url: placeholderImageUrl,
          access_token: accessToken,
        }
      );

      imageHash =
        imageUploadRes.data?.images?.[placeholderImageUrl]?.hash ||
        (Object.values(imageUploadRes.data?.images || {})?.[0] as any)?.['hash'];
    } catch (uploadError: any) {
      console.warn(
        '[Meta Campaign Service] Image upload failed or restricted. Attempting to fetch existing images...',
        uploadError.message
      );

    if (mediaHash) {
      if (isVideo) {
        console.log('[Meta Campaign Service] Using uploaded video ID:', mediaHash);
      } else {
        imageHash = mediaHash;
        console.log('[Meta Campaign Service] Using uploaded image hash:', imageHash);
      }
    } else {
      // Fallback to placeholder image upload
      const placeholderImageUrl = 'https://via.placeholder.com/1200x628.png';
      try {
        const imageUploadRes = await axios.post(
          `${baseUrl}/${adAccountId}/adimages`,
          {
            url: placeholderImageUrl,
            access_token: accessToken,
          }
        );

        imageHash =
          imageUploadRes.data?.images?.[placeholderImageUrl]?.hash ||
          (Object.values(imageUploadRes.data?.images || {})?.[0] as any)?.hash;
      } catch (uploadError: any) {
        console.warn(
          '[Meta Campaign Service] Image upload failed or restricted. Attempting to fetch existing images...',
          uploadError.message
        );

        try {
          const existingImagesRes = await axios.get(
            `${baseUrl}/${adAccountId}/adimages`,
            {
              params: {
                access_token: accessToken,
                limit: 5,
              },
            }
          );

          const existingImages = existingImagesRes.data?.data || [];
          if (existingImages.length > 0) {
            imageHash = existingImages[0].hash;
            console.log('[Meta Campaign Service] Found existing image in account. Using hash:', imageHash);
          } else {
            throw new Error('No existing images found in ad account to fallback to.');
          }
        } catch (fallbackError: any) {
          console.error('[Meta Campaign Service] Fallback fetch failed:', fallbackError.message);
          throw uploadError;
        }
      }

      if (!imageHash) {
        throw new Error('Meta image upload failed: image hash not found');
      }

      console.log('Image Hash to use:', imageHash);
    }

    // ===========================
    // CREATE CREATIVE
    // ===========================
    let creativePayload: any = {
      name: `${campaign.name} Creative`,
      access_token: accessToken,
    };

    if (isVideo) {
      creativePayload.object_story_spec = {
        page_id: pageId,
        ...(instagramActorId ? { instagram_actor_id: instagramActorId } : {}),
        video_data: {
          video_id: mediaHash,
          title: template.adHeadline,
          message: template.primaryText,
          call_to_action: {
            type: template.ctaButtonText,
            value: {
              link: template.landingPageUrl,
            },
          },
        },
      };
    } else {
      creativePayload.object_story_spec = {
        page_id: pageId,
        ...(instagramActorId ? { instagram_actor_id: instagramActorId } : {}),
        link_data: {
          message: template.primaryText,
          link: template.landingPageUrl,
          name: template.adHeadline,
          image_hash: imageHash,
          call_to_action: {
            type: template.ctaButtonText,
            value: {
              link: template.landingPageUrl,
            },
          },
        },
      };
    }

    console.log('Creative Payload:', JSON.stringify(creativePayload, null, 2));

    const creativeRes = await axios.post(
      `${baseUrl}/${adAccountId}/adcreatives`,
      creativePayload
    );

    console.log('Creative Created:', creativeRes.data);

    const metaCreativeId = creativeRes.data.id;

    // ===========================
    // CREATE AD
    // ===========================
    const adPayload = {
      name: `${campaign.name} Ad`,
      adset_id: metaAdSetId,
      creative: {
        creative_id: metaCreativeId,
      },
      status: metaStatus,
      access_token: accessToken,
    };

    console.log('Ad Payload:', JSON.stringify(adPayload, null, 2));

    const adRes = await axios.post(`${baseUrl}/${adAccountId}/ads`, adPayload);

    console.log('Ad Created:', adRes.data);

    const metaAdId = adRes.data.id;

    return {
      success: true,
      channel: 'SOCIAL_MEDIA',
      message: 'Meta ad created successfully',
      metaCampaignId,
      metaAdSetId,
      metaCreativeId,
      metaAdId,
    };
  } catch (apiError: any) {
    console.error('META ERROR MESSAGE:', apiError.message);
    console.error('META ERROR STACK:', apiError.stack);

    if (apiError.response) {
      console.error(
        'META FULL ERROR:',
        JSON.stringify(apiError.response.data, null, 2)
      );
      console.error('META STATUS:', apiError.response.status);
      console.error('META HEADERS:', apiError.response.headers);
    }

    return {
      success: false,
      channel: 'SOCIAL_MEDIA',
      message: apiError.response?.data?.error?.message || apiError.message,
      details: apiError.response?.data || {},
    };
  }
};

export const uploadMediaToMeta = async (file: any): Promise<{ hash: string; type: 'IMAGE' | 'VIDEO' }> => {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = normalizeAdAccountId(process.env.META_AD_ACCOUNT_ID);
  
  if (!accessToken || !adAccountId) {
    throw new Error('Meta Ads account is not configured in environment variables');
  }

  const isVideo = file.mimetype.startsWith('video/');
  const baseUrl = 'https://graph.facebook.com/v25.0';

  if (isVideo) {
    const formData = new globalThis.FormData();
    const blob = new globalThis.Blob([file.buffer], { type: file.mimetype });
    formData.append('source', blob, file.originalname);
    formData.append('access_token', accessToken);

    console.log(`[Meta Campaign Service] Uploading video to act_${adAccountId}/advideos...`);
    const response = await axios.post(`${baseUrl}/${adAccountId}/advideos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const videoId = response.data.id;
    if (!videoId) {
      throw new Error('Meta video upload failed: video ID not returned from Graph API');
    }

    console.log(`[Meta Campaign Service] Video uploaded successfully. ID: ${videoId}`);
    return { hash: videoId, type: 'VIDEO' };
  } else {
    const formData = new globalThis.FormData();
    const blob = new globalThis.Blob([file.buffer], { type: file.mimetype });
    formData.append('filename', blob, file.originalname);
    formData.append('access_token', accessToken);

    console.log(`[Meta Campaign Service] Uploading image to act_${adAccountId}/adimages...`);
    const response = await axios.post(`${baseUrl}/${adAccountId}/adimages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const images = response.data?.images || {};
    const firstImage = Object.values(images)[0] as any;
    const imageHash = firstImage?.hash;

    if (!imageHash) {
      throw new Error('Meta image upload failed: image hash not found in response');
    }

    console.log(`[Meta Campaign Service] Image uploaded successfully. Hash: ${imageHash}`);
    return { hash: imageHash, type: 'IMAGE' };
  }
};