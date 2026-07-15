import axios from "axios";
import { CampaignType } from "@prisma/client";
import { prisma } from "../../../prisma.js";

const META_API_VERSION = "v25.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export const syncMetaCampaignInsights = async (campaignId: number) => {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn("[Meta Insights] META_ACCESS_TOKEN missing");
    return null;
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) return null;

  if (campaign.type !== CampaignType.SOCIAL_MEDIA) return campaign;

  if (!campaign.metaCampaignId) {
    console.warn(`[Meta Insights] metaCampaignId missing for campaign ${campaign.id}`);
    return campaign;
  }

  try {
    const response = await axios.get(
      `${META_BASE_URL}/${campaign.metaCampaignId}/insights`,
      {
        params: {
          access_token: accessToken,
          fields: "spend,impressions,reach,clicks,cpc,cpm,ctr",
          date_preset: "maximum",
        },
      }
    );

    const insight = response.data?.data?.[0];

    const metaSpend = Number(insight?.spend || 0);
    const metaImpressions = Number(insight?.impressions || 0);
    const metaReach = Number(insight?.reach || 0);
    const metaClicks = Number(insight?.clicks || 0);
    const metaCpc = Number(insight?.cpc || 0);
    const metaCpm = Number(insight?.cpm || 0);
    const metaCtr = Number(insight?.ctr || 0);

    return await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        metaSpend,
        metaImpressions,
        metaReach,
        metaClicks,
        metaCpc,
        metaCpm,
        metaCtr,

        // keep old spent column updated also
        spent: metaSpend,

        lastMetaSyncAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error(
      "[Meta Insights] Sync failed:",
      error.response?.data || error.message
    );

    return campaign;
  }
};