import { Router } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import * as controller from './agency-crm.controller.js';

const router = Router();

router.use(authenticateToken);

const view = requirePermission('VIEW_AGENCY_CRM', 'MANAGE_AGENCY_CRM');
const manage = requirePermission('MANAGE_AGENCY_CRM');

router.get('/statistics', view, controller.getStatistics);

router.get('/partners', view, controller.listPartners);
router.get('/partners/me', view, controller.getMyPartner);
router.get('/partners/:id', view, controller.getPartner);
router.post('/partners', manage, controller.createPartner);
router.put('/partners/:id', view, controller.updatePartner);

router.get('/leads', view, controller.listLeads);
router.get('/applications', view, controller.listApplications);
router.post('/referrals', manage, controller.createReferral);

router.get('/commissions', view, controller.listCommissions);
router.post('/commissions', manage, controller.createCommission);
router.put('/commissions/:id', manage, controller.updateCommission);

export default router;
