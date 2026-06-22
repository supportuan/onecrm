import { Router } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { isSuperAdmin } from './super-admin.middleware.js';
import { MODULE_CATALOG } from '../rbac/rbac.constants.js';
import { sendSuccess } from '../../utils/response.js';
import * as ctrl from './super-admin.controller.js';

const router = Router();

// Every super-admin route requires a valid JWT + SUPER_ADMIN role.
router.use(authenticateToken, isSuperAdmin);

// Expose the catalog so the onboarding UI can render module checkboxes.
router.get('/catalog/modules', (_req, res) => {
  sendSuccess(res, 'Module catalog', MODULE_CATALOG);
});

router.get('/tenants', ctrl.list);
router.post('/tenants', ctrl.create);
router.get('/tenants/:id', ctrl.get);
router.patch('/tenants/:id', ctrl.update);
router.patch('/tenants/:id/modules', ctrl.setModules);
router.post('/tenants/:id/admin/reset-password', ctrl.resetAdminPassword);
router.get('/audit', ctrl.listAudits);

export default router;
