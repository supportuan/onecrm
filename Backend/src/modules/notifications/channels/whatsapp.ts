import type { RenderedNotification } from '../templates.js';

/**
 * WhatsApp channel adapter.
 *
 * Stub: logs to console. Replace with a real WhatsApp Business / Twilio
 * WhatsApp call when keys are available.
 */
export const sendWhatsApp = async (opts: {
  recipientPhone: string | null | undefined;
  rendered: RenderedNotification;
}): Promise<void> => {
  const { recipientPhone, rendered } = opts;
  if (!recipientPhone) throw new Error('recipient has no phone number');
  const text = `*${rendered.title}*\n${rendered.body}${rendered.link ? `\n${rendered.link}` : ''}`;
  // eslint-disable-next-line no-console
  console.log(`[NOTIFY/WHATSAPP → ${recipientPhone}] ${text}`);
};
