import * as marketingService from './marketing.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { createLeadSchema, updateLeadSchema, createCampaignSchema, updateCampaignSchema, createAutomationSchema, updateAutomationSchema, createLandingPageSchema, updateLandingPageSchema, submitFormSchema, leadActivitySchema, addCampaignLeadsSchema, createDashboardMetricSchema, updateDashboardMetricSchema, createIntakeTrendSchema, updateIntakeTrendSchema, createStudentFunnelStageSchema, updateStudentFunnelStageSchema, createAgencyFunnelStageSchema, updateAgencyFunnelStageSchema, createMarketingPerformanceSchema, updateMarketingPerformanceSchema, createMarketingChannelAnalyticsSchema, updateMarketingChannelAnalyticsSchema, createAgencyFunnelAnalyticsSchema, updateAgencyFunnelAnalyticsSchema, } from './marketing.validation.js';
// ==========================================
// 1. Dashboard & General Analytics Controllers
// ==========================================
export const getDashboard = async (req, res, next) => {
    try {
        const data = await marketingService.getDashboardData();
        return sendSuccess(res, 'Marketing dashboard metrics retrieved successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getIntakeTrends = async (req, res, next) => {
    try {
        const data = await marketingService.getIntakeTrends();
        return sendSuccess(res, 'Lead intake trend metrics retrieved successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getFunnels = async (req, res, next) => {
    try {
        const data = await marketingService.getMarketingFunnels();
        return sendSuccess(res, 'Marketing funnels retrieved successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getAnalytics = async (req, res, next) => {
    try {
        const data = await marketingService.getAnalyticsData();
        return sendSuccess(res, 'Marketing analytics report generated successfully', data);
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// 2. Lead Controllers
// ==========================================
export const getLeads = async (req, res, next) => {
    try {
        const search = req.query.search;
        const status = req.query.status;
        const sourceId = req.query.sourceId ? parseInt(req.query.sourceId) : undefined;
        const page = req.query.page ? parseInt(req.query.page) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        const sortBy = req.query.sortBy;
        const sortOrder = req.query.sortOrder;
        const data = await marketingService.getLeads({ search, status, sourceId, page, limit, sortBy, sortOrder });
        return sendSuccess(res, 'Leads fetched successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getSources = async (req, res, next) => {
    try {
        const data = await marketingService.getSources();
        return sendSuccess(res, 'Sources fetched successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getLeadById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid lead ID', null, 400);
        const lead = await marketingService.getLeadById(id);
        if (!lead)
            return sendError(res, 'Lead not found', null, 404);
        return sendSuccess(res, 'Lead retrieved successfully', lead);
    }
    catch (error) {
        next(error);
    }
};
export const createLead = async (req, res, next) => {
    try {
        const validatedData = createLeadSchema.parse(req.body);
        const newLead = await marketingService.createLead(validatedData);
        return sendSuccess(res, 'Lead created successfully', newLead, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateLead = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid lead ID', null, 400);
        const validatedData = updateLeadSchema.parse(req.body);
        const updatedLead = await marketingService.updateLead(id, validatedData);
        return sendSuccess(res, 'Lead updated successfully', updatedLead);
    }
    catch (error) {
        next(error);
    }
};
export const deleteLead = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid lead ID', null, 400);
        await marketingService.deleteLead(id);
        return sendSuccess(res, 'Lead deleted successfully (soft-delete)');
    }
    catch (error) {
        next(error);
    }
};
export const getLeadActivities = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid lead ID', null, 400);
        const activities = await marketingService.getLeadActivities(id);
        return sendSuccess(res, 'Lead activities retrieved successfully', activities);
    }
    catch (error) {
        next(error);
    }
};
export const createLeadActivity = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid lead ID', null, 400);
        const validatedData = leadActivitySchema.parse(req.body);
        const newActivity = await marketingService.createLeadActivity(id, validatedData);
        return sendSuccess(res, 'Activity logged successfully', newActivity, 201);
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// 3. Campaign Controllers
// ==========================================
export const getCampaigns = async (req, res, next) => {
    try {
        const search = req.query.search;
        const type = req.query.type;
        const status = req.query.status;
        const page = req.query.page ? parseInt(req.query.page) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        const sortBy = req.query.sortBy;
        const sortOrder = req.query.sortOrder;
        const data = await marketingService.getCampaigns({ search, type, status, page, limit, sortBy, sortOrder });
        return sendSuccess(res, 'Campaigns retrieved successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getCampaignById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid campaign ID', null, 400);
        const campaign = await marketingService.getCampaignById(id);
        if (!campaign)
            return sendError(res, 'Campaign not found', null, 404);
        return sendSuccess(res, 'Campaign retrieved successfully', campaign);
    }
    catch (error) {
        next(error);
    }
};
export const createCampaign = async (req, res, next) => {
    try {
        const validatedData = createCampaignSchema.parse(req.body);
        const newCampaign = await marketingService.createCampaign(validatedData);
        return sendSuccess(res, 'Campaign created successfully', newCampaign, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateCampaign = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid campaign ID', null, 400);
        const validatedData = updateCampaignSchema.parse(req.body);
        const updatedCampaign = await marketingService.updateCampaign(id, validatedData);
        return sendSuccess(res, 'Campaign updated successfully', updatedCampaign);
    }
    catch (error) {
        next(error);
    }
};
export const deleteCampaign = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid campaign ID', null, 400);
        await marketingService.deleteCampaign(id);
        return sendSuccess(res, 'Campaign deleted successfully (soft-delete)');
    }
    catch (error) {
        next(error);
    }
};
export const addCampaignLeads = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid campaign ID', null, 400);
        const validatedData = addCampaignLeadsSchema.parse(req.body);
        await marketingService.addCampaignLeads(id, validatedData.leadIds, validatedData.status || undefined, validatedData.engagement || undefined);
        return sendSuccess(res, 'Leads associated with campaign successfully');
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// 4. Automation Controllers
// ==========================================
export const getAutomations = async (req, res, next) => {
    try {
        const search = req.query.search;
        const status = req.query.status;
        const page = req.query.page ? parseInt(req.query.page) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        const sortBy = req.query.sortBy;
        const sortOrder = req.query.sortOrder;
        const data = await marketingService.getAutomations({
            search,
            status,
            page,
            limit,
            sortBy,
            sortOrder,
        });
        return sendSuccess(res, 'Automation workflows retrieved successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getAutomationSummary = async (req, res, next) => {
    try {
        const data = await marketingService.getAutomationSummary();
        return sendSuccess(res, 'Automation workflows performance summary retrieved successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getAutomationById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid automation ID', null, 400);
        const workflow = await marketingService.getAutomationById(id);
        if (!workflow)
            return sendError(res, 'Automation workflow not found', null, 404);
        return sendSuccess(res, 'Automation workflow retrieved successfully', workflow);
    }
    catch (error) {
        next(error);
    }
};
export const createAutomation = async (req, res, next) => {
    try {
        const validatedData = createAutomationSchema.parse(req.body);
        const newWorkflow = await marketingService.createAutomation(validatedData);
        return sendSuccess(res, 'Automation workflow created successfully', newWorkflow, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateAutomation = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid automation ID', null, 400);
        const validatedData = updateAutomationSchema.parse(req.body);
        const updatedWorkflow = await marketingService.updateAutomation(id, validatedData);
        return sendSuccess(res, 'Automation workflow updated successfully', updatedWorkflow);
    }
    catch (error) {
        next(error);
    }
};
export const deleteAutomation = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid automation ID', null, 400);
        await marketingService.deleteAutomation(id);
        return sendSuccess(res, 'Automation workflow deleted successfully (soft-delete)');
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// 5. Landing Page Controllers
// ==========================================
export const getLandingPages = async (req, res, next) => {
    try {
        const { search, type, page, limit, sortBy, sortOrder } = req.query;
        const data = await marketingService.getLandingPages({
            search: search,
            type: type,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            sortBy: sortBy,
            sortOrder: sortOrder,
        });
        return sendSuccess(res, 'Landing pages fetched successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getFormsSummary = async (req, res, next) => {
    try {
        const data = await marketingService.getFormsSummary();
        return sendSuccess(res, 'Forms summary fetched successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getLandingPageById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid landing page ID', null, 400);
        const page = await marketingService.getLandingPageById(id);
        if (!page)
            return sendError(res, 'Landing page not found', null, 404);
        return sendSuccess(res, 'Landing page retrieved successfully', page);
    }
    catch (error) {
        next(error);
    }
};
export const createLandingPage = async (req, res, next) => {
    try {
        const validatedData = createLandingPageSchema.parse(req.body);
        const newPage = await marketingService.createLandingPage(validatedData);
        return sendSuccess(res, 'Landing page created successfully', newPage, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateLandingPage = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid landing page ID', null, 400);
        const validatedData = updateLandingPageSchema.parse(req.body);
        const updatedPage = await marketingService.updateLandingPage(id, validatedData);
        return sendSuccess(res, 'Landing page updated successfully', updatedPage);
    }
    catch (error) {
        next(error);
    }
};
export const deleteLandingPage = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid landing page ID', null, 400);
        await marketingService.deleteLandingPage(id);
        return sendSuccess(res, 'Landing page deleted successfully (soft-delete)');
    }
    catch (error) {
        next(error);
    }
};
export const submitLandingPageForm = async (req, res, next) => {
    try {
        const slug = req.params.slug;
        if (!slug)
            return sendError(res, 'Slug parameter is required', null, 400);
        const validatedData = submitFormSchema.parse(req.body);
        const lead = await marketingService.submitForm(slug, validatedData);
        return sendSuccess(res, 'Form submitted successfully, lead recorded', lead, 201);
    }
    catch (error) {
        next(error);
    }
};
export const getMarketingMetrics = async (req, res, next) => {
    try {
        const period = req.query.period;
        const data = await marketingService.getMarketingMetrics(period);
        return sendSuccess(res, 'Analytics metrics fetched successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getMarketingPerformance = async (req, res, next) => {
    try {
        const period = req.query.period;
        const data = await marketingService.getMarketingPerformance(period);
        return sendSuccess(res, 'Analytics performance fetched successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getChannelAnalytics = async (req, res, next) => {
    try {
        const period = req.query.period;
        const data = await marketingService.getChannelAnalytics(period);
        return sendSuccess(res, 'Analytics channels fetched successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getAgencyFunnelAnalytics = async (req, res, next) => {
    try {
        const period = req.query.period;
        const data = await marketingService.getAgencyFunnelAnalytics(period);
        return sendSuccess(res, 'Analytics agency funnel fetched successfully', data);
    }
    catch (error) {
        next(error);
    }
};
export const getAnalyticsSummary = async (req, res, next) => {
    try {
        const period = req.query.period;
        const data = await marketingService.getAnalyticsSummary(period);
        return sendSuccess(res, 'Analytics fetched successfully', data);
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// 7. Dashboard Upsert & Update Controllers
// ==========================================
export const upsertDashboardMetric = async (req, res, next) => {
    try {
        const validatedData = createDashboardMetricSchema.parse(req.body);
        const metric = await marketingService.upsertDashboardMetric(validatedData);
        return sendSuccess(res, 'Dashboard metric upserted successfully', metric, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateDashboardMetric = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid metric ID', null, 400);
        const validatedData = updateDashboardMetricSchema.parse(req.body);
        const metric = await marketingService.updateDashboardMetric(id, validatedData);
        return sendSuccess(res, 'Dashboard metric updated successfully', metric);
    }
    catch (error) {
        next(error);
    }
};
export const upsertIntakeTrend = async (req, res, next) => {
    try {
        const validatedData = createIntakeTrendSchema.parse(req.body);
        const trend = await marketingService.upsertIntakeTrend(validatedData);
        return sendSuccess(res, 'Intake trend upserted successfully', trend, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateIntakeTrend = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid trend ID', null, 400);
        const validatedData = updateIntakeTrendSchema.parse(req.body);
        const trend = await marketingService.updateIntakeTrend(id, validatedData);
        return sendSuccess(res, 'Intake trend updated successfully', trend);
    }
    catch (error) {
        next(error);
    }
};
export const upsertStudentFunnelStage = async (req, res, next) => {
    try {
        const validatedData = createStudentFunnelStageSchema.parse(req.body);
        const stage = await marketingService.upsertStudentFunnelStage(validatedData);
        return sendSuccess(res, 'Student funnel stage upserted successfully', stage, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateStudentFunnelStage = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid stage ID', null, 400);
        const validatedData = updateStudentFunnelStageSchema.parse(req.body);
        const stage = await marketingService.updateStudentFunnelStage(id, validatedData);
        return sendSuccess(res, 'Student funnel stage updated successfully', stage);
    }
    catch (error) {
        next(error);
    }
};
export const upsertAgencyFunnelStage = async (req, res, next) => {
    try {
        const validatedData = createAgencyFunnelStageSchema.parse(req.body);
        const stage = await marketingService.upsertAgencyFunnelStage(validatedData);
        return sendSuccess(res, 'Agency funnel stage upserted successfully', stage, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateAgencyFunnelStage = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid stage ID', null, 400);
        const validatedData = updateAgencyFunnelStageSchema.parse(req.body);
        const stage = await marketingService.updateAgencyFunnelStage(id, validatedData);
        return sendSuccess(res, 'Agency funnel stage updated successfully', stage);
    }
    catch (error) {
        next(error);
    }
};
export const upsertMarketingPerformance = async (req, res, next) => {
    try {
        const validatedData = createMarketingPerformanceSchema.parse(req.body);
        const perf = await marketingService.upsertMarketingPerformance(validatedData);
        return sendSuccess(res, 'Marketing performance daily point upserted successfully', perf, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateMarketingPerformance = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid performance ID', null, 400);
        const validatedData = updateMarketingPerformanceSchema.parse(req.body);
        const perf = await marketingService.updateMarketingPerformance(id, validatedData);
        return sendSuccess(res, 'Marketing performance daily point updated successfully', perf);
    }
    catch (error) {
        next(error);
    }
};
export const upsertMarketingChannelAnalytics = async (req, res, next) => {
    try {
        const validatedData = createMarketingChannelAnalyticsSchema.parse(req.body);
        const channel = await marketingService.upsertMarketingChannelAnalytics(validatedData);
        return sendSuccess(res, 'Marketing channel analytics upserted successfully', channel, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateMarketingChannelAnalytics = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid channel ID', null, 400);
        const validatedData = updateMarketingChannelAnalyticsSchema.parse(req.body);
        const channel = await marketingService.updateMarketingChannelAnalytics(id, validatedData);
        return sendSuccess(res, 'Marketing channel analytics updated successfully', channel);
    }
    catch (error) {
        next(error);
    }
};
export const upsertAgencyFunnelAnalytics = async (req, res, next) => {
    try {
        const validatedData = createAgencyFunnelAnalyticsSchema.parse(req.body);
        const funnel = await marketingService.upsertAgencyFunnelAnalytics(validatedData);
        return sendSuccess(res, 'Agency funnel analytics upserted successfully', funnel, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateAgencyFunnelAnalytics = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return sendError(res, 'Invalid funnel ID', null, 400);
        const validatedData = updateAgencyFunnelAnalyticsSchema.parse(req.body);
        const funnel = await marketingService.updateAgencyFunnelAnalytics(id, validatedData);
        return sendSuccess(res, 'Agency funnel analytics updated successfully', funnel);
    }
    catch (error) {
        next(error);
    }
};
