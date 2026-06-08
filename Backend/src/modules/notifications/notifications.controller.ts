import { Request, Response, NextFunction } from 'express';
import { sendError, sendSuccess } from '../../utils/response.js';
import {
  listForUser,
  unreadCountForUser,
  markRead,
  markAllRead,
  deleteForUser,
  notify,
} from './notifications.service.js';
import { listTemplateKeys } from './templates.js';

/** GET /api/notifications */
export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 'unauthorized', null, 401);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const unreadOnly = req.query.unreadOnly === 'true';
    const items = await listForUser(userId, { limit, unreadOnly });
    return sendSuccess(res, 'notifications fetched', items);
  } catch (err) {
    next(err);
  }
};

/** GET /api/notifications/unread-count */
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 'unauthorized', null, 401);
    const count = await unreadCountForUser(userId);
    return sendSuccess(res, 'unread count', { count });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/notifications/:id/read */
export const markNotificationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 'unauthorized', null, 401);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, 'invalid id', null, 400);
    const updated = await markRead(userId, id);
    if (!updated) return sendError(res, 'not found', null, 404);
    return sendSuccess(res, 'marked read', updated);
  } catch (err) {
    next(err);
  }
};

/** PUT /api/notifications/read-all */
export const markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 'unauthorized', null, 401);
    const result = await markAllRead(userId);
    return sendSuccess(res, 'all marked read', { updated: result.count });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/notifications/:id */
export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 'unauthorized', null, 401);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, 'invalid id', null, 400);
    const removed = await deleteForUser(userId, id);
    if (!removed) return sendError(res, 'not found', null, 404);
    return sendSuccess(res, 'deleted', { id });
  } catch (err) {
    next(err);
  }
};

// -------------------- Admin --------------------

/** GET /api/notifications/admin/templates */
export const listTemplates = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, 'templates', listTemplateKeys());
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/admin/test
 * body: { recipientId, templateKey, vars, channels }
 */
export const sendTestNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipientId, templateKey, vars, channels } = req.body || {};
    if (!recipientId || !templateKey) {
      return sendError(res, 'recipientId and templateKey are required', null, 400);
    }
    const result = await notify({ recipientId, templateKey, vars, channels });
    return sendSuccess(res, 'dispatched', result);
  } catch (err: any) {
    next(err);
  }
};
