import { Router } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import * as controller from './student-crm.controller.js';

const router = Router();

router.use(authenticateToken);

// All read endpoints — VIEW_STUDENT_CRM (or MANAGE_STUDENT_CRM which is a stronger permission).
const view = requirePermission('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM');
const manage = requirePermission('MANAGE_STUDENT_CRM');

// Statistics
router.get('/statistics', view, controller.getStatistics);

// Students
router.get('/students/me', view, controller.getMyStudent);
router.put('/students/me', manage, controller.updateMyStudent);
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
router.delete('/applications/:id/documents/:docId', manage, controller.deleteDocument);
router.post('/applications/:id/notify-missing-docs', manage, controller.notifyMissing);

// Offer / visa
router.put('/applications/:id/offer', manage, controller.upsertOffer);
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
