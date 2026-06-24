// // src/modules/marketing/services/googleAdsCampaignService.ts

// import { GoogleAdsApi, enums, ResourceNames } from 'google-ads-api';

// const client = new GoogleAdsApi({
//   client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
//   client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
//   developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
// });

// /**
//  * Task 6 & 9: Create Campaign Budget helper function
//  * 
//  * 
//  */

// export const createCampaignBudget = async (customer: any, campaign: any) => {
//   const budgetPayload = [
//     {
//       name: `${campaign.name} Budget ${Date.now()}`,
//       amount_micros: Math.round((campaign.budget || 1000) * 1000000),
//       delivery_method: enums.BudgetDeliveryMethod.STANDARD,
//       explicitly_shared: false,
//     },
//   ];

//   console.log('Google Ads - Campaign Budget Payload:', JSON.stringify(budgetPayload, null, 2));
//   const budgetResult = await customer.campaignBudgets.create(budgetPayload);

//   if (!budgetResult || !budgetResult.results || budgetResult.results.length === 0) {
//     throw new Error('Failed to create campaign budget: empty response');
//   }

//   const budgetResourceName = budgetResult.results[0].resource_name;
//   console.log('Google Ads - Created Budget Resource Name:', budgetResourceName);
//   return budgetResourceName;
// };

// /**
//  * Task 6 & 9: Create Google Campaign helper function
//  */
// export const createGoogleCampaign = async (customer: any, campaign: any, budgetResourceName: string) => {
//   // Task 7: Validate that the campaign budget resource exists before creating the campaign
//   if (!budgetResourceName || typeof budgetResourceName !== 'string' || !budgetResourceName.startsWith('customers/')) {
//     throw new Error(`Invalid or missing campaign budget resource name: "${budgetResourceName}"`);
//   }

//   const campaignPayload = [
//     {
//       name: `${campaign.name} ${Date.now()}`,
//       advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
//       status: enums.CampaignStatus.PAUSED,
//       campaign_budget: budgetResourceName,
//       manual_cpc: {},
//       // Task 2: Pass the correct SDK enum value instead of a boolean
//       contains_eu_political_advertising: enums.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING,
//       network_settings: {
//         target_google_search: true,
//         target_search_network: true,
//         target_content_network: false,
//         target_partner_search_network: false,
//       },
//     },
//   ];

//   console.log('Google Ads - Campaign Payload:', JSON.stringify(campaignPayload, null, 2));
//   const campaignResult = await customer.campaigns.create(campaignPayload);

//   if (!campaignResult || !campaignResult.results || campaignResult.results.length === 0) {
//     throw new Error('Failed to create campaign: empty response');
//   }

//   return campaignResult.results[0].resource_name;
// };

// /**
//  * Task 9: Launch Google Campaign (Orchestrator)
//  */
// export const launchGoogleCampaign = async (campaign: any, leads: any[] = []) => {
//   try {
//     const requiredEnv = [
//       'GOOGLE_ADS_CLIENT_ID',
//       'GOOGLE_ADS_CLIENT_SECRET',
//       'GOOGLE_ADS_REFRESH_TOKEN',
//       'GOOGLE_ADS_DEVELOPER_TOKEN',
//       'GOOGLE_ADS_CUSTOMER_ID',
//     ];

//     const missing = requiredEnv.filter((key) => !process.env[key]);
//     if (missing.length > 0) {
//       return {
//         success: false,
//         platform: 'GOOGLE_ADS',
//         message: `Missing Google Ads env keys: ${missing.join(', ')}`,
//       };
//     }

//     // Sanitize credentials
//     const rawCustomerId = process.env.GOOGLE_ADS_CUSTOMER_ID || '';
//     const customerId = rawCustomerId.replace(/[^0-9]/g, ''); // ensure only digits
//     const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
//       ? process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/[^0-9]/g, '')
//       : undefined;

//     // Task 6: Log credentials
//     console.log('Google Ads - Credentials/Config:', {
//       customer_id: customerId,
//       login_customer_id: loginCustomerId || null,
//       developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
//     });

//     const customerConfig: any = {
//       customer_id: customerId,
//       refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
//     };

//     // Only use MCC login_customer_id if customer is managed by MCC
//     if (loginCustomerId && process.env.GOOGLE_ADS_USE_MCC === 'true') {
//       customerConfig.login_customer_id = loginCustomerId;
//     }

//     const customer = client.Customer(customerConfig);



//     // 1. Create campaign budget
//     const budgetResourceName = await createCampaignBudget(customer, campaign);

//     // 2. Create campaign
//     const googleCampaignResourceName = await createGoogleCampaign(customer, campaign, budgetResourceName);

//     // 3. Create Ad Group
//     const adGroupPayload = [
//       {
//         name: `${campaign.name} Ad Group`,
//         campaign: googleCampaignResourceName,
//         status: enums.AdGroupStatus.ENABLED,
//         type: enums.AdGroupType.SEARCH_STANDARD,
//         cpc_bid_micros: 1000000,
//       },
//     ];
//     console.log('Google Ads - Ad Group Payload:', JSON.stringify(adGroupPayload, null, 2));
//     const adGroupResult = await customer.adGroups.create(adGroupPayload);
//     if (!adGroupResult || !adGroupResult.results || adGroupResult.results.length === 0) {
//       throw new Error('Failed to create ad group: empty response');
//     }

//     // 4. Create Expanded/Responsive Search Ad
//     const adPayload = [
//       {
//         ad_group: adGroupResult.results[0].resource_name,
//         status: enums.AdGroupAdStatus.PAUSED,
//         ad: {
//           final_urls: [
//             campaign.launchDetails?.landingPageUrl || 'https://example.com'
//           ],
//           expanded_text_ad: {
//             headline_part1: (campaign.launchDetails?.headlines?.split(',')[0] ?? 'Headline 1').trim(),
//             headline_part2: (campaign.launchDetails?.headlines?.split(',')[1] ?? 'Headline 2').trim(),
//             description: (campaign.launchDetails?.descriptions?.split(',')[0] ?? 'Description').trim(),
//           },
//         },
//       },
//     ];
//     console.log('Google Ads - Ad Payload:', JSON.stringify(adPayload, null, 2));
//     const adGroupAdResult = await customer.adGroupAds.create(adPayload);

//     return {
//       success: true,
//       platform: 'GOOGLE_ADS',
//       message: 'Google Ads campaign created successfully',
//       campaignName: campaign.name,
//       customerId: customerId,
//       googleCampaignResourceName,
//       googleAdGroupResourceName: adGroupResult.results[0].resource_name,
//       googleAdGroupAdResourceName: adGroupAdResult?.results?.[0]?.resource_name,
//       leadsCount: leads.length,
//     };
//   } catch (error: any) {
//     console.error('Google Ads Full Error:', JSON.stringify(error, null, 2));
//     if (error?.errors) {
//       error.errors.forEach((e: any) => {
//         console.error('Message:', e.message);
//         console.error('Code:', e.error_code);
//         console.error('Location:', JSON.stringify(e.location, null, 2));
//       });
//     }
//     throw error;
//   }
// };

// // Map default execution entrypoint to launchGoogleCampaign for compatibility
// export const execute = launchGoogleCampaign;


import { GoogleAdsApi, enums } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
});

const truncate = (value: string, max: number) =>
  String(value || '').trim().slice(0, max);

export const createCampaignBudget = async (customer: any, campaign: any) => {
  const dailyBudget =
    Number(campaign.launchDetails?.dailyBudget) ||
    Number(campaign.budget) ||
    1000;

  const budgetPayload = [
    {
      name: `${campaign.name} Budget ${Date.now()}`,
      amount_micros: Math.round(dailyBudget * 1_000_000),
      delivery_method: enums.BudgetDeliveryMethod.STANDARD,
      explicitly_shared: false,
    },
  ];

  console.log('Google Ads - Campaign Budget Payload:', JSON.stringify(budgetPayload, null, 2));

  const budgetResult = await customer.campaignBudgets.create(budgetPayload);

  if (!budgetResult?.results?.length) {
    throw new Error('Failed to create campaign budget: empty response');
  }

  return budgetResult.results[0].resource_name;
};

export const createGoogleCampaign = async (
  customer: any,
  campaign: any,
  budgetResourceName: string
) => {
  const campaignPayload = [
    {
      name: `${campaign.name} ${Date.now()}`,
      advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
      // status: enums.CampaignStatus.PAUSED,
      status: enums.CampaignStatus.ENABLED,
      campaign_budget: budgetResourceName,
      manual_cpc: {},
      contains_eu_political_advertising:
        enums.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING,
      network_settings: {
        target_google_search: true,
        target_search_network: true,
        target_content_network: false,
        target_partner_search_network: false,
      },
    },
  ];

  console.log('Google Ads - Campaign Payload:', JSON.stringify(campaignPayload, null, 2));

  const campaignResult = await customer.campaigns.create(campaignPayload);

  if (!campaignResult?.results?.length) {
    throw new Error('Failed to create campaign: empty response');
  }

  return campaignResult.results[0].resource_name;
};

export const launchGoogleCampaign = async (campaign: any, leads: any[] = []) => {
  try {
    const requiredEnv = [
      'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_REFRESH_TOKEN',
      'GOOGLE_ADS_DEVELOPER_TOKEN',
      'GOOGLE_ADS_CUSTOMER_ID',
    ];

    const missing = requiredEnv.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      return {
        success: false,
        platform: 'GOOGLE_ADS',
        message: `Missing Google Ads env keys: ${missing.join(', ')}`,
      };
    }

    const customerId = String(process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/[^0-9]/g, '');

    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
      ? String(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID).replace(/[^0-9]/g, '')
      : undefined;

    console.log('Google Ads - Credentials/Config:', {
      customer_id: customerId,
      login_customer_id: loginCustomerId || null,
      use_mcc: process.env.GOOGLE_ADS_USE_MCC || 'false',
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    });

    const customerConfig: any = {
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    };

    if (loginCustomerId && process.env.GOOGLE_ADS_USE_MCC === 'true') {
      customerConfig.login_customer_id = loginCustomerId;
    }

    const customer = client.Customer(customerConfig);

    const testCustomer = await customer.query(`
      SELECT customer.id, customer.descriptive_name
      FROM customer
      LIMIT 1
    `);

    console.log('Google Ads - Customer Test:', testCustomer);

    const budgetResourceName = await createCampaignBudget(customer, campaign);

    const googleCampaignResourceName = await createGoogleCampaign(
      customer,
      campaign,
      budgetResourceName
    );

    const adGroupPayload = [
      {
        name: `${campaign.name} Ad Group ${Date.now()}`,
        campaign: googleCampaignResourceName,
        status: enums.AdGroupStatus.ENABLED,
        type: enums.AdGroupType.SEARCH_STANDARD,
        cpc_bid_micros: 1_000_000,
      },
    ];

    console.log('Google Ads - Ad Group Payload:', JSON.stringify(adGroupPayload, null, 2));

    const adGroupResult = await customer.adGroups.create(adGroupPayload);

    if (!adGroupResult?.results?.length) {
      throw new Error('Failed to create ad group: empty response');
    }

    const adGroupResourceName = adGroupResult.results[0].resource_name;

    const headlines = String(campaign.launchDetails?.headlines || '')
      .split(',')
      .map((item) => truncate(item, 30))
      .filter(Boolean);

    const descriptions = String(campaign.launchDetails?.descriptions || '')
      .split(',')
      .map((item) => truncate(item, 90))
      .filter(Boolean);

    const landingPageUrl =
      campaign.launchDetails?.landingPageUrl || 'https://applyuninow.com/';

    const adPayload = [
      {
        ad_group: adGroupResourceName,
        // status: enums.AdGroupAdStatus.PAUSED,
        status: enums.AdGroupAdStatus.ENABLED,
        ad: {
          final_urls: [landingPageUrl],
          responsive_search_ad: {
            headlines: [
              { text: headlines[0] || 'ApplyUniNow' },
              { text: headlines[1] || 'Study Abroad Help' },
              { text: headlines[2] || 'Apply To Universities' },
            ],
            descriptions: [
              {
                text:
                  descriptions[0] ||
                  'Get expert guidance for admissions and applications.',
              },
              {
                text:
                  descriptions[1] ||
                  'Start your study abroad journey with ApplyUniNow.',
              },
            ],
          },
        },
      },
    ];

    console.log('Google Ads - Ad Payload:', JSON.stringify(adPayload, null, 2));

    const adGroupAdResult = await customer.adGroupAds.create(adPayload);

    return {
      success: true,
      platform: 'GOOGLE_ADS',
      message: 'Google Ads campaign created successfully',
      campaignName: campaign.name,
      customerId,
      googleCampaignResourceName,
      googleAdGroupResourceName: adGroupResourceName,
      googleAdGroupAdResourceName:
        adGroupAdResult?.results?.[0]?.resource_name || null,
      leadsCount: leads.length,
    };
  } catch (error: any) {
    console.error('Google Ads Full Error:', JSON.stringify(error, null, 2));

    if (error?.errors) {
      error.errors.forEach((e: any) => {
        console.error('Message:', e.message);
        console.error('Code:', e.error_code);
        console.error('Location:', JSON.stringify(e.location, null, 2));
      });
    }

    throw error;
  }
};

export const execute = launchGoogleCampaign;