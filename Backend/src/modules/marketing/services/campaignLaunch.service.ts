
import { CampaignStatus } from '@prisma/client';
import { prisma } from '../../../prisma.js';

import * as emailCampaignService from './emailCampaign.service.js';
import * as smsWhatsAppCampaignService from './smsWhatsAppCampaign.service.js';
import * as metaCampaignService from './metaCampaign.service.js';
import * as websiteCampaignService from './websiteCampaign.service.js';
import * as googleAdsCampaignService from './googleAdsCampaignService.js';

type AudienceType = 'ALL' | 'HOT' | 'WARM' | 'COLD' | 'MAYBE';

const normalizeAudienceType = (value?: string): AudienceType => {
  const normalized = String(value || 'ALL').toUpperCase();

  if (['ALL', 'HOT', 'WARM', 'COLD', 'MAYBE'].includes(normalized)) {
    return normalized as AudienceType;
  }

  return 'ALL';
};

const isDirectLeadCampaign = (type: string) => {
  return ['EMAIL', 'SMS', 'WHATSAPP'].includes(type);
};

export const launchCampaign = async (
  campaignId: number,
  launchedByUserId?: number,
  audienceType: string = 'ALL'
) => {
  const selectedAudienceType = normalizeAudienceType(audienceType);

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      deletedAt: null,
    },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  let leads: any[] = [];
  let campaignLeadCount = 0;

  if (isDirectLeadCampaign(campaign.type)) {
    const campaignLeads = await prisma.campaignLead.findMany({
      where: {
        campaignId,
        lead: {
          deletedAt: null,
          ...(selectedAudienceType !== 'ALL'
            ? {
              rating: selectedAudienceType,
            }
            : {}),
        },
      },
      include: {
        lead: true,
      },
    });

    campaignLeadCount = campaignLeads.length;

    leads = campaignLeads
      .map((cl) => cl.lead)
      .filter((lead) => lead && lead.email && String(lead.email).trim() !== '');
  }

  console.log('Launching campaign ID:', campaignId);
  console.log('Campaign type:', campaign.type);
  console.log('Selected audience type:', isDirectLeadCampaign(campaign.type) ? selectedAudienceType : 'NOT_APPLICABLE');
  console.log('CampaignLead records:', campaignLeadCount);
  console.log('Leads passed to campaign service:', leads.length);

  if (isDirectLeadCampaign(campaign.type) && leads.length === 0) {
    await prisma.campaignLaunchLog.create({
      data: {
        campaignId,
        launchedBy: launchedByUserId || null,
        status: 'FAILED',
        details: {
          audienceType: selectedAudienceType,
          totalLeads: 0,
          error: `No ${selectedAudienceType} leads found for this campaign`,
        },
      },
    });

    return {
      success: false,
      message: `No ${selectedAudienceType} leads found for this campaign`,
      audienceType: selectedAudienceType,
      totalSent: 0,
      totalFailed: 0,
      totalSkipped: 0,
      details: {},
    };
  }

  let results: any = {};

  try {
    switch (campaign.type) {
      case 'EMAIL':
        results = await emailCampaignService.execute(campaign, leads);
        console.log('EMAIL RESULT:', JSON.stringify(results, null, 2));
        break;

      case 'SMS':
      case 'WHATSAPP':
        results = await smsWhatsAppCampaignService.execute(campaign, leads);
        break;

      case 'SOCIAL_MEDIA':
        results = await metaCampaignService.execute(campaign, []);
        break;

      case 'PPC':
        results = await googleAdsCampaignService.execute(campaign, []);
        break;

      case 'CONTENT':
        results = await websiteCampaignService.execute(campaign, []);
        break;

      default:
        throw new Error(`Unsupported campaign type: ${campaign.type}`);
    }

    const totalSent =
      results.sentCount ||
      results.sent ||
      results.details?.sentCount ||
      0;

    const totalFailed =
      results.failedCount ||
      results.failed ||
      results.details?.failedCount ||
      0;

    const totalSkipped =
      results.skippedCount ||
      results.skipped ||
      results.details?.skippedCount ||
      0;

    const overallSuccess =
      campaign.type === 'SOCIAL_MEDIA' ||
        campaign.type === 'PPC' ||
        campaign.type === 'CONTENT'
        ? Boolean(results.success)
        : totalSent > 0;

    await prisma.campaignLaunchLog.create({
      data: {
        campaignId,
        launchedBy: launchedByUserId || null,
        status: overallSuccess ? 'SUCCESS' : 'FAILED',
        details: {
          campaignType: campaign.type,
          audienceType: isDirectLeadCampaign(campaign.type)
            ? selectedAudienceType
            : 'NOT_APPLICABLE',
          totalLeads: leads.length,
          totalSent,
          totalFailed,
          totalSkipped,
          results,
        },
      },
    });

    if (overallSuccess) {
      await prisma.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          status: CampaignStatus.ACTIVE,
        },
      });
    }

    return {
      success: overallSuccess,
      message:
        results.message ||
        (overallSuccess
          ? 'Campaign launched successfully'
          : 'Campaign launch completed with errors'),
      audienceType: isDirectLeadCampaign(campaign.type)
        ? selectedAudienceType
        : 'NOT_APPLICABLE',
      totalSent,
      totalFailed,
      totalSkipped,
      details: results,
    };
  } catch (error: any) {
    await prisma.campaignLaunchLog.create({
      data: {
        campaignId,
        launchedBy: launchedByUserId || null,
        status: 'FAILED',
        details: {
          campaignType: campaign.type,
          audienceType: isDirectLeadCampaign(campaign.type)
            ? selectedAudienceType
            : 'NOT_APPLICABLE',
          totalLeads: leads.length,
          error: error.message || 'Fatal launch error',
        },
      },
    });

    throw error;
  }
};