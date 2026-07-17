import { Router } from 'express';
import * as controller from './hr.controller.js';
import { employeeDocUpload, recruitmentFileUpload } from './hr.upload.js';
import { requireHrAuth, requirePermission } from './hr.auth.js';

const router = Router();

router.use(requireHrAuth);

// Employees & team
router.get('/employees', requirePermission('VIEW_ALL_EMPLOYEES', 'VIEW_TEAM'), controller.getEmployees);
router.post('/employees', requirePermission('MANAGE_EMPLOYEES'), controller.createEmployee);
router.get('/employees/:id', requirePermission('VIEW_ALL_EMPLOYEES', 'VIEW_TEAM'), controller.getEmployeeById);
router.put('/employees/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updateEmployee);
router.get('/team', requirePermission('VIEW_TEAM', 'VIEW_ALL_EMPLOYEES'), controller.getTeam);
router.put('/employees/:id/role', requirePermission('MANAGE_EMPLOYEES'), controller.assignAccessRole);
router.post('/employees/bulk', requirePermission('MANAGE_EMPLOYEES'), controller.bulkImportEmployees);
router.get('/employees/:id/documents', requirePermission('VIEW_ALL_EMPLOYEES', 'VIEW_TEAM'), controller.getEmployeeDocuments);
router.post(
  '/employees/:id/documents/upload',
  requirePermission('MANAGE_EMPLOYEES'),
  employeeDocUpload.single('file'),
  controller.uploadEmployeeDocument,
);
router.post('/employees/:id/documents', requirePermission('MANAGE_EMPLOYEES'), controller.createEmployeeDocument);
router.delete('/employees/:id/documents/:docId', requirePermission('MANAGE_EMPLOYEES'), controller.deleteEmployeeDocument);

// Attendance settings
router.get('/attendance/settings', requirePermission('VIEW_ATTENDANCE'), controller.getAttendanceSettings);
router.put('/attendance/settings', requirePermission('MANAGE_ATTENDANCE'), controller.updateAttendanceSettings);

// Biometric devices
router.get('/attendance/devices', requirePermission('MANAGE_BIOMETRICS'), controller.getDevices);
router.post('/attendance/devices', requirePermission('MANAGE_BIOMETRICS'), controller.createDevice);
router.delete('/attendance/devices/:id', requirePermission('MANAGE_BIOMETRICS'), controller.deleteDevice);

// Whitelisted networks
router.get('/attendance/networks', requirePermission('MANAGE_NETWORK_SECURITY'), controller.getNetworks);
router.post('/attendance/networks', requirePermission('MANAGE_NETWORK_SECURITY'), controller.createNetwork);
router.delete('/attendance/networks/:id', requirePermission('MANAGE_NETWORK_SECURITY'), controller.deleteNetwork);

// Attendance — clock in/out & personal history
router.get('/attendance/me', requirePermission('VIEW_ATTENDANCE'), controller.getMyAttendanceProfile);
router.post('/attendance/remote-clockin', requirePermission('VIEW_ATTENDANCE'), controller.submitRemoteClockIn);
router.get('/attendance/biometric-users/:ip', requirePermission('MANAGE_BIOMETRICS'), controller.getBiometricUsers);
router.get('/attendance/events', requirePermission('MANAGE_ATTENDANCE'), controller.getAttendanceEvents);
router.post('/attendance/process-biometric-logs', requirePermission('MANAGE_ATTENDANCE'), controller.processBiometricLogs);

// Regularizations
router.get('/attendance/regularizations', requirePermission('VIEW_ATTENDANCE'), controller.getRegularizations);
router.post('/attendance/regularizations', requirePermission('VIEW_ATTENDANCE'), controller.requestRegularization);
router.put('/attendance/regularizations/:id', requirePermission('MANAGE_ATTENDANCE'), controller.processRegularization);

// Dashboard & self-service
router.get('/dashboard/summary', requirePermission('VIEW_HR'), controller.getDashboardSummary);
router.get('/me', requirePermission('VIEW_HR'), controller.getHrMeProfile);

// Leave
router.get('/leave/requests', requirePermission('VIEW_LEAVE'), controller.getLeaveRequests);
router.post('/leave/requests', requirePermission('VIEW_LEAVE'), controller.createLeaveRequest);
router.put('/leave/requests/:id/process', requirePermission('VIEW_LEAVE'), controller.processLeaveRequest);
router.put('/leave/requests/:id/cancel', requirePermission('VIEW_LEAVE'), controller.cancelLeaveRequest);
router.get('/leave/plans', requirePermission('VIEW_LEAVE'), controller.getLeavePlans);
router.post('/leave/plans', requirePermission('MANAGE_LEAVE'), controller.createLeavePlan);
router.delete('/leave/plans/:planId', requirePermission('MANAGE_LEAVE'), controller.deleteLeavePlan);
router.get('/leave/types', requirePermission('VIEW_LEAVE'), controller.getLeaveTypes);
router.post('/leave/types', requirePermission('MANAGE_LEAVE'), controller.createLeaveType);
router.put('/leave/types/:id', requirePermission('MANAGE_LEAVE'), controller.updateLeaveType);
router.delete('/leave/types/:id', requirePermission('MANAGE_LEAVE'), controller.deleteLeaveType);
router.get('/leave/plans/:planId/definitions', requirePermission('VIEW_LEAVE'), controller.getLeaveDefinitions);
router.post('/leave/plans/:planId/definitions', requirePermission('MANAGE_LEAVE'), controller.addLeaveDefinition);
router.delete('/leave/plans/:planId/definitions/:leaveTypeId', requirePermission('MANAGE_LEAVE'), controller.deleteLeaveDefinition);
router.get('/leave/plans/:planId/employees', requirePermission('VIEW_LEAVE'), controller.getLeavePlanEmployees);
router.post('/leave/plans/:planId/employees', requirePermission('MANAGE_LEAVE'), controller.assignLeavePlanEmployees);
router.delete('/leave/plans/:planId/employees/:employeeId', requirePermission('MANAGE_LEAVE'), controller.removeLeavePlanEmployee);

// Holidays
router.get('/holidays', requirePermission('VIEW_ATTENDANCE'), controller.getHolidays);
router.post('/holidays', requirePermission('MANAGE_SYSTEM'), controller.createHoliday);
router.delete('/holidays/:id', requirePermission('MANAGE_SYSTEM'), controller.deleteHoliday);

// Payroll
router.get('/payroll/structures', requirePermission('MANAGE_PAYROLL'), controller.getSalaryStructures);
router.put('/payroll/structures', requirePermission('MANAGE_PAYROLL'), controller.updateSalaryStructure);
router.get('/payroll/payslips', requirePermission('VIEW_OWN_PAYSLIP'), controller.getPayslips);
router.post('/payroll/execute', requirePermission('MANAGE_PAYROLL'), controller.calculatePayroll);
router.get('/payroll/deductions', requirePermission('MANAGE_PAYROLL'), controller.getPayrollDeductions);
router.post('/payroll/deductions', requirePermission('MANAGE_PAYROLL'), controller.upsertPayrollDeduction);

// Onboarding
router.get('/onboarding/templates', requirePermission('MANAGE_EMPLOYEES'), controller.getOnboardingTemplates);
router.post('/onboarding/templates', requirePermission('MANAGE_EMPLOYEES'), controller.createOnboardingTemplate);
router.delete('/onboarding/templates/:id', requirePermission('MANAGE_EMPLOYEES'), controller.deleteOnboardingTemplate);
router.get('/onboarding', requirePermission('MANAGE_EMPLOYEES'), controller.getOnboardingChecklists);
router.post('/onboarding', requirePermission('MANAGE_EMPLOYEES'), controller.createOnboardingChecklist);
router.get('/onboarding/:id', requirePermission('MANAGE_EMPLOYEES'), controller.getOnboardingChecklist);
router.put('/onboarding/:checklistId/items/:itemId', requirePermission('MANAGE_EMPLOYEES'), controller.updateOnboardingItem);
router.post(
  '/onboarding/:checklistId/items/:itemId/attachment',
  requirePermission('MANAGE_EMPLOYEES'),
  recruitmentFileUpload.single('file'),
  controller.uploadOnboardingItemAttachment,
);

// Recruitment file upload (resumes, etc.)
router.post(
  '/recruitment/upload',
  requirePermission('MANAGE_EMPLOYEES'),
  recruitmentFileUpload.single('file'),
  controller.uploadRecruitmentFile,
);

// Offer letters
router.get('/offer-letters/templates', requirePermission('MANAGE_EMPLOYEES'), controller.getOfferLetterTemplates);
router.post('/offer-letters/templates', requirePermission('MANAGE_EMPLOYEES'), controller.createOfferLetterTemplate);
router.put('/offer-letters/templates/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updateOfferLetterTemplate);
router.delete('/offer-letters/templates/:id', requirePermission('MANAGE_EMPLOYEES'), controller.deleteOfferLetterTemplate);
router.get('/offer-letters', requirePermission('MANAGE_EMPLOYEES'), controller.getOfferLetters);
router.get('/offer-letters/:id', requirePermission('MANAGE_EMPLOYEES'), controller.getOfferLetterById);
router.get('/offer-letters/:id/render', requirePermission('MANAGE_EMPLOYEES'), controller.renderOfferLetter);
router.post('/offer-letters', requirePermission('MANAGE_EMPLOYEES'), controller.createOfferLetter);
router.put('/offer-letters/:id/status', requirePermission('MANAGE_EMPLOYEES'), controller.updateOfferLetterStatus);
router.post('/offer-letters/:id/accept', requirePermission('MANAGE_EMPLOYEES'), controller.acceptOfferLetter);
router.post('/offer-letters/:id/reject', requirePermission('MANAGE_EMPLOYEES'), controller.rejectOfferLetter);

// Interviews
router.get('/interviews', requirePermission('MANAGE_EMPLOYEES'), controller.getInterviews);
router.post('/interviews', requirePermission('MANAGE_EMPLOYEES'), controller.scheduleInterview);
router.put('/interviews/:id/reschedule', requirePermission('MANAGE_EMPLOYEES'), controller.rescheduleInterview);
router.put('/interviews/:id/status', requirePermission('MANAGE_EMPLOYEES'), controller.updateInterviewStatus);
router.post('/interviews/:id/feedback', requirePermission('MANAGE_EMPLOYEES'), controller.submitInterviewFeedback);

// Jobs & candidates
router.get('/jobs', requirePermission('MANAGE_EMPLOYEES'), controller.getJobPostings);
router.post('/jobs', requirePermission('MANAGE_EMPLOYEES'), controller.createJobPosting);
router.put('/jobs/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updateJobPosting);
router.put('/jobs/:id/status', requirePermission('MANAGE_EMPLOYEES'), controller.updateJobPostingStatus);
router.get('/candidates', requirePermission('MANAGE_EMPLOYEES'), controller.getCandidates);
router.post('/candidates', requirePermission('MANAGE_EMPLOYEES'), controller.addCandidate);
router.put('/candidates/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updateCandidate);
router.post(
  '/candidates/:id/resume',
  requirePermission('MANAGE_EMPLOYEES'),
  recruitmentFileUpload.single('file'),
  controller.uploadCandidateResume,
);
router.put('/candidates/:id/status', requirePermission('MANAGE_EMPLOYEES'), controller.updateCandidateStatus);
router.get('/candidates/:id/stage-events', requirePermission('MANAGE_EMPLOYEES'), controller.getCandidateStageEvents);
router.put('/candidates/:id/stage', requirePermission('MANAGE_EMPLOYEES'), controller.updateCandidateStage);

// Performance metrics
router.get('/metrics/processing', requirePermission('VIEW_REPORTS'), controller.getProcessingMetrics);
router.post('/metrics/processing', requirePermission('MANAGE_EMPLOYEES'), controller.addProcessingMetric);
router.get('/kpi/definitions', requirePermission('VIEW_REPORTS'), controller.getKPIDefinitions);
router.post('/kpi/definitions', requirePermission('MANAGE_EMPLOYEES'), controller.createKPIDefinition);
router.put('/kpi/definitions/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updateKPIDefinition);
router.delete('/kpi/definitions/:id', requirePermission('MANAGE_EMPLOYEES'), controller.deleteKPIDefinition);
router.get('/kpi/metrics', requirePermission('VIEW_REPORTS'), controller.getKPIMetrics);
router.post('/kpi/metrics', requirePermission('MANAGE_EMPLOYEES'), controller.recordKPIMetric);
router.get('/performance/marketing', requirePermission('VIEW_REPORTS'), controller.getMarketingPerformance);
router.post('/performance/marketing', requirePermission('MANAGE_EMPLOYEES'), controller.addMarketingPerformance);
router.get('/performance/counsellors', requirePermission('VIEW_REPORTS'), controller.getCounsellorPerformance);
router.post('/performance/counsellors', requirePermission('MANAGE_EMPLOYEES'), controller.addCounsellorPerformance);
router.get('/performance/counsellors/computed', requirePermission('VIEW_REPORTS'), controller.getCounsellorConversionMetrics);
router.post('/performance/counsellors/sync', requirePermission('MANAGE_EMPLOYEES'), controller.syncCounsellorPerformanceFromLeads);
router.get('/performance-reviews', requirePermission('VIEW_REPORTS'), controller.getPerformanceReviews);
router.post('/performance-reviews', requirePermission('MANAGE_EMPLOYEES'), controller.createPerformanceReview);
router.post('/performance-reviews/generate', requirePermission('MANAGE_EMPLOYEES'), controller.generatePerformanceReviewsFromConversion);
router.put('/performance-reviews/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updatePerformanceReview);

export default router;
