import { AgencyAnnouncementType, AgencyPartnerStatus } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { notifyMany } from '../notifications/notifications.service.js';

export const listAnnouncements = async (opts?: {
  activeOnly?: boolean;
  userId?: number;
}) => {
  const rows = await prisma.agencyAnnouncement.findMany({
    where: {
      ...(opts?.activeOnly
        ? { isActive: true, publishedAt: { not: null, lte: new Date() } }
        : {}),
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      publishedBy: { select: { id: true, fullName: true } },
      ...(opts?.userId
        ? {
            reads: {
              where: { userId: opts.userId },
              select: { id: true, readAt: true },
            },
          }
        : {}),
    },
  });

  return rows.map((row) => {
    const reads = 'reads' in row ? (row as { reads?: { readAt: Date }[] }).reads : undefined;
    return {
      ...row,
      readAt: reads?.[0]?.readAt ?? null,
      reads: undefined,
    };
  });
};

export const createAnnouncement = async (opts: {
  type?: AgencyAnnouncementType;
  title: string;
  body: string;
  link?: string | null;
  publish?: boolean;
  publishedById?: number;
}) => {
  const publishedAt = opts.publish === false ? null : new Date();
  const announcement = await prisma.agencyAnnouncement.create({
    data: {
      type: opts.type || AgencyAnnouncementType.GENERAL,
      title: opts.title,
      body: opts.body,
      link: opts.link || null,
      publishedAt,
      publishedById: opts.publishedById ?? null,
      isActive: true,
    },
  });

  if (publishedAt) {
    const partners = await prisma.agencyPartner.findMany({
      where: {
        status: {
          in: [AgencyPartnerStatus.ACTIVE, AgencyPartnerStatus.APPROVED],
        },
      },
      select: { userId: true },
    });
    const recipientIds = partners.map((p) => p.userId);
    if (recipientIds.length) {
      await notifyMany({
        recipientIds,
        templateKey: 'agent.announcement',
        vars: {
          title: announcement.title,
          message: announcement.body,
          link: announcement.link || '/agency-crm/communications',
          type: announcement.type,
        },
      });
    }
  }

  return announcement;
};

export const markAnnouncementRead = async (announcementId: number, userId: number) => {
  const announcement = await prisma.agencyAnnouncement.findUnique({
    where: { id: announcementId },
  });
  if (!announcement || !announcement.isActive || !announcement.publishedAt) {
    throw new Error('announcement not found');
  }

  return prisma.agencyAnnouncementRead.upsert({
    where: {
      announcementId_userId: { announcementId, userId },
    },
    create: { announcementId, userId },
    update: { readAt: new Date() },
  });
};
