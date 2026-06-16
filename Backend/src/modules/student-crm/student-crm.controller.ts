import { Request, Response, NextFunction } from 'express';
import { sendError, sendSuccess } from '../../utils/response.js';
import * as service from './student-crm.service.js';
import { getDefaultChecklist } from './checklists.js';

const numId = (raw: any) => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

// -------------------- Students --------------------

const actor = (req: Request) => ({ id: req.user?.id, role: req.user?.role });

export const listStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const items = await service.listStudents({ search, limit, actor: actor(req) });
    return sendSuccess(res, 'students fetched', items);
  } catch (err) {
    next(err);
  }
};

export const getStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const item = await service.getStudent(id, actor(req));
    if (!item) return sendError(res, 'not found', null, 404);
    return sendSuccess(res, 'student', item);
  } catch (err) {
    next(err);
  }
};

export const getMyStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return sendError(res, 'unauthorized', null, 401);
    const item = await service.getStudentByUserId(req.user.id);
    if (!item) return sendError(res, 'student profile not found', null, 404);
    return sendSuccess(res, 'my student profile', item);
  } catch (err) {
    next(err);
  }
};

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await service.getStatistics(actor(req));
    return sendSuccess(res, 'statistics', stats);
  } catch (err) {
    next(err);
  }
};

export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body?.fullName || !req.body?.email) {
      return sendError(res, 'fullName and email are required', null, 400);
    }
    const created = await service.createStudent(req.body);
    return sendSuccess(res, 'student created', created, 201);
  } catch (err) {
    next(err);
  }
};

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const updated = await service.updateStudent(id, req.body || {}, actor(req));
    return sendSuccess(res, 'student updated', updated);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('enrolled')) return sendError(res, err.message, null, 403);
    next(err);
  }
};

export const updateMyStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return sendError(res, 'unauthorized', null, 401);
    const profile = await service.getStudentByUserId(req.user.id);
    if (!profile) return sendError(res, 'student profile not found', null, 404);
    const updated = await service.updateStudent(profile.id, req.body || {}, actor(req));
    return sendSuccess(res, 'profile updated', updated);
  } catch (err: any) {
    if (err?.message?.includes('enrolled')) return sendError(res, err.message, null, 403);
    next(err);
  }
};

export const setEnrolled = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const isEnrolled = Boolean(req.body?.isEnrolled);
    const updated = await service.setStudentEnrolled(id, isEnrolled, actor(req));
    return sendSuccess(res, 'enrollment updated', updated);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const patchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const { status, notes } = req.body || {};
    if (!status) return sendError(res, 'status is required', null, 400);
    const updated = await service.patchStudentStatus(id, status, notes, actor(req));
    return sendSuccess(res, 'status updated', updated);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('locked')) return sendError(res, err.message, null, 403);
    next(err);
  }
};

// -------------------- Applications --------------------

export const listApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.query.studentId ? numId(req.query.studentId) : undefined;
    const stage = typeof req.query.stage === 'string' ? req.query.stage : undefined;
    const assignedToId = req.query.assignedToId ? numId(req.query.assignedToId) : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const items = await service.listApplications({
      studentId: studentId ?? undefined,
      stage,
      assignedToId: assignedToId ?? undefined,
      search,
      limit,
      actor: actor(req),
    });
    return sendSuccess(res, 'applications fetched', items);
  } catch (err) {
    next(err);
  }
};

export const getApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const item = await service.getApplication(id, actor(req));
    if (!item) return sendError(res, 'not found', null, 404);
    return sendSuccess(res, 'application', item);
  } catch (err) {
    next(err);
  }
};

export const listChecklists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = numId(req.params.id);
    if (!studentId) return sendError(res, 'invalid student id', null, 400);
    const items = await service.listStudentChecklists(studentId, actor(req));
    return sendSuccess(res, 'checklists', items);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const updateChecklistValue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = numId(req.params.id);
    const checkListId = numId(req.params.checkListId);
    if (!studentId || !checkListId) return sendError(res, 'invalid ids', null, 400);
    const item = await service.updateChecklistValue(studentId, checkListId, req.body || {}, actor(req));
    return sendSuccess(res, 'checklist updated', item);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('locked')) return sendError(res, err.message, null, 403);
    next(err);
  }
};

export const listUniversities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = numId(req.params.id);
    if (!studentId) return sendError(res, 'invalid student id', null, 400);
    const items = await service.listStudentUniversities(studentId, actor(req));
    return sendSuccess(res, 'universities', items);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const upsertUniversity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = numId(req.params.id);
    if (!studentId || !req.body?.universityId) return sendError(res, 'student id and universityId required', null, 400);
    const item = await service.upsertStudentUniversity(studentId, req.body, actor(req));
    return sendSuccess(res, 'university saved', item);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('locked')) return sendError(res, err.message, null, 403);
    next(err);
  }
};

export const removeUniversity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = numId(req.params.id);
    const universityId = numId(req.params.universityId);
    if (!studentId || !universityId) return sendError(res, 'invalid ids', null, 400);
    await service.removeStudentUniversity(studentId, universityId, actor(req));
    return sendSuccess(res, 'university removed', { studentId, universityId });
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const createApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, country, university, course } = req.body || {};
    if (!studentId || !country || !university || !course) {
      return sendError(res, 'studentId, country, university, course are required', null, 400);
    }
    const created = await service.createApplication(req.body);
    return sendSuccess(res, 'application created', created, 201);
  } catch (err) {
    next(err);
  }
};

export const updateApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const updated = await service.updateApplication(id, req.body || {});
    return sendSuccess(res, 'application updated', updated);
  } catch (err) {
    next(err);
  }
};

export const advanceStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const { stage, notes } = req.body || {};
    if (!stage) return sendError(res, 'stage is required', null, 400);
    const result = await service.setStage(id, stage, req.user?.id, notes);
    return sendSuccess(res, 'stage updated', result);
  } catch (err) {
    next(err);
  }
};

// -------------------- Documents --------------------

export const upsertDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    if (!applicationId) return sendError(res, 'invalid application id', null, 400);
    const docId = req.params.docId ? numId(req.params.docId) : null;
    const item = await service.upsertDocument(applicationId, docId, req.body || {});
    return sendSuccess(res, 'document saved', item);
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docId = numId(req.params.docId);
    if (!docId) return sendError(res, 'invalid doc id', null, 400);
    await service.deleteDocument(docId);
    return sendSuccess(res, 'document deleted', { id: docId });
  } catch (err) {
    next(err);
  }
};

export const notifyMissing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    if (!applicationId) return sendError(res, 'invalid id', null, 400);
    await service.notifyMissingDocs(applicationId);
    return sendSuccess(res, 'missing-doc notification dispatched', null);
  } catch (err) {
    next(err);
  }
};

// -------------------- Offer / Visa --------------------

export const upsertOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const item = await service.upsertOfferLetter(id, req.body || {});
    return sendSuccess(res, 'offer saved', item);
  } catch (err) {
    next(err);
  }
};

export const upsertVisa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const item = await service.upsertVisaTracking(id, req.body || {});
    return sendSuccess(res, 'visa tracking saved', item);
  } catch (err) {
    next(err);
  }
};

// -------------------- Checklist defaults --------------------

export const getChecklist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as string) || '';
    if (!country) return sendError(res, 'country is required', null, 400);
    return sendSuccess(res, 'default checklist', getDefaultChecklist(country));
  } catch (err) {
    next(err);
  }
};

// -------------------- Lead → Application bridge (Phase 2) --------------------

export const listPromotableLeads = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await service.listPromotableLeads();
    return sendSuccess(res, 'promotable leads', items);
  } catch (err) {
    next(err);
  }
};

export const promoteLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leadId = numId(req.params.leadId);
    if (!leadId) return sendError(res, 'invalid lead id', null, 400);
    const result = await service.promoteLeadToStudent(leadId, req.body || {}, req.user?.id);
    return sendSuccess(res, 'lead promoted to student application', result, 201);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const promoteAllLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const password = typeof req.body?.password === 'string' ? req.body.password : undefined;
    const results = await service.promoteAllLeads(password, req.user?.id);
    return sendSuccess(res, 'batch promote complete', results);
  } catch (err) {
    next(err);
  }
};

export const createFromLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leadId = numId(req.params.leadId);
    if (!leadId) return sendError(res, 'invalid lead id', null, 400);
    const { university, course } = req.body || {};
    if (!university || !course) {
      return sendError(res, 'university and course are required', null, 400);
    }
    const result = await service.createApplicationFromLead(leadId, req.body || {}, req.user?.id);
    return sendSuccess(res, 'lead converted to application', result, 201);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('already converted')) return sendError(res, err.message, null, 409);
    next(err);
  }
};
