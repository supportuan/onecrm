import {
  Prisma,
  TrainingBatchStatus,
  TrainingDeliveryMode,
  TrainingProgramType,
  TrainingSeatPaymentStatus,
  UserRole,
} from '@prisma/client';
import { prisma } from '../../prisma.js';
import { TrainingError } from './training-errors.js';

const PROGRAMS = new Set<string>(Object.values(TrainingProgramType));
const MODES = new Set<string>(Object.values(TrainingDeliveryMode));
const STATUSES = new Set<string>(Object.values(TrainingBatchStatus));
const PAYMENTS = new Set<string>(Object.values(TrainingSeatPaymentStatus));
const DEFAULT_GROUP_SEATS = 8;

const userSelect = { id: true, fullName: true, email: true, role: true } as const;
const batchInclude = {
  trainer: { select: userSelect },
  createdBy: { select: userSelect },
  course: { select: { id: true, title: true, category: true, isPublished: true } },
  members: {
    include: { user: { select: userSelect } },
    orderBy: { enrolledAt: 'desc' as const },
  },
  _count: { select: { members: true } },
} as const;

const notFound = (what: string): never => {
  throw new TrainingError(`${what} not found`, 404);
};

const asInt = (raw: unknown): number | null => {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export const parseProgramType = (raw: unknown): TrainingProgramType => {
  const value = String(raw || '').toUpperCase();
  if (!PROGRAMS.has(value)) throw new TrainingError('Program must be IELTS preparation or visa training');
  return value as TrainingProgramType;
};

export const parseDeliveryMode = (raw: unknown): TrainingDeliveryMode => {
  const value = String(raw || 'ONE_ON_ONE').toUpperCase().replace(/[-\s]/g, '_');
  const normalized = value === 'ONEONONE' || value === '1_ON_1' || value === '1ON1' ? 'ONE_ON_ONE' : value;
  if (!MODES.has(normalized)) throw new TrainingError('Delivery must be 1-on-1 or group');
  return normalized as TrainingDeliveryMode;
};

export const parseBatchStatus = (raw: unknown): TrainingBatchStatus => {
  const value = String(raw || '').toUpperCase();
  if (!STATUSES.has(value)) throw new TrainingError('Invalid class status');
  return value as TrainingBatchStatus;
};

export const parseSeatPaymentStatus = (raw: unknown): TrainingSeatPaymentStatus => {
  const value = String(raw || '').toUpperCase();
  if (!PAYMENTS.has(value)) throw new TrainingError('Invalid payment status');
  return value as TrainingSeatPaymentStatus;
};

export const resolveMaxSeats = (mode: TrainingDeliveryMode, requested?: unknown): number => {
  if (mode === 'ONE_ON_ONE') return 1;
  const n = asInt(requested);
  if (n == null) return DEFAULT_GROUP_SEATS;
  if (n < 2) throw new TrainingError('Group classes need at least 2 seats');
  if (n > 50) throw new TrainingError('Group classes cannot exceed 50 seats');
  return n;
};

const asDate = (raw: unknown): Date | null => {
  if (raw == null || raw === '') return null;
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) throw new TrainingError('Invalid schedule date');
  return date;
};

const asFeePaise = (raw: unknown): number | null => {
  if (raw == null || raw === '') return null;
  const n = asInt(raw);
  if (n == null || n < 0) throw new TrainingError('Fee must be a non-negative amount in paise');
  return n;
};

const syncCapacityStatus = async (batchId: number) => {
  const batch = await prisma.trainingBatch.findUnique({
    where: { id: batchId },
    include: { _count: { select: { members: true } } },
  });
  if (!batch || batch.deletedAt) return null;
  if (batch.status === 'COMPLETED' || batch.status === 'CANCELLED' || batch.status === 'IN_PROGRESS' || batch.status === 'DRAFT') {
    return batch;
  }
  const next: TrainingBatchStatus = batch._count.members >= batch.maxSeats ? 'FULL' : 'OPEN';
  if (next === batch.status) return batch;
  return prisma.trainingBatch.update({ where: { id: batchId }, data: { status: next } });
};

const assertMutable = (status: TrainingBatchStatus) => {
  if (status === 'CANCELLED') throw new TrainingError('This class is cancelled');
  if (status === 'COMPLETED') throw new TrainingError('This class is already completed');
};

export const serializeBatch = (row: {
  members: { id: number }[];
  _count?: { members: number };
  maxSeats: number;
  [key: string]: unknown;
}) => {
  const memberCount = row._count?.members ?? row.members.length;
  return {
    ...row,
    memberCount,
    seatsRemaining: Math.max(0, row.maxSeats - memberCount),
  };
};

export const listAdminBatches = async (filters?: { programType?: unknown; deliveryMode?: unknown }) => {
  const where: Prisma.TrainingBatchWhereInput = { deletedAt: null };
  if (filters?.programType) where.programType = parseProgramType(filters.programType);
  if (filters?.deliveryMode) where.deliveryMode = parseDeliveryMode(filters.deliveryMode);

  const rows = await prisma.trainingBatch.findMany({
    where,
    include: batchInclude,
    orderBy: [{ scheduledAt: 'asc' }, { updatedAt: 'desc' }],
  });
  return rows.map(serializeBatch);
};

export const getBatch = async (batchId: number, actor?: { userId: number; role: UserRole }) => {
  const row = await prisma.trainingBatch.findFirst({
    where: { id: batchId, deletedAt: null },
    include: batchInclude,
  });
  if (!row) return notFound('Class');

  if (actor?.role === 'STUDENT' && !row.members.some((member) => member.userId === actor.userId)) {
    throw new TrainingError('Class is not available', 403);
  }

  return serializeBatch(row);
};

export const listMyBatches = async (actor: { userId: number; role: UserRole }) => {
  const where: Prisma.TrainingBatchWhereInput =
    actor.role === 'STUDENT'
      ? { deletedAt: null, members: { some: { userId: actor.userId } } }
      : {
          deletedAt: null,
          OR: [{ trainerId: actor.userId }, { createdById: actor.userId }],
        };

  const rows = await prisma.trainingBatch.findMany({
    where,
    include: batchInclude,
    orderBy: [{ scheduledAt: 'asc' }, { updatedAt: 'desc' }],
  });

  return rows.map((row) => ({
    ...serializeBatch(row),
    mySeat: row.members.find((member) => member.userId === actor.userId) || null,
  }));
};

export const createBatch = async (
  actor: { userId: number },
  body: {
    title?: string;
    programType?: unknown;
    deliveryMode?: unknown;
    maxSeats?: unknown;
    trainerId?: unknown;
    courseId?: unknown;
    feeAmountPaise?: unknown;
    scheduledAt?: unknown;
    notes?: string;
    status?: unknown;
  },
) => {
  const title = String(body.title || '').trim();
  if (title.length < 2) throw new TrainingError('Class title is required');

  const programType = parseProgramType(body.programType);
  const deliveryMode = parseDeliveryMode(body.deliveryMode);
  const maxSeats = resolveMaxSeats(deliveryMode, body.maxSeats);
  const trainerId = asInt(body.trainerId);
  const courseId = asInt(body.courseId);

  if (trainerId != null) {
    const trainer = await prisma.user.findUnique({ where: { id: trainerId }, select: { id: true, isActive: true, role: true } });
    if (!trainer || !trainer.isActive || trainer.role === 'STUDENT') return notFound('Trainer');
  }
  if (courseId != null) {
    const course = await prisma.trainingCourse.findFirst({ where: { id: courseId, deletedAt: null }, select: { id: true } });
    if (!course) return notFound('Course');
  }

  const row = await prisma.trainingBatch.create({
    data: {
      title,
      programType,
      deliveryMode,
      maxSeats,
      trainerId,
      courseId,
      feeAmountPaise: asFeePaise(body.feeAmountPaise),
      scheduledAt: asDate(body.scheduledAt),
      notes: body.notes ? String(body.notes) : null,
      status: body.status ? parseBatchStatus(body.status) : 'OPEN',
      createdById: actor.userId,
    },
    include: batchInclude,
  });
  return serializeBatch(row);
};

export const updateBatch = async (
  batchId: number,
  body: {
    title?: string;
    programType?: unknown;
    deliveryMode?: unknown;
    maxSeats?: unknown;
    trainerId?: unknown;
    courseId?: unknown;
    feeAmountPaise?: unknown;
    scheduledAt?: unknown;
    notes?: string | null;
    status?: unknown;
  },
) => {
  const existing = await prisma.trainingBatch.findFirst({
    where: { id: batchId, deletedAt: null },
    include: { _count: { select: { members: true } } },
  });
  if (!existing) return notFound('Class');

  const data: Prisma.TrainingBatchUpdateInput = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length < 2) throw new TrainingError('Class title is required');
    data.title = title;
  }
  if (body.programType !== undefined) data.programType = parseProgramType(body.programType);

  let nextMode = existing.deliveryMode;
  if (body.deliveryMode !== undefined) {
    nextMode = parseDeliveryMode(body.deliveryMode);
    data.deliveryMode = nextMode;
  }

  if (body.deliveryMode !== undefined || body.maxSeats !== undefined) {
    const maxSeats = resolveMaxSeats(nextMode, body.maxSeats ?? existing.maxSeats);
    if (existing._count.members > maxSeats) {
      throw new TrainingError(`This class already has ${existing._count.members} students; lower seats after removing some`);
    }
    data.maxSeats = maxSeats;
  }

  if (body.trainerId !== undefined) {
    const trainerId = asInt(body.trainerId);
    if (trainerId == null) {
      data.trainer = { disconnect: true };
    } else {
      const trainer = await prisma.user.findUnique({ where: { id: trainerId }, select: { id: true, isActive: true, role: true } });
      if (!trainer || !trainer.isActive || trainer.role === 'STUDENT') return notFound('Trainer');
      data.trainer = { connect: { id: trainerId } };
    }
  }

  if (body.courseId !== undefined) {
    const courseId = asInt(body.courseId);
    if (courseId == null) {
      data.course = { disconnect: true };
    } else {
      const course = await prisma.trainingCourse.findFirst({ where: { id: courseId, deletedAt: null }, select: { id: true } });
      if (!course) return notFound('Course');
      data.course = { connect: { id: courseId } };
    }
  }

  if (body.feeAmountPaise !== undefined) data.feeAmountPaise = asFeePaise(body.feeAmountPaise);
  if (body.scheduledAt !== undefined) data.scheduledAt = asDate(body.scheduledAt);
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;
  if (body.status !== undefined) data.status = parseBatchStatus(body.status);

  await prisma.trainingBatch.update({
    where: { id: batchId },
    data,
    include: batchInclude,
  });
  await syncCapacityStatus(batchId);
  return getBatch(batchId);
};

export const deleteBatch = async (batchId: number) => {
  const existing = await prisma.trainingBatch.findFirst({ where: { id: batchId, deletedAt: null } });
  if (!existing) return notFound('Class');
  await prisma.trainingBatch.update({
    where: { id: batchId },
    data: { deletedAt: new Date(), status: 'CANCELLED' },
  });
  return { id: batchId };
};

export const addBatchMember = async (actor: { userId: number }, batchId: number, userId: number) => {
  const [batch, user] = await Promise.all([
    prisma.trainingBatch.findFirst({
      where: { id: batchId, deletedAt: null },
      include: { _count: { select: { members: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true, role: true } }),
  ]);
  if (!batch) return notFound('Class');
  if (!user || !user.isActive) return notFound('Student');
  if (user.role !== 'STUDENT') throw new TrainingError('Only students can be added to a class');
  assertMutable(batch.status);

  if (batch._count.members >= batch.maxSeats) {
    const label = batch.deliveryMode === 'ONE_ON_ONE' ? '1-on-1 class already has a student' : 'This group is full';
    throw new TrainingError(label);
  }

  await prisma.trainingBatchMember.upsert({
    where: { batchId_userId: { batchId, userId } },
    update: {},
    create: {
      batchId,
      userId,
      assignedById: actor.userId,
      paymentStatus: 'UNPAID',
    },
  });

  await syncCapacityStatus(batchId);
  return getBatch(batchId);
};

export const removeBatchMember = async (memberId: number) => {
  const existing = await prisma.trainingBatchMember.findUnique({
    where: { id: memberId },
    include: { batch: true },
  });
  if (!existing || existing.batch.deletedAt) return notFound('Seat');
  assertMutable(existing.batch.status);
  await prisma.trainingBatchMember.delete({ where: { id: memberId } });
  await syncCapacityStatus(existing.batchId);
  return getBatch(existing.batchId);
};

export const setMemberPaymentStatus = async (memberId: number, status: unknown) => {
  const existing = await prisma.trainingBatchMember.findUnique({
    where: { id: memberId },
    include: { batch: true },
  });
  if (!existing || existing.batch.deletedAt) return notFound('Seat');
  const paymentStatus = parseSeatPaymentStatus(status);
  await prisma.trainingBatchMember.update({
    where: { id: memberId },
    data: { paymentStatus },
  });
  return getBatch(existing.batchId);
};
