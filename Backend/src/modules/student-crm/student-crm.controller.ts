import { Request, Response, NextFunction } from 'express';
import { sendError, sendSuccess } from '../../utils/response.js';
import * as service from './student-crm.service.js';
import { getFormOptions as loadFormOptions } from '../crm-settings/crm-settings.service.js';
import { resolveFileRefsDeep, safeUploadFilename, storeUploadedFile } from '../../lib/file-storage.js';
import { isStudentRole } from './scoping.js';
import { getApplicationReadiness } from './application-gates.js';
import * as paymentsService from './payments.service.js';

const numId = (raw: any) => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

// -------------------- Students --------------------

const actor = (req: Request) => ({
  id: req.user?.id,
  role: req.user?.role,
  email: req.user?.email,
});

const assertApplicationAccess = async (req: Request, applicationId: number) => {
  const app = await service.getApplication(applicationId, actor(req));
  if (!app) return null;
  return app;
};

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
    const item = await resolveFileRefsDeep(await service.getStudentByUserId(req.user.id));
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
    const updated = await service.updateMyStudentProfile(req.user.id, req.body || {});
    return sendSuccess(res, 'profile updated', updated);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('enrolled')) return sendError(res, err.message, null, 403);
    if (err?.message?.includes('counsellor')) return sendError(res, err.message, null, 403);
    next(err);
  }
};

export const uploadMyProfilePhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return sendError(res, 'unauthorized', null, 401);
    const file = req.file;
    if (!file) {
      return sendError(res, 'image is required (jpg, jpeg, png, webp, max 5MB)', null, 400);
    }

    const storedName = safeUploadFilename(file.originalname);
    const relativePath = `uploads/student-crm/profiles/${req.user.id}/${storedName}`;
    const { ref: fileUrl } = await storeUploadedFile({
      relativePath,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    const updated = await resolveFileRefsDeep(await service.uploadMyProfilePhoto(req.user.id, fileUrl));
    return sendSuccess(res, 'profile photo updated', updated);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const listMyApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return sendError(res, 'unauthorized', null, 401);
    const items = await resolveFileRefsDeep(await service.listMyApplications(req.user.id));
    return sendSuccess(res, 'my applications', items);
  } catch (err) {
    next(err);
  }
};

export const getFormOptions = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await loadFormOptions();
    return sendSuccess(res, 'form options', data);
  } catch (err) {
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
    const item = await resolveFileRefsDeep(await service.getApplication(id, actor(req)));
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

export const listStudyPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = numId(req.params.id);
    if (!studentId) return sendError(res, 'invalid student id', null, 400);
    const items = await service.listStudentStudyPlans(studentId, actor(req));
    return sendSuccess(res, 'study plans', items);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const createStudyPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = numId(req.params.id);
    if (!studentId) return sendError(res, 'invalid student id', null, 400);
    const item = await service.createStudentStudyPlan(studentId, req.body || {}, actor(req));
    return sendSuccess(res, 'study plan created', item, 201);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('locked')) return sendError(res, err.message, null, 403);
    next(err);
  }
};

export const updateStudyPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = numId(req.params.id);
    const planId = numId(req.params.planId);
    if (!studentId || !planId) return sendError(res, 'invalid ids', null, 400);
    const item = await service.updateStudentStudyPlan(studentId, planId, req.body || {}, actor(req));
    return sendSuccess(res, 'study plan updated', item);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('locked')) return sendError(res, err.message, null, 403);
    next(err);
  }
};

export const removeStudyPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = numId(req.params.id);
    const planId = numId(req.params.planId);
    if (!studentId || !planId) return sendError(res, 'invalid ids', null, 400);
    await service.removeStudentStudyPlan(studentId, planId, actor(req));
    return sendSuccess(res, 'study plan removed', { studentId, planId });
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('locked')) return sendError(res, err.message, null, 403);
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
    const app = await assertApplicationAccess(req, id);
    if (!app) return sendError(res, 'not found', null, 404);
    const updated = await service.updateApplication(id, req.body || {});
    return sendSuccess(res, 'application updated', updated);
  } catch (err) {
    next(err);
  }
};

export const bulkAssignApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = Array.isArray(req.body?.applicationIds) ? req.body.applicationIds : [];
    const rawAssignee = req.body?.assignedToId;
    const assignedToId =
      rawAssignee === null || rawAssignee === '' || rawAssignee === undefined
        ? null
        : numId(rawAssignee);
    if (rawAssignee != null && rawAssignee !== '' && !assignedToId) {
      return sendError(res, 'invalid assignedToId', null, 400);
    }
    const result = await service.bulkAssignApplications(ids, assignedToId, actor(req));
    return sendSuccess(res, 'applications assigned', result);
  } catch (err: any) {
    if (err?.message?.includes('required')) return sendError(res, err.message, null, 400);
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const advanceStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const { stage, notes } = req.body || {};
    if (!stage) return sendError(res, 'stage is required', null, 400);
    const app = await assertApplicationAccess(req, id);
    if (!app) return sendError(res, 'not found', null, 404);
    const result = await service.setStage(id, stage, req.user?.id, notes);
    return sendSuccess(res, 'stage updated', result);
  } catch (err: any) {
    if (err?.message?.includes('Cannot advance')) return sendError(res, err.message, null, 400);
    next(err);
  }
};

// -------------------- Documents --------------------

export const upsertDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    if (!applicationId) return sendError(res, 'invalid application id', null, 400);
    const docId = req.params.docId ? numId(req.params.docId) : null;

    const app = await assertApplicationAccess(req, applicationId);
    if (!app) return sendError(res, 'not found', null, 404);

    const body = { ...(req.body || {}) };
    if (isStudentRole(req.user?.role)) {
      return sendError(res, 'forbidden', null, 403);
    }

    const item = await resolveFileRefsDeep(await service.upsertDocument(applicationId, docId, body));
    return sendSuccess(res, 'document saved', item);
  } catch (err) {
    next(err);
  }
};

export const uploadApplicationDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    const docId = numId(req.params.docId);
    if (!applicationId || !docId) return sendError(res, 'invalid application or document id', null, 400);

    const app = await assertApplicationAccess(req, applicationId);
    if (!app) return sendError(res, 'not found', null, 404);

    const doc = (app.documents || []).find((d: { id: number }) => d.id === docId);
    if (!doc) return sendError(res, 'document not found on this application', null, 404);

    if (isStudentRole(req.user?.role)) {
      if (!['PENDING', 'REJECTED'].includes(doc.status)) {
        return sendError(res, 'this document cannot be uploaded right now', null, 403);
      }
    }

    const file = req.file;
    if (!file) {
      return sendError(res, 'file is required (jpg, png, pdf, doc, docx, max 20MB)', null, 400);
    }

    const storedName = safeUploadFilename(file.originalname);
    const relativePath = `uploads/student-crm/applications/${applicationId}/documents/${docId}/${storedName}`;
    const { ref: fileUrl } = await storeUploadedFile({
      relativePath,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    const item = await resolveFileRefsDeep(
      await service.upsertDocument(applicationId, docId, {
        filename: file.originalname,
        fileUrl,
        status: 'UPLOADED',
        ...(isStudentRole(req.user?.role) ? { notes: '' } : {}),
      }),
    );

    if (isStudentRole(req.user?.role) && app.assignedToId) {
      await service.notifyDocumentUploaded(applicationId, docId, req.user?.id);
    }

    return sendSuccess(res, 'document uploaded', item, 201);
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
    const item = await resolveFileRefsDeep(
      await service.upsertOfferLetter(id, req.body || {}, req.user?.id)
    );
    return sendSuccess(res, 'offer saved', item);
  } catch (err) {
    next(err);
  }
};

export const uploadOfferLetter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    if (!applicationId) return sendError(res, 'invalid application id', null, 400);

    const file = req.file;
    if (!file) {
      return sendError(res, 'file is required (jpg, png, pdf, doc, docx, max 20MB)', null, 400);
    }

    const storedName = safeUploadFilename(file.originalname);
    const relativePath = `uploads/student-crm/applications/${applicationId}/offer/${storedName}`;
    const { ref: fileUrl } = await storeUploadedFile({
      relativePath,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    const item = await resolveFileRefsDeep(
      await service.upsertOfferLetter(applicationId, {
        filename: file.originalname,
        fileUrl,
        receivedAt: new Date().toISOString().slice(0, 10),
      }, req.user?.id),
    );
    return sendSuccess(res, 'offer letter uploaded', item, 201);
  } catch (err) {
    next(err);
  }
};

export const upsertVisa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const item = await resolveFileRefsDeep(await service.upsertVisaTracking(id, req.body || {}));
    return sendSuccess(res, 'visa tracking saved', item);
  } catch (err) {
    next(err);
  }
};

export const uploadVisaDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    if (!applicationId) return sendError(res, 'invalid application id', null, 400);

    const file = req.file;
    if (!file) {
      return sendError(res, 'file is required (jpg, png, pdf, doc, docx, max 20MB)', null, 400);
    }

    const storedName = safeUploadFilename(file.originalname);
    const relativePath = `uploads/student-crm/applications/${applicationId}/visa/${storedName}`;
    const { ref: fileUrl } = await storeUploadedFile({
      relativePath,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    const label = typeof req.body?.label === 'string' ? req.body.label : undefined;
    const item = await resolveFileRefsDeep(
      await service.appendVisaDocumentFile(applicationId, {
        fileUrl,
        filename: file.originalname,
        label,
      }),
    );
    return sendSuccess(res, 'visa document uploaded', item, 201);
  } catch (err) {
    next(err);
  }
};

export const upsertVisaChecklistDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    if (!applicationId) return sendError(res, 'invalid application id', null, 400);
    const docId = req.params.docId ? numId(req.params.docId) : null;
    const app = await assertApplicationAccess(req, applicationId);
    if (!app) return sendError(res, 'not found', null, 404);
    if (isStudentRole(req.user?.role)) return sendError(res, 'forbidden', null, 403);
    const item = await resolveFileRefsDeep(
      await service.upsertVisaDocument(applicationId, docId, req.body || {}),
    );
    return sendSuccess(res, 'visa document saved', item);
  } catch (err) {
    next(err);
  }
};

export const uploadVisaChecklistDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    const docId = numId(req.params.docId);
    if (!applicationId || !docId) return sendError(res, 'invalid application or document id', null, 400);

    const app = await assertApplicationAccess(req, applicationId);
    if (!app) return sendError(res, 'not found', null, 404);

    const docs = app.visaTracking?.visaDocuments || [];
    const doc = docs.find((d: { id: number }) => d.id === docId);
    if (!doc) return sendError(res, 'visa document not found on this application', null, 404);

    if (isStudentRole(req.user?.role)) {
      if (!['PENDING', 'REJECTED'].includes(doc.status)) {
        return sendError(res, 'this document cannot be uploaded right now', null, 403);
      }
    }

    const file = req.file;
    if (!file) {
      return sendError(res, 'file is required (jpg, png, pdf, doc, docx, max 20MB)', null, 400);
    }

    const storedName = safeUploadFilename(file.originalname);
    const relativePath = `uploads/student-crm/applications/${applicationId}/visa/${docId}/${storedName}`;
    const { ref: fileUrl } = await storeUploadedFile({
      relativePath,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    const item = await resolveFileRefsDeep(
      await service.upsertVisaDocument(applicationId, docId, {
        filename: file.originalname,
        fileUrl,
        status: 'UPLOADED',
        ...(isStudentRole(req.user?.role) ? { notes: '' } : {}),
      }),
    );

    if (isStudentRole(req.user?.role) && app.assignedToId) {
      await service.notifyVisaDocumentUploaded(applicationId, item?.name || 'Visa document');
    }

    return sendSuccess(res, 'visa document uploaded', item, 201);
  } catch (err) {
    next(err);
  }
};

export const deleteVisaChecklistDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    const docId = numId(req.params.docId);
    if (!applicationId || !docId) return sendError(res, 'invalid id', null, 400);
    await service.deleteVisaDocument(applicationId, docId);
    return sendSuccess(res, 'visa document deleted', { id: docId });
  } catch (err) {
    next(err);
  }
};

// -------------------- Application tasks --------------------

export const listApplicationTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    if (!applicationId) return sendError(res, 'invalid application id', null, 400);
    const app = await assertApplicationAccess(req, applicationId);
    if (!app) return sendError(res, 'not found', null, 404);
    const items = await service.listApplicationTasks(applicationId);
    return sendSuccess(res, 'tasks', items);
  } catch (err) {
    next(err);
  }
};

export const createApplicationTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    if (!applicationId) return sendError(res, 'invalid application id', null, 400);
    const app = await assertApplicationAccess(req, applicationId);
    if (!app) return sendError(res, 'not found', null, 404);
    const title = String(req.body?.title || '').trim();
    if (!title) return sendError(res, 'title is required', null, 400);
    const item = await service.createApplicationTask(
      applicationId,
      {
        title,
        description: req.body?.description,
        assignedToId: req.body?.assignedToId != null ? Number(req.body.assignedToId) : undefined,
        dueDate: req.body?.dueDate,
        status: req.body?.status,
      },
      req.user?.id,
    );
    return sendSuccess(res, 'task created', item, 201);
  } catch (err) {
    next(err);
  }
};

export const updateApplicationTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    const taskId = numId(req.params.taskId);
    if (!applicationId || !taskId) return sendError(res, 'invalid id', null, 400);
    const app = await assertApplicationAccess(req, applicationId);
    if (!app) return sendError(res, 'not found', null, 404);
    const item = await service.updateApplicationTask(applicationId, taskId, {
      ...(req.body?.title !== undefined && { title: String(req.body.title) }),
      ...(req.body?.description !== undefined && { description: req.body.description }),
      ...(req.body?.assignedToId !== undefined && {
        assignedToId: req.body.assignedToId == null ? null : Number(req.body.assignedToId),
      }),
      ...(req.body?.dueDate !== undefined && { dueDate: req.body.dueDate }),
      ...(req.body?.status !== undefined && { status: req.body.status }),
    });
    return sendSuccess(res, 'task updated', item);
  } catch (err) {
    next(err);
  }
};

export const deleteApplicationTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    const taskId = numId(req.params.taskId);
    if (!applicationId || !taskId) return sendError(res, 'invalid id', null, 400);
    const app = await assertApplicationAccess(req, applicationId);
    if (!app) return sendError(res, 'not found', null, 404);
    const item = await service.deleteApplicationTask(applicationId, taskId);
    return sendSuccess(res, 'task deleted', item);
  } catch (err) {
    next(err);
  }
};

// -------------------- Checklist defaults --------------------

export const getChecklist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as string) || '';
    if (!country) return sendError(res, 'country is required', null, 400);
    const university = typeof req.query.university === 'string' ? req.query.university : undefined;
    const items = await service.resolveChecklistForCountry(country, university);
    return sendSuccess(res, 'checklist', items);
  } catch (err) {
    next(err);
  }
};

export const getProcessStages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = typeof req.query.country === 'string' ? req.query.country : undefined;
    return sendSuccess(res, 'process stages', service.getProcessStages(country));
  } catch (err) {
    next(err);
  }
};

export const listChecklistTemplates = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await service.listChecklistTemplates();
    return sendSuccess(res, 'checklist templates', items);
  } catch (err) {
    next(err);
  }
};

export const createChecklistTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country, university, documents } = req.body || {};
    if (!country || !Array.isArray(documents)) {
      return sendError(res, 'country and documents array are required', null, 400);
    }
    const created = await service.createChecklistTemplate({ country, university, documents });
    return sendSuccess(res, 'template created', created, 201);
  } catch (err) {
    next(err);
  }
};

export const updateChecklistTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const updated = await service.updateChecklistTemplate(id, req.body || {});
    return sendSuccess(res, 'template updated', updated);
  } catch (err) {
    next(err);
  }
};

export const deleteChecklistTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    await service.deleteChecklistTemplate(id);
    return sendSuccess(res, 'template deleted', { id });
  } catch (err) {
    next(err);
  }
};

export const listVisaTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await resolveFileRefsDeep(await service.listVisaTracking(actor(req)));
    return sendSuccess(res, 'visa tracking', items);
  } catch (err) {
    next(err);
  }
};

export const studentOfferDecision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    const decision = req.body?.decision;
    if (!id || !req.user?.id) return sendError(res, 'invalid request', null, 400);
    if (decision !== 'ACCEPTED' && decision !== 'REJECTED') {
      return sendError(res, 'decision must be ACCEPTED or REJECTED', null, 400);
    }
    const result = await resolveFileRefsDeep(
      await service.studentRespondToOffer(id, req.user.id, decision)
    );
    return sendSuccess(res, 'offer decision recorded', result);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('already')) return sendError(res, err.message, null, 409);
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

// -------------------- Payments & readiness --------------------

export const getApplicationReadinessHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const app = await assertApplicationAccess(req, id);
    if (!app) return sendError(res, 'not found', null, 404);
    const readiness = await getApplicationReadiness(id);
    return sendSuccess(res, 'readiness', readiness);
  } catch (err) {
    next(err);
  }
};

export const listApplicationFeesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const app = await assertApplicationAccess(req, id);
    if (!app) return sendError(res, 'not found', null, 404);
    const fees = await paymentsService.listApplicationFees(id);
    return sendSuccess(res, 'fees', fees);
  } catch (err) {
    next(err);
  }
};

export const upsertApplicationFeeHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const { label, amountInr, feeType, required, dueDate } = req.body || {};
    if (!label || amountInr == null) {
      return sendError(res, 'label and amountInr are required', null, 400);
    }
    const fee = await paymentsService.upsertApplicationFee(id, {
      id: numId(req.body?.id) ?? undefined,
      label,
      amountInr: Number(amountInr),
      feeType,
      required,
      dueDate,
    });
    return sendSuccess(res, 'fee saved', fee);
  } catch (err: any) {
    if (err?.message?.includes('greater than zero')) return sendError(res, err.message, null, 400);
    next(err);
  }
};

export const listMyPaymentsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return sendError(res, 'unauthorized', null, 401);
    const items = await paymentsService.listMyPayments(req.user.id);
    return sendSuccess(res, 'my payments', items);
  } catch (err) {
    next(err);
  }
};

export const getPaymentReceiptHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paymentId = numId(req.params.id);
    if (!paymentId || !req.user?.id) return sendError(res, 'invalid request', null, 400);
    const result = await paymentsService.getPaymentReceipt(
      paymentId,
      req.user.id,
      req.user.role,
    );
    return sendSuccess(res, 'payment receipt', result);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('only available')) return sendError(res, err.message, null, 400);
    next(err);
  }
};

export const createPaymentOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    const feeId = numId(req.body?.feeId);
    if (!applicationId || !feeId || !req.user?.id) {
      return sendError(res, 'invalid request', null, 400);
    }
    const order = await paymentsService.createPaymentOrder(applicationId, feeId, req.user.id);
    return sendSuccess(res, 'payment order created', order);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    if (err?.message?.includes('already been paid')) return sendError(res, err.message, null, 409);
    if (err?.message?.includes('upload all required')) return sendError(res, err.message, null, 400);
    if (err?.message?.includes('Razorpay')) return sendError(res, err.message, null, 503);
    next(err);
  }
};

export const verifyPaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = numId(req.params.id);
    if (!applicationId || !req.user?.id) return sendError(res, 'invalid request', null, 400);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, 'razorpay payment details are required', null, 400);
    }
    const result = await paymentsService.verifyPayment(applicationId, req.user.id, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    return sendSuccess(res, 'payment verified', result);
  } catch (err: any) {
    if (err?.message?.includes('invalid')) return sendError(res, err.message, null, 400);
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};
