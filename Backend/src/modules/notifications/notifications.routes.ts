import { Router } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import * as controller from './notifications.controller.js';

const router = Router();

// Every notifications route requires auth.
router.use(authenticateToken);

// -------- My inbox / bell --------
router.get('/', controller.getMyNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.put('/read-all', controller.markAllNotificationsRead);
router.put('/:id/read', controller.markNotificationRead);
router.delete('/:id', controller.deleteNotification);

// -------- Admin --------
router.get('/admin/templates', requirePermission('MANAGE_ADMINS'), controller.listTemplates);
router.post('/admin/test', requirePermission('MANAGE_ADMINS'), controller.sendTestNotification);

export default router;
