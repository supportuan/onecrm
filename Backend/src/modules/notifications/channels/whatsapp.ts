import { sendWhatsAppText } from '../../marketing/services/whatsapp.service.js';
import type { RenderedNotification } from '../templates.js';

/** WhatsApp channel adapter — uses the shared Meta Graph API sender. */
export const sendWhatsApp = async (opts: {
  recipientPhone: string | null | undefined;
  rendered: RenderedNotification;
}): Promise<void> => {
  const { recipientPhone, rendered } = opts;
  if (!recipientPhone) throw new Error('recipient has no phone number');
  const text = `*${rendered.title}*\n${rendered.body}${rendered.link ? `\n${rendered.link}` : ''}`;
  await sendWhatsAppText({ phone: recipientPhone, body: text });
};
