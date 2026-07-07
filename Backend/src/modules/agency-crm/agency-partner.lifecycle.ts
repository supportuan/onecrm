import {
  AgencyOnboardingStage,
  AgencyPartnerStatus,
  UserRole,
} from '@prisma/client';
import { prisma } from '../../prisma.js';

const slugCode = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || `AGY-${Date.now()}`;

const syncUserAgencyDetails = async (
  userId: number,
  data: {
    agencyName: string;
    agencyCode: string;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    services?: string | null;
  }
) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      agencyDetails: {
        agencyName: data.agencyName,
        agencyCode: data.agencyCode,
        agencyAddress: data.address ?? null,
        agencyCity: data.city ?? null,
        agencyCountry: data.country ?? null,
        services: data.services ?? null,
      },
    },
  });
};

const uniqueAgencyCode = async (base: string) => {
  let code = base.toUpperCase();
  let suffix = 0;
  while (await prisma.agencyPartner.findUnique({ where: { agencyCode: code } })) {
    suffix += 1;
    code = `${base.toUpperCase()}-${suffix}`;
  }
  return code;
};

export const provisionPartnerFromAgentUser = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== UserRole.AGENT && user.role !== UserRole.AGENCY_FREELANCER)) {
    return null;
  }

  const existing = await prisma.agencyPartner.findUnique({ where: { userId } });
  if (existing) return existing;

  const details = (user.agencyDetails as Record<string, string> | null) || {};
  const agencyName = details.agencyName || user.fullName;
  const agencyCode = await uniqueAgencyCode(details.agencyCode || slugCode(agencyName));

  const partner = await prisma.agencyPartner.create({
    data: {
      userId,
      agencyName,
      agencyCode,
      contactPerson: user.fullName,
      email: user.email,
      phone: user.phone,
      address: details.agencyAddress || null,
      city: details.agencyCity || null,
      country: details.agencyCountry || null,
      services: details.services || null,
      status: AgencyPartnerStatus.PENDING,
      onboardingStage: AgencyOnboardingStage.REGISTERED,
    },
  });

  await syncUserAgencyDetails(userId, {
    agencyName: partner.agencyName,
    agencyCode: partner.agencyCode,
    address: partner.address,
    city: partner.city,
    country: partner.country,
    services: partner.services,
  });

  return partner;
};

export const advancePartnerOnboarding = async (
  partnerId: number,
  stage: AgencyOnboardingStage,
  actorId?: number
) => {
  const partner = await prisma.agencyPartner.findUnique({ where: { id: partnerId } });
  if (!partner) throw new Error('partner not found');

  const now = new Date();
  const data: Record<string, unknown> = { onboardingStage: stage };

  if (stage === AgencyOnboardingStage.AGREEMENT_SIGNED) {
    data.agreementSignedAt = now;
  }
  if (stage === AgencyOnboardingStage.VERIFIED) {
    data.verifiedAt = now;
    data.status = AgencyPartnerStatus.VERIFIED;
  }
  if (stage === AgencyOnboardingStage.APPROVED) {
    data.approvedAt = now;
    data.status = AgencyPartnerStatus.APPROVED;
  }
  if (stage === AgencyOnboardingStage.ACTIVE) {
    data.activatedAt = now;
    data.status = AgencyPartnerStatus.ACTIVE;
    await prisma.user.update({
      where: { id: partner.userId },
      data: { isApproved: true, isActive: true },
    });
  }

  const updated = await prisma.agencyPartner.update({
    where: { id: partnerId },
    data,
  });

  if (actorId) {
    await prisma.agencyActivity.create({
      data: {
        agencyPartnerId: partnerId,
        actorId,
        activityType: 'NOTE',
        subject: 'Onboarding stage updated',
        comment: `Stage set to ${stage}`,
      },
    });
  }

  return updated;
};

export const setPartnerStatus = async (
  partnerId: number,
  status: AgencyPartnerStatus,
  actorId?: number
) => {
  const partner = await prisma.agencyPartner.findUnique({ where: { id: partnerId } });
  if (!partner) throw new Error('partner not found');

  const updated = await prisma.agencyPartner.update({
    where: { id: partnerId },
    data: {
      status,
      ...(status === AgencyPartnerStatus.ACTIVE
        ? { activatedAt: new Date(), onboardingStage: AgencyOnboardingStage.ACTIVE }
        : {}),
    },
  });

  if (status === AgencyPartnerStatus.ACTIVE) {
    await prisma.user.update({
      where: { id: partner.userId },
      data: { isApproved: true, isActive: true },
    });
  }
  if (status === AgencyPartnerStatus.INACTIVE || status === AgencyPartnerStatus.BLACKLISTED) {
    await prisma.user.update({
      where: { id: partner.userId },
      data: { isActive: status !== AgencyPartnerStatus.BLACKLISTED },
    });
  }

  if (actorId) {
    await prisma.agencyActivity.create({
      data: {
        agencyPartnerId: partnerId,
        actorId,
        activityType: 'NOTE',
        subject: 'Status changed',
        comment: `Partner status set to ${status}`,
      },
    });
  }

  return updated;
};

export const signPartnerAgreement = async (partnerId: number, userId: number) => {
  const partner = await prisma.agencyPartner.findUnique({ where: { id: partnerId } });
  if (!partner || partner.userId !== userId) throw new Error('forbidden');

  return advancePartnerOnboarding(partnerId, AgencyOnboardingStage.AGREEMENT_SIGNED, userId);
};

export const submitPartnerOnboardingDocs = async (partnerId: number, userId: number) => {
  const partner = await prisma.agencyPartner.findUnique({ where: { id: partnerId } });
  if (!partner || partner.userId !== userId) throw new Error('forbidden');

  const docCount = await prisma.agencyPartnerDocument.count({
    where: { agencyPartnerId: partnerId },
  });
  if (docCount < 1) {
    throw new Error('Upload at least one onboarding document before submitting');
  }

  return advancePartnerOnboarding(partnerId, AgencyOnboardingStage.DOCS_SUBMITTED, userId);
};

export { syncUserAgencyDetails, uniqueAgencyCode, slugCode };
