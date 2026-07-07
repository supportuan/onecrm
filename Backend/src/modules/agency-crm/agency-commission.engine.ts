import {
  ApplicationStage,
  CommissionRuleType,
  CommissionStatus,
  CommissionTrigger,
  VisaStatus,
} from '@prisma/client';
import { prisma } from '../../prisma.js';
import { safeNotify } from '../notifications/recipients.js';
import { findPartnerForApplication } from './agency-referral.service.js';

const parseMoney = (value?: string | null): number => {
  if (!value) return 0;
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
};

export const listCommissionRules = async (agencyPartnerId?: number) => {
  return prisma.agencyCommissionRule.findMany({
    where: {
      isActive: true,
      ...(agencyPartnerId ? { OR: [{ agencyPartnerId }, { agencyPartnerId: null }] } : {}),
    },
    orderBy: [{ agencyPartnerId: 'desc' }, { id: 'asc' }],
  });
};

export const upsertCommissionRule = async (data: {
  id?: number;
  agencyPartnerId?: number | null;
  country?: string | null;
  university?: string | null;
  ruleType?: CommissionRuleType;
  amount: number;
  trigger?: CommissionTrigger;
  currency?: string;
  isActive?: boolean;
}) => {
  if (data.id) {
    return prisma.agencyCommissionRule.update({
      where: { id: data.id },
      data: {
        agencyPartnerId: data.agencyPartnerId ?? null,
        country: data.country ?? null,
        university: data.university ?? null,
        ruleType: data.ruleType,
        amount: data.amount,
        trigger: data.trigger,
        currency: data.currency,
        isActive: data.isActive,
      },
    });
  }

  return prisma.agencyCommissionRule.create({
    data: {
      agencyPartnerId: data.agencyPartnerId ?? null,
      country: data.country ?? null,
      university: data.university ?? null,
      ruleType: data.ruleType ?? CommissionRuleType.PERCENTAGE,
      amount: data.amount,
      trigger: data.trigger ?? CommissionTrigger.ENROLLED,
      currency: data.currency ?? 'INR',
      isActive: data.isActive ?? true,
    },
  });
};

export const deleteCommissionRule = async (id: number) => {
  return prisma.agencyCommissionRule.delete({ where: { id } });
};

const pickRule = async (
  partnerId: number,
  trigger: CommissionTrigger,
  country?: string | null,
  university?: string | null
) => {
  const rules = await prisma.agencyCommissionRule.findMany({
    where: {
      isActive: true,
      trigger,
      OR: [{ agencyPartnerId: partnerId }, { agencyPartnerId: null }],
    },
    orderBy: { id: 'asc' },
  });

  const scoped =
    rules.find(
      (r) =>
        r.university &&
        university &&
        r.university.toLowerCase() === university.toLowerCase() &&
        r.country?.toLowerCase() === country?.toLowerCase()
    ) ||
    rules.find(
      (r) =>
        r.country &&
        country &&
        !r.university &&
        r.country.toLowerCase() === country.toLowerCase()
    ) ||
    rules.find((r) => r.agencyPartnerId === partnerId && !r.country && !r.university) ||
    rules.find((r) => r.agencyPartnerId === null && !r.country && !r.university);

  return scoped;
};

export const computeCommissionAmount = async (opts: {
  agencyPartnerId: number;
  trigger: CommissionTrigger;
  country?: string | null;
  university?: string | null;
  course?: string | null;
}) => {
  const partner = await prisma.agencyPartner.findUnique({ where: { id: opts.agencyPartnerId } });
  if (!partner) return 0;

  const rule = await pickRule(
    opts.agencyPartnerId,
    opts.trigger,
    opts.country,
    opts.university
  );

  let baseAmount = 0;
  if (opts.course && opts.university) {
    const course = await prisma.course.findFirst({
      where: {
        name: { equals: opts.course, mode: 'insensitive' },
        university: { name: { equals: opts.university, mode: 'insensitive' } },
      },
      select: { tuitionFee: true },
    });
    baseAmount = parseMoney(course?.tuitionFee);
  }
  if (!baseAmount) baseAmount = Number(process.env.AGENCY_DEFAULT_COMMISSION_BASE || 50_000);

  if (rule) {
    if (rule.ruleType === CommissionRuleType.FIXED) return rule.amount;
    return Math.round((baseAmount * rule.amount) / 100);
  }

  return Math.round((baseAmount * partner.commissionRate) / 100);
};

export const createAutoCommission = async (opts: {
  applicationId: number;
  trigger: CommissionTrigger;
  description?: string;
}) => {
  const app = await prisma.application.findUnique({
    where: { id: opts.applicationId },
    include: { student: true },
  });
  if (!app) return null;

  const partner = await findPartnerForApplication(opts.applicationId);
  if (!partner) return null;

  const existing = await prisma.agencyCommission.findFirst({
    where: {
      agencyPartnerId: partner.id,
      applicationId: app.id,
      description: { contains: opts.trigger },
    },
  });
  if (existing) return existing;

  const amount = await computeCommissionAmount({
    agencyPartnerId: partner.id,
    trigger: opts.trigger,
    country: app.country,
    university: app.university,
    course: app.course,
  });

  const period = new Date().toISOString().slice(0, 7);
  const commission = await prisma.agencyCommission.create({
    data: {
      agencyPartnerId: partner.id,
      studentId: app.studentId,
      applicationId: app.id,
      amount,
      currency: 'INR',
      status: CommissionStatus.PENDING,
      period,
      description: opts.description || `Auto commission — ${opts.trigger}`,
    },
  });

  await safeNotify({
    recipientId: partner.userId,
    templateKey: 'agent.commission_update',
    vars: {
      amount,
      currency: 'INR',
      status: 'PENDING',
      applicationCode: app.applicationCode,
    },
  });

  return commission;
};

export const onApplicationStageChanged = async (
  applicationId: number,
  toStage: ApplicationStage
) => {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { student: true },
  });
  if (!app) return;

  const partner = await findPartnerForApplication(applicationId);
  if (!partner) return;

  await safeNotify({
    recipientId: partner.userId,
    templateKey: 'agent.application_status',
    vars: {
      studentName: app.student.fullName,
      university: app.university,
      course: app.course,
      stage: toStage.replace(/_/g, ' ').toLowerCase(),
      applicationId,
    },
  });

  if (toStage === ApplicationStage.ENROLLED) {
    await createAutoCommission({
      applicationId,
      trigger: CommissionTrigger.ENROLLED,
      description: 'Enrollment commission',
    });
  }
};

export const onVisaStatusChanged = async (applicationId: number, status: VisaStatus) => {
  if (status !== VisaStatus.APPROVED) return;
  await createAutoCommission({
    applicationId,
    trigger: CommissionTrigger.VISA_APPROVED,
    description: 'Visa approval commission',
  });
};

export const getCommissionStatement = async (opts: {
  agencyPartnerId: number;
  period?: string;
}) => {
  const where: Record<string, unknown> = { agencyPartnerId: opts.agencyPartnerId };
  if (opts.period) where.period = opts.period;

  const rows = await prisma.agencyCommission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { fullName: true, email: true } },
      application: { select: { applicationCode: true, university: true, course: true } },
      agencyPartner: { select: { agencyName: true, agencyCode: true } },
    },
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.count += 1;
      acc.amount += row.amount;
      if (row.status === CommissionStatus.PAID) acc.paid += row.amount;
      if (row.status === CommissionStatus.PENDING) acc.pending += row.amount;
      if (row.status === CommissionStatus.APPROVED) acc.approved += row.amount;
      return acc;
    },
    { count: 0, amount: 0, paid: 0, pending: 0, approved: 0 }
  );

  return { period: opts.period || 'all', totals, rows };
};
