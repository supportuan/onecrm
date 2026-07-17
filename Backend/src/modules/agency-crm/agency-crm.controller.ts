import { Request, Response, NextFunction } from 'express';
import {
  AgencyDocumentVerificationStatus,
  AgencyOnboardingStage,
  AgencyPartnerStatus,
  CommissionPayoutStatus,
  CommissionStatus,
} from '@prisma/client';
import { sendError, sendSuccess } from '../../utils/response.js';
import * as service from './agency-crm.service.js';
import {
  advancePartnerOnboarding,
  OnboardingTransitionError,
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
  verifyPartnerDocument,
} from './agency-communications.service.js';
import { AgencyReferralConflictError } from './agency-referral.service.js';
import {
  createAnnouncement,
  listAnnouncements,
  markAnnouncementRead,
} from './agency-announcements.service.js';
import {
  createPayoutBatch,
  getPayout,
  listPayouts,
  updatePayoutStatus,
  verifyCommission,
} from './agency-payout.service.js';
import {
  advanceOnboardingSchema,
  agentPaymentOrderSchema,
  commissionRuleSchema,
  createAnnouncementSchema,
  createCommissionSchema,
  createPartnerSchema,
  createPayoutSchema,
  createReferralSchema,
  parseBody,
  partnerStatusSchema,
  payoutStatusSchema,
  updateCommissionSchema,
  updatePartnerSchema,
  verifyCommissionSchema,
  verifyDocumentSchema,
} from './agency-crm.validation.js';
import { hasCapability } from './agency-capabilities.js';
import { assertAgentPaymentAction } from './agency-payment-policy.js';
import * as paymentsService from '../student-crm/payments.service.js';

const numId = (raw: unknown) => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const actor = (req: Request) => ({ id: req.user?.id, role: req.user?.role });

const validationError = (err: unknown, res: Response) => {
  const e = err as Error & { statusCode?: number };
  if (e?.statusCode === 400) {
    sendError(res, e.message, null, 400);
    return true;
  }
  return false;
};

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
    const body = parseBody(createPartnerSchema, req.body);
    const created = await service.createPartner({
      ...body,
      phone: body.phone ?? undefined,
      contactPerson: body.contactPerson ?? undefined,
      address: body.address ?? undefined,
      city: body.city ?? undefined,
      country: body.country ?? undefined,
      services: body.services ?? undefined,
      notes: body.notes ?? undefined,
    });
    return sendSuccess(res, 'agency partner created', created, 201);
  } catch (err: any) {
    if (validationError(err, res)) return;
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
    const body = parseBody(updatePartnerSchema, req.body || {});
    const updated = await service.updatePartner(
      id,
      {
        ...body,
        contactPerson: body.contactPerson ?? undefined,
        email: body.email ?? undefined,
        phone: body.phone ?? undefined,
        address: body.address ?? undefined,
        city: body.city ?? undefined,
        country: body.country ?? undefined,
        services: body.services ?? undefined,
        notes: body.notes ?? undefined,
        branding: body.branding as Record<string, unknown> | undefined,
        capabilities: body.capabilities as Record<string, unknown> | undefined,
      },
      actor(req)
    );
    return sendSuccess(res, 'agency partner updated', updated);
  } catch (err: any) {
    if (validationError(err, res)) return;
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
    const body = parseBody(createReferralSchema, req.body);
    const created = await service.createReferral(
      {
        agencyPartnerId: body.agencyPartnerId,
        leadId: body.leadId ?? undefined,
        studentId: body.studentId ?? undefined,
        applicationId: body.applicationId ?? undefined,
        referralCode: body.referralCode ?? undefined,
        notes: body.notes ?? undefined,
      },
      actor(req)
    );
    return sendSuccess(res, 'referral created', created, 201);
  } catch (err: any) {
    if (validationError(err, res)) return;
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
    const body = parseBody(createCommissionSchema, req.body);
    const created = await service.createCommission(
      {
        ...body,
        studentId: body.studentId ?? undefined,
        applicationId: body.applicationId ?? undefined,
        period: body.period ?? undefined,
        description: body.description ?? undefined,
      },
      actor(req)
    );
    return sendSuccess(res, 'commission created', created, 201);
  } catch (err: any) {
    if (validationError(err, res)) return;
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
    const body = parseBody(updateCommissionSchema, req.body || {});
    const updated = await service.updateCommission(
      id,
      {
        ...body,
        period: body.period ?? undefined,
        description: body.description ?? undefined,
      },
      actor(req)
    );
    return sendSuccess(res, 'commission updated', updated);
  } catch (err: any) {
    if (validationError(err, res)) return;
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
    if (!id) return sendError(res, 'id and stage required', null, 400);
    const { stage } = parseBody(advanceOnboardingSchema, req.body);
    const updated = await advancePartnerOnboarding(id, stage as AgencyOnboardingStage, req.user?.id, {
      actorRole: req.user?.role,
    });
    return sendSuccess(res, 'onboarding updated', updated);
  } catch (err: any) {
    if (validationError(err, res)) return;
    if (err instanceof OnboardingTransitionError || err?.name === 'OnboardingTransitionError') {
      return sendError(res, err.message, null, 400);
    }
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const updatePartnerStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'id and status required', null, 400);
    const { status } = parseBody(partnerStatusSchema, req.body);
    const updated = await setPartnerStatus(id, status as AgencyPartnerStatus, req.user?.id);
    return sendSuccess(res, 'partner status updated', updated);
  } catch (err: any) {
    if (validationError(err, res)) return;
    if (err instanceof OnboardingTransitionError || err?.name === 'OnboardingTransitionError') {
      return sendError(res, err.message, null, 400);
    }
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const signAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id || !req.user?.id) return sendError(res, 'invalid request', null, 400);
    const updated = await signPartnerAgreement(id, req.user.id, req.user.role, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      agreementVersion: typeof req.body?.agreementVersion === 'string' ? req.body.agreementVersion : 'v1',
    });
    return sendSuccess(res, 'agreement signed', updated);
  } catch (err: any) {
    if (err instanceof OnboardingTransitionError || err?.name === 'OnboardingTransitionError') {
      return sendError(res, err.message, null, 400);
    }
    if (err?.message === 'forbidden') return sendError(res, err.message, null, 403);
    next(err);
  }
};

export const submitOnboardingDocs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id || !req.user?.id) return sendError(res, 'invalid request', null, 400);
    const updated = await submitPartnerOnboardingDocs(id, req.user.id, req.user.role);
    return sendSuccess(res, 'onboarding docs submitted', updated);
  } catch (err: any) {
    if (err instanceof OnboardingTransitionError || err?.name === 'OnboardingTransitionError') {
      return sendError(res, err.message, null, 400);
    }
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
    const body = parseBody(commissionRuleSchema, req.body);
    const row = await upsertCommissionRule(body);
    return sendSuccess(res, 'commission rule saved', row, 201);
  } catch (err: any) {
    if (validationError(err, res)) return;
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

export const getUniversityContactHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const university = typeof req.query.university === 'string' ? req.query.university : '';
    const country = typeof req.query.country === 'string' ? req.query.country : undefined;
    if (!university.trim()) return sendError(res, 'university is required', null, 400);
    const contact = await service.getUniversityContact(university, country);
    return sendSuccess(res, 'university contact', contact);
  } catch (err) {
    next(err);
  }
};

export const listUniversityDirectoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const country = typeof req.query.country === 'string' ? req.query.country : undefined;
    const page = numId(req.query.page) ?? undefined;
    const limit = numId(req.query.limit) ?? undefined;
    const data = await service.listUniversityDirectory({ search, country, page, limit });
    return sendSuccess(res, 'university directory', data);
  } catch (err) {
    next(err);
  }
};

export const verifyDocumentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partnerId = numId(req.params.id);
    const docId = numId(req.params.docId);
    if (!partnerId || !docId) return sendError(res, 'invalid id', null, 400);
    const body = parseBody(verifyDocumentSchema, req.body);
    const updated = await verifyPartnerDocument(partnerId, docId, {
      verificationStatus: body.verificationStatus as AgencyDocumentVerificationStatus,
      notes: body.notes,
      actorId: req.user?.id,
    });
    return sendSuccess(res, 'document verification updated', updated);
  } catch (err: any) {
    if (validationError(err, res)) return;
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const verifyCommissionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id || !req.user?.id) return sendError(res, 'invalid request', null, 400);
    const body = parseBody(verifyCommissionSchema, req.body || {});
    const updated = await verifyCommission(id, req.user.id, body);
    return sendSuccess(res, 'commission verified', updated);
  } catch (err: any) {
    if (validationError(err, res)) return;
    if (err?.message?.includes('not found') || err?.message?.includes('cannot')) {
      return sendError(res, err.message, null, 400);
    }
    next(err);
  }
};

export const listPayoutsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status =
      typeof req.query.status === 'string' &&
      Object.values(CommissionPayoutStatus).includes(req.query.status as CommissionPayoutStatus)
        ? (req.query.status as CommissionPayoutStatus)
        : undefined;
    const rows = await listPayouts({ status });
    return sendSuccess(res, 'commission payouts', rows);
  } catch (err) {
    next(err);
  }
};

export const getPayoutHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const row = await getPayout(id);
    if (!row) return sendError(res, 'not found', null, 404);
    return sendSuccess(res, 'commission payout', row);
  } catch (err) {
    next(err);
  }
};

export const createPayoutHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = parseBody(createPayoutSchema, req.body);
    const payout = await createPayoutBatch({
      ...body,
      createdById: req.user?.id,
    });
    return sendSuccess(res, 'payout batch created', payout, 201);
  } catch (err: any) {
    if (validationError(err, res)) return;
    if (err?.message) return sendError(res, err.message, null, 400);
    next(err);
  }
};

export const updatePayoutStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const body = parseBody(payoutStatusSchema, req.body);
    const updated = await updatePayoutStatus(id, body.status as CommissionPayoutStatus, {
      notes: body.notes,
    });
    return sendSuccess(res, 'payout status updated', updated);
  } catch (err: any) {
    if (validationError(err, res)) return;
    if (err?.message) return sendError(res, err.message, null, 400);
    next(err);
  }
};

export const listAnnouncementsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const rows = await listAnnouncements({
      activeOnly,
      userId: req.user?.id,
    });
    return sendSuccess(res, 'announcements', rows);
  } catch (err) {
    next(err);
  }
};

export const createAnnouncementHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = parseBody(createAnnouncementSchema, req.body);
    const row = await createAnnouncement({
      ...body,
      link: body.link || null,
      publishedById: req.user?.id,
    });
    return sendSuccess(res, 'announcement created', row, 201);
  } catch (err: any) {
    if (validationError(err, res)) return;
    next(err);
  }
};

export const markAnnouncementReadHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id || !req.user?.id) return sendError(res, 'invalid request', null, 400);
    const row = await markAnnouncementRead(id, req.user.id);
    return sendSuccess(res, 'announcement marked read', row);
  } catch (err: any) {
    if (err?.message?.includes('not found')) return sendError(res, err.message, null, 404);
    next(err);
  }
};

export const createAgentPaymentOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertAgentPaymentAction('create-order');
    const applicationId = numId(req.params.applicationId);
    if (!applicationId || !req.user?.id) return sendError(res, 'invalid request', null, 400);
    const body = parseBody(agentPaymentOrderSchema, req.body);

    const { partner, application } = await service.assertAgentOwnsApplication(actor(req), applicationId);
    if (!hasCapability(partner.capabilities, 'canPayFees')) {
      return sendError(res, 'payment capability is not enabled for this partner', null, 403);
    }
    const studentUserId = application.student?.userId;
    if (!studentUserId) {
      return sendError(res, 'student user account is required before paying fees', null, 400);
    }

    const order = await paymentsService.createPaymentOrder(applicationId, body.feeId, studentUserId, {
      actor: { id: req.user.id, role: req.user.role },
      actedByUserId: req.user.id,
      actorRole: req.user.role,
    });
    return sendSuccess(res, 'payment order created', order, 201);
  } catch (err: any) {
    if (validationError(err, res)) return;
    if (err?.message === 'forbidden') return sendError(res, err.message, null, 403);
    if (err?.message) return sendError(res, err.message, null, 400);
    next(err);
  }
};

export const verifyAgentPaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertAgentPaymentAction('verify');
    const applicationId = numId(req.params.applicationId);
    if (!applicationId || !req.user?.id) return sendError(res, 'invalid request', null, 400);

    const { partner } = await service.assertAgentOwnsApplication(actor(req), applicationId);
    if (!hasCapability(partner.capabilities, 'canPayFees')) {
      return sendError(res, 'payment capability is not enabled for this partner', null, 403);
    }

    const result = await paymentsService.verifyPayment(applicationId, req.user.id, {
      razorpay_order_id: req.body?.razorpay_order_id,
      razorpay_payment_id: req.body?.razorpay_payment_id,
      razorpay_signature: req.body?.razorpay_signature,
    });
    return sendSuccess(res, 'payment verified', result);
  } catch (err: any) {
    if (err?.message === 'forbidden') return sendError(res, err.message, null, 403);
    if (err?.message) return sendError(res, err.message, null, 400);
    next(err);
  }
};
