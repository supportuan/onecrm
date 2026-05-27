import { Request, Response, NextFunction } from 'express';
import * as agentService from './agent.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const getAgentId = (req: Request) => (req as any).user?.id as string;
const getRole = (req: Request) => String((req as any).user?.role || '').toUpperCase();

const resolveAgent = async (req: Request) => {
  const role = getRole(req);
  if (role === 'AGENT') {
    return agentService.getAgentById(getAgentId(req));
  }
  const email = (req as any).user?.email;
  if (email) return agentService.getAgentByEmail(email);
  return null;
};

const requireAgent = async (req: Request, res: Response) => {
  const agent = await resolveAgent(req);
  if (!agent) {
    sendError(res, 'Agent profile not found', null, 404);
    return null;
  }
  return agent;
};

const requirePermission = (agent: agentService.AgentProfile, permission: string, res: Response) => {
  if (!agentService.hasPermission(agent as agentService.AgentProfile, permission)) {
    sendError(res, `Forbidden: contract does not include ${permission}`, null, 403);
    return false;
  }
  return true;
};

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await requireAgent(req, res);
    if (!agent) return;
    const data = await agentService.getAgentDashboard(agent.id);
    return sendSuccess(res, 'Agent dashboard retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await requireAgent(req, res);
    if (!agent) return;
    return sendSuccess(res, 'Agent profile retrieved', agent);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await requireAgent(req, res);
    if (!agent) return;
    if (!requirePermission(agent as agentService.AgentProfile, 'VIEW_PROFILE', res)) return;

    const updated = await agentService.updateMyProfile(agent.id, req.body);
    return sendSuccess(res, 'Agent profile updated', updated);
  } catch (error) {
    next(error);
  }
};

export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await requireAgent(req, res);
    if (!agent) return;
    if (!requirePermission(agent as agentService.AgentProfile, 'VIEW_ASSOCIATED_STUDENTS', res)) return;

    const data = await agentService.getMyStudents(agent.id);
    return sendSuccess(res, 'Associated students retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const getStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await requireAgent(req, res);
    if (!agent) return;
    if (!requirePermission(agent as agentService.AgentProfile, 'VIEW_ASSOCIATED_STUDENTS', res)) return;

    const studentId = String(req.params.studentId);
    const data = await agentService.getMyStudentById(agent.id, studentId);
    if (!data) return sendError(res, 'Student not found or not associated', null, 404);
    return sendSuccess(res, 'Student profile retrieved', data);
  } catch (error: any) {
    if (error.message?.includes('Access denied')) {
      return sendError(res, error.message, null, 403);
    }
    next(error);
  }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await requireAgent(req, res);
    if (!agent) return;
    if (!requirePermission(agent as agentService.AgentProfile, 'VIEW_ASSOCIATED_STUDENTS', res)) return;

    const studentId = String(req.params.studentId);
    const data = await agentService.getStudentDocuments(agent.id, studentId);
    return sendSuccess(res, 'Student documents retrieved', data);
  } catch (error: any) {
    if (error.message?.includes('Access denied')) {
      return sendError(res, error.message, null, 403);
    }
    next(error);
  }
};

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await requireAgent(req, res);
    if (!agent) return;
    if (!requirePermission(agent as agentService.AgentProfile, 'MANAGE_STUDENT_DOCUMENTS', res)) return;

    const studentId = String(req.params.studentId);
    const data = await agentService.uploadStudentDocument(agent.id, studentId, req.body);
    return sendSuccess(res, 'Document uploaded', data, 201);
  } catch (error: any) {
    if (error.message?.includes('Access denied')) {
      return sendError(res, error.message, null, 403);
    }
    next(error);
  }
};

export const getUniversityPocs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await requireAgent(req, res);
    if (!agent) return;
    if (!requirePermission(agent as agentService.AgentProfile, 'CONTACT_UNIVERSITY_POC', res)) return;

    const data = await agentService.getUniversityPocsForAgent(agent.id);
    return sendSuccess(res, 'University POCs retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const contactPoc = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await requireAgent(req, res);
    if (!agent) return;
    if (!requirePermission(agent as agentService.AgentProfile, 'CONTACT_UNIVERSITY_POC', res)) return;

    const pocId = String(req.params.pocId);
    const data = await agentService.contactUniversityPoc(agent.id, pocId, req.body);
    return sendSuccess(res, 'University POC contacted', data, 201);
  } catch (error: any) {
    if (error.message?.includes('Access denied') || error.message?.includes('not found')) {
      return sendError(res, error.message, null, 403);
    }
    next(error);
  }
};

export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await requireAgent(req, res);
    if (!agent) return;
    if (!requirePermission(agent as agentService.AgentProfile, 'MAKE_TUITION_PAYMENTS', res)) return;

    const data = await agentService.getMyPayments(agent.id);
    return sendSuccess(res, 'Tuition payments retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await requireAgent(req, res);
    if (!agent) return;
    if (!requirePermission(agent as agentService.AgentProfile, 'MAKE_TUITION_PAYMENTS', res)) return;

    const data = await agentService.createTuitionPayment(agent.id, req.body);
    return sendSuccess(res, 'Tuition payment initiated', data, 201);
  } catch (error: any) {
    if (error.message?.includes('Access denied')) {
      return sendError(res, error.message, null, 403);
    }
    next(error);
  }
};

export const listAgents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = getRole(req);
    if (!['SUPER_ADMIN', 'HR_MANAGER', 'ADMIN'].includes(role)) {
      return sendError(res, 'Forbidden', null, 403);
    }
    const data = await agentService.listAgents();
    return sendSuccess(res, 'Agents listed', data);
  } catch (error) {
    next(error);
  }
};

export const onboardAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = getRole(req);
    if (!['SUPER_ADMIN', 'HR_MANAGER', 'ADMIN'].includes(role)) {
      return sendError(res, 'Forbidden', null, 403);
    }
    const data = await agentService.onboardAgent(req.body);
    return sendSuccess(res, 'Agent onboarded successfully', data, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Onboarding failed', null, 400);
  }
};

export const getContractTiers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = agentService.getContractTiers();
    return sendSuccess(res, 'Contract tiers retrieved', data);
  } catch (error) {
    next(error);
  }
};
