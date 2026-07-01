import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import * as controller from './student-crm.controller.js';
import { applicationDocUpload } from './student-crm.upload.js';

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

// Statistics
router.get('/statistics', view, controller.getStatistics);

// Students — self-service portal
router.get('/students/me', studentSelfOr('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM'), controller.getMyStudent);
router.put('/students/me', studentSelfOr('MANAGE_STUDENT_CRM'), controller.updateMyStudent);
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

// Applications — list/get
router.get('/applications', view, controller.listApplications);
router.get('/applications/:id', view, controller.getApplication);

// Applications — write
router.post('/applications', manage, controller.createApplication);
router.put('/applications/:id', manage, controller.updateApplication);
router.post('/applications/:id/advance', manage, controller.advanceStage);

// Application documents
router.post('/applications/:id/documents', manage, controller.upsertDocument);
router.put('/applications/:id/documents/:docId', manage, controller.upsertDocument);
router.post(
  '/applications/:id/documents/:docId/upload',
  studentSelfOr('MANAGE_STUDENT_CRM'),
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

// Checklist defaults (used by UI before docs exist)
router.get('/checklist', view, controller.getChecklist);

// Lead → Application bridge (Phase 2)
router.post('/applications/from-lead/:leadId', manage, controller.createFromLead);

// Lead → student login + profile + application
router.get('/leads/promotable', view, controller.listPromotableLeads);
router.post('/leads/promote-all', manage, controller.promoteAllLeads);
router.post('/leads/:leadId/promote', manage, controller.promoteLead);

export default router;
