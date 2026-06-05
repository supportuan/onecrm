import { Router } from 'express';
import * as controller from './hr.controller.js';
import { requireHrAuth, requirePermission } from './hr.auth.js';

const router = Router();

// All HR routes require authentication. Per-endpoint capability checks below.
router.use(requireHrAuth);

// ==========================================
// 1. Employees & Team Directory
// ==========================================
router.get('/employees', requirePermission('VIEW_ALL_EMPLOYEES', 'VIEW_TEAM'), controller.getEmployees);
router.get('/team', requirePermission('VIEW_TEAM', 'VIEW_ALL_EMPLOYEES'), controller.getTeam);
router.put('/employees/:id/role', requirePermission('MANAGE_EMPLOYEES'), controller.assignAccessRole);
router.post('/employees/bulk', requirePermission('MANAGE_EMPLOYEES'), controller.bulkImportEmployees);

// ==========================================
// 2. Attendance Settings & Configuration
// ==========================================
router.get('/attendance/settings', requirePermission('VIEW_ATTENDANCE'), controller.getAttendanceSettings);
router.put('/attendance/settings', requirePermission('MANAGE_ATTENDANCE'), controller.updateAttendanceSettings);
router.get('/admin/attendance/settings', requirePermission('VIEW_ATTENDANCE'), controller.getAttendanceSettings);
router.put('/admin/attendance/settings', requirePermission('MANAGE_ATTENDANCE'), controller.updateAttendanceSettings);

// ==========================================
// 3. Biometric Whitelisted Hardware Devices
// ==========================================
router.get('/attendance/devices', requirePermission('MANAGE_BIOMETRICS'), controller.getDevices);
router.post('/attendance/devices', requirePermission('MANAGE_BIOMETRICS'), controller.createDevice);
router.delete('/attendance/devices/:id', requirePermission('MANAGE_BIOMETRICS'), controller.deleteDevice);

// Compatibility paths for hardware registry
router.get('/admin/devices', requirePermission('MANAGE_BIOMETRICS'), controller.getDevices);
router.post('/admin/devices', requirePermission('MANAGE_BIOMETRICS'), controller.createDevice);
router.delete('/admin/devices', requirePermission('MANAGE_BIOMETRICS'), controller.deleteDevice);
router.delete('/admin/devices/:id', requirePermission('MANAGE_BIOMETRICS'), controller.deleteDevice);

// ==========================================
// 4. Whitelisted IP Networks
// ==========================================
router.get('/attendance/networks', requirePermission('MANAGE_NETWORK_SECURITY'), controller.getNetworks);
router.post('/attendance/networks', requirePermission('MANAGE_NETWORK_SECURITY'), controller.createNetwork);
router.delete('/attendance/networks/:id', requirePermission('MANAGE_NETWORK_SECURITY'), controller.deleteNetwork);

// Compatibility paths for networks
router.get('/admin/attendance/networks', requirePermission('MANAGE_NETWORK_SECURITY'), controller.getNetworks);
router.post('/admin/attendance/networks', requirePermission('MANAGE_NETWORK_SECURITY'), controller.createNetwork);
router.delete('/admin/attendance/networks/:id', requirePermission('MANAGE_NETWORK_SECURITY'), controller.deleteNetwork);

// ==========================================
// 5. Hardware Device User list & Event Logs
// ==========================================
router.get('/attendance/biometric-users/:ip', requirePermission('MANAGE_BIOMETRICS'), controller.getBiometricUsers);
router.get('/attendance/events', requirePermission('VIEW_ATTENDANCE'), controller.getAttendanceEvents);
router.post('/attendance/process-biometric-logs', requirePermission('MANAGE_ATTENDANCE'), controller.processBiometricLogs);
router.post('/attendance/remote-clockin', requirePermission('VIEW_ATTENDANCE'), controller.submitRemoteClockIn);

// Compatibility paths for logs / users / process
router.get('/biometric/users', requirePermission('MANAGE_BIOMETRICS'), controller.getBiometricUsers);
router.post('/attendance/process', requirePermission('MANAGE_ATTENDANCE'), controller.processBiometricLogs);
router.get('/attendance/remote', requirePermission('VIEW_ATTENDANCE'), controller.getAttendanceEvents);
router.post('/attendance/remote', requirePermission('VIEW_ATTENDANCE'), controller.submitRemoteClockIn);

// ==========================================
// 6. Calendar Grid & Regularization Request
// ==========================================
router.get('/attendance/team-calendar', requirePermission('VIEW_ATTENDANCE'), controller.getTeamCalendar);
router.get('/attendance/regularizations', requirePermission('VIEW_ATTENDANCE'), controller.getRegularizations);
router.post('/attendance/regularizations', requirePermission('VIEW_ATTENDANCE'), controller.requestRegularization);
router.put('/attendance/regularizations/:id', requirePermission('MANAGE_ATTENDANCE'), controller.processRegularization);

// Compatibility paths for regularizations / team calendar
router.get('/team/calendar', requirePermission('VIEW_ATTENDANCE'), controller.getTeamCalendar);
router.post('/attendance/regularize', requirePermission('VIEW_ATTENDANCE'), controller.requestRegularization);
router.get('/attendance/regularization-requests', requirePermission('VIEW_ATTENDANCE'), controller.getRegularizations);
router.put('/attendance/regularization-requests/:id', requirePermission('MANAGE_ATTENDANCE'), controller.processRegularization);

// ==========================================
// 7. Leave Policies, Plans, & Employee Roles
// ==========================================
router.get('/leave/plans', requirePermission('VIEW_LEAVE'), controller.getLeavePlans);
router.post('/leave/plans', requirePermission('MANAGE_LEAVE'), controller.createLeavePlan);
router.get('/leave/types', requirePermission('VIEW_LEAVE'), controller.getLeaveTypes);
router.get('/leave/plans/:planId/definitions', requirePermission('VIEW_LEAVE'), controller.getLeaveDefinitions);
router.post('/leave/plans/:planId/definitions', requirePermission('MANAGE_LEAVE'), controller.addLeaveDefinition);
router.delete('/leave/plans/:planId/definitions/:leaveTypeId', requirePermission('MANAGE_LEAVE'), controller.deleteLeaveDefinition);
router.get('/leave/plans/:planId/employees', requirePermission('VIEW_LEAVE'), controller.getLeavePlanEmployees);
router.post('/leave/plans/:planId/employees', requirePermission('MANAGE_LEAVE'), controller.assignLeavePlanEmployees);

// ==========================================
// 8. Holiday Schedules
// ==========================================
router.get('/holidays', requirePermission('VIEW_ATTENDANCE'), controller.getHolidays);
router.post('/holidays', requirePermission('MANAGE_SYSTEM'), controller.createHoliday);
router.delete('/holidays/:id', requirePermission('MANAGE_SYSTEM'), controller.deleteHoliday);

// Compatibility paths for holidays
router.get('/admin/holidays', requirePermission('VIEW_ATTENDANCE'), controller.getHolidays);
router.post('/admin/holidays', requirePermission('MANAGE_SYSTEM'), controller.createHoliday);
router.delete('/admin/holidays', requirePermission('MANAGE_SYSTEM'), controller.deleteHoliday);
router.delete('/admin/holidays/:id', requirePermission('MANAGE_SYSTEM'), controller.deleteHoliday);

// ==========================================
// 9. Payroll Execution & Salary Settings
// ==========================================
router.get('/payroll/structures', requirePermission('MANAGE_PAYROLL'), controller.getSalaryStructures);
router.put('/payroll/structures', requirePermission('MANAGE_PAYROLL'), controller.updateSalaryStructure);
router.get('/payroll/payslips', requirePermission('VIEW_OWN_PAYSLIP'), controller.getPayslips);
router.post('/payroll/execute', requirePermission('MANAGE_PAYROLL'), controller.calculatePayroll);

// Compatibility paths for payroll
router.get('/payroll/salary-structures', requirePermission('MANAGE_PAYROLL'), controller.getSalaryStructures);
router.put('/payroll/salary-structures', requirePermission('MANAGE_PAYROLL'), controller.updateSalaryStructure);
router.post('/payroll/calculate', requirePermission('MANAGE_PAYROLL'), controller.calculatePayroll);

// ==========================================
// 10. Payroll Deductions (leaves & taxes)
// ==========================================
router.get('/payroll/deductions', requirePermission('MANAGE_PAYROLL'), controller.getPayrollDeductions);
router.post('/payroll/deductions', requirePermission('MANAGE_PAYROLL'), controller.upsertPayrollDeduction);

// ==========================================
// 11. Employee Onboarding Checklist
// ==========================================
router.get('/onboarding', requirePermission('MANAGE_EMPLOYEES'), controller.getOnboardingChecklists);
router.post('/onboarding', requirePermission('MANAGE_EMPLOYEES'), controller.createOnboardingChecklist);
router.get('/onboarding/:id', requirePermission('MANAGE_EMPLOYEES'), controller.getOnboardingChecklist);
router.put('/onboarding/:checklistId/items/:itemId', requirePermission('MANAGE_EMPLOYEES'), controller.updateOnboardingItem);

// ==========================================
// 12. Offer Letters
// ==========================================
router.get('/offer-letters', requirePermission('MANAGE_EMPLOYEES'), controller.getOfferLetters);
router.post('/offer-letters', requirePermission('MANAGE_EMPLOYEES'), controller.createOfferLetter);
router.put('/offer-letters/:id/status', requirePermission('MANAGE_EMPLOYEES'), controller.updateOfferLetterStatus);

// ==========================================
// 13. Interview Scheduling & Feedback
// ==========================================
router.get('/interviews', requirePermission('MANAGE_EMPLOYEES'), controller.getInterviews);
router.post('/interviews', requirePermission('MANAGE_EMPLOYEES'), controller.scheduleInterview);
router.put('/interviews/:id/status', requirePermission('MANAGE_EMPLOYEES'), controller.updateInterviewStatus);
router.post('/interviews/:id/feedback', requirePermission('MANAGE_EMPLOYEES'), controller.submitInterviewFeedback);

// ==========================================
// 14. Job Postings & Candidate Tracking
// ==========================================
router.get('/jobs', requirePermission('MANAGE_EMPLOYEES'), controller.getJobPostings);
router.post('/jobs', requirePermission('MANAGE_EMPLOYEES'), controller.createJobPosting);
router.put('/jobs/:id/status', requirePermission('MANAGE_EMPLOYEES'), controller.updateJobPostingStatus);
router.get('/candidates', requirePermission('MANAGE_EMPLOYEES'), controller.getCandidates);
router.post('/candidates', requirePermission('MANAGE_EMPLOYEES'), controller.addCandidate);
router.put('/candidates/:id/stage', requirePermission('MANAGE_EMPLOYEES'), controller.updateCandidateStage);

// ==========================================
// 15. Processing Performance Metrics
// ==========================================
router.get('/metrics/processing', requirePermission('VIEW_REPORTS'), controller.getProcessingMetrics);
router.post('/metrics/processing', requirePermission('MANAGE_EMPLOYEES'), controller.addProcessingMetric);

// ==========================================
// 16. KPI Definitions & Metrics
// ==========================================
router.get('/kpi/definitions', requirePermission('VIEW_REPORTS'), controller.getKPIDefinitions);
router.post('/kpi/definitions', requirePermission('MANAGE_EMPLOYEES'), controller.createKPIDefinition);
router.put('/kpi/definitions/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updateKPIDefinition);
router.delete('/kpi/definitions/:id', requirePermission('MANAGE_EMPLOYEES'), controller.deleteKPIDefinition);
router.get('/kpi/metrics', requirePermission('VIEW_REPORTS'), controller.getKPIMetrics);
router.post('/kpi/metrics', requirePermission('MANAGE_EMPLOYEES'), controller.recordKPIMetric);

// ==========================================
// 17. Marketing Performance
// ==========================================
router.get('/performance/marketing', requirePermission('VIEW_REPORTS'), controller.getMarketingPerformance);
router.post('/performance/marketing', requirePermission('MANAGE_EMPLOYEES'), controller.addMarketingPerformance);

// ==========================================
// 18. Counsellor Performance
// ==========================================
router.get('/performance/counsellors', requirePermission('VIEW_REPORTS'), controller.getCounsellorPerformance);
router.post('/performance/counsellors', requirePermission('MANAGE_EMPLOYEES'), controller.addCounsellorPerformance);

// ==========================================
// 19. Performance Reviews
// ==========================================
router.get('/performance-reviews', requirePermission('VIEW_REPORTS'), controller.getPerformanceReviews);
router.post('/performance-reviews', requirePermission('MANAGE_EMPLOYEES'), controller.createPerformanceReview);
router.put('/performance-reviews/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updatePerformanceReview);

export default router;
