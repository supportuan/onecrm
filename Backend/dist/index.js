import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { setupSwagger } from './swagger.js';
import { errorHandler } from './middleware/error.middleware.js';
import marketingRouter from './modules/marketing/routes/marketing.routes.js';
import hrRouter from './modules/hr/hr.routes.js';
import userRouter from './modules/users/user.routes.js';
import authRouter from './modules/auth/auth.routes.js';
import rbacRouter from './modules/rbac/rbac.routes.js';
import notificationsRouter from './modules/notifications/notifications.routes.js';
import studentCrmRouter from './modules/student-crm/student-crm.routes.js';
import crmSettingsRouter from './modules/crm-settings/crm-settings.routes.js';
import uploadsRouter from './modules/uploads/uploads.routes.js';
import agencyCrmRouter from './modules/agency-crm/agency-crm.routes.js';
import agencyCrmPublicRouter from './modules/agency-crm/agency-crm.public.routes.js';
import resourcesRouter from './modules/resources/resources.routes.js';
import trainingRouter from './modules/training/training.routes.js';
import superAdminRouter from './modules/super-admin/super-admin.routes.js';
import path from 'path';
import http from 'http';
import { ensureDefaultTenantSeeded } from './modules/rbac/rbac.service.js';
import { backfillHrSeedsForExistingTenants, backfillStaffEmployees } from './modules/super-admin/hr-seed-backfill.js';
import { startNotificationScheduler } from './modules/notifications/scheduler.js';
import { startHrPerformanceReviewScheduler } from './modules/hr/hr-performance.scheduler.js';
import { startStudentCrmScheduler } from './modules/student-crm/student-crm.scheduler.js';
import { warmIndustryCache } from './modules/crm-settings/crm-settings.service.js';
import communicationRouter from './modules/communication/communication.routes.js';
import { attachCommunicationWebSocket } from './modules/communication/communication.ws.js';
import countryRoutes from './modules/countries/country.routes.js';
import { authenticateTokenOrCookie } from './middleware/authenticate.js';
import { getJwtAccessSecret, getJwtRefreshSecret } from './utils/jwt.js';
import { verifyEmailTransport } from './lib/email-transport.js';
import orgRouter from './modules/org/org.routes.js';
import { getLogPrefix, getOrgName } from './utils/org-identity.js';
const app = express();
const port = process.env.PORT || 4000;
const logPrefix = getLogPrefix();
// Fail fast if JWT secrets are missing/default outside test.
try {
    getJwtAccessSecret();
    getJwtRefreshSecret();
}
catch (err) {
    console.error(`${logPrefix} Fatal JWT configuration error:`, err.message);
    process.exit(1);
}
app.use(cors());
app.use(express.json());
// Set up Swagger UI documentation
setupSwagger(app);
// Health check endpoint (must be registered before authenticated routers)
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', message: `${getOrgName()} backend is running` });
});
// Mount Modular API Routes
app.use('/api/org', orgRouter);
app.use('/api/auth', authRouter);
app.use('/api/rbac', rbacRouter);
app.use('/api', userRouter);
app.use('/api/marketing', marketingRouter);
app.use('/api/hr', hrRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/student-crm', studentCrmRouter);
app.use('/api/communication', communicationRouter);
app.use('/api/crm-settings', crmSettingsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/agency-crm/public', agencyCrmPublicRouter);
app.use('/api/agency-crm', agencyCrmRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/training', trainingRouter);
app.use('/api/super-admin', superAdminRouter);
app.use('/uploads', authenticateTokenOrCookie, express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/countries', countryRoutes);
// Mount global error handling middleware
app.use(errorHandler);
const server = http.createServer(app);
attachCommunicationWebSocket(server);
server.listen(Number(port), '0.0.0.0', async () => {
    const org = getOrgName();
    console.log(`${logPrefix} Backend server listening on http://127.0.0.1:${port}`);
    console.log(`${logPrefix} Swagger UI available at http://127.0.0.1:${port}/api-docs`);
    console.log(`${logPrefix} Isolated install: ${org} (one codebase, this copy's data only)`);
    try {
        await ensureDefaultTenantSeeded();
        console.log(`${logPrefix} RBAC seeded for ${org}`);
        await backfillHrSeedsForExistingTenants();
        console.log(`${logPrefix} HR defaults backfilled where missing`);
        await backfillStaffEmployees();
        console.log(`${logPrefix} HR employee records ensured for staff users`);
        startNotificationScheduler();
        console.log(`${logPrefix} Notification scheduler started`);
        startStudentCrmScheduler();
        console.log(`${logPrefix} Student Hub scheduler started`);
        startHrPerformanceReviewScheduler();
        warmIndustryCache().catch((err) => console.warn(`${logPrefix} Industry cache warm skipped`, err));
        verifyEmailTransport().catch((err) => console.warn(`${logPrefix} Email verify skipped`, err));
    }
    catch (err) {
        console.error(`${logPrefix} Failed to initialize RBAC permissions`, err);
    }
});
