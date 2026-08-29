import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import * as controller from './training.controller.js';

const router = Router();

router.use(authenticateToken);

const viewOrStudent = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === 'STUDENT') return next();
  return requirePermission('VIEW_TRAINING', 'MANAGE_TRAINING')(req, res, next);
};

router.get('/', viewOrStudent, controller.dashboard);
router.get('/admin/users', requirePermission('MANAGE_TRAINING'), controller.listUsers);
router.get('/admin/courses', requirePermission('MANAGE_TRAINING'), controller.listAdmin);
router.post('/admin/courses', requirePermission('MANAGE_TRAINING'), controller.createCourse);
router.put('/admin/courses/:id', requirePermission('MANAGE_TRAINING'), controller.updateCourse);
router.delete('/admin/courses/:id', requirePermission('MANAGE_TRAINING'), controller.removeCourse);
router.post('/admin/courses/:id/lessons', requirePermission('MANAGE_TRAINING'), controller.addLesson);
router.put('/admin/lessons/:id', requirePermission('MANAGE_TRAINING'), controller.updateLesson);
router.delete('/admin/lessons/:id', requirePermission('MANAGE_TRAINING'), controller.removeLesson);
router.get('/admin/courses/:id/enrollments', requirePermission('MANAGE_TRAINING'), controller.listEnrollments);
router.post('/admin/courses/:id/enroll', requirePermission('MANAGE_TRAINING'), controller.assignEnrollment);
router.delete('/admin/enrollments/:id', requirePermission('MANAGE_TRAINING'), controller.removeEnrollment);

router.get('/courses/:id', viewOrStudent, controller.getCourse);
router.post('/courses/:id/enroll', viewOrStudent, controller.enroll);
router.post('/lessons/:id/complete', viewOrStudent, controller.completeLesson);

export default router;
