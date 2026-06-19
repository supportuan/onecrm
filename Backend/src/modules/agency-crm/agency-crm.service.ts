import { AgencyPartnerStatus, CommissionStatus, UserRole } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { hashPassword } from '../../utils/password.js';
import { hasFullAgencyAccess, isAgencyFreelancer } from './scoping.js';

type Actor = { id?: number; role?: string };

const PARTNER_INCLUDE = {
  user: { select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true } },
};

const slugCode = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || `AGY-${Date.now()}`;

export const getPartnerByUserId = (userId: number) =>
  prisma.agencyPartner.findUnique({ where: { userId }, include: PARTNER_INCLUDE });

const resolvePartnerForActor = async (actor?: Actor, agencyPartnerId?: number) => {
  if (isAgencyFreelancer(actor?.role)) {
    if (!actor?.id) return null;
    return getPartnerByUserId(actor.id);
  }
  if (agencyPartnerId) {
    return prisma.agencyPartner.findUnique({ where: { id: agencyPartnerId }, include: PARTNER_INCLUDE });
  }
  return null;
};

const syncUserAgencyDetails = async (
  userId: number,
  data: { agencyName: string; agencyCode: string; address?: string | null; city?: string | null; country?: string | null }
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
      },
    },
  });
};

export const getStatistics = async (actor?: Actor, agencyPartnerId?: number) => {
  const partner = await resolvePartnerForActor(actor, agencyPartnerId);
  if (isAgencyFreelancer(actor?.role) && !partner) {
    return {
      totalReferrals: 0,
      activeStudents: 0,
      enrolledStudents: 0,
      totalApplications: 0,
      pendingCommissions: 0,
      approvedCommissions: 0,
      paidCommissions: 0,
      totalCommissionAmount: 0,
    };
  }

  const partnerFilter = partner ? { agencyPartnerId: partner.id } : {};

  const [referrals, commissions, applications] = await Promise.all([
    prisma.agencyReferral.count({ where: partnerFilter }),
    prisma.agencyCommission.findMany({ where: partnerFilter }),
    partner
      ? prisma.application.count({
          where: {
            student: {
              OR: [
                { agencyReferrals: { some: { agencyPartnerId: partner.id } } },
                { source: partner.agencyCode },
              ],
            },
          },
        })
      : prisma.application.count(),
  ]);

  const studentIds = partner
    ? await prisma.student.findMany({
        where: {
          deletedAt: null,
          OR: [
            { agencyReferrals: { some: { agencyPartnerId: partner.id } } },
            { source: partner.agencyCode },
          ],
        },
        select: { id: true, isEnrolled: true },
      })
    : await prisma.student.findMany({ where: { deletedAt: null }, select: { id: true, isEnrolled: true } });

  const pending = commissions.filter((c) => c.status === CommissionStatus.PENDING);
  const approved = commissions.filter((c) => c.status === CommissionStatus.APPROVED);
  const paid = commissions.filter((c) => c.status === CommissionStatus.PAID);

  return {
    totalReferrals: referrals,
    activeStudents: studentIds.length,
    enrolledStudents: studentIds.filter((s) => s.isEnrolled).length,
    totalApplications: applications,
    pendingCommissions: pending.length,
    approvedCommissions: approved.length,
    paidCommissions: paid.length,
    totalCommissionAmount: paid.reduce((sum, c) => sum + c.amount, 0),
  };
};

export const listPartners = async (opts: { search?: string; status?: AgencyPartnerStatus; actor?: Actor } = {}) => {
  if (isAgencyFreelancer(opts.actor?.role)) {
    const mine = opts.actor?.id ? await getPartnerByUserId(opts.actor.id) : null;
    return mine ? [mine] : [];
  }

  const where: Record<string, unknown> = {};
  if (opts.status) where.status = opts.status;
  if (opts.search) {
    where.OR = [
      { agencyName: { contains: opts.search, mode: 'insensitive' } },
      { agencyCode: { contains: opts.search, mode: 'insensitive' } },
      { email: { contains: opts.search, mode: 'insensitive' } },
      { contactPerson: { contains: opts.search, mode: 'insensitive' } },
    ];
  }

  return prisma.agencyPartner.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: PARTNER_INCLUDE,
  });
};

export const getPartner = async (id: number, actor?: Actor) => {
  const partner = await prisma.agencyPartner.findUnique({ where: { id }, include: PARTNER_INCLUDE });
  if (!partner) return null;
  if (isAgencyFreelancer(actor?.role) && partner.userId !== actor?.id) return null;
  return partner;
};

export const createPartner = async (data: {
  userId?: number;
  email?: string;
  fullName?: string;
  password?: string;
  phone?: string;
  agencyName: string;
  agencyCode?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  country?: string;
  commissionRate?: number;
  status?: AgencyPartnerStatus;
  notes?: string;
}) => {
  const agencyCode = (data.agencyCode || slugCode(data.agencyName)).toUpperCase();

  let userId = data.userId;
  if (!userId) {
    if (!data.email || !data.fullName || !data.password) {
      throw new Error('email, fullName, and password are required when userId is not provided');
    }
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('user with this email already exists');
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        passwordHash: await hashPassword(data.password),
        role: UserRole.AGENCY_FREELANCER,
        isActive: true,
        isApproved: true,
      },
    });
    userId = user.id;
  }

  const existingPartner = await prisma.agencyPartner.findUnique({ where: { userId } });
  if (existingPartner) throw new Error('agency partner already exists for this user');

  const partner = await prisma.agencyPartner.create({
    data: {
      userId,
      agencyName: data.agencyName,
      agencyCode,
      contactPerson: data.contactPerson ?? data.fullName ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      country: data.country ?? null,
      commissionRate: data.commissionRate ?? 10,
      status: data.status ?? AgencyPartnerStatus.ACTIVE,
      notes: data.notes ?? null,
    },
    include: PARTNER_INCLUDE,
  });

  await syncUserAgencyDetails(userId, {
    agencyName: partner.agencyName,
    agencyCode: partner.agencyCode,
    address: partner.address,
    city: partner.city,
    country: partner.country,
  });

  return partner;
};

export const updatePartner = async (
  id: number,
  data: Partial<{
    agencyName: string;
    agencyCode: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    commissionRate: number;
    status: AgencyPartnerStatus;
    branding: Record<string, unknown>;
    notes: string;
  }>,
  actor?: Actor
) => {
  const existing = await getPartner(id, actor);
  if (!existing) throw new Error('partner not found');

  const payload = { ...data };
  if (isAgencyFreelancer(actor?.role)) {
    delete payload.agencyCode;
    delete payload.commissionRate;
    delete payload.status;
    delete payload.email;
  } else if (!hasFullAgencyAccess(actor?.role)) {
    throw new Error('forbidden');
  }

  const updated = await prisma.agencyPartner.update({
    where: { id },
    data: {
      ...payload,
      agencyCode: payload.agencyCode?.toUpperCase(),
      branding: payload.branding as any,
    },
    include: PARTNER_INCLUDE,
  });

  await syncUserAgencyDetails(updated.userId, {
    agencyName: updated.agencyName,
    agencyCode: updated.agencyCode,
    address: updated.address,
    city: updated.city,
    country: updated.country,
  });

  return updated;
};

export const listLeads = async (opts: {
  page?: number;
  limit?: number;
  search?: string;
  agencyPartnerId?: number;
  actor?: Actor;
}) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const partner = await resolvePartnerForActor(opts.actor, opts.agencyPartnerId);
  if (isAgencyFreelancer(opts.actor?.role) && !partner) {
    return { items: [], total: 0, page, totalPages: 1, from: 0, to: 0 };
  }

  const where: Record<string, unknown> = partner ? { agencyPartnerId: partner.id } : {};
  if (opts.search) {
    where.OR = [
      { referralCode: { contains: opts.search, mode: 'insensitive' } },
      { lead: { fullName: { contains: opts.search, mode: 'insensitive' } } },
      { lead: { email: { contains: opts.search, mode: 'insensitive' } } },
      { student: { fullName: { contains: opts.search, mode: 'insensitive' } } },
      { student: { email: { contains: opts.search, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.agencyReferral.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        agencyPartner: { select: { id: true, agencyName: true, agencyCode: true } },
        lead: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            preferredCountry: true,
            preferredCourse: true,
            createdAt: true,
          },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            processStage: true,
            isEnrolled: true,
            status: true,
          },
        },
        application: {
          select: { id: true, applicationCode: true, stage: true, university: true, course: true },
        },
      },
    }),
    prisma.agencyReferral.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    items,
    total,
    page,
    totalPages,
    from: total === 0 ? 0 : skip + 1,
    to: Math.min(skip + limit, total),
  };
};

export const listApplications = async (opts: {
  page?: number;
  limit?: number;
  search?: string;
  agencyPartnerId?: number;
  actor?: Actor;
}) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const partner = await resolvePartnerForActor(opts.actor, opts.agencyPartnerId);
  if (isAgencyFreelancer(opts.actor?.role) && !partner) {
    return { items: [], total: 0, page, totalPages: 1, from: 0, to: 0 };
  }

  const studentScope = partner
    ? {
        OR: [
          { agencyReferrals: { some: { agencyPartnerId: partner.id } } },
          { source: partner.agencyCode },
        ],
      }
    : hasFullAgencyAccess(opts.actor?.role)
      ? {}
      : { id: -1 };

  const where: Record<string, unknown> = {
    student: { deletedAt: null, ...studentScope },
  };

  if (opts.search) {
    where.AND = [
      {
        OR: [
          { applicationCode: { contains: opts.search, mode: 'insensitive' } },
          { university: { contains: opts.search, mode: 'insensitive' } },
          { course: { contains: opts.search, mode: 'insensitive' } },
          { student: { fullName: { contains: opts.search, mode: 'insensitive' } } },
        ],
      },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, fullName: true, email: true, isEnrolled: true } },
      },
    }),
    prisma.application.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    items,
    total,
    page,
    totalPages,
    from: total === 0 ? 0 : skip + 1,
    to: Math.min(skip + limit, total),
  };
};

export const createReferral = async (
  data: {
    agencyPartnerId: number;
    leadId?: number;
    studentId?: number;
    applicationId?: number;
    referralCode?: string;
    status?: string;
    notes?: string;
  },
  actor?: Actor
) => {
  if (isAgencyFreelancer(actor?.role)) {
    const mine = actor?.id ? await getPartnerByUserId(actor.id) : null;
    if (!mine || mine.id !== data.agencyPartnerId) throw new Error('forbidden');
  }

  if (!data.leadId && !data.studentId && !data.applicationId) {
    throw new Error('leadId, studentId, or applicationId is required');
  }

  const partner = await prisma.agencyPartner.findUnique({ where: { id: data.agencyPartnerId } });
  if (!partner) throw new Error('partner not found');

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

export const listCommissions = async (opts: {
  page?: number;
  limit?: number;
  status?: CommissionStatus;
  agencyPartnerId?: number;
  actor?: Actor;
}) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const partner = await resolvePartnerForActor(opts.actor, opts.agencyPartnerId);
  if (isAgencyFreelancer(opts.actor?.role) && !partner) {
    return { items: [], total: 0, page, totalPages: 1, from: 0, to: 0 };
  }

  const where: Record<string, unknown> = {};
  if (partner) where.agencyPartnerId = partner.id;
  if (opts.status) where.status = opts.status;

  const [items, total] = await Promise.all([
    prisma.agencyCommission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        agencyPartner: { select: { id: true, agencyName: true, agencyCode: true } },
        student: { select: { id: true, fullName: true, email: true } },
        application: { select: { id: true, applicationCode: true, university: true, course: true } },
      },
    }),
    prisma.agencyCommission.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    items,
    total,
    page,
    totalPages,
    from: total === 0 ? 0 : skip + 1,
    to: Math.min(skip + limit, total),
  };
};

export const createCommission = async (
  data: {
    agencyPartnerId: number;
    studentId?: number;
    applicationId?: number;
    amount: number;
    currency?: string;
    status?: CommissionStatus;
    period?: string;
    description?: string;
  },
  actor?: Actor
) => {
  if (isAgencyFreelancer(actor?.role)) {
    throw new Error('only admins can create commissions');
  }

  const partner = await prisma.agencyPartner.findUnique({ where: { id: data.agencyPartnerId } });
  if (!partner) throw new Error('partner not found');

  return prisma.agencyCommission.create({
    data: {
      agencyPartnerId: data.agencyPartnerId,
      studentId: data.studentId ?? null,
      applicationId: data.applicationId ?? null,
      amount: data.amount,
      currency: data.currency ?? 'GBP',
      status: data.status ?? CommissionStatus.PENDING,
      period: data.period ?? null,
      description: data.description ?? null,
    },
    include: {
      agencyPartner: { select: { id: true, agencyName: true, agencyCode: true } },
      student: { select: { id: true, fullName: true, email: true } },
      application: { select: { id: true, applicationCode: true } },
    },
  });
};

export const updateCommission = async (
  id: number,
  data: Partial<{
    amount: number;
    currency: string;
    status: CommissionStatus;
    period: string;
    description: string;
    paidAt: string | Date | null;
  }>,
  actor?: Actor
) => {
  const existing = await prisma.agencyCommission.findUnique({
    where: { id },
    include: { agencyPartner: true },
  });
  if (!existing) throw new Error('commission not found');

  if (isAgencyFreelancer(actor?.role)) {
    const mine = actor?.id ? await getPartnerByUserId(actor.id) : null;
    if (!mine || mine.id !== existing.agencyPartnerId) throw new Error('forbidden');
    if (data.status && data.status !== existing.status) {
      throw new Error('agents cannot change commission status');
    }
  }

  const paidAt =
    data.paidAt === null
      ? null
      : data.paidAt
        ? new Date(data.paidAt)
        : data.status === CommissionStatus.PAID && !existing.paidAt
          ? new Date()
          : undefined;

  return prisma.agencyCommission.update({
    where: { id },
    data: {
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      period: data.period,
      description: data.description,
      ...(paidAt !== undefined ? { paidAt } : {}),
    },
    include: {
      agencyPartner: { select: { id: true, agencyName: true, agencyCode: true } },
      student: { select: { id: true, fullName: true, email: true } },
      application: { select: { id: true, applicationCode: true } },
    },
  });
};
