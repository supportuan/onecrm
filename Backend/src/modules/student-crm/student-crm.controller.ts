import { Request, Response, NextFunction } from 'express';
import { sendError, sendSuccess } from '../../utils/response.js';
import * as service from './student-crm.service.js';
import { getDefaultChecklist } from './checklists.js';

const numId = (raw: any) => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

// -------------------- Students --------------------

export const listStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const items = await service.listStudents({ search, limit });
    return sendSuccess(res, 'students fetched', items);
  } catch (err) {
    next(err);
  }
};

export const getStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const item = await service.getStudent(id);
    if (!item) return sendError(res, 'not found', null, 404);
    return sendSuccess(res, 'student', item);
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
    const updated = await service.updateStudent(id, req.body || {});
    return sendSuccess(res, 'student updated', updated);
  } catch (err) {
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
    const item = await service.getApplication(id);
    if (!item) return sendError(res, 'not found', null, 404);
    return sendSuccess(res, 'application', item);
  } catch (err) {
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
