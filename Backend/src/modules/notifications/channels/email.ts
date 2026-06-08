import { sendCampaignEmail } from '../../marketing/services/email.service.js';
import type { RenderedNotification } from '../templates.js';

/**
 * Email channel adapter. Wraps the existing marketing SMTP sender so we share
 * one transport configuration (SMTP_*) across the app.
 */
export const sendEmail = async (opts: {
  recipientEmail: string;
  rendered: RenderedNotification;
}): Promise<void> => {
  const { recipientEmail, rendered } = opts;
  if (!recipientEmail) throw new Error('recipient has no email address');
  await sendCampaignEmail({
    to: recipientEmail,
    subject: rendered.title,
    html: rendered.html || `<p>${rendered.body}</p>`,
  });
};
