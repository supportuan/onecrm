import { Request, Response, NextFunction } from 'express';
import { AgencyPartnerStatus, CommissionStatus } from '@prisma/client';
import { sendError, sendSuccess } from '../../utils/response.js';
import * as service from './agency-crm.service.js';

const numId = (raw: unknown) => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const actor = (req: Request) => ({ id: req.user?.id, role: req.user?.role });

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agencyPartnerId = numId(req.query.agencyPartnerId) ?? undefined;
    const stats = await service.getStatistics(actor(req), agencyPartnerId);
    return sendSuccess(res, 'agency statistics', stats);
  } catch (err) {
    next(err);
  }
};

export const listPartners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status =
      typeof req.query.status === 'string' && Object.values(AgencyPartnerStatus).includes(req.query.status as AgencyPartnerStatus)
        ? (req.query.status as AgencyPartnerStatus)
        : undefined;
    const items = await service.listPartners({ search, status, actor: actor(req) });
    return sendSuccess(res, 'agency partners', items);
  } catch (err) {
    next(err);
  }
};

export const getPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const item = await service.getPartner(id, actor(req));
    if (!item) return sendError(res, 'not found', null, 404);
    return sendSuccess(res, 'agency partner', item);
  } catch (err) {
    next(err);
  }
};

export const getMyPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return sendError(res, 'unauthorized', null, 401);
    const item = await service.getPartnerByUserId(req.user.id);
    if (!item) return sendError(res, 'agency profile not found', null, 404);
    return sendSuccess(res, 'my agency profile', item);
  } catch (err) {
    next(err);
  }
};

export const createPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body?.agencyName) return sendError(res, 'agencyName is required', null, 400);
    const created = await service.createPartner(req.body);
    return sendSuccess(res, 'agency partner created', created, 201);
  } catch (err: any) {
    if (err?.message?.includes('already exists') || err?.message?.includes('required')) {
      return sendError(res, err.message, null, 400);
    }
    next(err);
  }
};

export const updatePartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const updated = await service.updatePartner(id, req.body || {}, actor(req));
    return sendSuccess(res, 'agency partner updated', updated);
  } catch (err: any) {
    if (err?.message === 'forbidden') return sendError(res, err.message, null, 403);
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const listLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = numId(req.query.page) ?? undefined;
    const limit = numId(req.query.limit) ?? undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const agencyPartnerId = numId(req.query.agencyPartnerId) ?? undefined;
    const result = await service.listLeads({ page, limit, search, agencyPartnerId, actor: actor(req) });
    return sendSuccess(res, 'agency leads', result);
  } catch (err) {
    next(err);
  }
};

export const listApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = numId(req.query.page) ?? undefined;
    const limit = numId(req.query.limit) ?? undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const agencyPartnerId = numId(req.query.agencyPartnerId) ?? undefined;
    const result = await service.listApplications({ page, limit, search, agencyPartnerId, actor: actor(req) });
    return sendSuccess(res, 'agency applications', result);
  } catch (err) {
    next(err);
  }
};

export const createReferral = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body?.agencyPartnerId) return sendError(res, 'agencyPartnerId is required', null, 400);
    const created = await service.createReferral(req.body, actor(req));
    return sendSuccess(res, 'referral created', created, 201);
  } catch (err: any) {
    if (err?.message === 'forbidden') return sendError(res, err.message, null, 403);
    if (err?.message?.includes('required') || err?.message?.includes('not found')) {
      return sendError(res, err.message, null, 400);
    }
    next(err);
  }
};

export const listCommissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = numId(req.query.page) ?? undefined;
    const limit = numId(req.query.limit) ?? undefined;
    const agencyPartnerId = numId(req.query.agencyPartnerId) ?? undefined;
    const status =
      typeof req.query.status === 'string' && Object.values(CommissionStatus).includes(req.query.status as CommissionStatus)
        ? (req.query.status as CommissionStatus)
        : undefined;
    const result = await service.listCommissions({ page, limit, status, agencyPartnerId, actor: actor(req) });
    return sendSuccess(res, 'commissions', result);
  } catch (err) {
    next(err);
  }
};

export const createCommission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body?.agencyPartnerId || req.body?.amount == null) {
      return sendError(res, 'agencyPartnerId and amount are required', null, 400);
    }
    const created = await service.createCommission(req.body, actor(req));
    return sendSuccess(res, 'commission created', created, 201);
  } catch (err: any) {
    if (err?.message?.includes('only admins') || err?.message?.includes('not found')) {
      return sendError(res, err.message, null, 400);
    }
    next(err);
  }
};

export const updateCommission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const updated = await service.updateCommission(id, req.body || {}, actor(req));
    return sendSuccess(res, 'commission updated', updated);
  } catch (err: any) {
    if (err?.message === 'forbidden') return sendError(res, err.message, null, 403);
    if (err?.message?.includes('not found') || err?.message?.includes('cannot change')) {
      return sendError(res, err.message, null, 400);
    }
    next(err);
  }
};
