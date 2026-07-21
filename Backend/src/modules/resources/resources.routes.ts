import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import { resourceUpload } from './resources.upload.js';
import * as controller from './resources.controller.js';

const router = Router();

router.use(authenticateToken);

const viewOrStudent = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === 'STUDENT') return next();
  return requirePermission('VIEW_RESOURCES', 'MANAGE_RESOURCES')(req, res, next);
};

router.get('/pending', viewOrStudent, controller.listPending);
router.get('/admin', requirePermission('MANAGE_RESOURCES'), controller.listAdmin);
router.post(
  '/admin',
  requirePermission('MANAGE_RESOURCES'),
  resourceUpload.single('file'),
  controller.create,
);
router.put(
  '/admin/:id',
  requirePermission('MANAGE_RESOURCES'),
  resourceUpload.single('file'),
  controller.update,
);
router.delete('/admin/:id', requirePermission('MANAGE_RESOURCES'), controller.remove);
router.get(
  '/admin/:id/acknowledgements',
  requirePermission('MANAGE_RESOURCES'),
  controller.listAcknowledgements,
);

router.get('/', viewOrStudent, controller.listForUser);
router.post('/:id/acknowledge', viewOrStudent, controller.acknowledge);

export default router;
