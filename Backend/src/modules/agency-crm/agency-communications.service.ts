import {
  AgencyActivityType,
  AgencyDocumentType,
  AgencyDocumentVerificationStatus,
} from '@prisma/client';
import { prisma } from '../../prisma.js';
import { storeUploadedFile, safeUploadFilename } from '../../lib/file-storage.js';
import { notifyMany } from '../notifications/notifications.service.js';

export const listPartnerDocuments = async (agencyPartnerId: number) => {
  return prisma.agencyPartnerDocument.findMany({
    where: { agencyPartnerId },
    orderBy: [{ type: 'asc' }, { version: 'desc' }, { uploadedAt: 'desc' }],
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
    version?: number;
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
      version: data.version ?? 1,
      verificationStatus: AgencyDocumentVerificationStatus.PENDING,
    },
  });
};

export const uploadPartnerDocument = async (
  agencyPartnerId: number,
  file: Express.Multer.File,
  meta: { type?: AgencyDocumentType; notes?: string }
) => {
  const type = meta.type || AgencyDocumentType.OTHER;
  const latest = await prisma.agencyPartnerDocument.findFirst({
    where: { agencyPartnerId, type },
    orderBy: { version: 'desc' },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  const storedName = safeUploadFilename(file.originalname);
  const relativePath = `uploads/agency/${agencyPartnerId}/${storedName}`;
  const { ref: fileUrl } = await storeUploadedFile({
    relativePath,
    buffer: file.buffer,
    contentType: file.mimetype,
  });

  const created = await createPartnerDocument(agencyPartnerId, {
    type,
    fileName: file.originalname,
    fileUrl,
    mimeType: file.mimetype,
    fileSize: file.size,
    notes: meta.notes,
    version: nextVersion,
  });

  if (latest) {
    await prisma.agencyPartnerDocument.update({
      where: { id: latest.id },
      data: { replacedById: created.id },
    });
  }

  return created;
};

export const verifyPartnerDocument = async (
  agencyPartnerId: number,
  docId: number,
  data: {
    verificationStatus: AgencyDocumentVerificationStatus;
    notes?: string | null;
    actorId?: number;
  }
) => {
  const doc = await prisma.agencyPartnerDocument.findFirst({
    where: { id: docId, agencyPartnerId },
  });
  if (!doc) throw new Error('document not found');

  const updated = await prisma.agencyPartnerDocument.update({
    where: { id: docId },
    data: {
      verificationStatus: data.verificationStatus,
      ...(data.notes != null ? { notes: data.notes } : {}),
    },
  });

  if (data.actorId) {
    await prisma.agencyActivity.create({
      data: {
        agencyPartnerId,
        actorId: data.actorId,
        activityType: AgencyActivityType.NOTE,
        subject: 'Document verification',
        comment: `Document #${docId} set to ${data.verificationStatus}`,
      },
    });
  }

  return updated;
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
  studentId?: number | null;
  applicationId?: number | null;
  activityType: AgencyActivityType;
  subject?: string | null;
  comment?: string | null;
  metadata?: Record<string, unknown> | null;
}) => {
  return prisma.agencyActivity.create({
    data: {
      agencyPartnerId: data.agencyPartnerId,
      actorId: data.actorId ?? null,
      studentId: data.studentId ?? null,
      applicationId: data.applicationId ?? null,
      activityType: data.activityType,
      subject: data.subject ?? null,
      comment: data.comment ?? null,
      metadata: (data.metadata as any) ?? undefined,
    },
  });
};

export const broadcastToAgents = async (opts: {
  title: string;
  message: string;
  link?: string;
  actorId?: number;
}) => {
  const partners = await prisma.agencyPartner.findMany({
    where: { status: { in: ['ACTIVE', 'APPROVED'] } },
    select: { id: true, userId: true },
  });

  for (const p of partners) {
    await prisma.agencyActivity.create({
      data: {
        agencyPartnerId: p.id,
        actorId: opts.actorId ?? null,
        activityType: AgencyActivityType.BROADCAST,
        subject: opts.title,
        comment: opts.message,
        metadata: opts.link ? { link: opts.link } : undefined,
      },
    });
  }

  const recipientIds = partners.map((p) => p.userId);
  if (recipientIds.length) {
    await notifyMany({
      recipientIds,
      templateKey: 'agent.broadcast',
      vars: {
        title: opts.title,
        message: opts.message,
        link: opts.link,
      },
    });
  }

  return { sent: recipientIds.length };
};
