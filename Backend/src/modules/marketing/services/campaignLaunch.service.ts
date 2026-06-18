
import { CampaignStatus } from '@prisma/client';
import { prisma } from '../../../prisma.js';

import * as emailCampaignService from './emailCampaign.service.js';
import * as smsWhatsAppCampaignService from './smsWhatsAppCampaign.service.js';
import * as metaCampaignService from './metaCampaign.service.js';
import * as linkedInCampaignService from './linkedInCampaign.service.js';
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

  const leads = campaignLeads
    .map((cl) => cl.lead)
    .filter((lead) => lead && lead.email && String(lead.email).trim() !== '');

  console.log('Launching campaign ID:', campaignId);
  console.log('Selected audience type:', selectedAudienceType);
  console.log('CampaignLead records:', campaignLeads.length);
  console.log('Leads passed to campaign service:', leads.length);

  if (leads.length === 0) {
    await prisma.campaignLaunchLog.create({
      data: {
        campaignId,
        launchedBy: launchedByUserId || null,
        status: 'FAILED',
        details: {
          audienceType: selectedAudienceType,
          totalLeads: 0,
          error: `No ${selectedAudienceType} leads with valid email found for this campaign`,
        },
      },
    });

    return {
      success: false,
      message: `No ${selectedAudienceType} leads with valid email found for this campaign`,
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

      case 'SOCIAL_MEDIA': {
        const metaRes = await metaCampaignService.execute(campaign, leads);
        const linkedInRes = await linkedInCampaignService.execute(campaign, leads);

        results = {
          success: Boolean(metaRes.success && linkedInRes.success),
          meta: metaRes,
          linkedin: linkedInRes,
        };
        break;
      }

      case 'PPC':
        results = await googleAdsCampaignService.execute(campaign, leads);
        break;

      case 'CONTENT':
        results = await websiteCampaignService.execute(campaign, leads);
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

    const overallSuccess = totalSent > 0;

    await prisma.campaignLaunchLog.create({
      data: {
        campaignId,
        launchedBy: launchedByUserId || null,
        status: overallSuccess ? 'SUCCESS' : 'FAILED',
        details: {
          audienceType: selectedAudienceType,
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
        totalSent > 0
          ? 'Campaign launched successfully'
          : 'Campaign launch completed with errors',
      audienceType: selectedAudienceType,
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
          audienceType: selectedAudienceType,
          totalLeads: leads.length,
          error: error.message || 'Fatal launch error',
        },
      },
    });

    throw error;
  }
};