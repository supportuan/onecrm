import { prisma } from '../../prisma.js';
import { notify } from './notifications.service.js';

const TERMINAL_STAGES = new Set(['ENROLLED', 'OFFER_REJECTED']);

const OVERDUE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Notify assignees about applications whose deadline has passed.
 * Uses `application.task_overdue` with a 24h dedup window per application.
 */
export const checkOverdueApplications = async (): Promise<void> => {
  const now = new Date();
  const apps = await prisma.application.findMany({
    where: {
      deadline: { lt: now },
      assignedToId: { not: null },
      stage: { notIn: ['ENROLLED', 'OFFER_REJECTED'] },
    },
    include: { student: true },
  });

  for (const app of apps) {
    if (!app.assignedToId || !app.deadline) continue;
    if (TERMINAL_STAGES.has(app.stage)) continue;

    const recent = await prisma.notification.findFirst({
      where: {
        recipientId: app.assignedToId,
        templateKey: 'application.task_overdue',
        channel: 'IN_APP',
        createdAt: { gte: new Date(Date.now() - OVERDUE_COOLDOWN_MS) },
        vars: { path: ['applicationId'], equals: app.id },
      },
    });
    if (recent) continue;

    try {
      await notify({
        recipientId: app.assignedToId,
        templateKey: 'application.task_overdue',
        vars: {
          taskTitle: 'Application deadline',
          studentName: app.student.fullName,
          dueDate: app.deadline.toISOString().slice(0, 10),
          applicationId: app.id,
        },
      });
    } catch (_) {
      /* swallow */
    }
  }
};

const SCHEDULER_MS = 60 * 60 * 1000;

export const startNotificationScheduler = (): void => {
  const run = () => {
    checkOverdueApplications().catch((err) =>
      console.error('[NOTIFY/SCHEDULER] overdue check failed', err)
    );
  };
  run();
  setInterval(run, SCHEDULER_MS);
};
