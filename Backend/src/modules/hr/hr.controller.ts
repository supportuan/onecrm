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
  createEmployeeSchema,
  updateEmployeeSchema,
  uploadDocumentSchema,
  remoteClockInSchema,
  applyLeaveRequestSchema,
  processLeaveApprovalSchema,
  createGroupSchema,
  createBusinessGoalSchema,
  linkBusinessGoalSchema,
  createKpiSchema,
  createPerformanceReviewSchema,
  updatePerformanceReviewSchema,
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

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createEmployeeSchema.parse(req.body);
    const data = await hrService.createEmployee(validated);
    return sendSuccess(res, 'Employee created successfully', data, 201);
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
    const validated = remoteClockInSchema.parse(req.body);
    const data = await hrService.submitRemoteClockIn(validated.employeeId, {
      ip: validated.ip || '',
      coordinates: validated.coordinates,
      isCheckOut: validated.isCheckOut,
    });
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

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (!id?.trim()) return sendError(res, 'Employee ID is required', null, 400);
    const validated = updateEmployeeSchema.parse(req.body);
    const data = await hrService.updateEmployee(id, validated);
    return sendSuccess(res, 'Employee updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const data = await hrService.getEmployeeDocuments(id);
    return sendSuccess(res, 'Employee documents retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const uploadEmployeeDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = uploadDocumentSchema.parse(req.body);
    const data = await hrService.uploadEmployeeDocument(id, validated);
    return sendSuccess(res, 'Employee document uploaded successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteEmployeeDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, docId } = req.params;
    const data = await hrService.deleteEmployeeDocument(id, docId);
    return sendSuccess(res, 'Employee document deleted successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getLeaveRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getLeaveRequests();
    return sendSuccess(res, 'Leave requests retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const applyLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = applyLeaveRequestSchema.parse(req.body);
    const data = await hrService.applyLeaveRequest(validated.employeeId, validated);
    return sendSuccess(res, 'Leave request submitted successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const processLeaveApproval = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = processLeaveApprovalSchema.parse(req.body);
    const data = await hrService.processLeaveApproval(id, validated.role, validated.status, validated.remarks);
    return sendSuccess(res, 'Leave request processed successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getLeaveBalancesReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getLeaveBalancesReport();
    return sendSuccess(res, 'Leave balances report retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getCandidates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getCandidates();
    return sendSuccess(res, 'Candidates retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createCandidate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.createCandidate(req.body);
    return sendSuccess(res, 'Candidate created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCandidate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const data = await hrService.updateCandidate(id, req.body);
    return sendSuccess(res, 'Candidate updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const generateOfferLetterPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { candidateId } = req.params;
    const candidateList = await hrService.getCandidates();
    const candidate = candidateList.find(c => c.id === candidateId);
    if (!candidate) return res.status(404).send('Candidate not found');

    const offeredSalary = candidate.fields.offeredSalary || candidate.fields.expectedSalary || '₹12,00,000';
    const designation = candidate.fields.designation || candidate.role || 'Senior Software Engineer';
    const doj = candidate.fields.doj || '2026-07-01';
    const department = candidate.fields.offerDepartment || candidate.department || 'Engineering';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Offer Letter - ${candidate.name}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: bold; color: #4f46e5; letter-spacing: 1px; }
          .sub-logo { font-size: 12px; color: #666; text-transform: uppercase; margin-top: 5px; }
          .date { text-align: right; font-weight: bold; margin-bottom: 20px; color: #555; }
          .details { margin-bottom: 30px; }
          .details p { margin: 5px 0; }
          .title { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 30px; text-transform: uppercase; color: #1e1b4b; }
          .highlight { font-weight: bold; color: #4f46e5; }
          .footer { margin-top: 60px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #777; text-align: center; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
          .signature-block { width: 200px; text-align: center; border-top: 1px dashed #333; padding-top: 8px; font-size: 14px; font-weight: bold; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>
        <div class="header">
          <div class="logo">OPTIMA GLOBAL</div>
          <div class="sub-logo">AUN Admissions & CRM Solutions Network</div>
        </div>
        <div class="date">Date: ${new Date().toLocaleDateString()}</div>
        
        <div class="details">
          <p><strong>To,</strong></p>
          <p><strong>${candidate.name}</strong></p>
          <p>Email: ${candidate.email}</p>
          <p>Phone: ${candidate.phone}</p>
        </div>

        <div class="title">Letter of Employment Offer</div>

        <p>Dear ${candidate.name},</p>
        
        <p>Following our recent discussions and interview rounds, we are pleased to offer you the position of <span class="highlight">${designation}</span> in the <span class="highlight">${department}</span> department at Optima Global. We believe that your skill set, background, and cultural fitment align exceptionally well with our organization's expansion milestones.</p>
        
        <p>Please find below the terms and details regarding your employment:</p>
        
        <ul>
          <li><strong>Role Designation:</strong> ${designation}</li>
          <li><strong>Allocated Department:</strong> ${department}</li>
          <li><strong>Date of Joining:</strong> ${doj}</li>
          <li><strong>Annual CTC Compensation:</strong> <span class="highlight">${offeredSalary}</span> (Inclusive of basic, allowances, and performance incentive bonuses)</li>
          <li><strong>Work Location:</strong> Chicago / New York HQ (Hybrid Assignment)</li>
        </ul>

        <p>Your employment will be subject to positive reference verifications and the completion of onboarding documents as outlined in our recruitment workflow checklist. We request you to review this offer and confirm your acceptance by signing below and returning a copy to HR within 7 business days.</p>

        <p>We are very excited about the prospect of you joining our engineering and operations network, and we look forward to achieving great milestones together.</p>

        <p>Warm regards,</p>
        
        <p><strong>HR & Talent Acquisition Team</strong><br>Optima Global Group</p>

        <div class="signatures">
          <div class="signature-block">Optima Global Authorized Signatory</div>
          <div class="signature-block">Candidate Acceptance Signature</div>
        </div>

        <div class="footer">
          Optima Global Network • Confidential Business Communication
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(htmlContent);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 13. HR Groups
// ==========================================

export const getGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getGroups();
    return sendSuccess(res, 'HR groups retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createGroupSchema.parse(req.body);
    const data = await hrService.createGroup(validated);
    return sendSuccess(res, 'HR group created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 14. Business Goals
// ==========================================

export const getBusinessGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getBusinessGoals();
    return sendSuccess(res, 'Business goals retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createBusinessGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createBusinessGoalSchema.parse(req.body);
    const data = await hrService.createBusinessGoal(validated);
    return sendSuccess(res, 'Business goal created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const linkBusinessGoalToHr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = linkBusinessGoalSchema.parse(req.body);
    const data = await hrService.linkBusinessGoalToHr(validated.goalId);
    return sendSuccess(res, 'Business goal linked to HR successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 15. Attendance Templates & Reports
// ==========================================

export const getAttendanceTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getAttendanceTemplates();
    return sendSuccess(res, 'Attendance templates retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getAttendanceTemplate(req.params.id as string);
    return sendSuccess(res, 'Attendance template retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceSummaryReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const data = await hrService.getAttendanceSummaryReport(month, year);
    return sendSuccess(res, 'Attendance summary report retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 16. Counselor & Marketing KPIs
// ==========================================

export const getCounselorMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (!id || id === 'null' || id === 'undefined') {
      return sendError(res, 'Counselor ID is required', null, 400);
    }
    const data = await hrService.getCounselorMetrics(id);
    return sendSuccess(res, 'Counselor metrics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getMarketingTeamKpis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.teamId as string;
    if (!teamId || teamId === 'null') {
      return sendError(res, 'Team ID is required', null, 400);
    }
    const data = await hrService.getMarketingTeamKpis(teamId);
    return sendSuccess(res, 'Marketing team KPIs retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 17. KPI Definitions & Performance Reviews
// ==========================================

export const getKpiDefinitions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getKpiDefinitions();
    return sendSuccess(res, 'KPI definitions retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createKpiDefinition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createKpiSchema.parse(req.body);
    const data = await hrService.createKpiDefinition(validated);
    return sendSuccess(res, 'KPI definition created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const getPerformanceReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await hrService.getPerformanceReviews();
    return sendSuccess(res, 'Performance reviews retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createPerformanceReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createPerformanceReviewSchema.parse(req.body);
    const data = await hrService.createPerformanceReview(validated);
    return sendSuccess(res, 'Performance review created successfully', data, 201);
  } catch (error) {
    next(error);
  }
};

export const updatePerformanceReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = updatePerformanceReviewSchema.parse(req.body);
    const data = await hrService.updatePerformanceReview(id, validated);
    return sendSuccess(res, 'Performance review updated successfully', data);
  } catch (error) {
    next(error);
  }
};
