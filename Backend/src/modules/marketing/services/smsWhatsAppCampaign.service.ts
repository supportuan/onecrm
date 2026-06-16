import { sendSMS } from './sms.service.js';
import { sendWhatsAppMessage } from './whatsapp.service.js';

export const execute = async (campaign: any, leads: any[]) => {
  console.log(`[SMS/WhatsApp Campaign Service] Launching campaign: ${campaign.name} (${campaign.type}) for ${leads.length} leads`);
  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    if (!lead.phone) continue;
    try {
      if (campaign.type === 'SMS') {
        await sendSMS({
          to: lead.phone,
          message: campaign.description || campaign.name,
        });
      } else if (campaign.type === 'WHATSAPP') {
        await sendWhatsAppMessage({
          phone: lead.phone,
          message: campaign.description || campaign.name,
        });
      }
      sentCount++;
    } catch (err: any) {
      failedCount++;
      errors.push(err.message || 'Unknown SMS/WhatsApp error');
    }
  }

  return {
    success: failedCount === 0,
    channel: campaign.type,
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
