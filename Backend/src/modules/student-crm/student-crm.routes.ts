import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import * as controller from './student-crm.controller.js';
import { applicationDocUpload, profilePhotoUpload } from './student-crm.upload.js';

const router = Router();

router.use(authenticateToken);

const view = requirePermission('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM');
const manage = requirePermission('MANAGE_STUDENT_CRM');

/** Students may access their own portal endpoints without staff CRM permissions */
const studentSelfOr =
  (...perms: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === 'STUDENT') return next();
    return requirePermission(...perms)(req, res, next);
  };

/** Agents may attach documents for their referred students. */
const agentOrManageStudentWrite = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (role === UserRole.AGENT || role === UserRole.AGENCY_FREELANCER) {
    return requirePermission('VIEW_AGENCY_CRM')(req, res, next);
  }
  return requirePermission('MANAGE_STUDENT_CRM')(req, res, next);
};

/** Students, agents (referred students), or counsellors may upload application documents. */
const studentAgentOrManageDocumentUpload = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === 'STUDENT') return next();
  if (req.user?.role === UserRole.AGENT || req.user?.role === UserRole.AGENCY_FREELANCER) {
    return requirePermission('VIEW_AGENCY_CRM')(req, res, next);
  }
  return requirePermission('MANAGE_STUDENT_CRM')(req, res, next);
};

// Statistics
router.get('/statistics', view, controller.getStatistics);

// Students — self-service portal
router.get('/students/me', studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'), controller.getMyStudent);
router.put('/students/me', studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'), controller.updateMyStudent);
router.post(
  '/students/me/profile-photo',
  studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'),
  profilePhotoUpload.single('file'),
  controller.uploadMyProfilePhoto,
);
router.get('/applications/me', studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'), controller.listMyApplications);
router.get('/form-options', studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'), controller.getFormOptions);
router.get('/students', view, controller.listStudents);
router.get('/students/:id', view, controller.getStudent);
router.post('/students', manage, controller.createStudent);
router.put('/students/:id', manage, controller.updateStudent);
router.patch('/students/:id/status', manage, controller.patchStatus);
router.patch('/students/:id/enrolled', manage, controller.setEnrolled);

// Student checklists & universities
router.get('/students/:id/checklists', view, controller.listChecklists);
router.put('/students/:id/checklists/:checkListId', manage, controller.updateChecklistValue);
router.get('/students/:id/universities', view, controller.listUniversities);
router.put('/students/:id/universities', manage, controller.upsertUniversity);
router.delete('/students/:id/universities/:universityId', manage, controller.removeUniversity);

// Student study plans (destination + university + course groupings)
router.get('/students/:id/study-plans', view, controller.listStudyPlans);
router.post('/students/:id/study-plans', manage, controller.createStudyPlan);
router.put('/students/:id/study-plans/:planId', manage, controller.updateStudyPlan);
router.delete('/students/:id/study-plans/:planId', manage, controller.removeStudyPlan);

// Applications — list/get
router.get('/applications', view, controller.listApplications);
router.get('/applications/:id', studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'), controller.getApplication);

// Applications — write
router.post('/applications', manage, controller.createApplication);
router.post('/applications/bulk-assign', manage, controller.bulkAssignApplications);
router.put('/applications/:id', manage, controller.updateApplication);
router.post('/applications/:id/advance', manage, controller.advanceStage);

// Application documents
router.post('/applications/:id/documents', agentOrManageStudentWrite, controller.upsertDocument);
router.put('/applications/:id/documents/:docId', agentOrManageStudentWrite, controller.upsertDocument);
router.post(
  '/applications/:id/documents/:docId/upload',
  studentAgentOrManageDocumentUpload,
  applicationDocUpload.single('file'),
  controller.uploadApplicationDocument,
);
router.delete('/applications/:id/documents/:docId', manage, controller.deleteDocument);
router.post('/applications/:id/notify-missing-docs', manage, controller.notifyMissing);

// Offer / visa
router.put('/applications/:id/offer', manage, controller.upsertOffer);
router.post(
  '/applications/:id/offer/upload',
  manage,
  applicationDocUpload.single('file'),
  controller.uploadOfferLetter,
);
router.put('/applications/:id/visa', manage, controller.upsertVisa);
router.post(
  '/applications/:id/visa/upload',
  manage,
  applicationDocUpload.single('file'),
  controller.uploadVisaDocument,
);

// Checklist defaults (used by UI before docs exist)
router.get('/checklist', view, controller.getChecklist);
router.get('/process-stages', studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'), controller.getProcessStages);

// Checklist template admin
router.get('/checklist-templates', view, controller.listChecklistTemplates);
router.post('/checklist-templates', manage, controller.createChecklistTemplate);
router.put('/checklist-templates/:id', manage, controller.updateChecklistTemplate);
router.delete('/checklist-templates/:id', manage, controller.deleteChecklistTemplate);

// Visa aggregate view
router.get('/visa-tracking', view, controller.listVisaTracking);

// Student offer decision
router.post(
  '/applications/:id/offer/decision',
  studentSelfOr('MANAGE_STUDENT_CRM'),
  controller.studentOfferDecision,
);

// Payments & readiness
router.get(
  '/applications/:id/readiness',
  studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'),
  controller.getApplicationReadinessHandler,
);
router.get(
  '/applications/:id/fees',
  studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'),
  controller.listApplicationFeesHandler,
);
router.post('/applications/:id/fees', manage, controller.upsertApplicationFeeHandler);
router.get('/payments/me', studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'), controller.listMyPaymentsHandler);
router.get(
  '/payments/:id/receipt',
  studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'),
  controller.getPaymentReceiptHandler,
);
router.post(
  '/applications/:id/payments/create-order',
  studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'),
  controller.createPaymentOrderHandler,
);
router.post(
  '/applications/:id/payments/verify',
  studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'),
  controller.verifyPaymentHandler,
);

// Lead → Application bridge (Phase 2)
router.post('/applications/from-lead/:leadId', manage, controller.createFromLead);

// Lead → student login + profile + application
router.get('/leads/promotable', view, controller.listPromotableLeads);
router.post('/leads/promote-all', manage, controller.promoteAllLeads);
router.post('/leads/:leadId/promote', manage, controller.promoteLead);

export default router;
