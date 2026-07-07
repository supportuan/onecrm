import { Request, Response, NextFunction } from 'express';
import { AgencyOnboardingStage, AgencyPartnerStatus, CommissionStatus } from '@prisma/client';
import { sendError, sendSuccess } from '../../utils/response.js';
import * as service from './agency-crm.service.js';
import {
  advancePartnerOnboarding,
  provisionPartnerFromAgentUser,
  setPartnerStatus,
  signPartnerAgreement,
  submitPartnerOnboardingDocs,
} from './agency-partner.lifecycle.js';
import {
  listCommissionRules,
  upsertCommissionRule,
  deleteCommissionRule,
  getCommissionStatement,
} from './agency-commission.engine.js';
import {
  broadcastToAgents,
  listPartnerActivities,
  logPartnerActivity,
  listPartnerDocuments,
  uploadPartnerDocument,
  deletePartnerDocument,
} from './agency-communications.service.js';
import { AgencyReferralConflictError } from './agency-referral.service.js';

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
    if (err instanceof AgencyReferralConflictError) return sendError(res, err.message, null, 409);
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

export const provisionMyPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) return sendError(res, 'unauthorized', null, 401);
    const partner = await provisionPartnerFromAgentUser(req.user.id);
    if (!partner) return sendError(res, 'unable to provision agency profile', null, 400);
    return sendSuccess(res, 'agency profile ready', partner);
  } catch (err) {
    next(err);
  }
};

export const advanceOnboarding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    const stage = req.body?.stage as AgencyOnboardingStage;
    if (!id || !stage) return sendError(res, 'id and stage required', null, 400);
    const updated = await advancePartnerOnboarding(id, stage, req.user?.id);
    return sendSuccess(res, 'onboarding updated', updated);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const updatePartnerStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    const status = req.body?.status as AgencyPartnerStatus;
    if (!id || !status) return sendError(res, 'id and status required', null, 400);
    const updated = await setPartnerStatus(id, status, req.user?.id);
    return sendSuccess(res, 'partner status updated', updated);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const signAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id || !req.user?.id) return sendError(res, 'invalid request', null, 400);
    const updated = await signPartnerAgreement(id, req.user.id);
    return sendSuccess(res, 'agreement signed', updated);
  } catch (err: any) {
    if (err?.message === 'forbidden') return sendError(res, err.message, null, 403);
    next(err);
  }
};

export const submitOnboardingDocs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id || !req.user?.id) return sendError(res, 'invalid request', null, 400);
    const updated = await submitPartnerOnboardingDocs(id, req.user.id);
    return sendSuccess(res, 'onboarding docs submitted', updated);
  } catch (err: any) {
    if (err?.message === 'forbidden') return sendError(res, err.message, null, 403);
    if (err?.message?.includes('Upload')) return sendError(res, err.message, null, 400);
    next(err);
  }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const docs = await listPartnerDocuments(id);
    return sendSuccess(res, 'partner documents', docs);
  } catch (err) {
    next(err);
  }
};

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id || !req.file) return sendError(res, 'file required', null, 400);
    const doc = await uploadPartnerDocument(id, req.file, {
      type: (req.body?.type as any) || undefined,
      notes: req.body?.notes,
    });
    return sendSuccess(res, 'document uploaded', doc, 201);
  } catch (err) {
    next(err);
  }
};

export const removeDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partnerId = numId(req.params.id);
    const docId = numId(req.params.docId);
    if (!partnerId || !docId) return sendError(res, 'invalid id', null, 400);
    await deletePartnerDocument(partnerId, docId);
    return sendSuccess(res, 'document deleted', { id: docId });
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const rows = await listPartnerActivities(id);
    return sendSuccess(res, 'partner activities', rows);
  } catch (err) {
    next(err);
  }
};

export const addActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id || !req.body?.activityType) return sendError(res, 'activityType required', null, 400);
    const row = await logPartnerActivity({
      agencyPartnerId: id,
      actorId: req.user?.id,
      activityType: req.body.activityType,
      subject: req.body.subject,
      comment: req.body.comment,
      metadata: req.body.metadata,
    });
    return sendSuccess(res, 'activity logged', row, 201);
  } catch (err) {
    next(err);
  }
};

export const sendBroadcast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body?.title || !req.body?.message) {
      return sendError(res, 'title and message required', null, 400);
    }
    const result = await broadcastToAgents({
      title: req.body.title,
      message: req.body.message,
      link: req.body.link,
      actorId: req.user?.id,
      statusFilter: req.body.statusFilter,
    });
    return sendSuccess(res, 'broadcast sent', result);
  } catch (err) {
    next(err);
  }
};

export const getCommissionRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agencyPartnerId = numId(req.query.agencyPartnerId) ?? undefined;
    const rows = await listCommissionRules(agencyPartnerId);
    return sendSuccess(res, 'commission rules', rows);
  } catch (err) {
    next(err);
  }
};

export const saveCommissionRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body?.amount == null) return sendError(res, 'amount required', null, 400);
    const row = await upsertCommissionRule(req.body);
    return sendSuccess(res, 'commission rule saved', row, 201);
  } catch (err) {
    next(err);
  }
};

export const removeCommissionRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    await deleteCommissionRule(id);
    return sendSuccess(res, 'rule deleted', { id });
  } catch (err) {
    next(err);
  }
};

export const commissionStatement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agencyPartnerId = numId(req.query.agencyPartnerId);
    if (!agencyPartnerId) return sendError(res, 'agencyPartnerId required', null, 400);
    const period = typeof req.query.period === 'string' ? req.query.period : undefined;
    const data = await getCommissionStatement({ agencyPartnerId, period });
    return sendSuccess(res, 'commission statement', data);
  } catch (err) {
    next(err);
  }
};
