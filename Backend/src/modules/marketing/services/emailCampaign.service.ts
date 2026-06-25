
import { sendCampaignEmail } from './email.service.js';
import { buildCampaignEmailTemplate } from './emailTemplate.service.js';

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isBlockedTestEmail = (email: string) => {
  return /@(example\.com|example\.org|example\.net|meta-lead\.local|test\.com)$/i.test(email);
};

export const execute = async (campaign: any, leads: any[]) => {
  console.log(
    `[Email Campaign Service] Launching email campaign: ${campaign.name} for ${leads.length} leads`
  );

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    const email = String(lead?.email || '').trim();

    if (!email || !isValidEmail(email) || isBlockedTestEmail(email)) {
      skippedCount++;
      errors.push(`Skipped lead ${lead?.id}: invalid/test email ${email}`);
      continue;
    }

    try {
      const html = buildCampaignEmailTemplate(campaign, lead);

      await sendCampaignEmail({
        to: email,
        subject: campaign.name,
        html,
      });

      sentCount++;
      console.log(`Email sent to: ${email}`);
    } catch (err: any) {
      failedCount++;
      errors.push(`Lead ${lead?.id} (${email}) failed: ${err.message}`);
    }
  }

  return {
    success: sentCount > 0,
    channel: 'EMAIL',
    leadsProcessed: leads.length,
    sent: sentCount,
    failed: failedCount,
    skipped: skippedCount,
    sentCount,
    failedCount,
    skippedCount,
    errors,
    details: {
      sentCount,
      failedCount,
      skippedCount,
      errors,
    },
  };
};
