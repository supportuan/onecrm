import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { sendError, sendSuccess } from '../../utils/response.js';
import * as service from './training.service.js';
import * as classes from './training-classes.js';

const numId = (raw: unknown) => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const actor = (req: Request) => ({
  userId: req.user!.id,
  role: req.user!.role as UserRole,
});

const handle = (err: unknown, res: Response, next: NextFunction) => {
  if (err instanceof service.TrainingError) {
    return sendError(res, err.message, null, err.status);
  }
  return next(err);
};

export const dashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listDashboard(actor(req));
    return sendSuccess(res, 'training dashboard', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const getCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await service.getCourseForUser(actor(req), id);
    return sendSuccess(res, 'training course', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const enroll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await service.enrollSelf(actor(req), id);
    return sendSuccess(res, 'enrolled', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const completeLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await service.completeLesson(actor(req), id);
    return sendSuccess(res, 'lesson completed', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const listAdmin = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listAdminCourses();
    return sendSuccess(res, 'training courses', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.createCourse(actor(req), req.body || {});
    return sendSuccess(res, 'course created', data, 201);
  } catch (err) {
    handle(err, res, next);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await service.updateCourse(id, req.body || {});
    return sendSuccess(res, 'course updated', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const removeCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await service.deleteCourse(id);
    return sendSuccess(res, 'course deleted', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const addLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await service.addLesson(id, req.body || {});
    return sendSuccess(res, 'lesson added', data, 201);
  } catch (err) {
    handle(err, res, next);
  }
};

export const updateLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await service.updateLesson(id, req.body || {});
    return sendSuccess(res, 'lesson updated', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const removeLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await service.deleteLesson(id);
    return sendSuccess(res, 'lesson deleted', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const listEnrollments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await service.listEnrollments(id);
    return sendSuccess(res, 'enrollments', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const assignEnrollment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    const userId = numId(req.body?.userId);
    if (!id || !userId) return sendError(res, 'course id and userId are required', null, 400);
    const data = await service.assignEnrollment(actor(req), id, userId);
    return sendSuccess(res, 'user assigned', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const removeEnrollment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await service.removeEnrollment(id);
    return sendSuccess(res, 'enrollment removed', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listAssignableUsers(
      typeof req.query.q === 'string' ? req.query.q : '',
      typeof req.query.audience === 'string' ? req.query.audience : '',
    );
    return sendSuccess(res, 'users', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const listClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await classes.listAdminBatches({
      programType: typeof req.query.programType === 'string' ? req.query.programType : undefined,
      deliveryMode: typeof req.query.deliveryMode === 'string' ? req.query.deliveryMode : undefined,
    });
    return sendSuccess(res, 'training classes', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const getClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await classes.getBatch(id, actor(req));
    return sendSuccess(res, 'training class', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const createClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await classes.createBatch(actor(req), req.body || {});
    return sendSuccess(res, 'class created', data, 201);
  } catch (err) {
    handle(err, res, next);
  }
};

export const updateClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await classes.updateBatch(id, req.body || {});
    return sendSuccess(res, 'class updated', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const removeClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await classes.deleteBatch(id);
    return sendSuccess(res, 'class deleted', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const addClassStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    const userId = numId(req.body?.userId);
    if (!id || !userId) return sendError(res, 'class id and userId are required', null, 400);
    const data = await classes.addBatchMember(actor(req), id, userId);
    return sendSuccess(res, 'student added', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const removeClassStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await classes.removeBatchMember(id);
    return sendSuccess(res, 'student removed', data);
  } catch (err) {
    handle(err, res, next);
  }
};

export const setClassSeatPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const data = await classes.setMemberPaymentStatus(id, req.body?.paymentStatus);
    return sendSuccess(res, 'seat payment updated', data);
  } catch (err) {
    handle(err, res, next);
  }
};
