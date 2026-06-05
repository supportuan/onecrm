import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { setupSwagger } from './swagger.js';
import { errorHandler } from './middleware/error.middleware.js';
import { tenantMiddleware } from './middleware/tenant.js';
import marketingRouter from './modules/marketing/routes/marketing.routes.js';
import hrRouter from './modules/hr/hr.routes.js';
import userRouter from './modules/users/user.routes.js';
import authRouter from './modules/auth/auth.routes.js';
import rbacRouter from './modules/rbac/rbac.routes.js';
import { ensureDefaults, loadPermissions } from './modules/rbac/rbac.service.js';
// @ts-ignore
import customerRouter from './routes/customers.js';

const app = express();
const port = process.env.PORT || 4000;


app.use(cors());
app.use(express.json());
app.use(tenantMiddleware);

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
app.use('/api/customers', customerRouter);

// Mount global error handling middleware
app.use(errorHandler);

app.listen(port, async () => {
  console.log(`[One CRM] Backend server listening on http://localhost:${port}`);
  console.log(`[One CRM] Swagger UI available at http://localhost:${port}/api-docs`);
  try {
    await ensureDefaults();
    await loadPermissions();
    console.log('[One CRM] RBAC permission map loaded');
  } catch (err) {
    console.error('[One CRM] Failed to initialize RBAC permissions', err);
  }
});
