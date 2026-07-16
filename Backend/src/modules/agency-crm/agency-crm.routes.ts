import { Router } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import * as controller from './agency-crm.controller.js';
import { agencyDocUpload } from './agency.upload.js';

const router = Router();

router.use(authenticateToken);

const view = requirePermission('VIEW_AGENCY_CRM', 'MANAGE_AGENCY_CRM');
const manage = requirePermission('MANAGE_AGENCY_CRM');

router.get('/statistics', view, controller.getStatistics);

router.get('/partners', view, controller.listPartners);
router.get('/partners/me', view, controller.getMyPartner);
router.post('/partners/provision', view, controller.provisionMyPartner);
router.get('/partners/:id', view, controller.getPartner);
router.post('/partners', manage, controller.createPartner);
router.put('/partners/:id', view, controller.updatePartner);
router.post('/partners/:id/onboarding', manage, controller.advanceOnboarding);
router.post('/partners/:id/sign-agreement', view, controller.signAgreement);
router.post('/partners/:id/submit-docs', view, controller.submitOnboardingDocs);
router.put('/partners/:id/status', manage, controller.updatePartnerStatus);

router.get('/partners/:id/documents', view, controller.getDocuments);
router.post(
  '/partners/:id/documents/upload',
  view,
  agencyDocUpload.single('file'),
  controller.uploadDocument
);
router.put('/partners/:id/documents/:docId/verify', manage, controller.verifyDocumentHandler);
router.delete('/partners/:id/documents/:docId', view, controller.removeDocument);

router.get('/partners/:id/activities', view, controller.getActivities);
router.post('/partners/:id/activities', view, controller.addActivity);
router.post('/broadcasts', manage, controller.sendBroadcast);

router.get('/announcements', view, controller.listAnnouncementsHandler);
router.post('/announcements', manage, controller.createAnnouncementHandler);
router.post('/announcements/:id/read', view, controller.markAnnouncementReadHandler);

router.get('/leads', view, controller.listLeads);
router.get('/applications', view, controller.listApplications);
router.post('/referrals', view, controller.createReferral);
router.get('/university-contact', view, controller.getUniversityContactHandler);
router.get('/universities', view, controller.listUniversityDirectoryHandler);

router.get('/commissions', view, controller.listCommissions);
router.get('/commissions/statement', view, controller.commissionStatement);
router.post('/commissions', manage, controller.createCommission);
router.put('/commissions/:id', manage, controller.updateCommission);
router.post('/commissions/:id/verify', manage, controller.verifyCommissionHandler);

router.get('/payouts', manage, controller.listPayoutsHandler);
router.get('/payouts/:id', manage, controller.getPayoutHandler);
router.post('/payouts', manage, controller.createPayoutHandler);
router.put('/payouts/:id/status', manage, controller.updatePayoutStatusHandler);

router.get('/commission-rules', view, controller.getCommissionRules);
router.post('/commission-rules', manage, controller.saveCommissionRule);
router.delete('/commission-rules/:id', manage, controller.removeCommissionRule);

router.post(
  '/applications/:applicationId/payments/create-order',
  view,
  controller.createAgentPaymentOrderHandler
);
router.post(
  '/applications/:applicationId/payments/verify',
  view,
  controller.verifyAgentPaymentHandler
);

export default router;
