import { Router } from 'express';
import { authenticateToken } from '../../middleware/authenticate.js';
import { requirePermission } from '../rbac/rbac.middleware.js';
import * as controller from './crm-settings.controller.js';

const router = Router();
router.use(authenticateToken);

const view = requirePermission('VIEW_STUDENT_CRM', 'MANAGE_STUDENT_CRM');
const manage = requirePermission('MANAGE_STUDENT_CRM');

router.get('/form-options', view, controller.getFormOptions);
router.get('/countries', view, controller.listCountries);
router.post('/countries', manage, controller.createCountry);
router.put('/countries/:id', manage, controller.updateCountry);
router.delete('/countries/:id', manage, controller.deleteCountry);

router.get('/industries', view, controller.listIndustries);
router.get('/industries/sub-fields', view, controller.listIndustrySubFields);
router.post('/industries', manage, controller.createIndustry);
router.post('/industries/:industryId/sub-industries', manage, controller.createSubIndustry);
router.post('/study-areas', manage, controller.createStudyArea);

router.get('/universities', view, controller.listUniversities);
router.post('/universities', manage, controller.createUniversity);
router.post('/universities/find-or-create', view, controller.findOrCreateUniversity);
router.put('/universities/:id', manage, controller.updateUniversity);
router.delete('/universities/:id', manage, controller.deleteUniversity);

router.get('/catalog/stats', view, controller.getCatalogStats);
router.get('/catalog', view, controller.listCatalog);
router.get('/courses', view, controller.listCourses);
router.post('/courses', view, controller.findOrCreateCourse);

export default router;
