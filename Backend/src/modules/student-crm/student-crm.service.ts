import { prisma } from '../../prisma.js';
import { getDefaultChecklist, type ChecklistItem } from './checklists.js';
import { notify } from '../notifications/notifications.service.js';
import { safeNotify } from '../notifications/recipients.js';

/** Generate a human-readable application code like APP-2026-0007. */
const generateApplicationCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.application.count({
    where: {
      applicationCode: { startsWith: `APP-${year}-` },
    },
  });
  return `APP-${year}-${String(count + 1).padStart(4, '0')}`;
};

// -------------------- Students --------------------

export const listStudents = async (opts: { search?: string; limit?: number } = {}) => {
  const where: any = {};
  if (opts.search) {
    where.OR = [
      { fullName: { contains: opts.search, mode: 'insensitive' } },
      { email: { contains: opts.search, mode: 'insensitive' } },
      { phone: { contains: opts.search, mode: 'insensitive' } },
    ];
  }
  return prisma.student.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: opts.limit ?? 200,
    include: {
      applications: { select: { id: true, stage: true, university: true, country: true } },
    },
  });
};

export const getStudent = async (id: number) =>
  prisma.student.findUnique({
    where: { id },
    include: {
      applications: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

export const createStudent = async (data: {
  fullName: string;
  email: string;
  phone?: string;
  dob?: string;
  nationality?: string;
  preferredCountry?: string;
  academicHistory?: any;
  ieltsScore?: number;
  toeflScore?: number;
  greScore?: number;
  gmatScore?: number;
  source?: string;
  sourceLeadId?: number;
}) => {
  const existing = await prisma.student.findUnique({ where: { email: data.email } });
  if (existing) return existing;
  return prisma.student.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      dob: data.dob ? new Date(data.dob) : null,
      nationality: data.nationality || null,
      preferredCountry: data.preferredCountry || null,
      academicHistory: data.academicHistory || undefined,
      ieltsScore: data.ieltsScore ?? null,
      toeflScore: data.toeflScore ?? null,
      greScore: data.greScore ?? null,
      gmatScore: data.gmatScore ?? null,
      source: data.source || null,
      sourceLeadId: data.sourceLeadId || null,
    },
  });
};

export const updateStudent = async (id: number, data: Record<string, any>) => {
  // Whitelist fields we accept here so updates are predictable.
  const allowed = [
    'fullName',
    'phone',
    'dob',
    'nationality',
    'preferredCountry',
    'academicHistory',
    'ieltsScore',
    'toeflScore',
    'greScore',
    'gmatScore',
    'notes',
  ];
  const payload: any = {};
  for (const k of allowed) if (k in data) payload[k] = k === 'dob' && data.dob ? new Date(data.dob) : data[k];
  return prisma.student.update({ where: { id }, data: payload });
};

// -------------------- Applications --------------------

const APPLICATION_INCLUDE = {
  student: true,
  assignedTo: { select: { id: true, fullName: true, email: true, role: true } },
  documents: { orderBy: { id: 'asc' as const } },
  offerLetter: true,
  visaTracking: true,
  stageEvents: {
    orderBy: { createdAt: 'desc' as const },
    take: 50,
    include: { changedBy: { select: { id: true, fullName: true } } },
  },
};

export const listApplications = async (opts: {
  studentId?: number;
  stage?: string;
  assignedToId?: number;
  search?: string;
  limit?: number;
} = {}) => {
  const where: any = {};
  if (opts.studentId) where.studentId = opts.studentId;
  if (opts.stage) where.stage = opts.stage;
  if (opts.assignedToId) where.assignedToId = opts.assignedToId;
  if (opts.search) {
    where.OR = [
      { applicationCode: { contains: opts.search, mode: 'insensitive' } },
      { university: { contains: opts.search, mode: 'insensitive' } },
      { country: { contains: opts.search, mode: 'insensitive' } },
      { course: { contains: opts.search, mode: 'insensitive' } },
    ];
  }
  return prisma.application.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: opts.limit ?? 200,
    include: {
      student: { select: { id: true, fullName: true, email: true } },
      assignedTo: { select: { id: true, fullName: true } },
    },
  });
};

export const getApplication = async (id: number) =>
  prisma.application.findUnique({ where: { id }, include: APPLICATION_INCLUDE });

/** Seed the document checklist for a new application using country/university defaults. */
const seedChecklistFor = async (applicationId: number, country: string, university: string) => {
  // Try DB template first.
  let items: ChecklistItem[] | null = null;
  const tpl = await prisma.documentChecklistTemplate.findFirst({
    where: { country, university },
  });
  if (tpl?.documents) {
    items = Array.isArray(tpl.documents) ? (tpl.documents as any) : null;
  }
  if (!items) {
    const fallback = await prisma.documentChecklistTemplate.findFirst({
      where: { country, university: null },
    });
    if (fallback?.documents) items = Array.isArray(fallback.documents) ? (fallback.documents as any) : null;
  }
  if (!items) items = getDefaultChecklist(country);

  if (items.length === 0) return;
  await prisma.applicationDocument.createMany({
    data: items.map((it) => ({
      applicationId,
      name: it.name,
      required: it.required !== false,
      notes: it.description || null,
    })),
  });
};

export const createApplication = async (data: {
  studentId: number;
  country: string;
  university: string;
  course: string;
  intake?: string;
  assignedToId?: number;
  deadline?: string;
  notes?: string;
}) => {
  const code = await generateApplicationCode();
  const app = await prisma.application.create({
    data: {
      applicationCode: code,
      studentId: data.studentId,
      country: data.country,
      university: data.university,
      course: data.course,
      intake: data.intake || null,
      assignedToId: data.assignedToId || null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      notes: data.notes || null,
      stage: 'DRAFT',
    },
  });
  await prisma.applicationStageEvent.create({
    data: { applicationId: app.id, fromStage: null, toStage: 'DRAFT', notes: 'application created' },
  });
  await seedChecklistFor(app.id, data.country, data.university);

  if (data.assignedToId) {
    const student = await prisma.student.findUnique({ where: { id: data.studentId } });
    await safeNotify({
      recipientId: data.assignedToId,
      templateKey: 'application.task_assigned',
      vars: {
        taskTitle: 'New application assignment',
        studentName: student?.fullName,
        applicationId: app.id,
      },
    });
  }

  return getApplication(app.id);
};

export const updateApplication = async (id: number, data: Record<string, any>) => {
  const allowed = ['country', 'university', 'course', 'intake', 'assignedToId', 'deadline', 'notes'];
  const payload: any = {};
  for (const k of allowed) {
    if (k in data) {
      payload[k] = k === 'deadline' && data.deadline ? new Date(data.deadline) : data[k];
    }
  }

  const previous =
    'assignedToId' in data
      ? await prisma.application.findUnique({
          where: { id },
          include: { student: true },
        })
      : null;

  await prisma.application.update({ where: { id }, data: payload });

  if (
    previous &&
    data.assignedToId &&
    data.assignedToId !== previous.assignedToId
  ) {
    await safeNotify({
      recipientId: data.assignedToId,
      templateKey: 'application.task_assigned',
      vars: {
        taskTitle: 'Application reassigned to you',
        studentName: previous.student.fullName,
        applicationId: id,
      },
    });
  }

  return getApplication(id);
};

/** Stage transitions: advance, regress, or jump. Records an audit row and fires notifications. */
export const setStage = async (
  applicationId: number,
  toStage:
    | 'DRAFT'
    | 'DOCUMENTS_PENDING'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'OFFER_RECEIVED'
    | 'OFFER_ACCEPTED'
    | 'OFFER_REJECTED'
    | 'VISA_PROCESS'
    | 'ENROLLED',
  changedById?: number,
  notes?: string
) => {
  const current = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { student: true, assignedTo: true },
  });
  if (!current) throw new Error('application not found');

  await prisma.application.update({ where: { id: applicationId }, data: { stage: toStage } });
  await prisma.applicationStageEvent.create({
    data: {
      applicationId,
      fromStage: current.stage,
      toStage,
      changedById: changedById || null,
      notes: notes || null,
    },
  });

  if (current.assignedToId) {
    if (toStage === 'OFFER_RECEIVED') {
      await safeNotify({
        recipientId: current.assignedToId,
        templateKey: 'application.offer_received',
        vars: {
          studentName: current.student.fullName,
          university: current.university,
          course: current.course,
          applicationId,
        },
      });
    } else {
      await safeNotify({
        recipientId: current.assignedToId,
        templateKey: 'application.stage_changed',
        vars: {
          studentName: current.student.fullName,
          university: current.university,
          stage: toStage.replace(/_/g, ' ').toLowerCase(),
          applicationId,
        },
      });
    }
  }

  return getApplication(applicationId);
};

// -------------------- Documents --------------------

export const upsertDocument = async (
  applicationId: number,
  docId: number | null,
  data: Partial<{ name: string; required: boolean; filename: string; fileUrl: string; status: string; notes: string }>
) => {
  if (docId) {
    return prisma.applicationDocument.update({
      where: { id: docId },
      data: {
        ...(data.name && { name: data.name }),
        ...(typeof data.required === 'boolean' && { required: data.required }),
        ...(data.filename && { filename: data.filename }),
        ...(data.fileUrl && { fileUrl: data.fileUrl }),
        ...(data.status && { status: data.status as any }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...((data.status === 'UPLOADED' || data.fileUrl) && { uploadedAt: new Date() }),
      },
    });
  }
  return prisma.applicationDocument.create({
    data: {
      applicationId,
      name: data.name || 'document',
      required: data.required ?? true,
      filename: data.filename || null,
      fileUrl: data.fileUrl || null,
      status: (data.status as any) || 'PENDING',
      notes: data.notes || null,
    },
  });
};

export const deleteDocument = (docId: number) => prisma.applicationDocument.delete({ where: { id: docId } });

/** Fires a `document_missing` notification if any required docs are still PENDING. */
export const notifyMissingDocs = async (applicationId: number) => {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { documents: true, assignedTo: true, student: true },
  });
  if (!app) return;
  const missing = app.documents.filter((d) => d.required && d.status === 'PENDING').map((d) => d.name);
  if (missing.length === 0 || !app.assignedToId) return;
  await safeNotify({
    recipientId: app.assignedToId,
    templateKey: 'application.document_missing',
    vars: {
      applicationCode: app.applicationCode,
      missing,
      applicationId,
    },
  });
};

// -------------------- Offer / Visa --------------------

export const upsertOfferLetter = async (
  applicationId: number,
  data: Partial<{
    fileUrl: string;
    filename: string;
    receivedAt: string;
    conditional: boolean;
    decisionDeadline: string;
    studentDecision: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    decisionAt: string;
    notes: string;
  }>
) => {
  const existing = await prisma.offerLetter.findUnique({ where: { applicationId } });
  const payload: any = {
    ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
    ...(data.filename !== undefined && { filename: data.filename }),
    ...(data.receivedAt && { receivedAt: new Date(data.receivedAt) }),
    ...(typeof data.conditional === 'boolean' && { conditional: data.conditional }),
    ...(data.decisionDeadline && { decisionDeadline: new Date(data.decisionDeadline) }),
    ...(data.studentDecision && { studentDecision: data.studentDecision }),
    ...(data.decisionAt && { decisionAt: new Date(data.decisionAt) }),
    ...(data.notes !== undefined && { notes: data.notes }),
  };
  if (existing) {
    return prisma.offerLetter.update({ where: { applicationId }, data: payload });
  }
  return prisma.offerLetter.create({ data: { applicationId, ...payload } });
};

export const upsertVisaTracking = async (
  applicationId: number,
  data: Partial<{
    country: string;
    status: string;
    appointmentDate: string;
    decisionDate: string;
    documents: any;
    notes: string;
  }>
) => {
  const existing = await prisma.visaTracking.findUnique({ where: { applicationId } });
  const payload: any = {
    ...(data.country && { country: data.country }),
    ...(data.status && { status: data.status as any }),
    ...(data.appointmentDate && { appointmentDate: new Date(data.appointmentDate) }),
    ...(data.decisionDate && { decisionDate: new Date(data.decisionDate) }),
    ...(data.documents !== undefined && { documents: data.documents }),
    ...(data.notes !== undefined && { notes: data.notes }),
  };
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { student: true },
  });
  if (!app) throw new Error('application not found');

  const prevStatus = existing?.status;
  const result = existing
    ? await prisma.visaTracking.update({ where: { applicationId }, data: payload })
    : await prisma.visaTracking.create({
        data: { applicationId, country: data.country || app.country || 'UNKNOWN', ...payload },
      });

  if (
    app.assignedToId &&
    data.status &&
    data.status !== prevStatus
  ) {
    await safeNotify({
      recipientId: app.assignedToId,
      templateKey: 'application.visa_update',
      vars: {
        studentName: app.student.fullName,
        status: String(data.status).replace(/_/g, ' ').toLowerCase(),
        applicationId,
      },
    });
  }

  return result;
};

// -------------------- Lead → Application conversion (Phase 2) --------------------

export const createApplicationFromLead = async (
  leadId: number,
  opts: {
    university: string;
    course: string;
    country?: string;
    intake?: string;
    deadline?: string;
    assignedToId?: number;
    notes?: string;
  },
  actingUserId?: number
) => {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { source: true, assignedCounsellor: true },
  });
  if (!lead) throw new Error('lead not found');
  if (lead.status === 'CONVERTED') throw new Error('lead already converted');

  // Find or create a Student.
  let student = await prisma.student.findUnique({ where: { email: lead.email } });
  if (!student) {
    student = await prisma.student.create({
      data: {
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone || null,
        preferredCountry: lead.preferredCountry || lead.country || null,
        source: lead.source?.name || null,
        sourceLeadId: lead.id,
      },
    });
  } else if (!student.sourceLeadId) {
    student = await prisma.student.update({
      where: { id: student.id },
      data: { sourceLeadId: lead.id, source: student.source || lead.source?.name || null },
    });
  }

  const assignedToId = opts.assignedToId ?? lead.assignedCounsellorId ?? null;
  const country = opts.country || lead.preferredCountry || lead.country || 'UNKNOWN';

  const application = await createApplication({
    studentId: student.id,
    country,
    university: opts.university,
    course: opts.course,
    intake: opts.intake,
    assignedToId: assignedToId || undefined,
    deadline: opts.deadline,
    notes: opts.notes,
  });

  // Mark lead as converted.
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: 'CONVERTED' },
  });

  // Notify the counsellor (if any) and the actor (if different).
  const recipients = new Set<number>();
  if (assignedToId) recipients.add(assignedToId);
  if (actingUserId && actingUserId !== assignedToId) recipients.add(actingUserId);
  for (const recipientId of recipients) {
    await safeNotify({
      recipientId,
      templateKey: 'lead.converted',
      vars: {
        studentName: student.fullName,
        country,
        applicationId: application?.id,
      },
    });
  }

  return { student, application };
};
