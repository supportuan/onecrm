import { Request, Response, NextFunction } from 'express';
import * as marketingService from '../services/marketing.service.js';
import * as campaignLaunchService from '../services/campaignLaunch.service.js';
import * as metaCampaignService from '../services/metaCampaign.service.js';
import { sendSuccess, sendError } from '../../../utils/response.js';
import {
  createLeadSchema,
  updateLeadSchema,
  createCampaignSchema,
  updateCampaignSchema,
  createAutomationSchema,
  updateAutomationSchema,
  createLandingPageSchema,
  updateLandingPageSchema,
  submitFormSchema,
  leadActivitySchema,
  addCampaignLeadsSchema,
  createDashboardMetricSchema,
  updateDashboardMetricSchema,
  createIntakeTrendSchema,
  updateIntakeTrendSchema,
  createStudentFunnelStageSchema,
  updateStudentFunnelStageSchema,
  createAgencyFunnelStageSchema,
  updateAgencyFunnelStageSchema,
  createMarketingPerformanceSchema,
  updateMarketingPerformanceSchema,
  createMarketingChannelAnalyticsSchema,
  updateMarketingChannelAnalyticsSchema,
  createAgencyFunnelAnalyticsSchema,
  updateAgencyFunnelAnalyticsSchema,
} from '../validations/marketing.validation.js';
import {
  websiteLeadSchema,
} from '../schemas/website-lead.schema.js';
import { LeadStatus, CampaignType, CampaignStatus, UserRole } from '@prisma/client';
import { bulkUploadLeadsFromExcel } from '../services/lead-upload.service.js';





// ==========================================
// 1. Dashboard & General Analytics Controllers
// ==========================================

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketingService.getDashboardData();
    return sendSuccess(res, 'Marketing dashboard metrics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getIntakeTrends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketingService.getIntakeTrends();
    return sendSuccess(res, 'Lead intake trend metrics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getFunnels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketingService.getMarketingFunnels();
    return sendSuccess(res, 'Marketing funnels retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketingService.getAnalyticsData();
    return sendSuccess(res, 'Marketing analytics report generated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatusController = async (req: Request, res: Response) => {
  try {
    const leadId = Number(req.params.id);
    const { status } = req.body;

    const allowed = [
      'NEW',
      'CONTACTED',
      'NOT_CONTACTED',
      'CALLBACK',
      'FOLLOW_UP',
      'QUALIFIED',
      'PROPOSED',
      'CONVERTED',
      'LOST',
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead status',
      });
    }

    const data = await marketingService.updateLeadStatus(leadId, status);

    return res.json({
      success: true,
      message: 'Lead status updated successfully',
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update lead status',
    });
  }
};

export const updateLeadRating = async (req: Request, res: Response) => {
  try {
    const leadId = Number(req.params.leadId);
    const { rating } = req.body;

    const allowedRatings = [
      'HOT',
      'WARM',
      'COLD',
      'MAYBE',
      'RED_PHONE',
      'GREEN_PHONE',
      'CALLBACK_PHONE',
    ];

    if (!leadId || Number.isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID',
      });
    }

    if (!allowedRatings.includes(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead status',
      });
    }

    const lead = await marketingService.updateLeadRating(leadId, rating);

    return res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
      data: lead,
    });
  } catch (error) {
    console.error('Update lead rating error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update lead status',
    });
  }
};

// ==========================================
// 2. Lead Controllers
// ==========================================

export const getLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as LeadStatus;
    const sourceId = req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined;
    const country = req.query.country as string;
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';

    // If counsellor, restrict leads to those assigned to them
    const filters: any = { search, status, sourceId, country, page, limit, sortBy, sortOrder };
    if (req.user && req.user.role === UserRole.COUNSELLOR) {
      filters.assignedCounsellorId = req.user.id;
    }

    const data = await marketingService.getLeads(filters);
    return sendSuccess(res, 'Leads fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getSources = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketingService.getSources();
    return sendSuccess(res, 'Sources fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid lead ID', null, 400);

    const lead = await marketingService.getLeadById(id);
    if (!lead) return sendError(res, 'Lead not found', null, 404);

    return sendSuccess(res, 'Lead retrieved successfully', lead);
  } catch (error) {
    next(error);
  }
};

export const createLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createLeadSchema.parse(req.body);
    const newLead = await marketingService.createLead(validatedData);
    return sendSuccess(res, 'Lead created successfully', newLead, 201);
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid lead ID', null, 400);

    const validatedData = updateLeadSchema.parse(req.body);
    const updatedLead = await marketingService.updateLead(id, validatedData);
    return sendSuccess(res, 'Lead updated successfully', updatedLead);
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid lead ID', null, 400);

    await marketingService.deleteLead(id);
    return sendSuccess(res, 'Lead deleted successfully (soft-delete)');
  } catch (error) {
    next(error);
  }
};

export const assignCounsellor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leadId = parseInt(req.params.leadId as string, 10);

    if (isNaN(leadId)) {
      return sendError(res, 'Invalid lead ID', null, 400);
    }

    if (
      !req.user ||
      (req.user.role !== UserRole.GLOBAL_ADMIN &&
        req.user.role !== UserRole.SUPER_ADMIN)
    ) {
      return sendError(res, 'Unauthorized to assign counsellor', null, 403);
    }

    const counsellorId =
      req.body.counsellorId === null || req.body.counsellorId === ''
        ? null
        : Number(req.body.counsellorId);

    if (
      req.body.counsellorId !== null &&
      req.body.counsellorId !== '' &&
      Number.isNaN(counsellorId)
    ) {
      return sendError(res, 'Invalid counsellor ID', null, 400);
    }

    const adminId = req.user.id;

    const updatedLead = await marketingService.assignCounsellor(
      leadId,
      counsellorId,
      adminId
    );

    return sendSuccess(
      res,
      'Counsellor assigned successfully',
      updatedLead
    );
  } catch (error) {
    next(error);
  }
};

export const getLeadActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid lead ID', null, 400);
    const activities = await marketingService.getLeadActivities(id);
    return sendSuccess(res, 'Lead activities retrieved successfully', activities);
  } catch (error) {
    next(error);
  }
};

export const createLeadActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid lead ID', null, 400);

    const validatedData = leadActivitySchema.parse(req.body);
    const newActivity = await marketingService.createLeadActivity(id, validatedData);
    return sendSuccess(res, 'Activity logged successfully', newActivity, 201);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. Campaign Controllers
// ==========================================

export const getCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const type = req.query.type as CampaignType;
    const status = req.query.status as CampaignStatus;
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';

    const data = await marketingService.getCampaigns({ search, type, status, page, limit, sortBy, sortOrder });
    return sendSuccess(res, 'Campaigns retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getCampaignById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid campaign ID', null, 400);

    const campaign = await marketingService.getCampaignById(id);
    if (!campaign) return sendError(res, 'Campaign not found', null, 404);

    return sendSuccess(res, 'Campaign retrieved successfully', campaign);
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createCampaignSchema.parse(req.body);
    const newCampaign = await marketingService.createCampaign(validatedData);
    return sendSuccess(res, 'Campaign created successfully', newCampaign, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid campaign ID', null, 400);

    const validatedData = updateCampaignSchema.parse(req.body);
    const updatedCampaign = await marketingService.updateCampaign(id, validatedData);
    return sendSuccess(res, 'Campaign updated successfully', updatedCampaign);
  } catch (error) {
    next(error);
  }
};

export const deleteCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid campaign ID', null, 400);

    await marketingService.deleteCampaign(id);
    return sendSuccess(res, 'Campaign deleted successfully (soft-delete)');
  } catch (error) {
    next(error);
  }
};

export const addCampaignLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid campaign ID', null, 400);

    const validatedData = addCampaignLeadsSchema.parse(req.body);
    await marketingService.addCampaignLeads(id, validatedData.leadIds, validatedData.status || undefined, validatedData.engagement || undefined);
    return sendSuccess(res, 'Leads associated with campaign successfully');
  } catch (error) {
    next(error);
  }
};

export const launchCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return sendError(res, 'Invalid campaign ID', null, 400);
    }

    const launchedBy = req.user ? req.user.id : undefined;
    const audienceType = req.body?.audienceType || 'ALL';

    const result = await campaignLaunchService.launchCampaign(
      id,
      launchedBy,
      audienceType
    );

    return res.status(200).json({
      success: result.success,
      message: result.message,
      audienceType: result.audienceType,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      details: result.details,
    });
  } catch (error: any) {
    next(error);
  }
};

// ==========================================
// 4. Automation Controllers
// ==========================================

export const getAutomations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as any;
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as any;

    const data = await marketingService.getAutomations({
      search,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return sendSuccess(res, 'Automation workflows retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAutomationSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketingService.getAutomationSummary();
    return sendSuccess(res, 'Automation workflows performance summary retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAutomationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid automation ID', null, 400);

    const workflow = await marketingService.getAutomationById(id);
    if (!workflow) return sendError(res, 'Automation workflow not found', null, 404);

    return sendSuccess(res, 'Automation workflow retrieved successfully', workflow);
  } catch (error) {
    next(error);
  }
};

export const createAutomation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createAutomationSchema.parse(req.body);
    const newWorkflow = await marketingService.createAutomation(validatedData);
    return sendSuccess(res, 'Automation workflow created successfully', newWorkflow, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAutomation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid automation ID', null, 400);

    const validatedData = updateAutomationSchema.parse(req.body);
    const updatedWorkflow = await marketingService.updateAutomation(id, validatedData);
    return sendSuccess(res, 'Automation workflow updated successfully', updatedWorkflow);
  } catch (error) {
    next(error);
  }
};

export const deleteAutomation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid automation ID', null, 400);

    await marketingService.deleteAutomation(id);
    return sendSuccess(res, 'Automation workflow deleted successfully (soft-delete)');
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. Landing Page Controllers
// ==========================================

export const getLandingPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, type, page, limit, sortBy, sortOrder } = req.query;
    const data = await marketingService.getLandingPages({
      search: search as string,
      type: type as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as any,
    });
    return sendSuccess(res, 'Landing pages fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getFormsSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketingService.getFormsSummary();
    return sendSuccess(res, 'Forms summary fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getLandingPageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid landing page ID', null, 400);

    const page = await marketingService.getLandingPageById(id);
    if (!page) return sendError(res, 'Landing page not found', null, 404);

    return sendSuccess(res, 'Landing page retrieved successfully', page);
  } catch (error) {
    next(error);
  }
};

export const createLandingPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createLandingPageSchema.parse(req.body);
    const newPage = await marketingService.createLandingPage(validatedData);
    return sendSuccess(res, 'Landing page created successfully', newPage, 201);
  } catch (error) {
    next(error);
  }
};

export const updateLandingPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid landing page ID', null, 400);

    const validatedData = updateLandingPageSchema.parse(req.body);
    const updatedPage = await marketingService.updateLandingPage(id, validatedData);
    return sendSuccess(res, 'Landing page updated successfully', updatedPage);
  } catch (error) {
    next(error);
  }
};

export const deleteLandingPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid landing page ID', null, 400);

    await marketingService.deleteLandingPage(id);
    return sendSuccess(res, 'Landing page deleted successfully (soft-delete)');
  } catch (error) {
    next(error);
  }
};

export const submitLandingPageForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    if (!slug) return sendError(res, 'Slug parameter is required', null, 400);

    const validatedData = submitFormSchema.parse(req.body);
    const lead = await marketingService.submitForm(slug, validatedData);
    return sendSuccess(res, 'Form submitted successfully, lead recorded', lead, 201);
  } catch (error) {
    next(error);
  }
};

export const getMarketingMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string;
    const data = await marketingService.getMarketingMetrics(period);
    return sendSuccess(res, 'Analytics metrics fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getMarketingPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string;
    const data = await marketingService.getMarketingPerformance(period);
    return sendSuccess(res, 'Analytics performance fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getChannelAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string;
    const data = await marketingService.getChannelAnalytics(period);
    return sendSuccess(res, 'Analytics channels fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAgencyFunnelAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string;
    const data = await marketingService.getAgencyFunnelAnalytics(period);
    return sendSuccess(res, 'Analytics agency funnel fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string;
    const data = await marketingService.getAnalyticsSummary(period);
    return sendSuccess(res, 'Analytics fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. Dashboard Upsert & Update Controllers
// ==========================================

export const upsertDashboardMetric = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createDashboardMetricSchema.parse(req.body);
    const metric = await marketingService.upsertDashboardMetric(validatedData);
    return sendSuccess(res, 'Dashboard metric upserted successfully', metric, 201);
  } catch (error) {
    next(error);
  }
};

export const updateDashboardMetric = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid metric ID', null, 400);
    const validatedData = updateDashboardMetricSchema.parse(req.body);
    const metric = await marketingService.updateDashboardMetric(id, validatedData);
    return sendSuccess(res, 'Dashboard metric updated successfully', metric);
  } catch (error) {
    next(error);
  }
};

export const upsertIntakeTrend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createIntakeTrendSchema.parse(req.body);
    const trend = await marketingService.upsertIntakeTrend(validatedData);
    return sendSuccess(res, 'Intake trend upserted successfully', trend, 201);
  } catch (error) {
    next(error);
  }
};

export const updateIntakeTrend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid trend ID', null, 400);
    const validatedData = updateIntakeTrendSchema.parse(req.body);
    const trend = await marketingService.updateIntakeTrend(id, validatedData);
    return sendSuccess(res, 'Intake trend updated successfully', trend);
  } catch (error) {
    next(error);
  }
};

export const upsertStudentFunnelStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createStudentFunnelStageSchema.parse(req.body);
    const stage = await marketingService.upsertStudentFunnelStage(validatedData);
    return sendSuccess(res, 'Student funnel stage upserted successfully', stage, 201);
  } catch (error) {
    next(error);
  }
};

export const updateStudentFunnelStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid stage ID', null, 400);
    const validatedData = updateStudentFunnelStageSchema.parse(req.body);
    const stage = await marketingService.updateStudentFunnelStage(id, validatedData);
    return sendSuccess(res, 'Student funnel stage updated successfully', stage);
  } catch (error) {
    next(error);
  }
};

export const upsertAgencyFunnelStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createAgencyFunnelStageSchema.parse(req.body);
    const stage = await marketingService.upsertAgencyFunnelStage(validatedData);
    return sendSuccess(res, 'Agency funnel stage upserted successfully', stage, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAgencyFunnelStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid stage ID', null, 400);
    const validatedData = updateAgencyFunnelStageSchema.parse(req.body);
    const stage = await marketingService.updateAgencyFunnelStage(id, validatedData);
    return sendSuccess(res, 'Agency funnel stage updated successfully', stage);
  } catch (error) {
    next(error);
  }
};

export const upsertMarketingPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createMarketingPerformanceSchema.parse(req.body);
    const perf = await marketingService.upsertMarketingPerformance(validatedData);
    return sendSuccess(res, 'Marketing performance daily point upserted successfully', perf, 201);
  } catch (error) {
    next(error);
  }
};

export const updateMarketingPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid performance ID', null, 400);
    const validatedData = updateMarketingPerformanceSchema.parse(req.body);
    const perf = await marketingService.updateMarketingPerformance(id, validatedData);
    return sendSuccess(res, 'Marketing performance daily point updated successfully', perf);
  } catch (error) {
    next(error);
  }
};

export const upsertMarketingChannelAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createMarketingChannelAnalyticsSchema.parse(req.body);
    const channel = await marketingService.upsertMarketingChannelAnalytics(validatedData);
    return sendSuccess(res, 'Marketing channel analytics upserted successfully', channel, 201);
  } catch (error) {
    next(error);
  }
};

export const updateMarketingChannelAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid channel ID', null, 400);
    const validatedData = updateMarketingChannelAnalyticsSchema.parse(req.body);
    const channel = await marketingService.updateMarketingChannelAnalytics(id, validatedData);
    return sendSuccess(res, 'Marketing channel analytics updated successfully', channel);
  } catch (error) {
    next(error);
  }
};

export const upsertAgencyFunnelAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createAgencyFunnelAnalyticsSchema.parse(req.body);
    const funnel = await marketingService.upsertAgencyFunnelAnalytics(validatedData);
    return sendSuccess(res, 'Agency funnel analytics upserted successfully', funnel, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAgencyFunnelAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return sendError(res, 'Invalid funnel ID', null, 400);
    const validatedData = updateAgencyFunnelAnalyticsSchema.parse(req.body);
    const funnel = await marketingService.updateAgencyFunnelAnalytics(id, validatedData);
    return sendSuccess(res, 'Agency funnel analytics updated successfully', funnel);
  } catch (error) {
    next(error);
  }
};

export const bulkUploadLeads = async (req: any, res: any, next: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is required',
      });
    }

    const result = await bulkUploadLeadsFromExcel(req.file.buffer);

    return res.status(200).json({
      success: true,
      message: 'Lead bulk upload completed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
//   Campaign Controllers
// =========================================

export const executeCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return sendError(res, 'Invalid campaign ID', null, 400);
    }

    const result = await marketingService.executeCampaign(id);

    return sendSuccess(res, 'Campaign executed successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getCampaignMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return sendError(res, 'Invalid campaign ID', null, 400);
    }

    const result = await marketingService.getCampaignMessages(id);

    return sendSuccess(res, 'Campaign messages retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getCampaignAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return sendError(res, 'Invalid campaign ID', null, 400);
    }

    const result = await marketingService.getCampaignAnalytics(id);

    return sendSuccess(res, 'Campaign analytics retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const createStudentLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leadId = parseInt(req.params.leadId as string);
    if (isNaN(leadId)) {
      return sendError(res, 'Invalid lead ID', null, 400);
    }
    const { password } = req.body;
    const user = await marketingService.createStudentLogin(leadId, password);
    return sendSuccess(res, 'Student login created successfully', user, 201);
  } catch (error) {
    next(error);
  }
};

export const convertStudentToLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(req.params.userId as string);
    if (isNaN(userId)) {
      return sendError(res, 'Invalid user ID', null, 400);
    }
    const overrides = req.body;
    const lead = await marketingService.convertStudentToLead(userId, overrides);
    return sendSuccess(res, 'Student converted to lead successfully', lead, 201);
  } catch (error) {
    next(error);
  }
};

export const uploadSocialMediaMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', null, 400);
    }

    const uploadResult = await metaCampaignService.uploadMediaToMeta(req.file);
    return sendSuccess(res, 'Media uploaded to Meta successfully', uploadResult, 201);
  } catch (error: any) {
    console.error('[Marketing Controller] Media upload error:', error);
    return sendError(res, error.message || 'Failed to upload media to Meta', error, 500);
  }
};


export const createWebsiteLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed =
      websiteLeadSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,

        message:
          parsed.error.issues[0]?.message ||
          'Invalid lead details',

        errors:
          parsed.error.flatten(),
      });
    }

    const lead =
      await marketingService.createWebsiteLead(
        parsed.data
      );

    return res.status(201).json({
      success: true,

      message:
        'Thank you. Our counsellor will contact you shortly.',

      data: {
        id: lead.id,
        fullName: lead.fullName,
        source: lead.source?.name,
        status: lead.status,
      },
    });
  } catch (error: any) {
    const message =
      error?.message ||
      'Failed to create website lead';

    if (
      message.includes('already exists') ||
      message.includes('Duplicate lead')
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (
      message.includes(
        'Phone number must contain'
      ) ||
      message.includes(
        'Email is required'
      ) ||
      message.includes(
        'Website Form source is not configured'
      )
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    next(error);
  }
};
