import { Router } from 'express';
import * as controller from './hr.controller.js';

const router = Router();

// ==========================================
// 1. Employees & Team Directory
// ==========================================
router.get('/employees', controller.getEmployees);
router.get('/team', controller.getTeam);
router.put('/employees/:id/role', controller.assignAccessRole);
router.post('/employees/bulk', controller.bulkImportEmployees);

// ==========================================
// 2. Attendance Settings & Configuration
// ==========================================
router.get('/attendance/settings', controller.getAttendanceSettings);
router.put('/attendance/settings', controller.updateAttendanceSettings);
router.get('/admin/attendance/settings', controller.getAttendanceSettings);
router.put('/admin/attendance/settings', controller.updateAttendanceSettings);

// ==========================================
// 3. Biometric Whitelisted Hardware Devices
// ==========================================
router.get('/attendance/devices', controller.getDevices);
router.post('/attendance/devices', controller.createDevice);
router.delete('/attendance/devices/:id', controller.deleteDevice);

// Compatibility paths for hardware registry
router.get('/admin/devices', controller.getDevices);
router.post('/admin/devices', controller.createDevice);
router.delete('/admin/devices', controller.deleteDevice);
router.delete('/admin/devices/:id', controller.deleteDevice);

// ==========================================
// 4. Whitelisted IP Networks
// ==========================================
router.get('/attendance/networks', controller.getNetworks);
router.post('/attendance/networks', controller.createNetwork);
router.delete('/attendance/networks/:id', controller.deleteNetwork);

// Compatibility paths for networks
router.get('/admin/attendance/networks', controller.getNetworks);
router.post('/admin/attendance/networks', controller.createNetwork);
router.delete('/admin/attendance/networks/:id', controller.deleteNetwork);

// ==========================================
// 5. Hardware Device User list & Event Logs
// ==========================================
router.get('/attendance/biometric-users/:ip', controller.getBiometricUsers);
router.get('/attendance/events', controller.getAttendanceEvents);
router.post('/attendance/process-biometric-logs', controller.processBiometricLogs);
router.post('/attendance/remote-clockin', controller.submitRemoteClockIn);

// Compatibility paths for logs / users / process
router.get('/biometric/users', controller.getBiometricUsers);
router.post('/attendance/process', controller.processBiometricLogs);
router.get('/attendance/remote', controller.getAttendanceEvents);
router.post('/attendance/remote', controller.submitRemoteClockIn);

// ==========================================
// 6. Calendar Grid & Regularization Request
// ==========================================
router.get('/attendance/team-calendar', controller.getTeamCalendar);
router.get('/attendance/regularizations', controller.getRegularizations);
router.post('/attendance/regularizations', controller.requestRegularization);
router.put('/attendance/regularizations/:id', controller.processRegularization);

// Compatibility paths for regularizations / team calendar
router.get('/team/calendar', controller.getTeamCalendar);
router.post('/attendance/regularize', controller.requestRegularization);
router.get('/attendance/regularization-requests', controller.getRegularizations);
router.put('/attendance/regularization-requests/:id', controller.processRegularization);

// ==========================================
// 7. Leave Policies, Plans, & Employee Roles
// ==========================================
router.get('/leave/plans', controller.getLeavePlans);
router.post('/leave/plans', controller.createLeavePlan);
router.get('/leave/types', controller.getLeaveTypes);
router.get('/leave/plans/:planId/definitions', controller.getLeaveDefinitions);
router.post('/leave/plans/:planId/definitions', controller.addLeaveDefinition);
router.delete('/leave/plans/:planId/definitions/:leaveTypeId', controller.deleteLeaveDefinition);
router.get('/leave/plans/:planId/employees', controller.getLeavePlanEmployees);
router.post('/leave/plans/:planId/employees', controller.assignLeavePlanEmployees);

// ==========================================
// 8. Holiday Schedules
// ==========================================
router.get('/holidays', controller.getHolidays);
router.post('/holidays', controller.createHoliday);
router.delete('/holidays/:id', controller.deleteHoliday);

// Compatibility paths for holidays
router.get('/admin/holidays', controller.getHolidays);
router.post('/admin/holidays', controller.createHoliday);
router.delete('/admin/holidays', controller.deleteHoliday);
router.delete('/admin/holidays/:id', controller.deleteHoliday);

// ==========================================
// 9. Payroll Execution & Salary Settings
// ==========================================
router.get('/payroll/structures', controller.getSalaryStructures);
router.put('/payroll/structures', controller.updateSalaryStructure);
router.get('/payroll/payslips', controller.getPayslips);
router.post('/payroll/execute', controller.calculatePayroll);

// Compatibility paths for payroll
router.get('/payroll/salary-structures', controller.getSalaryStructures);
router.put('/payroll/salary-structures', controller.updateSalaryStructure);
router.post('/payroll/calculate', controller.calculatePayroll);

export default router;
