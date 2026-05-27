const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'modules', 'marketing');
fs.mkdirSync(dir, { recursive: true });

const responseContent = `export const sendSuccess = (res, message, data = {}) => {
  res.status(200).json({ success: true, message, data });
};
export const sendError = (res, message, errors = [], status = 500) => {
  res.status(status).json({ success: false, message, errors });
};
`;
fs.mkdirSync(path.join(__dirname, 'src', 'utils'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'src', 'utils', 'response.js'), responseContent);

const prismaClientContent = `import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
`;
fs.writeFileSync(path.join(__dirname, 'src', 'prisma.js'), prismaClientContent);

const serviceContent = `import { prisma } from '../../prisma.js';

export const getDashboardData = async () => {
  const totalLeads = await prisma.lead.count();
  const activeCampaigns = await prisma.campaign.count({ where: { status: 'ACTIVE' } });
  return { totalLeads, activeCampaigns };
};

export const getLeads = async () => {
  return await prisma.lead.findMany({ include: { source: true } });
};

export const getCampaigns = async () => {
  return await prisma.campaign.findMany();
};

export const getAutomations = async () => {
  return await prisma.marketingAutomation.findMany();
};

export const getLandingPages = async () => {
  return await prisma.landingPage.findMany();
};
`;
fs.writeFileSync(path.join(dir, 'marketing.service.js'), serviceContent);

const controllerContent = `import * as marketingService from './marketing.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getDashboard = async (req, res) => {
  try {
    const data = await marketingService.getDashboardData();
    sendSuccess(res, 'Dashboard data fetched', data);
  } catch (error) {
    sendError(res, error.message);
  }
};

export const getLeads = async (req, res) => {
  try {
    const data = await marketingService.getLeads();
    sendSuccess(res, 'Leads fetched', data);
  } catch (error) {
    sendError(res, error.message);
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const data = await marketingService.getCampaigns();
    sendSuccess(res, 'Campaigns fetched', data);
  } catch (error) {
    sendError(res, error.message);
  }
};

export const getAutomations = async (req, res) => {
  try {
    const data = await marketingService.getAutomations();
    sendSuccess(res, 'Automations fetched', data);
  } catch (error) {
    sendError(res, error.message);
  }
};

export const getLandingPages = async (req, res) => {
  try {
    const data = await marketingService.getLandingPages();
    sendSuccess(res, 'Landing pages fetched', data);
  } catch (error) {
    sendError(res, error.message);
  }
};
`;
fs.writeFileSync(path.join(dir, 'marketing.controller.js'), controllerContent);

const routesContent = `import express from 'express';
import * as marketingController from './marketing.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/marketing/dashboard:
 *   get:
 *     summary: Get marketing dashboard data
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/dashboard', marketingController.getDashboard);

/**
 * @swagger
 * /api/marketing/leads:
 *   get:
 *     summary: Get all leads
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/leads', marketingController.getLeads);

/**
 * @swagger
 * /api/marketing/campaigns:
 *   get:
 *     summary: Get all campaigns
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/campaigns', marketingController.getCampaigns);

/**
 * @swagger
 * /api/marketing/automations:
 *   get:
 *     summary: Get all automations
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/automations', marketingController.getAutomations);

/**
 * @swagger
 * /api/marketing/landing-pages:
 *   get:
 *     summary: Get all landing pages
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/landing-pages', marketingController.getLandingPages);

export default router;
`;
fs.writeFileSync(path.join(dir, 'marketing.routes.js'), routesContent);

console.log('Marketing API files generated successfully.');
