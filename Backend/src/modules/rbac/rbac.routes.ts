import { Router } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from './rbac.middleware.js';
import {
  getPermissions,
  updatePermissions,
  resetPermissions,
} from './rbac.controller.js';

const router = Router();

router.use(authenticateToken);

// Any authenticated user can read the map (frontend needs it to render nav).
router.get('/permissions', getPermissions);

// Only roles with MANAGE_ADMINS (Super Admin by default) can change them.
router.put('/permissions/:role', requirePermission('MANAGE_ADMINS'), updatePermissions);
router.post('/permissions/reset', requirePermission('MANAGE_ADMINS'), resetPermissions);

export default router;
