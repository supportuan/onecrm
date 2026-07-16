import {
  CommissionPayoutStatus,
  CommissionStatus,
} from '@prisma/client';
import { prisma } from '../../prisma.js';
import { safeNotify } from '../notifications/recipients.js';

export const verifyCommission = async (
  commissionId: number,
  actorId: number,
  opts?: { approve?: boolean; notes?: string | null }
) => {
  const commission = await prisma.agencyCommission.findUnique({
    where: { id: commissionId },
    include: {
      agencyPartner: { include: { user: { select: { id: true, email: true } } } },
      application: { select: { applicationCode: true } },
    },
  });
  if (!commission) throw new Error('commission not found');
  if (commission.status === CommissionStatus.PAID) {
    throw new Error('paid commissions cannot be re-verified');
  }
  if (commission.status === CommissionStatus.CANCELLED) {
    throw new Error('cancelled commissions cannot be verified');
  }

  const approve = opts?.approve !== false;
  const updated = await prisma.agencyCommission.update({
    where: { id: commissionId },
    data: {
      verifiedById: actorId,
      verifiedAt: new Date(),
      status: approve ? CommissionStatus.APPROVED : CommissionStatus.CANCELLED,
      ...(opts?.notes
        ? { description: [commission.description, opts.notes].filter(Boolean).join(' — ') }
        : {}),
    },
    include: {
      agencyPartner: { select: { id: true, agencyName: true, agencyCode: true } },
      application: { select: { applicationCode: true } },
    },
  });

  const userId = commission.agencyPartner?.user?.id;
  if (userId) {
    await safeNotify({
      recipientId: userId,
      templateKey: 'agent.commission_update',
      vars: {
        status: updated.status,
        amount: String(updated.amount),
        currency: updated.currency,
        applicationCode: updated.application?.applicationCode,
      },
    });
  }

  return updated;
};

export const listPayouts = async (opts?: { status?: CommissionPayoutStatus }) => {
  return prisma.commissionPayout.findMany({
    where: opts?.status ? { status: opts.status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
      lines: {
        include: {
          agencyPartner: { select: { id: true, agencyName: true, agencyCode: true } },
          commission: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              application: { select: { applicationCode: true } },
            },
          },
        },
      },
    },
  });
};

export const getPayout = async (id: number) => {
  return prisma.commissionPayout.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
      lines: {
        include: {
          agencyPartner: { select: { id: true, agencyName: true, agencyCode: true } },
          commission: true,
        },
      },
    },
  });
};

export const createPayoutBatch = async (opts: {
  commissionIds: number[];
  period?: string | null;
  currency?: string;
  notes?: string | null;
  createdById?: number;
}) => {
  const commissions = await prisma.agencyCommission.findMany({
    where: {
      id: { in: opts.commissionIds },
      status: CommissionStatus.APPROVED,
      payoutLine: null,
    },
  });

  if (!commissions.length) {
    throw new Error('no approved unpaid commissions found for the given ids');
  }
  if (commissions.length !== opts.commissionIds.length) {
    throw new Error(
      'some commissions are missing, not APPROVED, or already included in a payout'
    );
  }

  const currency = opts.currency || commissions[0].currency || 'INR';
  const mismatched = commissions.find((c) => c.currency !== currency);
  if (mismatched) {
    throw new Error('all commissions in a payout must share the same currency');
  }

  const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);

  return prisma.$transaction(async (tx) => {
    const payout = await tx.commissionPayout.create({
      data: {
        period: opts.period ?? null,
        currency,
        totalAmount,
        status: CommissionPayoutStatus.DRAFT,
        notes: opts.notes ?? null,
        createdById: opts.createdById ?? null,
        lines: {
          create: commissions.map((c) => ({
            commissionId: c.id,
            agencyPartnerId: c.agencyPartnerId,
            amount: c.amount,
          })),
        },
      },
      include: {
        lines: true,
      },
    });
    return payout;
  });
};

export const updatePayoutStatus = async (
  payoutId: number,
  status: CommissionPayoutStatus,
  opts?: { notes?: string | null }
) => {
  const payout = await prisma.commissionPayout.findUnique({
    where: { id: payoutId },
    include: { lines: true },
  });
  if (!payout) throw new Error('payout not found');
  if (payout.status === CommissionPayoutStatus.PAID && status !== CommissionPayoutStatus.PAID) {
    throw new Error('paid payouts cannot change status');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.commissionPayout.update({
      where: { id: payoutId },
      data: {
        status,
        notes: opts?.notes ?? payout.notes,
        paidAt: status === CommissionPayoutStatus.PAID ? new Date() : payout.paidAt,
      },
      include: {
        lines: {
          include: {
            agencyPartner: { select: { id: true, agencyName: true } },
          },
        },
      },
    });

    if (status === CommissionPayoutStatus.PAID) {
      await tx.agencyCommission.updateMany({
        where: { id: { in: payout.lines.map((l) => l.commissionId) } },
        data: { status: CommissionStatus.PAID, paidAt: new Date() },
      });
    }

    if (status === CommissionPayoutStatus.CANCELLED && payout.status !== CommissionPayoutStatus.CANCELLED) {
      // Lines remain; commissions stay APPROVED so they can be re-batched.
      await tx.commissionPayoutLine.deleteMany({ where: { payoutId } });
    }

    return updated;
  });
};
