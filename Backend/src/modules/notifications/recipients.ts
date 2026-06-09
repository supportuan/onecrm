import { UserRole } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { notify, notifyMany } from './notifications.service.js';

/** Fire-and-forget helper — never throws. */
export const safeNotify = async (
  opts: Parameters<typeof notify>[0]
): Promise<void> => {
  try {
    await notify(opts);
  } catch (_) {
    /* swallow */
  }
};

export const getActiveUserIdsByRoles = async (roles: UserRole[]): Promise<number[]> => {
  const users = await prisma.user.findMany({
    where: { role: { in: roles }, isActive: true },
    select: { id: true },
  });
  return users.map((u) => u.id);
};

export const notifyRoles = async (
  roles: UserRole[],
  templateKey: string,
  vars?: Record<string, any>
): Promise<void> => {
  const ids = await getActiveUserIdsByRoles(roles);
  if (ids.length === 0) return;
  try {
    await notifyMany({ recipientIds: ids, templateKey, vars });
  } catch (_) {
    /* swallow */
  }
};
