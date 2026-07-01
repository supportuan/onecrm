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
import superAdminRouter from './modules/super-admin/super-admin.routes.js';
import path from 'path';
import { ensureDefaultTenantSeeded } from './modules/rbac/rbac.service.js';
import { backfillHrSeedsForExistingTenants, backfillStaffEmployees } from './modules/super-admin/hr-seed-backfill.js';
import { startNotificationScheduler } from './modules/notifications/scheduler.js';
const app = express();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
// Set up Swagger UI documentation
setupSwagger(app);
// Health check endpoint (must be registered before authenticated routers)
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', message: 'One CRM TypeScript backend is running' });
});
// Mount Modular API Routes
app.use('/api/auth', authRouter);
app.use('/api/rbac', rbacRouter);
app.use('/api', userRouter);
app.use('/api/marketing', marketingRouter);
app.use('/api/hr', hrRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/student-crm', studentCrmRouter);
app.use('/api/crm-settings', crmSettingsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/agency-crm', agencyCrmRouter);
app.use('/api/super-admin', superAdminRouter);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// Mount global error handling middleware
app.use(errorHandler);
app.listen(port, async () => {
    console.log(`[One CRM] Backend server listening on http://localhost:${port}`);
    console.log(`[One CRM] Swagger UI available at http://localhost:${port}/api-docs`);
    console.log('[One CRM] Multi-tenant: ON (HR root models auto-scoped via ALS + Prisma extension)');
    try {
        await ensureDefaultTenantSeeded();
        console.log('[One CRM] RBAC seeded for default tenant');
        await backfillHrSeedsForExistingTenants();
        console.log('[One CRM] HR defaults backfilled where missing');
        await backfillStaffEmployees();
        console.log('[One CRM] HR employee records ensured for staff users');
        startNotificationScheduler();
        console.log('[One CRM] Notification scheduler started');
    }
    catch (err) {
        console.error('[One CRM] Failed to initialize RBAC permissions', err);
    }
});
