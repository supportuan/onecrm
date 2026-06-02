import { Request, Response, NextFunction } from 'express';
import * as hrService from './hr.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import {
  createDeviceSchema,
  createNetworkSchema,
  updateSettingsSchema,
  requestRegularizationSchema,
  processRegularizationSchema,
  createLeavePlanSchema,
  createLeaveDefinitionSchema,
  assignLeaveEmployeesSchema,
  createHolidaySchema,
  executePayrollSchema,
  createSalaryStructureSchema,
} from './hr.validation.js';

// ==========================================
// 1. Employees & Admin Roles
// ==========================================

export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getEmployees();
    return sendSuccess(res, 'Employees retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getTeam();
    return sendSuccess(res, 'Team members retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const assignAccessRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    if (!role) {
      return sendError(res, 'Role is required', null, 400);
    }
    const data = await hrService.assignAccessRole(id, role);
    return sendSuccess(res, 'Access role assigned successfully', data);
  } catch (error) {
    next(error);
  }
};

export const bulkImportEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = req.body;
    if (!Array.isArray(rows)) {
      return sendError(res, 'Request body must be an array of employee objects', null, 400);
    }
    const result = await hrService.bulkImportEmployees(rows);
    return sendSuccess(res, 'Employees imported successfully', result);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. Attendance Settings
// ==========================================

export const getAttendanceSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getAttendanceSettings();
    return sendSuccess(res, 'Attendance settings retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateAttendanceSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateSettingsSchema.parse(req.body);
    const data = await hrService.updateAttendanceSettings(validatedData);
    return sendSuccess(res, 'Attendance settings updated successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. Device Whitelists
// ==========================================

export const getDevices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getDevices();
    return sendSuccess(res, 'Devices retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createDevice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createDeviceSchema.parse(req.body);
    const data = await hrService.createDevice(validatedData);
    return sendSuccess(res, 'Device created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteDevice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = ((req.query.id || req.params.id) as string);
    if (!id) return sendError(res, 'Device ID is required', null, 400);
    const result = await hrService.deleteDevice(id);
    return sendSuccess(res, 'Device deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. IP Networks Whitelist
// ==========================================

export const getNetworks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getNetworks();
    return sendSuccess(res, 'Networks retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createNetwork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createNetworkSchema.parse(req.body);
    const data = await hrService.createNetwork(validatedData);
    return sendSuccess(res, 'Network created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteNetwork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (req.params.id as string);
    const result = await hrService.deleteNetwork(id);
    return sendSuccess(res, 'Network deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. Biometric Users & Logs Processor
// ==========================================

export const getBiometricUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = ((req.query.ip || req.params.ip || '') as string);
    const data = await hrService.getBiometricUsers(ip);
    return sendSuccess(res, 'Biometric users retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getAttendanceEvents();
    return sendSuccess(res, 'Attendance events retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const processBiometricLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.processBiometricLogs();
    return sendSuccess(res, 'Biometric logs processed successfully', data);
  } catch (error) {
    next(error);
  }
};

export const submitRemoteClockIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, ip, coordinates, isCheckOut } = req.body;
    if (!employeeId) {
      return sendError(res, 'Employee email/ID is required for remote clock-in', null, 400);
    }
    const data = await hrService.submitRemoteClockIn(employeeId, { ip, coordinates, isCheckOut });
    return sendSuccess(res, 'Remote clock-in registered successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. Attendance Calendar & Regularization
// ==========================================

export const getTeamCalendar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const data = await hrService.getTeamCalendar(month, year);
    return sendSuccess(res, 'Team calendar retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getRegularizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getRegularizations();
    return sendSuccess(res, 'Regularization requests retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const requestRegularization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return sendError(res, 'employeeId is required', null, 400);
    }
    const validatedData = requestRegularizationSchema.parse(req.body);
    const data = await hrService.requestRegularization(employeeId, validatedData);
    return sendSuccess(res, 'Regularization request submitted successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const processRegularization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validatedData = processRegularizationSchema.parse(req.body);
    const data = await hrService.processRegularization(id, validatedData.status, validatedData.approverRemarks);
    return sendSuccess(res, 'Regularization request processed successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. Leave Management & Policy
// ==========================================

export const getLeavePlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getLeavePlans();
    return sendSuccess(res, 'Leave plans retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createLeavePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createLeavePlanSchema.parse(req.body);
    const data = await hrService.createLeavePlan(validatedData);
    return sendSuccess(res, 'Leave plan created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const getLeaveTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getLeaveTypes();
    return sendSuccess(res, 'Leave types retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getLeaveDefinitions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = req.params.planId as string;
    const data = await hrService.getLeaveDefinitions(planId);
    return sendSuccess(res, 'Leave definitions retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const addLeaveDefinition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = req.params.planId as string;
    const validatedData = createLeaveDefinitionSchema.parse(req.body);
    const data = await hrService.addLeaveDefinition(planId, {
      leaveTypeId: validatedData.leaveTypeId,
      annual_quota: validatedData.annual_quota ?? 12,
      carry_forward: validatedData.carry_forward
    });
    return sendSuccess(res, 'Leave definition added successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteLeaveDefinition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = req.params.planId as string;
    const leaveTypeId = req.params.leaveTypeId as string;
    const result = await hrService.deleteLeaveDefinition(planId, leaveTypeId);
    return sendSuccess(res, 'Leave definition deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getLeavePlanEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = req.params.planId as string;
    const data = await hrService.getLeavePlanEmployees(planId);
    return sendSuccess(res, 'Leave plan employees retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const assignLeavePlanEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = req.params.planId as string;
    const validatedData = assignLeaveEmployeesSchema.parse(req.body);
    const result = await hrService.assignLeavePlanEmployees(planId, validatedData.employeeIds);
    return sendSuccess(res, 'Employees assigned to leave plan successfully', result);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. Holidays Management
// ==========================================

export const getHolidays = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getHolidays();
    return sendSuccess(res, 'Holidays retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createHoliday = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createHolidaySchema.parse(req.body);
    const data = await hrService.createHoliday(validatedData);
    return sendSuccess(res, 'Holiday created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteHoliday = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (req.body?.id || (req.query.id as string) || req.params.id) as string;
    if (!id) return sendError(res, 'Holiday ID is required', null, 400);
    const result = await hrService.deleteHoliday(id);
    return sendSuccess(res, 'Holiday deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 9. Salary Structure & Payroll
// ==========================================

export const getSalaryStructures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getSalaryStructures();
    return sendSuccess(res, 'Salary structures retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateSalaryStructure = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createSalaryStructureSchema.parse(req.body);
    const data = await hrService.updateSalaryStructure(validatedData);
    return sendSuccess(res, 'Salary structure updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getPayslips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getPayslips();
    return sendSuccess(res, 'Payslips retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const calculatePayroll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = executePayrollSchema.parse(req.body);
    const data = await hrService.calculatePayroll(validatedData.month, validatedData.year);
    return sendSuccess(res, 'Payroll executed successfully', data);
  } catch (error) {
    next(error);
  }
};
