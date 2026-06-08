import { prisma } from '../../prisma.js';
import { TEMPLATES, type NotificationChannelKey, type RenderedNotification } from './templates.js';
import { sendEmail } from './channels/email.js';
import { sendSms } from './channels/sms.js';
import { sendWhatsApp } from './channels/whatsapp.js';
import { sendInApp } from './channels/inApp.js';

export type NotifyResult = {
  channel: NotificationChannelKey;
  notificationId: number;
  status: 'SENT' | 'FAILED';
  error?: string;
};

const dispatchToChannel = async (
  channel: NotificationChannelKey,
  recipient: { id: number; email: string; phone: string | null },
  rendered: RenderedNotification
): Promise<void> => {
  switch (channel) {
    case 'EMAIL':
      await sendEmail({ recipientEmail: recipient.email, rendered });
      return;
    case 'SMS':
      await sendSms({ recipientPhone: recipient.phone, rendered });
      return;
    case 'WHATSAPP':
      await sendWhatsApp({ recipientPhone: recipient.phone, rendered });
      return;
    case 'IN_APP':
      await sendInApp();
      return;
    default:
      throw new Error(`unknown channel: ${channel as string}`);
  }
};

/**
 * The single entry point for emitting a notification.
 *
 * Usage:
 *   await notify({ recipientId, templateKey: 'application.stage_changed', vars: { ... } });
 *
 * - Looks up the template (throws if unknown).
 * - Resolves channels (caller override or template defaults).
 * - For each channel: persists a Notification row, sends via adapter,
 *   updates row status to SENT or FAILED with error.
 *
 * Returns one result per channel. Never throws on per-channel failure —
 * one bad channel shouldn't stop the others.
 */
export const notify = async (opts: {
  recipientId: number;
  templateKey: string;
  vars?: Record<string, any>;
  channels?: NotificationChannelKey[];
  /** Override link from template if provided. */
  link?: string;
}): Promise<NotifyResult[]> => {
  const template = TEMPLATES[opts.templateKey];
  if (!template) throw new Error(`unknown notification template: ${opts.templateKey}`);

  const recipient = await prisma.user.findUnique({
    where: { id: opts.recipientId },
    select: { id: true, email: true, phone: true },
  });
  if (!recipient) throw new Error(`recipient user ${opts.recipientId} not found`);

  const channels = opts.channels?.length ? opts.channels : template.defaultChannels;
  const rendered = template.build(opts.vars || {});
  const link = opts.link ?? rendered.link ?? null;

  const results: NotifyResult[] = [];

  for (const channel of channels) {
    // Persist first so we have an audit row even if delivery fails.
    const row = await prisma.notification.create({
      data: {
        recipientId: recipient.id,
        templateKey: template.key,
        channel,
        status: 'PENDING',
        title: rendered.title,
        body: rendered.body,
        link,
        vars: opts.vars || undefined,
      },
    });

    try {
      await dispatchToChannel(channel, recipient, rendered);
      await prisma.notification.update({
        where: { id: row.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      results.push({ channel, notificationId: row.id, status: 'SENT' });
    } catch (err: any) {
      const message = err?.message || String(err);
      await prisma.notification.update({
        where: { id: row.id },
        data: { status: 'FAILED', error: message },
      });
      results.push({ channel, notificationId: row.id, status: 'FAILED', error: message });
    }
  }

  return results;
};

/**
 * Convenience: dispatch the same template to a list of recipients.
 * Useful for "broadcast" use cases (agency announcement, system alert).
 */
export const notifyMany = async (opts: {
  recipientIds: number[];
  templateKey: string;
  vars?: Record<string, any>;
  channels?: NotificationChannelKey[];
}): Promise<Record<number, NotifyResult[]>> => {
  const out: Record<number, NotifyResult[]> = {};
  for (const recipientId of opts.recipientIds) {
    try {
      out[recipientId] = await notify({ ...opts, recipientId });
    } catch (err: any) {
      out[recipientId] = [
        {
          channel: 'IN_APP',
          notificationId: -1,
          status: 'FAILED',
          error: err?.message || String(err),
        },
      ];
    }
  }
  return out;
};

// -------------------- Inbox / reader functions --------------------

export const listForUser = async (userId: number, opts?: { limit?: number; unreadOnly?: boolean }) => {
  const where: any = {
    recipientId: userId,
    channel: 'IN_APP',
  };
  if (opts?.unreadOnly) {
    where.readAt = null;
  }
  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: opts?.limit ?? 50,
  });
};

export const unreadCountForUser = async (userId: number): Promise<number> => {
  return prisma.notification.count({
    where: { recipientId: userId, channel: 'IN_APP', readAt: null },
  });
};

export const markRead = async (userId: number, notificationId: number) => {
  // ensure ownership
  const n = await prisma.notification.findFirst({
    where: { id: notificationId, recipientId: userId },
  });
  if (!n) return null;
  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date(), status: 'READ' },
  });
};

export const markAllRead = async (userId: number) => {
  return prisma.notification.updateMany({
    where: { recipientId: userId, channel: 'IN_APP', readAt: null },
    data: { readAt: new Date(), status: 'READ' },
  });
};

export const deleteForUser = async (userId: number, notificationId: number) => {
  const n = await prisma.notification.findFirst({
    where: { id: notificationId, recipientId: userId },
  });
  if (!n) return null;
  return prisma.notification.delete({ where: { id: notificationId } });
};
