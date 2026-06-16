// import { PrismaClient } from '@prisma/client';
// import * as emailCampaignService from './emailCampaign.service.js';
// import * as smsWhatsAppCampaignService from './smsWhatsAppCampaign.service.js';
// import * as metaCampaignService from './metaCampaign.service.js';
// import * as linkedInCampaignService from './linkedInCampaign.service.js';
// import * as websiteCampaignService from './websiteCampaign.service.js';

// const prisma = new PrismaClient();

// export const launchCampaign = async (campaignId: number, launchedByUserId?: number) => {
//   const campaign = await prisma.campaign.findFirst({
//     where: { id: campaignId, deletedAt: null },
//     include: {
//       leads: {
//         include: {
//           lead: true,
//         },
//       },
//     },
//   });

//   if (!campaign) {
//     throw new Error('Campaign not found');
//   }

//   const leads = campaign.leads.map((cl) => cl.lead).filter(Boolean);

//   let results: any = {};
//   let overallSuccess = true;

//   try {
//     switch (campaign.type) {
//       case 'EMAIL':
//         results = await emailCampaignService.execute(campaign, leads);
//         overallSuccess = results.success;
//         break;
//       case 'SMS':
//       case 'WHATSAPP':
//         results = await smsWhatsAppCampaignService.execute(campaign, leads);
//         overallSuccess = results.success;
//         break;
//       case 'SOCIAL_MEDIA':
//         const metaRes = await metaCampaignService.execute(campaign, leads);
//         const linkedInRes = await linkedInCampaignService.execute(campaign, leads);
//         results = {
//           meta: metaRes,
//           linkedin: linkedInRes,
//         };
//         overallSuccess = metaRes.success && linkedInRes.success;
//         break;
//       case 'CONTENT':
//       case 'PPC':
//         results = await websiteCampaignService.execute(campaign, leads);
//         overallSuccess = results.success;
//         break;
//       default:
//         results = await websiteCampaignService.execute(campaign, leads);
//         overallSuccess = results.success;
//     }

//     // Store launch log
//     await prisma.campaignLaunchLog.create({
//       data: {
//         campaignId,
//         launchedBy: launchedByUserId || null,
//         status: overallSuccess ? 'SUCCESS' : 'FAILED',
//         details: results,
//       },
//     });

//     // Update status to ACTIVE
//     if (overallSuccess) {
//       await prisma.campaign.update({
//         where: { id: campaignId },
//         data: { status: 'ACTIVE' },
//       });
//     }

//     return {
//       success: overallSuccess,
//       message: overallSuccess ? 'Campaign launched successfully' : 'Campaign launch completed with errors',
//       details: results,
//     };
//   } catch (error: any) {
//     await prisma.campaignLaunchLog.create({
//       data: {
//         campaignId,
//         launchedBy: launchedByUserId || null,
//         status: 'FAILED',
//         details: { error: error.message || 'Fatal launch error' },
//       },
//     });
//     throw error;
//   }
// };


import { CampaignStatus } from '@prisma/client';
import { prisma } from '../../../prisma.js';

import * as emailCampaignService from './emailCampaign.service.js';
import * as smsWhatsAppCampaignService from './smsWhatsAppCampaign.service.js';
import * as metaCampaignService from './metaCampaign.service.js';
import * as linkedInCampaignService from './linkedInCampaign.service.js';
import * as websiteCampaignService from './websiteCampaign.service.js';
import * as googleAdsCampaignService from './googleAdsCampaignService.js';

export const launchCampaign = async (
  campaignId: number,
  launchedByUserId?: number
) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, deletedAt: null },
    include: {
      leads: {
        include: {
          lead: true,
        },
      },
    },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const leads = campaign.leads.map((cl) => cl.lead).filter(Boolean);

  let results: any = {};
  let overallSuccess = true;

  try {
    switch (campaign.type) {
      case 'EMAIL':
        results = await emailCampaignService.execute(campaign, leads);
        overallSuccess = Boolean(results.success);
        break;

      case 'SMS':
      case 'WHATSAPP':
        results = await smsWhatsAppCampaignService.execute(campaign, leads);
        overallSuccess = Boolean(results.success);
        break;

      case 'SOCIAL_MEDIA': {
        const metaRes = await metaCampaignService.execute(campaign, leads);
        const linkedInRes = await linkedInCampaignService.execute(campaign, leads);

        results = {
          meta: metaRes,
          linkedin: linkedInRes,
        };

        overallSuccess = Boolean(metaRes.success && linkedInRes.success);
        break;
      }

      case 'PPC':
        results = await googleAdsCampaignService.execute(campaign, leads);
        overallSuccess = Boolean(results.success);
        break;

      case 'CONTENT':
        results = await websiteCampaignService.execute(campaign, leads);
        overallSuccess = Boolean(results.success);
        break;

      default:
        throw new Error(`Unsupported campaign type: ${campaign.type}`);
    }

    await prisma.campaignLaunchLog.create({
      data: {
        campaignId,
        launchedBy: launchedByUserId || null,
        status: overallSuccess ? 'SUCCESS' : 'FAILED',
        details: results,
      },
    });

    if (overallSuccess) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.ACTIVE },
      });
    }

    return {
      success: overallSuccess,
      message: overallSuccess
        ? 'Campaign launched successfully'
        : 'Campaign launch completed with errors',
      details: results,
    };
  } catch (error: any) {
    await prisma.campaignLaunchLog.create({
      data: {
        campaignId,
        launchedBy: launchedByUserId || null,
        status: 'FAILED',
        details: {
          error: error.message || 'Fatal launch error',
        },
      },
    });

    throw error;
  }
};
