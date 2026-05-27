import { Router } from 'express';
import * as controller from './hr.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
const router = Router();
// Apply authentication token verification globally to all HR sub-routes
router.use(authenticateToken);
// ==========================================
// 1. Employees & Team Directory
// ==========================================
router.get('/employees', requirePermission(['VIEW_ALL_EMPLOYEES', 'VIEW_TEAM']), controller.getEmployees);
router.get('/team', requirePermission('VIEW_TEAM'), controller.getTeam);
router.put('/employees/:id/role', requirePermission('MANAGE_EMPLOYEES'), controller.assignAccessRole);
router.post('/employees/bulk', requirePermission('MANAGE_EMPLOYEES'), controller.bulkImportEmployees);
router.post('/employees', requirePermission('MANAGE_EMPLOYEES'), controller.createEmployee);
// ==========================================
// 2. Attendance Settings & Configuration
// ==========================================
router.get('/attendance/settings', requirePermission('VIEW_ATTENDANCE'), controller.getAttendanceSettings);
router.put('/attendance/settings', requirePermission('MANAGE_SYSTEM'), controller.updateAttendanceSettings);
router.get('/admin/attendance/settings', requirePermission('MANAGE_SYSTEM'), controller.getAttendanceSettings);
router.put('/admin/attendance/settings', requirePermission('MANAGE_SYSTEM'), controller.updateAttendanceSettings);
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
router.post('/attendance/remote-clockin', requirePermission('VIEW_OWN_PAYSLIP'), controller.submitRemoteClockIn);
// Compatibility paths for logs / users / process
router.get('/biometric/users', requirePermission('MANAGE_BIOMETRICS'), controller.getBiometricUsers);
router.post('/attendance/process', requirePermission('MANAGE_ATTENDANCE'), controller.processBiometricLogs);
router.get('/attendance/remote', requirePermission('VIEW_ATTENDANCE'), controller.getAttendanceEvents);
router.post('/attendance/remote', requirePermission('VIEW_OWN_PAYSLIP'), controller.submitRemoteClockIn);
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
router.get('/holidays', requirePermission('VIEW_LEAVE'), controller.getHolidays);
router.post('/holidays', requirePermission('MANAGE_SYSTEM'), controller.createHoliday);
router.delete('/holidays/:id', requirePermission('MANAGE_SYSTEM'), controller.deleteHoliday);
// Compatibility paths for holidays
router.get('/admin/holidays', requirePermission('VIEW_LEAVE'), controller.getHolidays);
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
// ==========================================
// 10. Extended Lifecycle & Document Storage
// ==========================================
router.put('/employees/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updateEmployee);
router.get('/employees/:id/documents', requirePermission('VIEW_OWN_PAYSLIP'), controller.getEmployeeDocuments);
router.post('/employees/:id/documents', requirePermission('VIEW_OWN_PAYSLIP'), controller.uploadEmployeeDocument);
router.delete('/employees/:id/documents/:docId', requirePermission('VIEW_OWN_PAYSLIP'), controller.deleteEmployeeDocument);
// ==========================================
// 11. Multi-level Leave Request Workflows
// ==========================================
router.get('/leave/requests', requirePermission('VIEW_LEAVE'), controller.getLeaveRequests);
router.post('/leave/requests', requirePermission('VIEW_LEAVE'), controller.applyLeaveRequest);
router.put('/leave/requests/:id/approve', requirePermission('MANAGE_LEAVE'), controller.processLeaveApproval);
router.get('/leave/balances-report', requirePermission('VIEW_REPORTS'), controller.getLeaveBalancesReport);
// ==========================================
// 12. Recruitment Candidates & Persistance
// ==========================================
router.get('/recruitment/candidates', requirePermission('MANAGE_EMPLOYEES'), controller.getCandidates);
router.post('/recruitment/candidates', requirePermission('MANAGE_EMPLOYEES'), controller.createCandidate);
router.put('/recruitment/candidates/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updateCandidate);
router.get('/recruitment/offer-letter/:candidateId/pdf', requirePermission('MANAGE_EMPLOYEES'), controller.generateOfferLetterPdf);
// ==========================================
// 13. HR Groups
// ==========================================
router.get('/groups', requirePermission('MANAGE_EMPLOYEES'), controller.getGroups);
router.post('/groups', requirePermission('MANAGE_EMPLOYEES'), controller.createGroup);
// ==========================================
// 14. Business Goals
// ==========================================
router.get('/business-goals', requirePermission('VIEW_REPORTS'), controller.getBusinessGoals);
router.post('/business-goals', requirePermission('MANAGE_SYSTEM'), controller.createBusinessGoal);
router.post('/business-goals/link', requirePermission('MANAGE_SYSTEM'), controller.linkBusinessGoalToHr);
// ==========================================
// 15. Attendance Templates & Summary Reports
// ==========================================
router.get('/attendance/templates', requirePermission('VIEW_ATTENDANCE'), controller.getAttendanceTemplates);
router.get('/attendance/templates/:id', requirePermission('VIEW_ATTENDANCE'), controller.getAttendanceTemplate);
router.get('/attendance/summary-report', requirePermission('VIEW_REPORTS'), controller.getAttendanceSummaryReport);
// ==========================================
// 16. Counselor & Marketing KPI Metrics
// ==========================================
router.get('/counselors/:id/metrics', requirePermission('VIEW_REPORTS'), controller.getCounselorMetrics);
router.get('/marketing-teams/:teamId/kpis', requirePermission('VIEW_REPORTS'), controller.getMarketingTeamKpis);
// ==========================================
// 17. KPI Definitions & Performance Reviews
// ==========================================
router.get('/performance/kpis', requirePermission('VIEW_REPORTS'), controller.getKpiDefinitions);
router.post('/performance/kpis', requirePermission('MANAGE_SYSTEM'), controller.createKpiDefinition);
router.get('/performance/reviews', requirePermission('VIEW_REPORTS'), controller.getPerformanceReviews);
router.post('/performance/reviews', requirePermission('MANAGE_EMPLOYEES'), controller.createPerformanceReview);
router.put('/performance/reviews/:id', requirePermission('MANAGE_EMPLOYEES'), controller.updatePerformanceReview);
export default router;
