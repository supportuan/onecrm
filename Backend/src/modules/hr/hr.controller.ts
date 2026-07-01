import { Request, Response, NextFunction } from 'express';
import * as hrService from './hr.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { resolveFileRefsDeep, safeUploadFilename, storeUploadedFile } from '../../lib/file-storage.js';
import {
  createDeviceSchema,
  createNetworkSchema,
  updateSettingsSchema,
  requestRegularizationSchema,
  processRegularizationSchema,
  createLeavePlanSchema,
  createLeaveDefinitionSchema,
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  assignLeaveEmployeesSchema,
  createHolidaySchema,
  executePayrollSchema,
  createSalaryStructureSchema,
  createOnboardingChecklistSchema,
  updateOnboardingItemSchema,
  createOfferLetterSchema,
  createOfferLetterTemplateSchema,
  updateOfferLetterTemplateSchema,
  updateOfferLetterStatusSchema,
  scheduleInterviewSchema,
  rescheduleInterviewSchema,
  updateInterviewStatusSchema,
  submitInterviewFeedbackSchema,
  createJobPostingSchema,
  updateJobPostingSchema,
  updateJobPostingStatusSchema,
  addCandidateSchema,
  updateCandidateSchema,
  updateCandidateStatusSchema,
  updateCandidateStageSchema,
  createOnboardingTemplateSchema,
  addProcessingMetricSchema,
  createKPIDefinitionSchema,
  recordKPIMetricSchema,
  addMarketingPerformanceSchema,
  addCounsellorPerformanceSchema,
  upsertPayrollDeductionSchema,
  createPerformanceReviewSchema,
  updatePerformanceReviewSchema,
  createLeaveRequestSchema,
  processLeaveRequestSchema,
  updateEmployeeSchema,
  createEmployeeDocumentSchema,
} from './hr.validation.js';
import { notifyRoles } from '../notifications/recipients.js';
import { employeeDocUpload, recruitmentFileUpload } from './hr.upload.js';
import { UserRole } from '@prisma/client';

// ==========================================
// 1. Employees & Admin Roles
// ==========================================

export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const validStatuses = ['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED'];
    const data = await hrService.getEmployees(
      status && validStatuses.includes(status) ? { status: status as any } : undefined,
    );
    return sendSuccess(res, 'Employees retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = await hrService.getEmployeeById(id);
    if (!data) return sendError(res, 'Employee not found', null, 404);
    return sendSuccess(res, 'Employee retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = updateEmployeeSchema.parse(req.body);
    const data = await hrService.updateEmployee(id, validated);
    return sendSuccess(res, 'Employee updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = await resolveFileRefsDeep(await hrService.getEmployeeDocuments(id));
    return sendSuccess(res, 'Employee documents retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const uploadEmployeeDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const file = req.file;
    if (!file) {
      return sendError(res, 'file is required (jpg, png, pdf, doc, docx, html, max 20MB)', null, 400);
    }
    const type = (req.body.type as string) || 'OTHER';
    const validTypes = ['OFFER_LETTER', 'ID_PROOF', 'CONTRACT', 'OTHER'];
    if (!validTypes.includes(type)) {
      return sendError(res, 'Invalid document type', null, 400);
    }
    const storedName = safeUploadFilename(file.originalname);
    const relativePath = `uploads/hr/employees/${id}/${storedName}`;
    const { ref: fileUrl } = await storeUploadedFile({
      relativePath,
      buffer: file.buffer,
      contentType: file.mimetype,
    });
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;
    const data = await resolveFileRefsDeep(await hrService.createEmployeeDocument(id, {
      type: type as any,
      fileName: file.originalname,
      fileUrl,
      mimeType: file.mimetype,
      fileSize: file.size,
      expiresAt: req.body.expiresAt || null,
      notes: req.body.notes || null,
      tenantId,
    }));
    return sendSuccess(res, 'Document uploaded successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const createEmployeeDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = createEmployeeDocumentSchema.parse(req.body);
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;
    const data = await resolveFileRefsDeep(await hrService.createEmployeeDocument(id, { ...validated, tenantId }));
    return sendSuccess(res, 'Document created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteEmployeeDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const docId = req.params.docId as string;
    await hrService.deleteEmployeeDocument(id, docId);
    return sendSuccess(res, 'Document deleted successfully', { success: true });
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
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (tenantId == null) return sendError(res, 'No tenant context', null, 403);
    const data = await hrService.getAttendanceSettings(tenantId);
    return sendSuccess(res, 'Attendance settings retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateAttendanceSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (tenantId == null) return sendError(res, 'No tenant context', null, 403);
    const validatedData = updateSettingsSchema.parse(req.body);
    const data = await hrService.updateAttendanceSettings(tenantId, validatedData);
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
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const data = await hrService.getAttendanceEvents(date);
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
    if (!req.user?.id) return sendError(res, 'Unauthorized', null, 401);
    const { ip, coordinates, isCheckOut } = req.body;
    const data = await hrService.submitRemoteClockIn(req.user.id, req.user.email, {
      ip: ip || req.ip || '0.0.0.0',
      coordinates,
      isCheckOut: Boolean(isCheckOut),
    });
    return sendSuccess(res, isCheckOut ? 'Clocked out successfully' : 'Clocked in successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getMyAttendanceProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return sendError(res, 'Unauthorized', null, 401);
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const data = await hrService.getMyAttendance(req.user.id, req.user.email, month, year);
    return sendSuccess(res, 'My attendance retrieved', data);
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
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;
    const data = await hrService.getLeaveTypes(tenantId);
    return sendSuccess(res, 'Leave types retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createLeaveType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (tenantId == null) return sendError(res, 'No tenant context', null, 403);
    const validated = createLeaveTypeSchema.parse(req.body);
    const data = await hrService.createLeaveType(tenantId, validated);
    return sendSuccess(res, 'Leave category created successfully', data, 201);
  } catch (error: any) {
    if (error?.message?.includes('already exists')) {
      return sendError(res, error.message, null, 409);
    }
    next(error);
  }
};

export const updateLeaveType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (tenantId == null) return sendError(res, 'No tenant context', null, 403);
    const validated = updateLeaveTypeSchema.parse(req.body);
    const data = await hrService.updateLeaveType(tenantId, req.params.id as string, validated);
    return sendSuccess(res, 'Leave category updated successfully', data);
  } catch (error: any) {
    if (error?.message?.includes('not found')) return sendError(res, error.message, null, 404);
    if (error?.message?.includes('already exists')) return sendError(res, error.message, null, 409);
    next(error);
  }
};

export const deleteLeaveType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (tenantId == null) return sendError(res, 'No tenant context', null, 403);
    const result = await hrService.deleteLeaveType(tenantId, req.params.id as string);
    return sendSuccess(res, 'Leave category deleted successfully', result);
  } catch (error: any) {
    if (error?.message?.includes('not found')) return sendError(res, error.message, null, 404);
    if (error?.message?.includes('in use')) return sendError(res, error.message, null, 409);
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

// ==========================================
// 12. Onboarding Checklist
// ==========================================

export const getOnboardingChecklists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await resolveFileRefsDeep(await hrService.getOnboardingChecklists());
    return sendSuccess(res, 'Onboarding checklists retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getOnboardingChecklist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = await resolveFileRefsDeep(await hrService.getOnboardingChecklist(id));
    return sendSuccess(res, 'Onboarding checklist retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createOnboardingChecklist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createOnboardingChecklistSchema.parse(req.body);
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;
    const data = await hrService.createOnboardingChecklist({ ...validatedData, tenantId });
    return sendSuccess(res, 'Onboarding checklist created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const getOnboardingTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;
    const data = await hrService.getOnboardingTemplates(tenantId);
    return sendSuccess(res, 'Onboarding templates retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createOnboardingTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (tenantId == null) return sendError(res, 'No tenant context', null, 403);
    const validatedData = createOnboardingTemplateSchema.parse(req.body);
    const data = await hrService.createOnboardingTemplate(tenantId, validatedData);
    return sendSuccess(res, 'Onboarding template created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteOnboardingTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (tenantId == null) return sendError(res, 'No tenant context', null, 403);
    const id = req.params.id as string;
    await hrService.deleteOnboardingTemplate(tenantId, id);
    return sendSuccess(res, 'Onboarding template deleted successfully', { success: true });
  } catch (error) {
    next(error);
  }
};

export const uploadOnboardingItemAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const checklistId = req.params.checklistId as string;
    const itemId = req.params.itemId as string;
    const file = req.file;
    if (!file) return sendError(res, 'file is required', null, 400);
    const storedName = safeUploadFilename(file.originalname);
    const relativePath = `uploads/hr/recruitment/${storedName}`;
    const { ref: attachmentUrl } = await storeUploadedFile({
      relativePath,
      buffer: file.buffer,
      contentType: file.mimetype,
    });
    const data = await resolveFileRefsDeep(await hrService.updateOnboardingItem(checklistId, itemId, {
      status: 'PENDING',
      attachmentUrl,
      attachmentFileName: file.originalname,
    }));
    return sendSuccess(res, 'Attachment uploaded successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateOnboardingItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const checklistId = req.params.checklistId as string;
    const itemId = req.params.itemId as string;
    const validatedData = updateOnboardingItemSchema.parse(req.body);
    const data = await resolveFileRefsDeep(await hrService.updateOnboardingItem(checklistId, itemId, validatedData));
    return sendSuccess(res, 'Onboarding item updated successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 13. Offer Letters
// ==========================================

export const getOfferLetters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getOfferLetters();
    return sendSuccess(res, 'Offer letters retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createOfferLetter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createOfferLetterSchema.parse(req.body);
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;
    const data = await hrService.createOfferLetter(validatedData, { tenantId });
    return sendSuccess(res, 'Offer letter created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const getOfferLetterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = await hrService.getOfferLetterById(id);
    if (!data) return sendError(res, 'Offer letter not found', null, 404);
    return sendSuccess(res, 'Offer letter retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const renderOfferLetter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;
    const data = await hrService.renderOfferLetterHtml(id, { tenantId });
    return sendSuccess(res, 'Offer letter rendered successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getOfferLetterTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;
    const data = await hrService.getOfferLetterTemplates(tenantId);
    return sendSuccess(res, 'Offer letter templates retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createOfferLetterTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (tenantId == null) return sendError(res, 'No tenant context', null, 403);
    const validatedData = createOfferLetterTemplateSchema.parse(req.body);
    const data = await hrService.createOfferLetterTemplate(tenantId, validatedData);
    return sendSuccess(res, 'Offer letter template created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateOfferLetterTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (tenantId == null) return sendError(res, 'No tenant context', null, 403);
    const id = req.params.id as string;
    const validatedData = updateOfferLetterTemplateSchema.parse(req.body);
    const data = await hrService.updateOfferLetterTemplate(tenantId, id, validatedData);
    return sendSuccess(res, 'Offer letter template updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteOfferLetterTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (tenantId == null) return sendError(res, 'No tenant context', null, 403);
    const id = req.params.id as string;
    await hrService.deleteOfferLetterTemplate(tenantId, id);
    return sendSuccess(res, 'Offer letter template deleted successfully', { success: true });
  } catch (error) {
    next(error);
  }
};

export const updateOfferLetterStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = updateOfferLetterStatusSchema.parse(req.body);
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;
    if (status === 'SENT') {
      await hrService.renderOfferLetterHtml(id, { tenantId });
    }
    if (status === 'ACCEPTED') {
      const result = await hrService.acceptOfferLetter(id, { tenantId });
      return sendSuccess(res, 'Offer letter accepted — employee created', result);
    }
    if (status === 'REJECTED') {
      const result = await hrService.rejectOfferLetter(id);
      return sendSuccess(res, 'Offer letter rejected', result);
    }
    const data = await hrService.updateOfferLetterStatus(id, status);
    return sendSuccess(res, 'Offer letter status updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const acceptOfferLetter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId ?? req.user?.tenantId ?? null;
    const onboardingTemplateId = req.body?.onboardingTemplateId as string | undefined;
    const result = await hrService.acceptOfferLetter(id, { tenantId, onboardingTemplateId });
    return sendSuccess(res, 'Offer letter accepted — employee created', result);
  } catch (error) {
    next(error);
  }
};

export const rejectOfferLetter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const notes = req.body?.notes as string | undefined;
    const result = await hrService.rejectOfferLetter(id, notes);
    return sendSuccess(res, 'Offer letter rejected', result);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 14. Interview Scheduling & Feedback
// ==========================================

export const getInterviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getInterviews();
    return sendSuccess(res, 'Interviews retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const scheduleInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = scheduleInterviewSchema.parse(req.body);
    const data = await hrService.scheduleInterview(validatedData);
    return sendSuccess(res, 'Interview scheduled successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const rescheduleInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validatedData = rescheduleInterviewSchema.parse(req.body);
    const data = await hrService.rescheduleInterview(id, validatedData);
    return sendSuccess(res, 'Interview rescheduled successfully', data);
  } catch (error) {
    next(error);
  }
};

export const uploadRecruitmentFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) return sendError(res, 'file is required', null, 400);
    const storedName = safeUploadFilename(file.originalname);
    const relativePath = `uploads/hr/recruitment/${storedName}`;
    const { ref, url } = await storeUploadedFile({
      relativePath,
      buffer: file.buffer,
      contentType: file.mimetype,
    });
    const payload = await resolveFileRefsDeep({
      url,
      ref,
      filename: file.originalname,
      storedAs: storedName,
      size: file.size,
    });
    return sendSuccess(res, 'File uploaded', payload, 201);
  } catch (error) {
    next(error);
  }
};

export const updateInterviewStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = updateInterviewStatusSchema.parse(req.body);
    const data = await hrService.updateInterviewStatus(id, status);
    return sendSuccess(res, 'Interview status updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const submitInterviewFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validatedData = submitInterviewFeedbackSchema.parse(req.body);
    const data = await hrService.submitInterviewFeedback(id, { ...validatedData, submittedAt: new Date().toISOString() });
    return sendSuccess(res, 'Interview feedback submitted successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 15. Job Postings & Candidate Tracking
// ==========================================

export const getJobPostings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getJobPostings();
    return sendSuccess(res, 'Job postings retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createJobPosting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createJobPostingSchema.parse(req.body);
    const data = await hrService.createJobPosting(validatedData);
    return sendSuccess(res, 'Job posting created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateJobPosting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validatedData = updateJobPostingSchema.parse(req.body);
    const data = await hrService.updateJobPosting(id, validatedData);
    return sendSuccess(res, 'Job posting updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateJobPostingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = updateJobPostingStatusSchema.parse(req.body);
    const data = await hrService.updateJobPostingStatus(id, status);
    return sendSuccess(res, 'Job posting status updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getCandidates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = req.query.jobId as string | undefined;
    const data = await resolveFileRefsDeep(await hrService.getCandidates(jobId));
    return sendSuccess(res, 'Candidates retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const addCandidate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = addCandidateSchema.parse(req.body);
    const data = await hrService.addCandidate(validatedData);
    return sendSuccess(res, 'Candidate added successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCandidate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validatedData = updateCandidateSchema.parse(req.body);
    const data = await resolveFileRefsDeep(await hrService.updateCandidate(id, validatedData));
    return sendSuccess(res, 'Candidate updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const uploadCandidateResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const file = req.file;
    if (!file) return sendError(res, 'file is required', null, 400);
    const storedName = safeUploadFilename(file.originalname);
    const relativePath = `uploads/hr/recruitment/${storedName}`;
    const { ref: resumeUrl } = await storeUploadedFile({
      relativePath,
      buffer: file.buffer,
      contentType: file.mimetype,
    });
    const data = await resolveFileRefsDeep(await hrService.updateCandidate(id, { resumeUrl }));
    return sendSuccess(res, 'Resume uploaded successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateCandidateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validatedData = updateCandidateStatusSchema.parse(req.body);
    const changedById = req.user?.id ?? null;
    const data = await resolveFileRefsDeep(
      await hrService.updateCandidateStatus(id, validatedData.status, changedById, validatedData.notes),
    );
    return sendSuccess(res, 'Candidate status updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getCandidateStageEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = await hrService.getCandidateStageEvents(id);
    return sendSuccess(res, 'Candidate stage history retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateCandidateStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validatedData = updateCandidateStageSchema.parse(req.body);
    const changedById = req.user?.id ?? null;
    const data = await resolveFileRefsDeep(
      await hrService.updateCandidateStage(
        id,
        validatedData.stage,
        validatedData.status,
        changedById,
        validatedData.notes,
      ),
    );
    return sendSuccess(res, 'Candidate stage updated successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 16. Processing Performance Metrics
// ==========================================

export const getProcessingMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getProcessingMetrics();
    return sendSuccess(res, 'Processing metrics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const addProcessingMetric = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (tenantId == null) return sendError(res, 'No tenant context', null, 403);
    const validatedData = addProcessingMetricSchema.parse(req.body);
    const data = await hrService.addProcessingMetric(tenantId, validatedData);
    return sendSuccess(res, 'Processing metric saved successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 17. KPI Definitions
// ==========================================

export const getKPIDefinitions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.query.role as string | undefined;
    const data = await hrService.getKPIDefinitions(role);
    return sendSuccess(res, 'KPI definitions retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createKPIDefinition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createKPIDefinitionSchema.parse(req.body);
    const data = await hrService.createKPIDefinition(validatedData);
    return sendSuccess(res, 'KPI definition created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateKPIDefinition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = await hrService.updateKPIDefinition(id, req.body);
    return sendSuccess(res, 'KPI definition updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteKPIDefinition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await hrService.deleteKPIDefinition(id);
    return sendSuccess(res, 'KPI definition deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 18. KPI Metrics
// ==========================================

export const getKPIMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.query.role as string | undefined;
    const period = req.query.period as string | undefined;
    const data = await hrService.getKPIMetrics(role, period);
    return sendSuccess(res, 'KPI metrics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const recordKPIMetric = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = recordKPIMetricSchema.parse(req.body);
    const data = await hrService.recordKPIMetric(validatedData);
    return sendSuccess(res, 'KPI metric recorded successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 19. Marketing Performance
// ==========================================

export const getMarketingPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string | undefined;
    const data = await hrService.getMarketingPerformance(period);
    return sendSuccess(res, 'Marketing performance retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const addMarketingPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = addMarketingPerformanceSchema.parse(req.body);
    const data = await hrService.addMarketingPerformance(validatedData);
    return sendSuccess(res, 'Marketing performance recorded successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 20. Counsellor Performance
// ==========================================

export const getCounsellorPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string | undefined;
    const data = await hrService.getCounsellorPerformance(period);
    return sendSuccess(res, 'Counsellor performance retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const addCounsellorPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = addCounsellorPerformanceSchema.parse(req.body);
    const data = await hrService.addCounsellorPerformance(validatedData);
    return sendSuccess(res, 'Counsellor performance recorded successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 21. Payroll Deductions
// ==========================================

export const getPayrollDeductions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const data = await hrService.getPayrollDeductions(month, year);
    return sendSuccess(res, 'Payroll deductions retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const upsertPayrollDeduction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = upsertPayrollDeductionSchema.parse(req.body);
    const data = await hrService.upsertPayrollDeduction(validatedData);
    return sendSuccess(res, 'Payroll deduction saved successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 22. Performance Reviews
// ==========================================

export const getPerformanceReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string | undefined;
    const data = await hrService.getPerformanceReviews(search);
    return sendSuccess(res, 'Performance reviews retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createPerformanceReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createPerformanceReviewSchema.parse(req.body);
    const data = await hrService.createPerformanceReview(validatedData);
    return sendSuccess(res, 'Performance review created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const updatePerformanceReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validatedData = updatePerformanceReviewSchema.parse(req.body);
    const data = await hrService.updatePerformanceReview(id, validatedData);
    return sendSuccess(res, 'Performance review updated successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 23. Leave Requests
// ==========================================

export const getLeaveRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mine = req.query.mine === 'true';
    const status = req.query.status as string | undefined;
    const data = await hrService.getLeaveRequests({
      ...(mine && req.user?.email ? { mineEmail: req.user.email } : {}),
      ...(status ? { status } : {}),
    });
    return sendSuccess(res, 'Leave requests retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const createLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.email) return sendError(res, 'Unauthorized', null, 401);
    const validated = createLeaveRequestSchema.parse(req.body);
    const data = await hrService.createLeaveRequest(req.user.email, validated);
    await notifyRoles([UserRole.GLOBAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HR], 'hr.leave_request', {
      employeeName: data.employeeName,
      leaveType: data.leaveTypeName,
      from: data.fromDate,
      to: data.toDate,
    });
    return sendSuccess(res, 'Leave request submitted', data, 201);
  } catch (error) {
    next(error);
  }
};

export const processLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = processLeaveRequestSchema.parse(req.body);
    const data = await hrService.processLeaveRequest(id, validated);
    return sendSuccess(res, 'Leave request updated', data);
  } catch (error) {
    next(error);
  }
};

export const cancelLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.email) return sendError(res, 'Unauthorized', null, 401);
    const id = req.params.id as string;
    const data = await hrService.cancelLeaveRequest(id, req.user.email);
    return sendSuccess(res, 'Leave request cancelled', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 24. Dashboard Summary
// ==========================================

export const getDashboardSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getHrDashboardSummary();
    return sendSuccess(res, 'HR dashboard summary', data);
  } catch (error) {
    next(error);
  }
};

export const getHrMeProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return sendError(res, 'Unauthorized', null, 401);
    const data = await hrService.getHrMe(req.user.id, req.user.email);
    return sendSuccess(res, 'HR self-service profile', data);
  } catch (error) {
    next(error);
  }
};
