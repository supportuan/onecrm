import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { hashPassword } from '../../utils/password.js';
import { deleteStoredFile } from '../../lib/file-storage.js';
import { getDefaultChecklist, type ChecklistItem } from './checklists.js';
import { safeNotify } from '../notifications/recipients.js';
import { getDefaultTenantId } from '../../utils/tenant-default.js';
import { sendCampaignEmail } from '../marketing/services/email.service.js';
import { applicationScopeWhere, studentScopeWhere } from './scoping.js';
import { computeProcessProgress, getStagesForCountry } from './stage-engine.js';
import {
  appendVisaDocument,
  getVisaWorkflowForCountry,
  normalizeVisaDocuments,
} from './visa-workflows.js';

type Actor = { id?: number; role?: string };

const STUDENT_INCLUDE = {
  country: true,
  industry: true,
  subIndustry: true,
  studyArea: true,
  preferredUniversity: { include: { country: true } },
  preferredCourseRef: true,
  contact: { select: { id: true, fullName: true, email: true, role: true } },
  applications: { orderBy: { createdAt: 'desc' as const } },
  universities: { include: { university: { include: { country: true } } } },
  checklists: { include: { checkList: true }, orderBy: { id: 'asc' as const } },
};

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

export const listStudents = async (
  opts: { search?: string; limit?: number; actor?: Actor } = {}
) => {
  const where: any = { ...studentScopeWhere(opts.actor) };
  if (opts.search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { fullName: { contains: opts.search, mode: 'insensitive' } },
          { email: { contains: opts.search, mode: 'insensitive' } },
          { phone: { contains: opts.search, mode: 'insensitive' } },
        ],
      },
    ];
  }
  return prisma.student.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: opts.limit ?? 200,
    include: {
      country: { select: { id: true, name: true } },
      applications: { select: { id: true, stage: true, university: true, country: true } },
    },
  });
};

export const getStudent = async (id: number, actor?: Actor) => {
  const student = await prisma.student.findFirst({
    where: { id, ...studentScopeWhere(actor) },
    include: STUDENT_INCLUDE,
  });
  return student;
};

export const getStudentByUserId = async (userId: number) => {
  let student = await prisma.student.findFirst({
    where: { userId, deletedAt: null },
    include: STUDENT_INCLUDE,
  });
  if (student) return student;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return null;

  student = await prisma.student.findFirst({
    where: { email: user.email, deletedAt: null },
    include: STUDENT_INCLUDE,
  });
  if (student && !student.userId) {
    await prisma.student.update({ where: { id: student.id }, data: { userId } });
    student = await prisma.student.findFirst({
      where: { id: student.id },
      include: STUDENT_INCLUDE,
    });
  }
  return student;
};

const buildFullName = (data: { firstName?: string; lastName?: string; fullName?: string }) => {
  if (data.fullName?.trim()) return data.fullName.trim();
  return [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
};

const studentDataFromPayload = (data: Record<string, any>) => {
  const fullName = buildFullName(data);
  const payload: Record<string, unknown> = {
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    fullName: fullName || data.email,
    email: data.email,
    phone: data.phone ?? null,
    dob: data.dob ? new Date(data.dob) : null,
    nationality: data.nationality ?? null,
    preferredCountry: data.preferredCountry ?? null,
    level: data.level ?? null,
    countryId: data.countryId ?? null,
    industryId: data.industryId ?? null,
    subIndustryId: data.subIndustryId ?? null,
    studyAreaId: data.studyAreaId ?? null,
    preferredUniversityId: data.preferredUniversityId ?? null,
    preferredCourseId: data.preferredCourseId ?? null,
    preferredCourse: data.preferredCourse ?? null,
    intakeMonth: data.intakeMonth ?? null,
    intakeYear: data.intakeYear ?? null,
    studyMode: data.studyMode ?? null,
    studyDuration: data.studyDuration ?? null,
    studyBudget: data.studyBudget ?? null,
    studyAttendanceType: data.studyAttendanceType ?? null,
    typeOfDegree: data.typeOfDegree ?? null,
    workExperience: data.workExperience ?? null,
    recLevelAcademic: data.recLevelAcademic ?? null,
    recGradeAchieved: data.recGradeAchieved ?? null,
    preStudyLoc: data.preStudyLoc ?? null,
    educationDetails: data.educationDetails ?? undefined,
    asstExamSections: data.asstExamSections ?? undefined,
    academicHistory: data.academicHistory ?? undefined,
    ieltsScore: data.ieltsScore ?? null,
    toeflScore: data.toeflScore ?? null,
    greScore: data.greScore ?? null,
    gmatScore: data.gmatScore ?? null,
    contactId: data.contactId ?? null,
    source: data.source ?? null,
    sourceLeadId: data.sourceLeadId ?? null,
    notes: data.notes ?? null,
  };
  return payload;
};

export const createStudent = async (data: Record<string, any>) => {
  const existing = await prisma.student.findUnique({ where: { email: data.email } });
  if (existing) return existing;
  const created = await prisma.student.create({
    data: studentDataFromPayload(data) as any,
  });
  if (created.countryId) await seedStudentChecklists(created.id, created.countryId);
  return getStudent(created.id);
};

export const updateStudent = async (id: number, data: Record<string, any>, actor?: Actor) => {
  const current = await getStudent(id, actor);
  if (!current) throw new Error('student not found');
  if (current.isEnrolled) throw new Error('enrolled students cannot be edited');

  const allowed = [
    'firstName', 'lastName', 'fullName', 'phone', 'dob', 'nationality', 'preferredCountry',
    'level', 'countryId', 'industryId', 'subIndustryId', 'studyAreaId',
    'preferredUniversityId', 'preferredCourseId', 'preferredCourse',
    'intakeMonth', 'intakeYear', 'studyMode', 'studyDuration', 'studyBudget',
    'studyAttendanceType', 'typeOfDegree', 'workExperience', 'recLevelAcademic', 'recGradeAchieved',
    'preStudyLoc', 'educationDetails', 'asstExamSections', 'academicHistory',
    'ieltsScore', 'toeflScore', 'greScore', 'gmatScore', 'contactId', 'notes', 'status',
  ];
  const payload: any = {};
  for (const k of allowed) {
    if (k in data) payload[k] = k === 'dob' && data.dob ? new Date(data.dob) : data[k];
  }
  if (payload.firstName || payload.lastName) {
    payload.fullName = buildFullName({ ...current, ...payload });
  }
  await prisma.student.update({ where: { id }, data: payload });
  if (data.countryId && data.countryId !== current.countryId) {
    await seedStudentChecklists(id, data.countryId);
  }
  return getStudent(id, actor);
};

/** Student self-service update — may repeat until counsellor marks enrolled. */
export const updateMyStudentProfile = async (userId: number, data: Record<string, any>) => {
  const current = await getStudentByUserId(userId);
  if (!current) throw new Error('student profile not found');
  if (current.isEnrolled) {
    throw new Error('Your profile is locked. Contact your counsellor to request changes.');
  }
  return updateStudent(current.id, data, { id: userId, role: 'STUDENT' });
};

export const listMyApplications = async (userId: number) => {
  const student = await getStudentByUserId(userId);
  if (!student) return [];
  return prisma.application.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
    include: {
      documents: true,
      offerLetter: true,
      visaTracking: true,
    },
  });
};

export const setStudentEnrolled = async (id: number, isEnrolled: boolean, actor?: Actor) => {
  const current = await getStudent(id, actor);
  if (!current) throw new Error('student not found');
  await prisma.student.update({ where: { id }, data: { isEnrolled } });
  if (isEnrolled) {
    await prisma.application.updateMany({
      where: { studentId: id },
      data: { stage: 'ENROLLED' },
    });
  }
  return getStudent(id, actor);
};

export const patchStudentStatus = async (id: number, status: string, notes?: string, actor?: Actor) => {
  const current = await getStudent(id, actor);
  if (!current) throw new Error('student not found');
  if (current.isEnrolled) throw new Error('enrolled students are locked');
  return prisma.student.update({
    where: { id },
    data: { status, ...(notes !== undefined ? { notes } : {}) },
  });
};

export const getStatistics = async (actor?: Actor) => {
  const studentWhere = studentScopeWhere(actor);
  const appWhere = applicationScopeWhere(actor);

  const [totalStudents, enrolled, byStage, byProcessStage] = await Promise.all([
    prisma.student.count({ where: studentWhere }),
    prisma.student.count({ where: { ...studentWhere, isEnrolled: true } }),
    prisma.application.groupBy({ by: ['stage'], where: appWhere, _count: { id: true } }),
    prisma.student.groupBy({ by: ['processStage'], where: studentWhere, _count: { id: true } }),
  ]);

  return {
    totalStudents,
    enrolled,
    applicationsByStage: byStage.map((r) => ({ stage: r.stage, count: r._count.id })),
    studentsByProcessStage: byProcessStage.map((r) => ({ stage: r.processStage, count: r._count.id })),
  };
};

/** Seed country-linked checklist rows for a student */
export const seedStudentChecklists = async (studentId: number, countryId: number) => {
  const links = await prisma.countryChecklist.findMany({
    where: { countryId },
    include: { checkList: true },
  });
  if (!links.length) return;
  for (const link of links) {
    await prisma.studentChecklist.upsert({
      where: { studentId_checkListId: { studentId, checkListId: link.checkListId } },
      create: { studentId, checkListId: link.checkListId },
      update: {},
    });
  }
  await refreshStudentProgress(studentId);
};

export const refreshStudentProgress = async (studentId: number) => {
  const items = await prisma.studentChecklist.findMany({
    where: { studentId },
    include: { checkList: true },
  });
  const progress = computeProcessProgress(items);
  await prisma.student.update({ where: { id: studentId }, data: progress });
};

export const listStudentChecklists = async (studentId: number, actor?: Actor) => {
  const student = await getStudent(studentId, actor);
  if (!student) throw new Error('student not found');
  return student.checklists;
};

export const updateChecklistValue = async (
  studentId: number,
  checkListId: number,
  data: { value?: string; linkUrl?: string; completed?: boolean },
  actor?: Actor
) => {
  const student = await getStudent(studentId, actor);
  if (!student) throw new Error('student not found');
  if (student.isEnrolled) throw new Error('enrolled students are locked');

  const item = await prisma.studentChecklist.upsert({
    where: { studentId_checkListId: { studentId, checkListId } },
    create: { studentId, checkListId, ...data },
    update: data,
    include: { checkList: true },
  });
  await refreshStudentProgress(studentId);
  return item;
};

export const listStudentUniversities = async (studentId: number, actor?: Actor) => {
  const student = await getStudent(studentId, actor);
  if (!student) throw new Error('student not found');
  return student.universities;
};

export const upsertStudentUniversity = async (
  studentId: number,
  data: {
    universityId: number;
    value?: string;
    isSelected?: boolean;
    status?: string;
    appliedIntake?: string;
    offerIntake?: string;
    courseLink?: string;
    defer?: boolean;
  },
  actor?: Actor
) => {
  const student = await getStudent(studentId, actor);
  if (!student) throw new Error('student not found');
  if (student.isEnrolled) throw new Error('enrolled students are locked');

  return prisma.studentUniversity.upsert({
    where: { studentId_universityId: { studentId, universityId: data.universityId } },
    create: { studentId, ...data },
    update: data,
    include: { university: { include: { country: true } } },
  });
};

export const removeStudentUniversity = async (studentId: number, universityId: number, actor?: Actor) => {
  const student = await getStudent(studentId, actor);
  if (!student) throw new Error('student not found');
  await prisma.studentUniversity.delete({
    where: { studentId_universityId: { studentId, universityId } },
  });
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
  actor?: Actor;
} = {}) => {
  const where: any = { ...applicationScopeWhere(opts.actor) };
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

export const getApplication = async (id: number, actor?: Actor) => {
  const scope = applicationScopeWhere(actor);
  return prisma.application.findFirst({ where: { id, ...scope }, include: APPLICATION_INCLUDE });
};

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

  try {
    const { onApplicationStageChanged } = await import(
      '../agency-crm/agency-commission.engine.js'
    );
    await onApplicationStageChanged(applicationId, toStage);
  } catch (err) {
    console.warn('[Agency CRM] stage hook failed:', (err as Error)?.message);
  }

  return getApplication(applicationId);
};

// -------------------- Documents --------------------

export const upsertDocument = async (
  applicationId: number,
  docId: number | null,
  data: Partial<{ name: string; required: boolean; filename: string; fileUrl: string; status: string; notes: string }>
) => {
  let previousStatus: string | undefined;
  if (docId) {
    const existing = await prisma.applicationDocument.findUnique({ where: { id: docId } });
    previousStatus = existing?.status;
  }

  let result;
  if (docId) {
    result = await prisma.applicationDocument.update({
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
  } else {
    result = await prisma.applicationDocument.create({
      data: {
        applicationId,
        name: data.name || 'document',
        required: data.required ?? true,
        filename: data.filename || null,
        fileUrl: data.fileUrl || null,
        status: (data.status as any) || 'PENDING',
        notes: data.notes || null,
        ...(data.fileUrl && { uploadedAt: new Date() }),
      },
    });
  }

  if (docId && data.status === 'REJECTED' && previousStatus !== 'REJECTED') {
    await notifyDocumentRejected(applicationId, docId, data.notes);
  }

  return result;
};

export const deleteDocument = async (docId: number) => {
  const doc = await prisma.applicationDocument.findUnique({ where: { id: docId } });
  if (doc?.fileUrl) {
    try {
      await deleteStoredFile(doc.fileUrl);
    } catch {
      // File may already be gone; still remove the DB row.
    }
  }
  return prisma.applicationDocument.delete({ where: { id: docId } });
};

/** Fires missing-document notifications to the student (and counsellor if assigned). */
export const notifyMissingDocs = async (applicationId: number) => {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { documents: true, assignedTo: true, student: true },
  });
  if (!app) return;
  const missing = app.documents.filter((d) => d.required && d.status === 'PENDING').map((d) => d.name);
  if (missing.length === 0) return;

  if (app.student?.userId) {
    await safeNotify({
      recipientId: app.student.userId,
      templateKey: 'application.document_missing_student',
      vars: {
        applicationCode: app.applicationCode,
        missing,
        applicationId,
      },
    });
  }

  if (app.assignedToId) {
    await safeNotify({
      recipientId: app.assignedToId,
      templateKey: 'application.document_missing',
      vars: {
        applicationCode: app.applicationCode,
        missing,
        applicationId,
      },
    });
  }
};

/** Notify counsellor when a student uploads a document for review. */
export const notifyDocumentUploaded = async (applicationId: number, docId: number, _studentUserId?: number) => {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { documents: true, student: true },
  });
  if (!app?.assignedToId) return;
  const doc = app.documents.find((d) => d.id === docId);
  if (!doc) return;
  await safeNotify({
    recipientId: app.assignedToId,
    templateKey: 'application.document_uploaded',
    vars: {
      applicationCode: app.applicationCode,
      applicationId,
      documentName: doc.name,
      studentName: app.student?.fullName,
    },
  });
};

/** Notify student when counsellor rejects a document. */
export const notifyDocumentRejected = async (applicationId: number, docId: number, notes?: string) => {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { documents: true, student: true },
  });
  if (!app?.student?.userId) return;
  const doc = app.documents.find((d) => d.id === docId);
  if (!doc) return;
  await safeNotify({
    recipientId: app.student.userId,
    templateKey: 'application.document_rejected',
    vars: {
      applicationCode: app.applicationCode,
      applicationId,
      documentName: doc.name,
      notes: notes || doc.notes,
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
  }>,
  changedById?: number
) => {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { student: true, assignedTo: true, offerLetter: true },
  });
  if (!app) throw new Error('application not found');

  const existing = app.offerLetter;
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

  const result = existing
    ? await prisma.offerLetter.update({ where: { applicationId }, data: payload })
    : await prisma.offerLetter.create({ data: { applicationId, ...payload } });

  const hasNewFile = Boolean(data.fileUrl && data.fileUrl !== existing?.fileUrl);
  const staffDecision = data.studentDecision && data.studentDecision !== 'PENDING';

  if (hasNewFile || (data.receivedAt && app.stage !== 'OFFER_RECEIVED')) {
    if (!['OFFER_ACCEPTED', 'OFFER_REJECTED', 'ENROLLED'].includes(app.stage)) {
      await setStage(applicationId, 'OFFER_RECEIVED', changedById, 'offer letter received');
    }
    if (app.student?.userId) {
      await safeNotify({
        recipientId: app.student.userId,
        templateKey: 'application.offer_for_student',
        vars: {
          university: app.university,
          course: app.course,
          applicationCode: app.applicationCode,
          deadline: data.decisionDeadline
            ? new Date(data.decisionDeadline).toISOString().slice(0, 10)
            : result.decisionDeadline
              ? new Date(result.decisionDeadline).toISOString().slice(0, 10)
              : undefined,
          applicationId,
        },
      });
    }
  }

  if (staffDecision && data.studentDecision === 'ACCEPTED' && app.stage !== 'OFFER_ACCEPTED') {
    await setStage(applicationId, 'OFFER_ACCEPTED', changedById, 'offer accepted by counsellor');
  } else if (staffDecision && data.studentDecision === 'REJECTED' && app.stage !== 'OFFER_REJECTED') {
    await setStage(applicationId, 'OFFER_REJECTED', changedById, 'offer rejected by counsellor');
  }

  return result;
};

/** Student self-service accept or reject an offer. */
export const studentRespondToOffer = async (
  applicationId: number,
  userId: number,
  decision: 'ACCEPTED' | 'REJECTED'
) => {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, student: { userId, deletedAt: null } },
    include: { offerLetter: true, student: true, assignedTo: true },
  });
  if (!app) throw new Error('application not found');
  if (!app.offerLetter?.fileUrl) throw new Error('no offer letter on file');
  if (app.offerLetter.studentDecision !== 'PENDING' && app.offerLetter.studentDecision) {
    throw new Error('offer decision already recorded');
  }

  await prisma.offerLetter.update({
    where: { applicationId },
    data: {
      studentDecision: decision,
      decisionAt: new Date(),
    },
  });

  const toStage = decision === 'ACCEPTED' ? 'OFFER_ACCEPTED' : 'OFFER_REJECTED';
  await setStage(applicationId, toStage, userId, `student ${decision.toLowerCase()} offer`);

  if (app.assignedToId) {
    await safeNotify({
      recipientId: app.assignedToId,
      templateKey: 'application.offer_decision',
      vars: {
        studentName: app.student.fullName,
        university: app.university,
        decision: decision.toLowerCase(),
        applicationId,
      },
    });
  }

  return getApplication(applicationId, { id: userId, role: 'STUDENT' });
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

  if (data.status && data.status !== prevStatus && app.student?.userId) {
    await safeNotify({
      recipientId: app.student.userId,
      templateKey: 'application.visa_update_student',
      vars: {
        university: app.university,
        status: String(data.status).replace(/_/g, ' ').toLowerCase(),
        applicationId,
      },
    });
  }

  if (data.status && data.status !== prevStatus) {
    try {
      const { onVisaStatusChanged } = await import('../agency-crm/agency-commission.engine.js');
      await onVisaStatusChanged(applicationId, data.status as any);
    } catch (err) {
      console.warn('[Agency CRM] visa hook failed:', (err as Error)?.message);
    }
  }

  return result;
};

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
  const nameParts = (lead.fullName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || lead.fullName;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
  const assignedToId = opts.assignedToId ?? lead.assignedCounsellorId ?? null;
  const countryName = opts.country || lead.preferredCountry || lead.country || 'UNKNOWN';

  let student = await prisma.student.findUnique({ where: { email: lead.email } });
  if (!student) {
    student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone || null,
        preferredCountry: countryName,
        level: (lead as any).level || null,
        intakeMonth: (lead as any).intakeMonth || null,
        intakeYear: (lead as any).intakeYear || null,
        contactId: assignedToId,
        source: lead.source?.name || 'lead_conversion',
        sourceLeadId: lead.id,
      },
    });
  } else if (!student.sourceLeadId) {
    student = await prisma.student.update({
      where: { id: student.id },
      data: {
        sourceLeadId: lead.id,
        source: student.source || lead.source?.name || null,
        contactId: student.contactId || assignedToId,
        level: student.level || (lead as any).level || null,
      },
    });
  }

  const country = countryName;

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

// -------------------- Lead → Student login + application (full promote) --------------------

const resolveCountry = async (name?: string | null) => {
  if (!name) return null;
  return prisma.country.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, deletedAt: null },
  });
};

const pickUniversityForCountry = async (countryId: number, preferredName?: string | null) => {
  if (preferredName) {
    const exact = await prisma.university.findFirst({
      where: {
        countryId,
        deletedAt: null,
        name: { contains: preferredName, mode: 'insensitive' },
      },
    });
    if (exact) return exact;
  }
  return prisma.university.findFirst({
    where: { countryId, deletedAt: null },
    orderBy: { name: 'asc' },
  });
};

/**
 * Create student login (User), Student profile, Application, and university shortlist from a marketing Lead.
 * Safe to re-run: links existing user/student and skips duplicate applications.
 */
export const promoteLeadToStudent = async (
  leadId: number,
  opts: {
    password?: string;
    university?: string;
    universityId?: number;
    course?: string;
    country?: string;
    intake?: string;
    assignedToId?: number;
  } = {},
  actingUserId?: number
) => {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { source: true, assignedCounsellor: true },
  });
  if (!lead) throw new Error('lead not found');

  const nameParts = (lead.fullName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || lead.fullName;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
  const assignedToId = opts.assignedToId ?? lead.assignedCounsellorId ?? null;
  const countryName = opts.country || lead.preferredCountry || lead.country || 'Unknown';
  const countryRow = await resolveCountry(countryName);

  let user = lead.studentUserId
    ? await prisma.user.findUnique({ where: { id: lead.studentUserId } })
    : await prisma.user.findUnique({ where: { email: lead.email } });

  let tempPassword: string | undefined;

  if (!user) {
    tempPassword = opts.password || crypto.randomBytes(9).toString('base64').slice(0, 12);
    const passwordHash = await hashPassword(tempPassword);
    const tenantId = await getDefaultTenantId(assignedToId ?? actingUserId ?? null);
    user = await prisma.user.create({
      data: {
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        passwordHash,
        role: UserRole.STUDENT,
        tenantId,
        isActive: true,
        isApproved: true,
        mustChangePassword: true,
      },
    });

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student-login`;
    sendCampaignEmail({
      to: lead.email,
      subject: 'Your ApplyUniNow student account',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;">
          <h2>Welcome, ${lead.fullName}</h2>
          <p>Your student account has been created. Log in at <a href="${loginUrl}">${loginUrl}</a></p>
          <p><strong>Email:</strong> ${lead.email}</p>
          <p><strong>Temporary password:</strong> ${tempPassword}</p>
          <p>You will be asked to set a new password on first login.</p>
        </div>
      `,
    }).catch((err) => console.error('[Student welcome email]', err));
  } else if (!user.tenantId) {
    const tenantId = await getDefaultTenantId(assignedToId ?? actingUserId ?? null);
    if (tenantId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { tenantId } });
    }
  }

  let student = await prisma.student.findUnique({ where: { email: lead.email } });
  if (!student) {
    student = await prisma.student.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone || null,
        preferredCountry: countryName,
        countryId: countryRow?.id ?? null,
        contactId: assignedToId,
        source: lead.source?.name || 'lead_promotion',
        sourceLeadId: lead.id,
      },
    });
  } else {
    student = await prisma.student.update({
      where: { id: student.id },
      data: {
        userId: user.id,
        firstName: student.firstName || firstName,
        lastName: student.lastName || lastName,
        preferredCountry: student.preferredCountry || countryName,
        countryId: student.countryId || countryRow?.id || null,
        contactId: student.contactId || assignedToId,
        sourceLeadId: student.sourceLeadId || lead.id,
      },
    });
  }

  if (countryRow?.id) {
    await seedStudentChecklists(student.id, countryRow.id);
  }

  let universityRecord =
    opts.universityId != null
      ? await prisma.university.findUnique({ where: { id: opts.universityId } })
      : null;

  if (!universityRecord && countryRow) {
    universityRecord = await pickUniversityForCountry(countryRow.id, opts.university || lead.preferredCourse);
  }

  const universityName = opts.university || universityRecord?.name || lead.preferredCourse || 'TBD';
  const course = opts.course || lead.preferredCourse || 'General';

  let application = await prisma.application.findFirst({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!application) {
    application = await createApplication({
      studentId: student.id,
      country: countryName,
      university: universityName,
      course,
      intake: opts.intake,
      assignedToId: assignedToId || undefined,
    });
  }

  if (universityRecord) {
    await prisma.studentUniversity.upsert({
      where: {
        studentId_universityId: { studentId: student.id, universityId: universityRecord.id },
      },
      create: {
        studentId: student.id,
        universityId: universityRecord.id,
        isSelected: true,
        status: 'Application Processing',
      },
      update: { isSelected: true },
    });
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: 'CONVERTED',
      studentUserId: user.id,
      isStudentLoginCreated: true,
    },
  });

  if (assignedToId) {
    await safeNotify({
      recipientId: assignedToId,
      templateKey: 'lead.converted',
      vars: {
        studentName: student.fullName,
        country: countryName,
        applicationId: application?.id,
      },
    });
  }

  try {
    const { linkReferralsForConvertedLead } = await import(
      '../agency-crm/agency-referral.service.js'
    );
    if (application?.id) {
      await linkReferralsForConvertedLead(leadId, student.id, application.id);
    }
  } catch (err) {
    console.warn('[Agency CRM] referral link failed:', (err as Error)?.message);
  }

  return {
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    student: await getStudent(student.id),
    application,
    tempPassword,
  };
};

export const listPromotableLeads = async () => {
  const leads = await prisma.lead.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      assignedCounsellor: { select: { id: true, fullName: true } },
      studentUser: { select: { id: true, email: true } },
    },
  });

  const studentEmails = new Set(
    (await prisma.student.findMany({ select: { email: true, userId: true } })).map((s) => s.email)
  );

  return leads.map((lead) => ({
    id: lead.id,
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    preferredCountry: lead.preferredCountry,
    preferredCourse: lead.preferredCourse,
    status: lead.status,
    isStudentLoginCreated: lead.isStudentLoginCreated,
    studentUserId: lead.studentUserId,
    hasStudentProfile: studentEmails.has(lead.email),
    assignedCounsellor: lead.assignedCounsellor,
  }));
};

export const promoteAllLeads = async (password?: string, actingUserId?: number) => {
  const leads = await prisma.lead.findMany({
    where: { deletedAt: null, email: { not: '' } },
    orderBy: { id: 'asc' },
  });

  const results: Array<{ leadId: number; email: string; ok: boolean; error?: string; tempPassword?: string }> = [];

  for (const lead of leads) {
    try {
      const studentExists = await prisma.student.findUnique({ where: { email: lead.email } });
      const hasLogin = lead.isStudentLoginCreated || lead.studentUserId;
      if (studentExists?.userId && hasLogin && lead.status === 'CONVERTED') {
        results.push({ leadId: lead.id, email: lead.email, ok: true });
        continue;
      }
      const out = await promoteLeadToStudent(lead.id, { password }, actingUserId);
      results.push({
        leadId: lead.id,
        email: lead.email,
        ok: true,
        tempPassword: out.tempPassword,
      });
    } catch (err: any) {
      results.push({ leadId: lead.id, email: lead.email, ok: false, error: err?.message || 'failed' });
    }
  }

  return results;
};

// -------------------- Checklist templates (admin) --------------------

export const listChecklistTemplates = async () =>
  prisma.documentChecklistTemplate.findMany({ orderBy: [{ country: 'asc' }, { university: 'asc' }] });

export const createChecklistTemplate = async (data: {
  country: string;
  university?: string | null;
  documents: ChecklistItem[];
}) =>
  prisma.documentChecklistTemplate.create({
    data: {
      country: data.country,
      university: data.university || null,
      documents: data.documents as any,
    },
  });

export const updateChecklistTemplate = async (
  id: number,
  data: Partial<{ country: string; university: string | null; documents: ChecklistItem[] }>
) => {
  const payload: Record<string, unknown> = {};
  if (data.country) payload.country = data.country;
  if ('university' in data) payload.university = data.university || null;
  if (data.documents) payload.documents = data.documents;
  return prisma.documentChecklistTemplate.update({ where: { id }, data: payload as any });
};

export const deleteChecklistTemplate = async (id: number) =>
  prisma.documentChecklistTemplate.delete({ where: { id } });

export const resolveChecklistForCountry = async (country: string, university?: string) => {
  let items: ChecklistItem[] | null = null;
  if (university) {
    const tpl = await prisma.documentChecklistTemplate.findFirst({
      where: { country, university },
    });
    if (tpl?.documents) items = Array.isArray(tpl.documents) ? (tpl.documents as any) : null;
  }
  if (!items) {
    const fallback = await prisma.documentChecklistTemplate.findFirst({
      where: { country, university: null },
    });
    if (fallback?.documents) items = Array.isArray(fallback.documents) ? (fallback.documents as any) : null;
  }
  return items || getDefaultChecklist(country);
};

// -------------------- Visa management (aggregate) --------------------

export const listVisaTracking = async (actor?: Actor) => {
  const scope = applicationScopeWhere(actor);
  return prisma.visaTracking.findMany({
    where: { application: scope },
    orderBy: { updatedAt: 'desc' },
    include: {
      application: {
        select: {
          id: true,
          applicationCode: true,
          university: true,
          course: true,
          country: true,
          stage: true,
          student: { select: { id: true, fullName: true, email: true } },
          assignedTo: { select: { id: true, fullName: true } },
        },
      },
    },
  });
};

export const appendVisaDocumentFile = async (
  applicationId: number,
  entry: { fileUrl: string; filename: string; label?: string }
) => {
  const existing = await prisma.visaTracking.findUnique({ where: { applicationId } });
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app) throw new Error('application not found');

  const docEntry = {
    fileUrl: entry.fileUrl,
    filename: entry.filename,
    uploadedAt: new Date().toISOString(),
    ...(entry.label ? { label: entry.label } : {}),
  };
  const documents = appendVisaDocument(existing?.documents, docEntry);

  return upsertVisaTracking(applicationId, {
    country: existing?.country || app.country,
    documents,
  });
};

export const getProcessStages = (country?: string | null) => ({
  stages: getStagesForCountry(country),
  visaWorkflow: getVisaWorkflowForCountry(country),
});

export { getStagesForCountry, getVisaWorkflowForCountry, normalizeVisaDocuments };
