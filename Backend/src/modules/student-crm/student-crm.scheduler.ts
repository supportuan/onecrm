import { prisma } from '../../prisma.js';
import { notify } from '../notifications/notifications.service.js';
import { getApplicationReadiness } from './application-gates.js';

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DEADLINE_WINDOW_DAYS = 3;
const TERMINAL_STAGES = new Set(['ENROLLED', 'OFFER_REJECTED']);

const recentNotification = async (
  recipientId: number,
  templateKey: string,
  applicationId: number
) =>
  prisma.notification.findFirst({
    where: {
      recipientId,
      templateKey,
      channel: 'IN_APP',
      createdAt: { gte: new Date(Date.now() - COOLDOWN_MS) },
      vars: { path: ['applicationId'], equals: applicationId },
    },
  });

/** Auto-notify students about required documents still pending. */
export const checkMissingDocuments = async (): Promise<void> => {
  const apps = await prisma.application.findMany({
    where: {
      stage: { in: ['DRAFT', 'DOCUMENTS_PENDING', 'SUBMITTED', 'UNDER_REVIEW'] },
    },
    include: { documents: true, student: true },
  });

  for (const app of apps) {
    if (!app.student?.userId) continue;
    const missing = app.documents
      .filter((d) => d.required && d.status === 'PENDING')
      .map((d) => d.name);
    if (missing.length === 0) continue;

    const recent = await recentNotification(
      app.student.userId,
      'application.document_missing_student',
      app.id
    );
    if (recent) continue;

    try {
      await notify({
        recipientId: app.student.userId,
        templateKey: 'application.document_missing_student',
        vars: {
          applicationCode: app.applicationCode,
          missing,
          applicationId: app.id,
        },
      });
    } catch {
      /* swallow */
    }
  }
};

/** Remind students when an application deadline is within the next few days. */
export const checkUpcomingDeadlines = async (): Promise<void> => {
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + DEADLINE_WINDOW_DAYS);

  const apps = await prisma.application.findMany({
    where: {
      deadline: { gte: now, lte: horizon },
      stage: { notIn: ['ENROLLED', 'OFFER_REJECTED'] },
    },
    include: { student: true },
  });

  for (const app of apps) {
    if (!app.student?.userId || !app.deadline) continue;
    if (TERMINAL_STAGES.has(app.stage)) continue;

    const recent = await recentNotification(
      app.student.userId,
      'application.deadline_reminder',
      app.id
    );
    if (recent) continue;

    try {
      await notify({
        recipientId: app.student.userId,
        templateKey: 'application.deadline_reminder',
        vars: {
          applicationCode: app.applicationCode,
          university: app.university,
          dueDate: app.deadline.toISOString().slice(0, 10),
          applicationId: app.id,
        },
      });
    } catch {
      /* swallow */
    }
  }
};

/** Remind students when documents are uploaded but fees remain unpaid. */
export const checkUnpaidFees = async (): Promise<void> => {
  const apps = await prisma.application.findMany({
    where: {
      stage: { in: ['DOCUMENTS_PENDING', 'DRAFT'] },
    },
    include: { student: true },
  });

  for (const app of apps) {
    if (!app.student?.userId) continue;
    const readiness = await getApplicationReadiness(app.id);
    if (!readiness?.canPay || readiness.feesPaid || readiness.unpaidFees.length === 0) continue;

    const recent = await recentNotification(
      app.student.userId,
      'application.payment_due_student',
      app.id,
    );
    if (recent) continue;

    const fee = readiness.unpaidFees[0];
    try {
      await notify({
        recipientId: app.student.userId,
        templateKey: 'application.payment_due_student',
        vars: {
          applicationCode: app.applicationCode,
          feeLabel: fee.label,
          amount: (fee.amountPaise / 100).toFixed(2),
          applicationId: app.id,
        },
      });
    } catch {
      /* swallow */
    }
  }
};

const SCHEDULER_MS = 60 * 60 * 1000;

export const startStudentCrmScheduler = (): void => {
  const run = () => {
    checkMissingDocuments().catch((err) =>
      console.error('[STUDENT-CRM/SCHEDULER] missing-docs check failed', err)
    );
    checkUpcomingDeadlines().catch((err) =>
      console.error('[STUDENT-CRM/SCHEDULER] deadline reminder failed', err)
    );
    checkUnpaidFees().catch((err) =>
      console.error('[STUDENT-CRM/SCHEDULER] unpaid-fee reminder failed', err)
    );
  };
  run();
  setInterval(run, SCHEDULER_MS);
};
