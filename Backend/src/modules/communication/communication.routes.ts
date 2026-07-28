import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import { sendError } from '../../utils/response.js';
import * as controller from './communication.controller.js';

const router = Router();

router.use(authenticateToken);

const staffOnly =
  (...staffPerms: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === 'STUDENT') {
      return sendError(res, 'Forbidden', null, 403);
    }
    return requirePermission(...staffPerms)(req, res, next);
  };

const studentOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'STUDENT') {
    return sendError(res, 'Student access only', null, 403);
  }
  return next();
};

router.get(
  '/conversations',
  staffOnly('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'),
  controller.listConversations
);

router.get(
  '/students/:studentId/messages',
  staffOnly('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'),
  controller.getStudentThread
);

router.post(
  '/students/:studentId/messages',
  staffOnly('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'),
  controller.sendStudentMessage
);

router.get('/me/messages', studentOnly, controller.getMyThread);
router.post('/me/messages', studentOnly, controller.sendMyMessage);

export default router;
