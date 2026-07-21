import { Request, Response, NextFunction } from 'express';
import { ResourceCategory, UserRole } from '@prisma/client';
import { sendError, sendSuccess } from '../../utils/response.js';
import * as service from './resources.service.js';
import { normalizeTargetRoles } from './resources.audience.js';

const numId = (raw: unknown) => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const actor = (req: Request) => ({
  userId: req.user!.id,
  role: req.user!.role as UserRole,
  tenantId: req.tenantId ?? req.user?.tenantId ?? null,
});

const parseTargetRoles = (raw: unknown) => {
  if (Array.isArray(raw)) return normalizeTargetRoles(raw);
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return normalizeTargetRoles(JSON.parse(raw));
    } catch {
      return normalizeTargetRoles(raw.split(',').map((v) => v.trim()));
    }
  }
  return normalizeTargetRoles(['ALL']);
};

const parseCategory = (raw: unknown): ResourceCategory | null => {
  const value = String(raw || 'INHOUSE').toUpperCase();
  return Object.values(ResourceCategory).includes(value as ResourceCategory)
    ? (value as ResourceCategory)
    : null;
};

const parseCountries = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String).map((value) => value.trim()).filter(Boolean);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String).map((value) => value.trim()).filter(Boolean) : [];
  } catch {
    return raw.split(',').map((value) => value.trim()).filter(Boolean);
  }
};

export const listForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await service.listResourcesForUser(actor(req));
    return sendSuccess(res, 'resources', rows);
  } catch (err) {
    next(err);
  }
};

export const listPending = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await service.listPendingAcknowledgements(actor(req));
    return sendSuccess(res, 'pending resources', rows);
  } catch (err) {
    next(err);
  }
};

export const acknowledge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const row = await service.acknowledgeResource({ ...actor(req), resourceId: id });
    return sendSuccess(res, 'resource acknowledged', row);
  } catch (err: any) {
    if (err?.message?.includes('not found') || err?.message?.includes('not available')) {
      return sendError(res, err.message, null, 404);
    }
    if (err?.message?.includes('does not require')) {
      return sendError(res, err.message, null, 400);
    }
    next(err);
  }
};

export const listAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = actor(req);
    const rows = await service.listResourcesAdmin(tenantId);
    return sendSuccess(res, 'resources', rows);
  } catch (err) {
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return sendError(res, 'file is required', null, 400);
    const name = String(req.body?.name || req.file.originalname || '').trim();
    if (!name) return sendError(res, 'name is required', null, 400);
    const category = parseCategory(req.body?.category);
    if (!category) return sendError(res, 'invalid knowledge category', null, 400);
    const targetCountries = parseCountries(req.body?.targetCountries);
    if (category === ResourceCategory.ACADEMICS && targetCountries.length === 0) {
      return sendError(res, 'an academic country is required', null, 400);
    }

    const row = await service.createResource({
      ...actor(req),
      uploadedById: req.user!.id,
      file: req.file,
      name,
      description: req.body?.description ?? null,
      requiresAcknowledgement:
        req.body?.requiresAcknowledgement === true ||
        req.body?.requiresAcknowledgement === 'true',
      targetRoles: parseTargetRoles(req.body?.targetRoles),
      category,
      targetCountries,
      isPublished: req.body?.isPublished !== 'false',
    });
    return sendSuccess(res, 'resource created', row, 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const { tenantId } = actor(req);
    const category =
      req.body?.category !== undefined ? parseCategory(req.body.category) : undefined;
    if (category === null) return sendError(res, 'invalid knowledge category', null, 400);
    const targetCountries =
      req.body?.targetCountries !== undefined ? parseCountries(req.body.targetCountries) : undefined;
    if (category === ResourceCategory.ACADEMICS && !targetCountries?.length) {
      return sendError(res, 'an academic country is required', null, 400);
    }
    const row = await service.updateResource(id, tenantId, {
      name: req.body?.name ? String(req.body.name) : undefined,
      description: req.body?.description !== undefined ? String(req.body.description) : undefined,
      requiresAcknowledgement:
        req.body?.requiresAcknowledgement !== undefined
          ? req.body.requiresAcknowledgement === true || req.body.requiresAcknowledgement === 'true'
          : undefined,
      targetRoles: req.body?.targetRoles !== undefined ? parseTargetRoles(req.body.targetRoles) : undefined,
      category,
      targetCountries,
      isPublished:
        req.body?.isPublished !== undefined
          ? req.body.isPublished === true || req.body.isPublished === 'true'
          : undefined,
      file: req.file,
    });
    return sendSuccess(res, 'resource updated', row);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const { tenantId } = actor(req);
    const row = await service.deleteResource(id, tenantId);
    return sendSuccess(res, 'resource deleted', row);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const listAcknowledgements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const { tenantId } = actor(req);
    const rows = await service.listResourceAcknowledgements(id, tenantId);
    return sendSuccess(res, 'resource acknowledgements', rows);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};
