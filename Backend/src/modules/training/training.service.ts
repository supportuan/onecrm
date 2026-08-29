import { Prisma, TrainingCourseCategory, TrainingEnrollmentStatus, UserRole } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { normalizeTargetRoles, roleMatchesAudience } from '../resources/resources.audience.js';
import { TrainingError } from './training-errors.js';
import { listMyBatches } from './training-classes.js';

export { TrainingError } from './training-errors.js';

const CATEGORIES = new Set<string>(Object.values(TrainingCourseCategory));
const STAFF_ROLES = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.GLOBAL_ADMIN,
  UserRole.HR,
  UserRole.COUNSELLOR,
  UserRole.MARKETING_MANAGER,
  UserRole.TELECALLER,
]);
const userSelect = { id: true, fullName: true, email: true, role: true } as const;
const lessonOrder = [{ sortOrder: 'asc' as const }, { id: 'asc' as const }];

const notFound = (what: string): never => {
  throw new TrainingError(`${what} not found`, 404);
};

const asInt = (raw: unknown): number | null => {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export const parseCategory = (raw: unknown): TrainingCourseCategory => {
  const value = String(raw || 'ONBOARDING').toUpperCase();
  if (!CATEGORIES.has(value)) throw new TrainingError('Invalid course category');
  return value as TrainingCourseCategory;
};

const percent = (completed: number, total: number) =>
  total <= 0 ? 0 : Math.round((completed / total) * 100);

const withProgress = (row: {
  status: TrainingEnrollmentStatus;
  completedAt: Date | null;
  progress: { lessonId: number }[];
  course: { lessons: { id: number }[] };
}) => {
  const totalLessons = row.course.lessons.length;
  const completedLessons = row.progress.length;
  return {
    status: row.status,
    completedAt: row.completedAt,
    completedLessons,
    totalLessons,
    percent: percent(completedLessons, totalLessons),
    completedLessonIds: row.progress.map((item) => item.lessonId),
  };
};

export const listDashboard = async (actor: { userId: number; role: UserRole }) => {
  const [enrollments, published, myClasses] = await Promise.all([
    prisma.trainingEnrollment.findMany({
      where: { userId: actor.userId, course: { deletedAt: null } },
      include: {
        course: { include: { lessons: { select: { id: true }, orderBy: lessonOrder } } },
        progress: { select: { lessonId: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    }),
    prisma.trainingCourse.findMany({
      where: { deletedAt: null, isPublished: true },
      include: { _count: { select: { lessons: true, enrollments: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    listMyBatches(actor),
  ]);

  const enrolledIds = new Set(enrollments.map((row) => row.courseId));
  return {
    myClasses,
    myCourses: enrollments.map((row) => ({
      ...row.course,
      enrollment: withProgress(row),
    })),
    catalog: published
      .filter((course) => roleMatchesAudience(actor.role, course.targetRoles) && !enrolledIds.has(course.id))
      .map((course) => ({ ...course, enrollment: null })),
  };
};

export const getCourseForUser = async (actor: { userId: number; role: UserRole }, courseId: number) => {
  const course = await prisma.trainingCourse.findFirst({
    where: { id: courseId, deletedAt: null },
    include: {
      lessons: { orderBy: lessonOrder },
      createdBy: { select: userSelect },
    },
  });
  if (!course) return notFound('Course');

  const enrollment = await prisma.trainingEnrollment.findUnique({
    where: { courseId_userId: { courseId, userId: actor.userId } },
    include: {
      progress: { select: { lessonId: true, completedAt: true } },
      course: { include: { lessons: { select: { id: true } } } },
    },
  });

  if (!enrollment && (!course.isPublished || !roleMatchesAudience(actor.role, course.targetRoles))) {
    throw new TrainingError('Course is not available', 403);
  }

  return {
    ...course,
    enrollment: enrollment ? withProgress(enrollment) : null,
  };
};

export const enrollSelf = async (actor: { userId: number; role: UserRole }, courseId: number) => {
  const course = await prisma.trainingCourse.findFirst({ where: { id: courseId, deletedAt: null } });
  if (!course) return notFound('Course');
  if (!course.isPublished || !roleMatchesAudience(actor.role, course.targetRoles)) {
    throw new TrainingError('Course is not available', 403);
  }

  await prisma.trainingEnrollment.upsert({
    where: { courseId_userId: { courseId, userId: actor.userId } },
    update: {},
    create: { courseId, userId: actor.userId, status: 'NOT_STARTED' },
  });
  return getCourseForUser(actor, courseId);
};

const refreshEnrollmentStatus = async (enrollmentId: number) => {
  const enrollment = await prisma.trainingEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      progress: true,
      course: { include: { lessons: { select: { id: true } } } },
    },
  });
  if (!enrollment) return null;

  const total = enrollment.course.lessons.length;
  const completed = enrollment.progress.length;
  let status: TrainingEnrollmentStatus = 'NOT_STARTED';
  let completedAt: Date | null = null;
  if (total > 0 && completed >= total) {
    status = 'COMPLETED';
    completedAt = enrollment.completedAt ?? new Date();
  } else if (completed > 0) {
    status = 'IN_PROGRESS';
  }

  return prisma.trainingEnrollment.update({
    where: { id: enrollmentId },
    data: { status, completedAt },
  });
};

export const completeLesson = async (actor: { userId: number; role: UserRole }, lessonId: number) => {
  const lesson = await prisma.trainingLesson.findUnique({
    where: { id: lessonId },
    include: { course: true },
  });
  if (!lesson || lesson.course.deletedAt) return notFound('Lesson');

  let enrollment = await prisma.trainingEnrollment.findUnique({
    where: { courseId_userId: { courseId: lesson.courseId, userId: actor.userId } },
  });
  if (!enrollment) {
    if (!lesson.course.isPublished || !roleMatchesAudience(actor.role, lesson.course.targetRoles)) {
      throw new TrainingError('Enroll in this course first', 403);
    }
    enrollment = await prisma.trainingEnrollment.create({
      data: { courseId: lesson.courseId, userId: actor.userId, status: 'IN_PROGRESS' },
    });
  }

  await prisma.trainingLessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    update: {},
    create: { enrollmentId: enrollment.id, lessonId, userId: actor.userId },
  });

  await refreshEnrollmentStatus(enrollment.id);
  return getCourseForUser(actor, lesson.courseId);
};

export const listAdminCourses = async () =>
  prisma.trainingCourse.findMany({
    where: { deletedAt: null },
    include: {
      createdBy: { select: userSelect },
      _count: { select: { lessons: true, enrollments: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

export const createCourse = async (
  actor: { userId: number },
  body: {
    title?: string;
    description?: string;
    category?: unknown;
    targetRoles?: unknown;
    isPublished?: boolean;
  },
) => {
  const title = String(body.title || '').trim();
  if (title.length < 2) throw new TrainingError('Title is required');

  return prisma.trainingCourse.create({
    data: {
      title,
      description: body.description ? String(body.description) : null,
      category: parseCategory(body.category),
      targetRoles: normalizeTargetRoles(body.targetRoles ? body.targetRoles : ['ALL']) as Prisma.InputJsonValue,
      isPublished: Boolean(body.isPublished),
      createdById: actor.userId,
    },
    include: { lessons: true, createdBy: { select: userSelect } },
  });
};

export const updateCourse = async (
  courseId: number,
  body: {
    title?: string;
    description?: string | null;
    category?: unknown;
    targetRoles?: unknown;
    isPublished?: boolean;
  },
) => {
  const existing = await prisma.trainingCourse.findFirst({ where: { id: courseId, deletedAt: null } });
  if (!existing) return notFound('Course');

  const data: Prisma.TrainingCourseUpdateInput = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length < 2) throw new TrainingError('Title is required');
    data.title = title;
  }
  if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
  if (body.category !== undefined) data.category = parseCategory(body.category);
  if (body.targetRoles !== undefined) {
    data.targetRoles = normalizeTargetRoles(body.targetRoles) as Prisma.InputJsonValue;
  }
  if (body.isPublished !== undefined) data.isPublished = Boolean(body.isPublished);

  return prisma.trainingCourse.update({
    where: { id: courseId },
    data,
    include: {
      lessons: { orderBy: lessonOrder },
      createdBy: { select: userSelect },
      _count: { select: { lessons: true, enrollments: true } },
    },
  });
};

export const deleteCourse = async (courseId: number) => {
  const existing = await prisma.trainingCourse.findFirst({ where: { id: courseId, deletedAt: null } });
  if (!existing) return notFound('Course');
  await prisma.trainingCourse.update({
    where: { id: courseId },
    data: { deletedAt: new Date(), isPublished: false },
  });
  return { id: courseId };
};

export const addLesson = async (
  courseId: number,
  body: { title?: string; content?: string; videoUrl?: string; durationMin?: unknown; sortOrder?: unknown },
) => {
  const existing = await prisma.trainingCourse.findFirst({ where: { id: courseId, deletedAt: null } });
  if (!existing) return notFound('Course');
  const title = String(body.title || '').trim();
  if (title.length < 2) throw new TrainingError('Lesson title is required');

  const last = await prisma.trainingLesson.findFirst({
    where: { courseId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  return prisma.trainingLesson.create({
    data: {
      courseId,
      title,
      content: body.content ? String(body.content) : null,
      videoUrl: body.videoUrl ? String(body.videoUrl) : null,
      durationMin: asInt(body.durationMin),
      sortOrder: asInt(body.sortOrder) ?? (last ? last.sortOrder + 1 : 0),
    },
  });
};

export const updateLesson = async (
  lessonId: number,
  body: {
    title?: string;
    content?: string | null;
    videoUrl?: string | null;
    durationMin?: unknown;
    sortOrder?: unknown;
  },
) => {
  const lesson = await prisma.trainingLesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return notFound('Lesson');

  const data: Prisma.TrainingLessonUpdateInput = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length < 2) throw new TrainingError('Lesson title is required');
    data.title = title;
  }
  if (body.content !== undefined) data.content = body.content ? String(body.content) : null;
  if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl ? String(body.videoUrl) : null;
  if (body.durationMin !== undefined) data.durationMin = asInt(body.durationMin);
  if (body.sortOrder !== undefined) {
    const order = asInt(body.sortOrder);
    if (order !== null) data.sortOrder = order;
  }

  return prisma.trainingLesson.update({ where: { id: lessonId }, data });
};

export const deleteLesson = async (lessonId: number) => {
  const lesson = await prisma.trainingLesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return notFound('Lesson');
  await prisma.trainingLesson.delete({ where: { id: lessonId } });
  const enrollments = await prisma.trainingEnrollment.findMany({
    where: { courseId: lesson.courseId },
    select: { id: true },
  });
  await Promise.all(enrollments.map((row) => refreshEnrollmentStatus(row.id)));
  return { id: lessonId };
};

export const listEnrollments = async (courseId: number) => {
  const existing = await prisma.trainingCourse.findFirst({ where: { id: courseId, deletedAt: null } });
  if (!existing) return notFound('Course');

  const rows = await prisma.trainingEnrollment.findMany({
    where: { courseId },
    include: {
      user: { select: userSelect },
      progress: { select: { lessonId: true } },
      course: { include: { lessons: { select: { id: true } } } },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  return rows.map((row) => ({
    id: row.id,
    user: row.user,
    enrolledAt: row.enrolledAt,
    ...withProgress(row),
  }));
};

export const assignEnrollment = async (actor: { userId: number }, courseId: number, userId: number) => {
  const [course, user] = await Promise.all([
    prisma.trainingCourse.findFirst({ where: { id: courseId, deletedAt: null } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true } }),
  ]);
  if (!course) return notFound('Course');
  if (!user || !user.isActive) return notFound('User');

  return prisma.trainingEnrollment.upsert({
    where: { courseId_userId: { courseId, userId } },
    update: {},
    create: {
      courseId,
      userId,
      assignedById: actor.userId,
      status: 'NOT_STARTED',
    },
  });
};

export const removeEnrollment = async (enrollmentId: number) => {
  const existing = await prisma.trainingEnrollment.findUnique({ where: { id: enrollmentId } });
  if (!existing) return notFound('Enrollment');
  await prisma.trainingEnrollment.delete({ where: { id: enrollmentId } });
  return { id: enrollmentId };
};

export const listAssignableUsers = async (q?: string, audience?: string) => {
  const query = String(q || '').trim();
  const kind = String(audience || '').toUpperCase();
  const roleFilter =
    kind === 'STUDENT'
      ? { role: UserRole.STUDENT }
      : kind === 'STAFF' || kind === 'TRAINER'
        ? { role: { in: [...STAFF_ROLES] } }
        : {};

  return prisma.user.findMany({
    where: {
      isActive: true,
      ...roleFilter,
      ...(query
        ? {
            OR: [
              { fullName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: userSelect,
    orderBy: { fullName: 'asc' },
    take: 50,
  });
};
