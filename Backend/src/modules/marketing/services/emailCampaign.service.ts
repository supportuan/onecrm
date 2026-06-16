import { sendCampaignEmail } from './email.service.js';

export const execute = async (campaign: any, leads: any[]) => {
  console.log(`[Email Campaign Service] Launching email campaign: ${campaign.name} for ${leads.length} leads`);
  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    if (!lead.email) continue;
    try {
      await sendCampaignEmail({
        to: lead.email,
        subject: campaign.name,
        html: campaign.description || `Welcome to campaign: ${campaign.name}`,
      });
      sentCount++;
    } catch (err: any) {
      failedCount++;
      errors.push(err.message || 'Unknown email error');
    }
  }

  return {
    success: failedCount === 0,
    channel: 'EMAIL',
    leadsProcessed: leads.length,
    sent: sentCount,
    failed: failedCount,
    details: {
      sentCount,
      failedCount,
      errors,
    }
  };
};
