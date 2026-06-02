import { Router } from 'express';
import * as controller from './marketing.controller.js';
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Marketing
 *   description: Operations related to the Marketing Module (Dashboard, Leads, Campaigns, Automations, Landing Pages, Analytics)
 */
// ==========================================
// 1. Dashboard & Reports
// ==========================================
/**
 * @swagger
 * /api/marketing/dashboard:
 *   get:
 *     summary: Retrieve Marketing Dashboard KPI metrics and quick actions
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Successfully retrieved dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
router.get('/dashboard', controller.getDashboard);
/**
 * @swagger
 * /api/marketing/intake-trends:
 *   get:
 *     summary: Retrieve monthly lead intake trends for charts
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Successfully retrieved lead trends
 */
router.get('/intake-trends', controller.getIntakeTrends);
/**
 * @swagger
 * /api/marketing/funnels:
 *   get:
 *     summary: Retrieve student and agency conversion funnel stats
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Successfully retrieved funnel analytics
 */
router.get('/funnels', controller.getFunnels);
/**
 * @swagger
 * /api/marketing/analytics:
 *   get:
 *     summary: Retrieve general marketing analytics reports (sources, campaigns, conversions)
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Successfully generated marketing reports
 */
router.get('/analytics', controller.getAnalytics);
// ==========================================
// 2. Leads Management
// ==========================================
/**
 * @swagger
 * /api/marketing/leads:
 *   get:
 *     summary: Get all leads with search, filter, and pagination support
 *     tags: [Marketing]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, country, course
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, CONTACTED, QUALIFIED, PROPOSED, CONVERTED, LOST]
 *         description: Filter leads by status
 *       - in: query
 *         name: sourceId
 *         schema:
 *           type: integer
 *         description: Filter leads by LeadSource ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Max leads per page
 *     responses:
 *       200:
 *         description: Successfully retrieved leads
 */
router.get('/leads', controller.getLeads);
/**
 * @swagger
 * /api/marketing/sources:
 *   get:
 *     summary: Get all lead sources
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Successfully retrieved lead sources
 */
router.get('/sources', controller.getSources);
/**
 * @swagger
 * /api/marketing/leads/{id}:
 *   get:
 *     summary: Retrieve details of a specific lead by ID
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved lead details
 *       404:
 *         description: Lead not found
 */
router.get('/leads/:id', controller.getLeadById);
/**
 * @swagger
 * /api/marketing/leads:
 *   post:
 *     summary: Create a new lead intake manually
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               preferredCountry:
 *                 type: string
 *               preferredCourse:
 *                 type: string
 *               sourceId:
 *                 type: integer
 *               assignedCounsellorId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [NEW, CONTACTED, QUALIFIED, PROPOSED, CONVERTED, LOST]
 *     responses:
 *       201:
 *         description: Lead successfully created
 */
router.post('/leads', controller.createLead);
/**
 * @swagger
 * /api/marketing/leads/{id}:
 *   put:
 *     summary: Update an existing lead details
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Lead successfully updated
 */
router.put('/leads/:id', controller.updateLead);
/**
 * @swagger
 * /api/marketing/leads/{id}:
 *   delete:
 *     summary: Soft-delete a lead by setting deletedAt timestamp
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lead successfully soft-deleted
 */
router.delete('/leads/:id', controller.deleteLead);
/**
 * @swagger
 * /api/marketing/leads/{id}/activities:
 *   get:
 *     summary: Retrieve history of interactions/activities logged for a specific lead
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved lead activities
 */
router.get('/leads/:id/activities', controller.getLeadActivities);
/**
 * @swagger
 * /api/marketing/leads/{id}/activities:
 *   post:
 *     summary: Log a new interaction activity (call, email, meeting, WhatsApp, SMS)
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activityType
 *             properties:
 *               activityType:
 *                 type: string
 *                 enum: [NOTE, CALL, EMAIL, SMS, WHATSAPP, MEETING]
 *               comment:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Activity successfully logged
 */
router.post('/leads/:id/activities', controller.createLeadActivity);
// ==========================================
// 3. Campaigns
// ==========================================
/**
 * @swagger
 * /api/marketing/campaigns:
 *   get:
 *     summary: Get all campaigns with query search and filters
 *     tags: [Marketing]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [EMAIL, SMS, WHATSAPP, SOCIAL_MEDIA, PPC, CONTENT]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Successfully retrieved campaigns
 */
router.get('/campaigns', controller.getCampaigns);
/**
 * @swagger
 * /api/marketing/campaigns/{id}:
 *   get:
 *     summary: Retrieve details of a campaign including list of target leads and calculated KPI rates
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved campaign details
 */
router.get('/campaigns/:id', controller.getCampaignById);
/**
 * @swagger
 * /api/marketing/campaigns:
 *   post:
 *     summary: Create a new marketing campaign
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [EMAIL, SMS, WHATSAPP, SOCIAL_MEDIA, PPC, CONTENT]
 *               budget:
 *                 type: number
 *               spent:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED]
 *               targetAudience:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Campaign successfully created
 */
router.post('/campaigns', controller.createCampaign);
/**
 * @swagger
 * /api/marketing/campaigns/{id}:
 *   put:
 *     summary: Update an existing campaign
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Campaign successfully updated
 */
router.put('/campaigns/:id', controller.updateCampaign);
/**
 * @swagger
 * /api/marketing/campaigns/{id}:
 *   delete:
 *     summary: Soft-delete a campaign by ID
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campaign successfully soft-deleted
 */
router.delete('/campaigns/:id', controller.deleteCampaign);
/**
 * @swagger
 * /api/marketing/campaigns/{id}/leads:
 *   post:
 *     summary: Associate multiple leads with a campaign for targeted delivery
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leadIds
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *               engagement:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leads successfully associated with campaign
 */
router.post('/campaigns/:id/leads', controller.addCampaignLeads);
// ==========================================
// 4. Marketing Automation Workflows
// ==========================================
/**
 * @swagger
 * /api/marketing/automations:
 *   get:
 *     summary: Get all marketing automation workflows with optional query filters
 *     tags: [Marketing]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keywords matching workflow name, trigger, or action
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PAUSED, DRAFT]
 *         description: Filter workflows by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Max number of workflows per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field name to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Order of sorting
 *     responses:
 *       200:
 *         description: Successfully retrieved automation workflows
 */
router.get('/automations', controller.getAutomations);
/**
 * @swagger
 * /api/marketing/automations/summary:
 *   get:
 *     summary: Retrieve marketing automation workflows performance summary metrics
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Successfully retrieved automation performance summary
 */
router.get('/automations/summary', controller.getAutomationSummary);
/**
 * @swagger
 * /api/marketing/automations/{id}:
 *   get:
 *     summary: Retrieve automation workflow details by ID
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved automation workflow
 */
router.get('/automations/:id', controller.getAutomationById);
/**
 * @swagger
 * /api/marketing/automations:
 *   post:
 *     summary: Create a new automation workflow
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workflowName
 *               - trigger
 *               - action
 *             properties:
 *               workflowName:
 *                 type: string
 *               trigger:
 *                 type: string
 *               action:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, PAUSED, DRAFT]
 *     responses:
 *       201:
 *         description: Automation workflow successfully created
 */
router.post('/automations', controller.createAutomation);
/**
 * @swagger
 * /api/marketing/automations/{id}:
 *   put:
 *     summary: Update an automation workflow parameters
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Automation workflow successfully updated
 */
router.put('/automations/:id', controller.updateAutomation);
/**
 * @swagger
 * /api/marketing/automations/{id}:
 *   delete:
 *     summary: Soft-delete an automation workflow
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Automation workflow successfully soft-deleted
 */
router.delete('/automations/:id', controller.deleteAutomation);
// ==========================================
// 5. Landing Pages
// ==========================================
/**
 * @swagger
 * /api/marketing/forms/summary:
 *   get:
 *     summary: Get forms performance summary
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Successfully retrieved forms summary
 */
router.get('/forms/summary', controller.getFormsSummary);
/**
 * @swagger
 * /api/marketing/landing-pages:
 *   get:
 *     summary: Get all landing pages
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Successfully retrieved landing pages
 */
router.get('/landing-pages', controller.getLandingPages);
/**
 * @swagger
 * /api/marketing/landing-pages/{id}:
 *   get:
 *     summary: Retrieve landing page details by ID
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved landing page details
 */
router.get('/landing-pages/:id', controller.getLandingPageById);
/**
 * @swagger
 * /api/marketing/landing-pages:
 *   post:
 *     summary: Create a new landing page record
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - slug
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [COUNTRY, COURSE, INTAKE, CAMPAIGN, GUIDE, EVENT, FORM, APPLICATION]
 *               country:
 *                 type: string
 *               course:
 *                 type: string
 *               seoTitle:
 *                 type: string
 *               seoDescription:
 *                 type: string
 *               content:
 *                 type: string
 *               formId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Landing page successfully created
 */
router.post('/landing-pages', controller.createLandingPage);
/**
 * @swagger
 * /api/marketing/landing-pages/{id}:
 *   put:
 *     summary: Update an existing landing page configuration
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Landing page successfully updated
 */
router.put('/landing-pages/:id', controller.updateLandingPage);
/**
 * @swagger
 * /api/marketing/landing-pages/{id}:
 *   delete:
 *     summary: Soft-delete a landing page by ID
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Landing page successfully soft-deleted
 */
router.delete('/landing-pages/:id', controller.deleteLandingPage);
/**
 * @swagger
 * /api/marketing/landing-pages/{slug}/submit:
 *   post:
 *     summary: Record a submission on a landing page - increments visits, creates a lead with utm parameters and logs activity
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique slug of the landing page
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               preferredCountry:
 *                 type: string
 *               preferredCourse:
 *                 type: string
 *               sourceType:
 *                 type: string
 *               utmSource:
 *                 type: string
 *               utmMedium:
 *                 type: string
 *               utmCampaign:
 *                 type: string
 *               utmTerm:
 *                 type: string
 *               utmContent:
 *                 type: string
 *     responses:
 *       201:
 *         description: Form successfully submitted, lead recorded
 *       404:
 *         description: Landing page with specified slug not found
 */
router.post('/landing-pages/:slug/submit', controller.submitLandingPageForm);
// ==========================================
// 6. Marketing Analytics Endpoints
// ==========================================
/**
 * @swagger
 * /api/marketing/analytics/metrics:
 *   get:
 *     summary: Retrieve key marketing metrics (Website Visits, Leads Generated, Email Open Rate, CTR)
 *     tags: [Marketing]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           example: 30days
 *         description: Time period filter (e.g. 30days, 60days)
 *     responses:
 *       200:
 *         description: Analytics metrics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       metricKey:
 *                         type: string
 *                       metricValue:
 *                         type: number
 *                       trend:
 *                         type: number
 */
router.get('/analytics/metrics', controller.getMarketingMetrics);
/**
 * @swagger
 * /api/marketing/analytics/performance:
 *   get:
 *     summary: Retrieve 30-day marketing performance overview (Opens, Clicks, Conversions)
 *     tags: [Marketing]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           example: 30days
 *     responses:
 *       200:
 *         description: Analytics performance fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day:
 *                         type: string
 *                       opens:
 *                         type: integer
 *                       clicks:
 *                         type: integer
 *                       conversions:
 *                         type: integer
 */
router.get('/analytics/performance', controller.getMarketingPerformance);
/**
 * @swagger
 * /api/marketing/analytics/channels:
 *   get:
 *     summary: Retrieve marketing channel breakdown percentages (Google Ads, Social Media, Referrals, Others)
 *     tags: [Marketing]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           example: 30days
 *     responses:
 *       200:
 *         description: Analytics channels fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       channelName:
 *                         type: string
 *                       percentage:
 *                         type: number
 *                       totalLeads:
 *                         type: integer
 *                       totalConversions:
 *                         type: integer
 */
router.get('/analytics/channels', controller.getChannelAnalytics);
/**
 * @swagger
 * /api/marketing/analytics/agency-funnel:
 *   get:
 *     summary: Retrieve agency funnel analytics (Study Abroad Webinar, Scholarship Campaign, etc.)
 *     tags: [Marketing]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           example: 30days
 *     responses:
 *       200:
 *         description: Analytics agency funnel fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       funnelName:
 *                         type: string
 *                       funnelValue:
 *                         type: number
 */
router.get('/analytics/agency-funnel', controller.getAgencyFunnelAnalytics);
/**
 * @swagger
 * /api/marketing/analytics/summary:
 *   get:
 *     summary: Retrieve consolidated marketing analytics summary including metrics, performance, channels, and agency funnel
 *     tags: [Marketing]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           example: 30days
 *         description: Time period filter
 *     responses:
 *       200:
 *         description: Analytics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     metrics:
 *                       type: array
 *                     performanceOverview:
 *                       type: array
 *                     channels:
 *                       type: array
 *                     agencyFunnels:
 *                       type: array
 */
router.get('/analytics/summary', controller.getAnalyticsSummary);
/**
 * @swagger
 * /api/marketing/dashboard/metrics:
 *   post:
 *     summary: Create or upsert a dashboard metric
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metricKey
 *               - metricValue
 *             properties:
 *               metricKey:
 *                 type: string
 *               metricValue:
 *                 type: number
 *               trend:
 *                 type: string
 *               period:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Successfully upserted dashboard metric
 */
router.post('/dashboard/metrics', controller.upsertDashboardMetric);
/**
 * @swagger
 * /api/marketing/dashboard/metrics/{id}:
 *   put:
 *     summary: Update an existing dashboard metric
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Successfully updated dashboard metric
 */
router.put('/dashboard/metrics/:id', controller.updateDashboardMetric);
/**
 * @swagger
 * /api/marketing/intake-trends:
 *   post:
 *     summary: Create or upsert an intake trend
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - applications
 *               - enrollments
 *               - revenue
 *             properties:
 *               month:
 *                 type: string
 *               applications:
 *                 type: integer
 *               enrollments:
 *                 type: integer
 *               revenue:
 *                 type: number
 *     responses:
 *       201:
 *         description: Successfully upserted intake trend
 */
router.post('/intake-trends', controller.upsertIntakeTrend);
/**
 * @swagger
 * /api/marketing/intake-trends/{id}:
 *   put:
 *     summary: Update an existing intake trend
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Successfully updated intake trend
 */
router.put('/intake-trends/:id', controller.updateIntakeTrend);
/**
 * @swagger
 * /api/marketing/funnels/student:
 *   post:
 *     summary: Create or upsert a student funnel stage
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stage
 *               - count
 *               - conversion
 *             properties:
 *               stage:
 *                 type: string
 *               count:
 *                 type: integer
 *               conversion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully upserted student funnel stage
 */
router.post('/funnels/student', controller.upsertStudentFunnelStage);
/**
 * @swagger
 * /api/marketing/funnels/student/{id}:
 *   put:
 *     summary: Update an existing student funnel stage
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Successfully updated student funnel stage
 */
router.put('/funnels/student/:id', controller.updateStudentFunnelStage);
/**
 * @swagger
 * /api/marketing/funnels/agency:
 *   post:
 *     summary: Create or upsert an agency funnel stage
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stage
 *               - count
 *               - conversion
 *             properties:
 *               stage:
 *                 type: string
 *               count:
 *                 type: integer
 *               conversion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully upserted agency funnel stage
 */
router.post('/funnels/agency', controller.upsertAgencyFunnelStage);
/**
 * @swagger
 * /api/marketing/funnels/agency/{id}:
 *   put:
 *     summary: Update an existing agency funnel stage
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Successfully updated agency funnel stage
 */
router.put('/funnels/agency/:id', controller.updateAgencyFunnelStage);
/**
 * @swagger
 * /api/marketing/analytics/performance:
 *   post:
 *     summary: Create or upsert a marketing performance daily point
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - day
 *             properties:
 *               day:
 *                 type: string
 *               opens:
 *                 type: integer
 *               clicks:
 *                 type: integer
 *               conversions:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Successfully upserted performance daily point
 */
router.post('/analytics/performance', controller.upsertMarketingPerformance);
/**
 * @swagger
 * /api/marketing/analytics/performance/{id}:
 *   put:
 *     summary: Update an existing marketing performance daily point
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Successfully updated performance daily point
 */
router.put('/analytics/performance/:id', controller.updateMarketingPerformance);
/**
 * @swagger
 * /api/marketing/analytics/channels:
 *   post:
 *     summary: Create or upsert marketing channel analytics
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelName
 *               - percentage
 *             properties:
 *               channelName:
 *                 type: string
 *               percentage:
 *                 type: number
 *               totalLeads:
 *                 type: integer
 *               totalConversions:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Successfully upserted channel analytics
 */
router.post('/analytics/channels', controller.upsertMarketingChannelAnalytics);
/**
 * @swagger
 * /api/marketing/analytics/channels/{id}:
 *   put:
 *     summary: Update an existing marketing channel analytics
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Successfully updated channel analytics
 */
router.put('/analytics/channels/:id', controller.updateMarketingChannelAnalytics);
/**
 * @swagger
 * /api/marketing/analytics/agency-funnel:
 *   post:
 *     summary: Create or upsert agency funnel analytics
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - funnelName
 *               - funnelValue
 *             properties:
 *               funnelName:
 *                 type: string
 *               funnelValue:
 *                 type: number
 *     responses:
 *       201:
 *         description: Successfully upserted agency funnel analytics
 */
router.post('/analytics/agency-funnel', controller.upsertAgencyFunnelAnalytics);
/**
 * @swagger
 * /api/marketing/analytics/agency-funnel/{id}:
 *   put:
 *     summary: Update an existing agency funnel analytics
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Successfully updated agency funnel analytics
 */
router.put('/analytics/agency-funnel/:id', controller.updateAgencyFunnelAnalytics);
export default router;
