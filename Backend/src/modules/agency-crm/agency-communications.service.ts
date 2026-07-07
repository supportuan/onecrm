import { AgencyActivityType, AgencyDocumentType } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { storeUploadedFile, safeUploadFilename } from '../../lib/file-storage.js';
import { notifyMany } from '../notifications/notifications.service.js';
import { safeNotify } from '../notifications/recipients.js';

export const listPartnerDocuments = async (agencyPartnerId: number) => {
  return prisma.agencyPartnerDocument.findMany({
    where: { agencyPartnerId },
    orderBy: [{ type: 'asc' }, { uploadedAt: 'desc' }],
  });
};

export const createPartnerDocument = async (
  agencyPartnerId: number,
  data: {
    type: AgencyDocumentType;
    fileName: string;
    fileUrl: string;
    mimeType?: string | null;
    fileSize?: number | null;
    notes?: string | null;
  }
) => {
  return prisma.agencyPartnerDocument.create({
    data: {
      agencyPartnerId,
      type: data.type,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      mimeType: data.mimeType ?? null,
      fileSize: data.fileSize ?? null,
      notes: data.notes ?? null,
    },
  });
};

export const uploadPartnerDocument = async (
  agencyPartnerId: number,
  file: Express.Multer.File,
  meta: { type?: AgencyDocumentType; notes?: string }
) => {
  const storedName = safeUploadFilename(file.originalname);
  const relativePath = `uploads/agency/${agencyPartnerId}/${storedName}`;
  const { ref: fileUrl } = await storeUploadedFile({
    relativePath,
    buffer: file.buffer,
    contentType: file.mimetype,
  });
  return createPartnerDocument(agencyPartnerId, {
    type: meta.type || AgencyDocumentType.OTHER,
    fileName: file.originalname,
    fileUrl,
    mimeType: file.mimetype,
    fileSize: file.size,
    notes: meta.notes,
  });
};

export const deletePartnerDocument = async (agencyPartnerId: number, docId: number) => {
  const doc = await prisma.agencyPartnerDocument.findFirst({
    where: { id: docId, agencyPartnerId },
  });
  if (!doc) throw new Error('document not found');
  await prisma.agencyPartnerDocument.delete({ where: { id: docId } });
  return { success: true };
};

export const listPartnerActivities = async (agencyPartnerId: number, limit = 100) => {
  return prisma.agencyActivity.findMany({
    where: { agencyPartnerId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actor: { select: { id: true, fullName: true, email: true } },
    },
  });
};

export const logPartnerActivity = async (data: {
  agencyPartnerId: number;
  actorId?: number;
  activityType: AgencyActivityType;
  subject?: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}) => {
  return prisma.agencyActivity.create({
    data: {
      agencyPartnerId: data.agencyPartnerId,
      actorId: data.actorId ?? null,
      activityType: data.activityType,
      subject: data.subject ?? null,
      comment: data.comment ?? null,
      metadata: data.metadata as any,
    },
  });
};

export const broadcastToAgents = async (data: {
  title: string;
  message: string;
  link?: string;
  actorId?: number;
  statusFilter?: 'ACTIVE' | 'ALL';
}) => {
  const where =
    data.statusFilter === 'ACTIVE'
      ? { status: 'ACTIVE' as const }
      : { status: { not: 'BLACKLISTED' as const } };

  const partners = await prisma.agencyPartner.findMany({
    where,
    select: { id: true, userId: true, agencyName: true },
  });

  const recipientIds = partners.map((p) => p.userId);
  if (!recipientIds.length) return { sent: 0 };

  await notifyMany({
    recipientIds,
    templateKey: 'agent.broadcast',
    vars: { title: data.title, message: data.message, link: data.link },
  });

  await prisma.agencyActivity.createMany({
    data: partners.map((p) => ({
      agencyPartnerId: p.id,
      actorId: data.actorId ?? null,
      activityType: AgencyActivityType.BROADCAST,
      subject: data.title,
      comment: data.message,
      metadata: { link: data.link ?? null },
    })),
  });

  return { sent: recipientIds.length };
};
