import type { RenderedNotification } from '../templates.js';

/**
 * SMS channel adapter.
 *
 * Stub: logs to console. Swap the body of `sendSms` with a real provider
 * (Twilio, MessageBird, AWS SNS, etc.) without touching the dispatcher.
 */
export const sendSms = async (opts: {
  recipientPhone: string | null | undefined;
  rendered: RenderedNotification;
}): Promise<void> => {
  const { recipientPhone, rendered } = opts;
  if (!recipientPhone) throw new Error('recipient has no phone number');
  const text = `${rendered.title}\n${rendered.body}${rendered.link ? `\n${rendered.link}` : ''}`;
  // eslint-disable-next-line no-console
  console.log(`[NOTIFY/SMS → ${recipientPhone}] ${text.slice(0, 160)}`);
};
