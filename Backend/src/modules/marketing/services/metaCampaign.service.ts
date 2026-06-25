
import axios from 'axios';
import { buildSocialMediaPostTemplate } from './socialMediaTemplate.service.js';

const normalizeAdAccountId = (value?: string) => {
  if (!value) return '';
  return value.startsWith('act_') ? value : `act_${value}`;
};

const getLaunchDetails = (campaign: any) => {
  return campaign.launchDetails || campaign.metadata || campaign.config || {};
};


const mapMetaObjective = (objective?: string) => {
  switch (String(objective || '').toUpperCase()) {
    case 'TRAFFIC':
      return 'OUTCOME_TRAFFIC';

    case 'LEAD_GENERATION':
      return 'OUTCOME_LEADS';

    case 'ENGAGEMENT':
      return 'OUTCOME_ENGAGEMENT';

    case 'CONVERSIONS':
      return 'OUTCOME_SALES';

    default:
      return 'OUTCOME_TRAFFIC';
  }
};

const mapOptimizationGoal = (objective?: string) => {
  switch (String(objective || '').toUpperCase()) {
    case 'OUTCOME_TRAFFIC':
      return 'LINK_CLICKS';
    case 'OUTCOME_LEADS':
      return 'LEAD_GENERATION';
    case 'OUTCOME_ENGAGEMENT':
      return 'POST_ENGAGEMENT';
    case 'OUTCOME_SALES':
      return 'OFFSITE_CONVERSIONS';
    default:
      return 'LINK_CLICKS';
  }
};

const normalizeCountry = (country?: string) => {
  const value = String(country || 'IN').trim().toUpperCase();

  const map: Record<string, string> = {
    INDIA: 'IN',
    IN: 'IN',

    USA: 'US',
    US: 'US',
    'UNITED STATES': 'US',
    'UNITED STATES OF AMERICA': 'US',

    UK: 'GB',
    GB: 'GB',
    'UNITED KINGDOM': 'GB',
    ENGLAND: 'GB',

    AUSTRALIA: 'AU',
    AU: 'AU',

    CANADA: 'CA',
    CA: 'CA',
  };

  return map[value] || value;
};

const parseAgeRange = (value?: string) => {
  const raw = String(value || '18-35').trim();

  if (!raw.includes('-')) {
    const age = Number(raw) || 18;

    return {
      ageMin: age,
      ageMax: age + 10,
    };
  }

  const [minRaw, maxRaw] = raw.split('-');

  const ageMin = Number(minRaw) || 18;
  const parsedMax = Number(maxRaw) || 35;

  return {
    ageMin,
    ageMax: parsedMax >= ageMin ? parsedMax : ageMin + 10,
  };
};


const buildMetaAdTemplate = (campaign: any) => {
  const details = getLaunchDetails(campaign);
  const postTemplate = buildSocialMediaPostTemplate(campaign);

  const objectiveMap: Record<string, string> = {
    TRAFFIC: 'OUTCOME_TRAFFIC',
    LEAD_GENERATION: 'OUTCOME_LEADS',
    ENGAGEMENT: 'OUTCOME_ENGAGEMENT',
    CONVERSIONS: 'OUTCOME_SALES',
  };

  const metaObjective =
    objectiveMap[String(details.objective || '').toUpperCase()] ||
    mapMetaObjective(details.objective);

  return {
    platform: details.platform || 'FACEBOOK',
    objective: metaObjective,
    optimizationGoal: mapOptimizationGoal(metaObjective),
    targetCountry: normalizeCountry(details.targetCountry || 'IN'),
    targetAgeRange: details.targetAgeRange || '18-35',

    adHeadline: postTemplate.headline,
    primaryText: postTemplate.primaryText,
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

  if (!accessToken || !adAccountId || !pageId) {
    return {
      success: false,
      channel: 'META',
      message: 'Meta Ads account is not configured',
    };
  }

  const template = buildMetaAdTemplate(campaign);
  const { ageMin, ageMax } = parseAgeRange(template.targetAgeRange);

  console.log('META ACCOUNT ID:', adAccountId);
  console.log('META PAGE ID:', pageId);

  try {
    const baseUrl = 'https://graph.facebook.com/v19.0';

    // ===========================
    // CREATE CAMPAIGN
    // ===========================

    // const campaignPayload = {
    //   name: campaign.name,
    //   objective: template.objective,
    //   status: 'PAUSED',
    //   special_ad_categories: [],
    //   access_token: accessToken,
    // };

    const campaignPayload = {
      name: campaign.name,
      objective: template.objective,
      status: 'PAUSED',

      special_ad_categories: [],

      // REQUIRED IN META API V25
      is_adset_budget_sharing_enabled: false,

      access_token: accessToken,
    };

    console.log(
      'Campaign Payload:',
      JSON.stringify(campaignPayload, null, 2)
    );

    const campaignRes = await axios.post(
      `${baseUrl}/${adAccountId}/campaigns`,
      campaignPayload
    );

    console.log('Campaign Created:', campaignRes.data);

    const metaCampaignId = campaignRes.data.id;

    // ===========================
    // CREATE ADSET
    // ===========================

    // const adSetPayload = {
    //   name: `${campaign.name} Ad Set`,
    //   campaign_id: metaCampaignId,

    //   daily_budget: Math.max(
    //     Number(campaign.budget || 100) * 100,
    //     100
    //   ),

    //   billing_event: 'IMPRESSIONS',

    //   optimization_goal: template.optimizationGoal,

    //   targeting: {
    //     geo_locations: {
    //       countries: [template.targetCountry],
    //     },
    //     age_min: ageMin,
    //     age_max: ageMax,
    //   },

    //   status: 'PAUSED',
    //   access_token: accessToken,
    // };

    const adSetPayload = {
      name: `${campaign.name} Ad Set`,
      campaign_id: metaCampaignId,

      daily_budget: Math.max(
        Number(campaign.budget || 100) * 100,
        100
      ),

      billing_event: 'IMPRESSIONS',
      // Added bid constraints required by Meta API for certain optimization goals
      bid_strategy: 'LOWEST_COST_WITH_BID_CAP',
      bid_amount: Math.max(Number(campaign.budget || 100) * 100, 100),

      optimization_goal: template.optimizationGoal,

      destination_type: 'WEBSITE',

      targeting: {
        geo_locations: {
          countries: [template.targetCountry]
        },
        age_min: ageMin,
        age_max: ageMax,
        // Advantage audience flag required by Meta API (0 = disabled, 1 = enabled)
        targeting_automation: { advantage_audience: 0 }
      },

      status: 'PAUSED',
      access_token: accessToken
    };

    console.log(
      'AdSet Payload:',
      JSON.stringify(adSetPayload, null, 2)
    );

    const adSetRes = await axios.post(
      `${baseUrl}/${adAccountId}/adsets`,
      adSetPayload
    );

    // Upload placeholder image to get image_hash for the creative
    const placeholderImageUrl = 'https://via.placeholder.com/1200x628.png';
    const imageUploadRes = await axios.post(
      `${baseUrl}/${adAccountId}/adimages`,
      {
        url: placeholderImageUrl,
        access_token: accessToken,
      }
    );
    const imageHash = imageUploadRes.data?.images?.[0]?.hash || imageUploadRes.data?.hash;


    console.log('AdSet Created:', adSetRes.data);

    const metaAdSetId = adSetRes.data.id;

    // ===========================
    // CREATE CREATIVE
    // ===========================

    const creativePayload = {
      name: `${campaign.name} Creative`,
      object_story_spec: {
        page_id: pageId,
        link_data: {

          message:
            template.primaryText ||
            `${campaign.name} - Apply Today`,
          // Use the uploaded image hash instead of unsupported image_url

          link:
            template.landingPageUrl ||
            'https://example.com',

          name:
            template.adHeadline ||
            `${campaign.name} Ad`,

          call_to_action: {
            type: template.ctaButtonText || 'LEARN_MORE',
            value: {
              link:
                template.landingPageUrl ||
                'https://example.com',
            },
          },
        },
      },
      access_token: accessToken,
    };

    console.log(
      'Creative Payload:',
      JSON.stringify(creativePayload, null, 2)
    );

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
      status: 'PAUSED',
      access_token: accessToken,
    };

    console.log(
      'Ad Payload:',
      JSON.stringify(adPayload, null, 2)
    );

    const adRes = await axios.post(
      `${baseUrl}/${adAccountId}/ads`,
      adPayload
    );

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
    console.error(
      'META FULL ERROR:',
      JSON.stringify(apiError.response?.data, null, 2)
    );

    console.error(
      'META STATUS:',
      apiError.response?.status
    );

    console.error(
      'META HEADERS:',
      apiError.response?.headers
    );

    return {
      success: false,
      channel: 'SOCIAL_MEDIA',
      message:
        apiError.response?.data?.error?.message ||
        apiError.message,
      details: apiError.response?.data || {},
    };
  }
};

