// src/modules/marketing/services/googleAdsCampaignService.ts

import { GoogleAdsApi, enums, ResourceNames } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
});

export const execute = async (campaign: any, leads: any[] = []) => {
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

    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    });

    const budgetResourceName = ResourceNames.campaignBudget(
      process.env.GOOGLE_ADS_CUSTOMER_ID!,
      Date.now()
    );

    const budgetResult = await customer.campaignBudgets.create([
      {
        name: `${campaign.name} Budget ${Date.now()}`,
        amount_micros: Math.round((campaign.budget || 1000) * 1000000),
        delivery_method: enums.BudgetDeliveryMethod.STANDARD,
        explicitly_shared: false,
      },
    ]);

    const createdBudget = budgetResult.results[0].resource_name;

    const campaignResult = await customer.campaigns.create([
      {
        name: `${campaign.name} ${Date.now()}`,
        advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
        status: enums.CampaignStatus.PAUSED,
        campaign_budget: createdBudget,
        manual_cpc: {},
        network_settings: {
          target_google_search: true,
          target_search_network: true,
          target_content_network: false,
          target_partner_search_network: false,
        },
      },
    ]);

    const googleCampaignResourceName = campaignResult.results[0].resource_name;

    const adGroupResult = await customer.adGroups.create([
      {
        name: `${campaign.name} Ad Group`,
        campaign: googleCampaignResourceName,
        status: enums.AdGroupStatus.ENABLED,
        type: enums.AdGroupType.SEARCH_STANDARD,
        cpc_bid_micros: 1000000,
      },
    ]);

    return {
      success: true,
      platform: 'GOOGLE_ADS',
      message: 'Google Ads campaign created successfully',
      campaignName: campaign.name,
      customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
      googleCampaignResourceName,
      googleAdGroupResourceName: adGroupResult.results[0].resource_name,
      leadsCount: leads.length,
    };
  } catch (error: any) {
    console.error('[GoogleAdsCampaignService] Error:', error);

    return {
      success: false,
      platform: 'GOOGLE_ADS',
      message:
        error?.errors?.[0]?.message ||
        error?.message ||
        'Google Ads campaign creation failed',
    };
  }
};