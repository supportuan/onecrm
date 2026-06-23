// import axios from 'axios';
// import crypto from 'crypto';

// export const execute = async (campaign: any, leads: any[]) => {
//   console.log(`[Meta Campaign Service] Launching campaign: ${campaign.name} for ${leads.length} leads`);

//   let sentCount = 0;
//   let failedCount = 0;
//   let skippedCount = 0;
//   const errors: string[] = [];

//   const accessToken = process.env.META_ACCESS_TOKEN;
//   const adAccountId = campaign.launchDetails?.metaAdAccountId || process.env.META_AD_ACCOUNT_ID;

//   if (!accessToken || !adAccountId) {
//     console.warn(`[Meta Campaign Service] Meta credentials missing for campaign ${campaign.id}`);
//     return {
//       success: false,
//       channel: 'META',
//       leadsProcessed: leads.length,
//       sentCount: 0,
//       failedCount: leads.length,
//       skippedCount: 0,
//       errors: ['Meta credentials missing: META_ACCESS_TOKEN or META_AD_ACCOUNT_ID not found.'],
//       details: {}
//     };
//   }

//   const validLeads = [];

//   for (const lead of leads) {
//     if (!lead.email && !lead.phone) {
//       skippedCount++;
//       errors.push(`Skipped lead ${lead.id}: No email or phone`);
//       continue;
//     }
//     validLeads.push(lead);
//   }

//   if (validLeads.length === 0) {
//     return {
//       success: false,
//       channel: 'META',
//       leadsProcessed: leads.length,
//       sentCount: 0,
//       failedCount: 0,
//       skippedCount: leads.length,
//       errors: ['No valid leads found with email or phone.'],
//       details: {}
//     };
//   }

//   // Hash lead data (SHA256) for Custom Audience
//   const hashedData = validLeads.map(lead => {
//     const data: string[] = [];
//     if (lead.email) {
//       data.push(crypto.createHash('sha256').update(lead.email.trim().toLowerCase()).digest('hex'));
//     } else {
//       data.push('');
//     }
//     if (lead.phone) {
//       const phone = lead.phone.replace(/\D/g, '');
//       data.push(crypto.createHash('sha256').update(phone).digest('hex'));
//     } else {
//       data.push('');
//     }
//     return data;
//   });

//   try {
//     const baseUrl = 'https://graph.facebook.com/v19.0';
//     let customAudienceId = '';

//     try {
//       // 1. Create Custom Audience
//       const audienceRes = await axios.post(`${baseUrl}/${adAccountId}/customaudiences`, {
//         name: `Audience_${campaign.name}_${Date.now()}`,
//         subtype: 'CUSTOM',
//         description: `Audience for campaign ${campaign.name}`,
//         customer_file_source: 'USER_PROVIDED_ONLY',
//         access_token: accessToken
//       });
//       customAudienceId = audienceRes.data.id;

//       // 2. Add Users to Custom Audience
//       const payload = {
//         payload: {
//           schema: ['EMAIL', 'PHONE'],
//           data: hashedData
//         },
//         access_token: accessToken
//       };
//       await axios.post(`${baseUrl}/${customAudienceId}/users`, payload);

//       console.log(`[Meta Campaign Service] Added ${validLeads.length} leads to Custom Audience ${customAudienceId}`);
//     } catch (apiError: any) {
//       const msg = apiError.response?.data?.error?.message || apiError.message;
//       console.warn(`[Meta Campaign Service] Meta API call failed: ${msg}.`);
//       errors.push(`Meta API Error: ${msg}`);

//       return {
//         success: false,
//         channel: 'META',
//         leadsProcessed: leads.length,
//         sentCount: 0,
//         failedCount: validLeads.length,
//         skippedCount,
//         errors,
//         details: {}
//       };
//     }

//     sentCount = validLeads.length;

//     return {
//       success: true,
//       channel: 'META',
//       leadsProcessed: leads.length,
//       sentCount,
//       failedCount: 0,
//       skippedCount,
//       errors,
//       details: {
//         metaCampaignId: `act_mock_cam_${Date.now()}`,
//         customAudienceId,
//         status: 'ACTIVE_PUBLISHED',
//       }
//     };
//   } catch (err: any) {
//     return {
//       success: false,
//       channel: 'META',
//       leadsProcessed: leads.length,
//       sentCount: 0,
//       failedCount: leads.length,
//       skippedCount: 0,
//       errors: [err.message],
//       details: {}
//     };
//   }
// };





import axios from 'axios';
import { buildSocialMediaPostTemplate } from './socialMediaTemplate.service';

const normalizeAdAccountId = (value?: string) => {
  if (!value) return '';
  return value.startsWith('act_') ? value : `act_${value}`;
};

const getLaunchDetails = (campaign: any) => {
  return campaign.launchDetails || campaign.metadata || campaign.config || {};
};

// const mapMetaObjective = (objective?: string) => {
//   switch (String(objective || '').toUpperCase()) {
//     case 'TRAFFIC':
//       return 'OUTCOME_TRAFFIC';
//     case 'LEAD_GENERATION':
//       return 'OUTCOME_LEADS';
//     case 'ENGAGEMENT':
//       return 'OUTCOME_ENGAGEMENT';
//     case 'CONVERSIONS':
//       return 'OUTCOME_SALES';
//     case 'OUTCOME_TRAFFIC':
//     case 'OUTCOME_LEADS':
//     case 'OUTCOME_ENGAGEMENT':
//     case 'OUTCOME_SALES':
//     case 'OUTCOME_AWARENESS':
//     case 'OUTCOME_APP_PROMOTION':
//       return String(objective).toUpperCase();
//     default:
//       return 'OUTCOME_TRAFFIC';
//   }
// };

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

// export const execute = async (campaign: any, leads: any[] = []) => {
//   // console.log(
//   //   `[Meta Campaign Service] Launching campaign: ${campaign.name} for social media ads`
//   // );

//   console.error(
//     "META FULL ERROR:",
//     JSON.stringify(apiError.response?.data, null, 2)
//   );

//   console.warn(
//     `[Meta Campaign Service] Meta API call failed: ${errorMessage}`
//   );

//   const accessToken = process.env.META_ACCESS_TOKEN;
//   const adAccountId = normalizeAdAccountId(process.env.META_AD_ACCOUNT_ID);
//   const pageId = process.env.META_PAGE_ID;

//   if (!accessToken || !adAccountId || !pageId) {
//     return {
//       success: false,
//       channel: 'META',
//       message: 'Meta Ads account is not configured',
//       requiredKeys: [
//         'META_ACCESS_TOKEN',
//         'META_AD_ACCOUNT_ID',
//         'META_PAGE_ID',
//       ],
//       details: {},
//     };
//   }

//   const template = buildMetaAdTemplate(campaign);
//   const { ageMin, ageMax } = parseAgeRange(template.targetAgeRange);

//   console.log('[Meta Ad Service] Creating Meta Ad with details:', {
//     objective: template.objective,
//     optimizationGoal: template.optimizationGoal,
//     platform: template.platform,
//     adHeadline: template.adHeadline,
//     ctaButtonText: template.ctaButtonText,
//     targetCountry: template.targetCountry,
//     targetAgeRange: template.targetAgeRange,
//     ageMin,
//     ageMax,
//   });

//   try {
//     const baseUrl = 'https://graph.facebook.com/v19.0';

//     const campaignRes = await axios.post(
//       `${baseUrl}/${adAccountId}/campaigns`,
//       {
//         name: campaign.name,
//         objective: template.objective,
//         status: 'PAUSED',
//         special_ad_categories: [],
//         access_token: accessToken,
//       }
//     );

//     const metaCampaignId = campaignRes.data.id;

//     const adSetRes = await axios.post(
//       `${baseUrl}/${adAccountId}/adsets`,
//       {
//         name: `${campaign.name} Ad Set`,
//         campaign_id: metaCampaignId,
//         daily_budget: Math.max(Number(campaign.budget || 100) * 100, 100),
//         billing_event: 'IMPRESSIONS',
//         optimization_goal: template.optimizationGoal,
//         bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
//         targeting: {
//           geo_locations: {
//             countries: [template.targetCountry],
//           },
//           age_min: ageMin,
//           age_max: ageMax,
//           publisher_platforms:
//             template.platform === 'INSTAGRAM'
//               ? ['instagram']
//               : template.platform === 'FACEBOOK'
//                 ? ['facebook']
//                 : ['facebook', 'instagram'],
//         },
//         status: 'PAUSED',
//         access_token: accessToken,
//       }
//     );

//     const metaAdSetId = adSetRes.data.id;

//     const creativeRes = await axios.post(
//       `${baseUrl}/${adAccountId}/adcreatives`,
//       {
//         name: `${campaign.name} Creative`,
//         object_story_spec: {
//           page_id: pageId,
//           link_data: {
//             message: template.primaryText,
//             link: template.landingPageUrl,
//             name: template.adHeadline,
//             call_to_action: {
//               type: template.ctaButtonText,
//               value: {
//                 link: template.landingPageUrl,
//               },
//             },
//           },
//         },
//         access_token: accessToken,
//       }
//     );

//     const metaCreativeId = creativeRes.data.id;

//     const adRes = await axios.post(`${baseUrl}/${adAccountId}/ads`, {
//       name: `${campaign.name} Ad`,
//       adset_id: metaAdSetId,
//       creative: {
//         creative_id: metaCreativeId,
//       },
//       status: 'PAUSED',
//       access_token: accessToken,
//     });

//     const metaAdId = adRes.data.id;

//     return {
//       success: true,
//       channel: 'SOCIAL_MEDIA',
//       message: 'Meta social media ad created successfully',
//       leadsProcessed: 0,
//       platform: template.platform,
//       objective: template.objective,
//       optimizationGoal: template.optimizationGoal,
//       targetCountry: template.targetCountry,
//       targetAgeRange: template.targetAgeRange,
//       ageMin,
//       ageMax,
//       metaCampaignId,
//       metaAdSetId,
//       metaCreativeId,
//       metaAdId,
//       details: {
//         status: 'PAUSED',
//         note:
//           'Ad was created in PAUSED mode. Review and publish from Meta Ads Manager.',
//       },
//     };
//   } catch (apiError: any) {
//     const errorMessage =
//       apiError.response?.data?.error?.message ||
//       apiError.message ||
//       'Meta API call failed';

//     console.warn(`[Meta Campaign Service] Meta API call failed: ${errorMessage}`);

//     return {
//       success: false,
//       channel: 'SOCIAL_MEDIA',
//       message: errorMessage,
//       leadsProcessed: 0,
//       platform: template.platform,
//       objective: template.objective,
//       optimizationGoal: template.optimizationGoal,
//       targetCountry: template.targetCountry,
//       targetAgeRange: template.targetAgeRange,
//       ageMin,
//       ageMax,
//       errors: [errorMessage],
//       details: apiError.response?.data || {},
//     };
//   }
// };

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

      optimization_goal: 'LINK_CLICKS',

      destination_type: 'WEBSITE',

      targeting: {
        geo_locations: {
          countries: [template.targetCountry]
        },
        age_min: ageMin,
        age_max: ageMax
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

