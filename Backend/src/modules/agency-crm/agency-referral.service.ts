import { prisma } from '../../prisma.js';
import { AgencyPartnerStatus } from '@prisma/client';

export class AgencyReferralConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgencyReferralConflictError';
  }
}

export const resolvePartnerByReferralCode = async (code: string) => {
  if (!code?.trim()) return null;
  return prisma.agencyPartner.findFirst({
    where: {
      agencyCode: code.trim().toUpperCase(),
      status: AgencyPartnerStatus.ACTIVE,
      onboardingStage: 'ACTIVE',
    },
  });
};

const assertReferralNotClaimed = async (opts: {
  leadId?: number | null;
  studentId?: number | null;
  agencyPartnerId: number;
}) => {
  if (opts.leadId) {
    const existing = await prisma.agencyReferral.findFirst({ where: { leadId: opts.leadId } });
    if (existing && existing.agencyPartnerId !== opts.agencyPartnerId) {
      throw new AgencyReferralConflictError(
        'This lead is already attributed to another agent'
      );
    }
    if (existing) return existing;
  }

  if (opts.studentId) {
    const existing = await prisma.agencyReferral.findFirst({
      where: { studentId: opts.studentId },
    });
    if (existing && existing.agencyPartnerId !== opts.agencyPartnerId) {
      throw new AgencyReferralConflictError(
        'This student is already attributed to another agent'
      );
    }
    if (existing) return existing;
  }

  return null;
};

export const attachReferralToLead = async (
  leadId: number,
  referralCode: string,
  notes?: string
) => {
  const partner = await resolvePartnerByReferralCode(referralCode);
  if (!partner) return null;

  const existing = await assertReferralNotClaimed({ leadId, agencyPartnerId: partner.id });
  if (existing) {
    return prisma.agencyReferral.update({
      where: { id: existing.id },
      data: { referralCode: partner.agencyCode, notes: notes ?? existing.notes },
      include: { agencyPartner: true, lead: true },
    });
  }

  return prisma.agencyReferral.create({
    data: {
      agencyPartnerId: partner.id,
      leadId,
      referralCode: partner.agencyCode,
      status: 'REFERRED',
      notes: notes ?? `Captured via referral code ${partner.agencyCode}`,
    },
    include: { agencyPartner: true, lead: true },
  });
};

export const linkReferralsForConvertedLead = async (
  leadId: number,
  studentId: number,
  applicationId?: number
) => {
  const referral = await prisma.agencyReferral.findFirst({ where: { leadId } });
  if (!referral) return null;

  const partner = await prisma.agencyPartner.findUnique({
    where: { id: referral.agencyPartnerId },
  });
  if (!partner) return null;

  await prisma.student.update({
    where: { id: studentId },
    data: { source: partner.agencyCode },
  });

  return prisma.agencyReferral.update({
    where: { id: referral.id },
    data: {
      studentId,
      applicationId: applicationId ?? referral.applicationId,
      status: 'CONVERTED',
    },
  });
};

export const capturePublicReferral = async (referralCode: string) => {
  const partner = await resolvePartnerByReferralCode(referralCode);
  if (!partner) return null;
  return {
    agencyCode: partner.agencyCode,
    agencyName: partner.agencyName,
    country: partner.country,
    services: partner.services,
  };
};

export const createReferralWithDedup = async (data: {
  agencyPartnerId: number;
  leadId?: number;
  studentId?: number;
  applicationId?: number;
  referralCode?: string;
  status?: string;
  notes?: string;
}) => {
  if (!data.leadId && !data.studentId && !data.applicationId) {
    throw new Error('leadId, studentId, or applicationId is required');
  }

  const partner = await prisma.agencyPartner.findUnique({ where: { id: data.agencyPartnerId } });
  if (!partner) throw new Error('partner not found');

  const existing = await assertReferralNotClaimed({
    leadId: data.leadId,
    studentId: data.studentId,
    agencyPartnerId: data.agencyPartnerId,
  });
  if (existing) {
    return prisma.agencyReferral.update({
      where: { id: existing.id },
      data: {
        applicationId: data.applicationId ?? existing.applicationId,
        studentId: data.studentId ?? existing.studentId,
        status: data.status ?? existing.status,
        notes: data.notes ?? existing.notes,
      },
      include: {
        lead: true,
        student: true,
        application: true,
        agencyPartner: { select: { id: true, agencyName: true, agencyCode: true } },
      },
    });
  }

  if (data.studentId) {
    await prisma.student.update({
      where: { id: data.studentId },
      data: { source: partner.agencyCode },
    });
  }

  return prisma.agencyReferral.create({
    data: {
      agencyPartnerId: data.agencyPartnerId,
      leadId: data.leadId ?? null,
      studentId: data.studentId ?? null,
      applicationId: data.applicationId ?? null,
      referralCode: data.referralCode ?? partner.agencyCode,
      status: data.status ?? 'REFERRED',
      notes: data.notes ?? null,
    },
    include: {
      lead: true,
      student: true,
      application: true,
      agencyPartner: { select: { id: true, agencyName: true, agencyCode: true } },
    },
  });
};

export const findPartnerForApplication = async (applicationId: number) => {
  const referral = await prisma.agencyReferral.findFirst({
    where: { applicationId },
    include: { agencyPartner: { include: { user: true } } },
  });
  if (referral?.agencyPartner) return referral.agencyPartner;

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { student: true },
  });
  if (!app?.student) return null;

  const byStudent = await prisma.agencyReferral.findFirst({
    where: { studentId: app.student.id },
    include: { agencyPartner: { include: { user: true } } },
  });
  if (byStudent?.agencyPartner) return byStudent.agencyPartner;

  if (app.student.source) {
    return prisma.agencyPartner.findFirst({
      where: { agencyCode: app.student.source },
      include: { user: true },
    });
  }

  return null;
};
