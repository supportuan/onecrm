import { Router } from 'express';
import * as controller from './hr.controller.js';
import { requireHrAuth, requirePermission } from './hr.auth.js';

const router = Router();

router.use(requireHrAuth);

// Employees & team
router.get('/employees', requirePermission('VIEW_ALL_EMPLOYEES', 'VIEW_TEAM'), controller.getEmployees);
router.get('/team', requirePermission('VIEW_TEAM', 'VIEW_ALL_EMPLOYEES'), controller.getTeam);
router.put('/employees/:id/role', requirePermission('MANAGE_EMPLOYEES'), controller.assignAccessRole);
router.post('/employees/bulk', requirePermission('MANAGE_EMPLOYEES'), controller.bulkImportEmployees);

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
router.put('/leave/requests/:id/process', requirePermission('MANAGE_LEAVE'), controller.processLeaveRequest);
router.put('/leave/requests/:id/cancel', requirePermission('VIEW_LEAVE'), controller.cancelLeaveRequest);
router.get('/leave/plans', requirePermission('VIEW_LEAVE'), controller.getLeavePlans);
router.post('/leave/plans', requirePermission('MANAGE_LEAVE'), controller.createLeavePlan);
router.get('/leave/types', requirePermission('VIEW_LEAVE'), controller.getLeaveTypes);
router.post('/leave/types', requirePermission('MANAGE_LEAVE'), controller.createLeaveType);
router.put('/leave/types/:id', requirePermission('MANAGE_LEAVE'), controller.updateLeaveType);
router.delete('/leave/types/:id', requirePermission('MANAGE_LEAVE'), controller.deleteLeaveType);
router.get('/leave/plans/:planId/definitions', requirePermission('VIEW_LEAVE'), controller.getLeaveDefinitions);
router.post('/leave/plans/:planId/definitions', requirePermission('MANAGE_LEAVE'), controller.addLeaveDefinition);
router.delete('/leave/plans/:planId/definitions/:leaveTypeId', requirePermission('MANAGE_LEAVE'), controller.deleteLeaveDefinition);
router.get('/leave/plans/:planId/employees', requirePermission('VIEW_LEAVE'), controller.getLeavePlanEmployees);
router.post('/leave/plans/:planId/employees', requirePermission('MANAGE_LEAVE'), controller.assignLeavePlanEmployees);

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
router.get('/onboarding', requirePermission('MANAGE_EMPLOYEES'), controller.getOnboardingChecklists);
router.post('/onboarding', requirePermission('MANAGE_EMPLOYEES'), controller.createOnboardingChecklist);
router.get('/onboarding/:id', requirePermission('MANAGE_EMPLOYEES'), controller.getOnboardingChecklist);
router.put('/onboarding/:checklistId/items/:itemId', requirePermission('MANAGE_EMPLOYEES'), controller.updateOnboardingItem);

// Offer letters
router.get('/offer-letters', requirePermission('MANAGE_EMPLOYEES'), controller.getOfferLetters);
router.post('/offer-letters', requirePermission('MANAGE_EMPLOYEES'), controller.createOfferLetter);
router.put('/offer-letters/:id/status', requirePermission('MANAGE_EMPLOYEES'), controller.updateOfferLetterStatus);

// Interviews
router.get('/interviews', requirePermission('MANAGE_EMPLOYEES'), controller.getInterviews);
router.post('/interviews', requirePermission('MANAGE_EMPLOYEES'), controller.scheduleInterview);
router.put('/interviews/:id/status', requirePermission('MANAGE_EMPLOYEES'), controller.updateInterviewStatus);
router.post('/interviews/:id/feedback', requirePermission('MANAGE_EMPLOYEES'), controller.submitInterviewFeedback);

// Jobs & candidates
router.get('/jobs', requirePermission('MANAGE_EMPLOYEES'), controller.getJobPostings);
router.post('/jobs', requirePermission('MANAGE_EMPLOYEES'), controller.createJobPosting);
router.put('/jobs/:id/status', requirePermission('MANAGE_EMPLOYEES'), controller.updateJobPostingStatus);
router.get('/candidates', requirePermission('MANAGE_EMPLOYEES'), controller.getCandidates);
router.post('/candidates', requirePermission('MANAGE_EMPLOYEES'), controller.addCandidate);
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
router.get('/performance-reviews', requirePermission('VIEW_REPORTS'), controller.getPerformanceReviews);
router.post('/performance-reviews', requirePermission('MANAGE_EMPLOYEES'), controller.createPerformanceReview);
router.put('/performance-reviews/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updatePerformanceReview);

export default router;
