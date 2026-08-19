import { Router } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { isSuperAdmin } from './super-admin.middleware.js';
import { sendError } from '../../utils/response.js';

const router = Router();

router.use(authenticateToken, isSuperAdmin);

router.use((_req, res) => {
  sendError(
    res,
    'Multi-tenant administration has been removed. ApplyUniNow runs as a single organization.',
    null,
    410,
  );
});

export default router;
