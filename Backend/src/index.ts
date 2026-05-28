import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { setupSwagger } from './swagger.js';
import { errorHandler } from './middleware/error.middleware.js';
import { tenantMiddleware } from './middleware/tenant.js';
import marketingRouter from './modules/marketing/marketing.routes.js';
import hrRouter from './modules/hr/hr.routes.js';

// Import existing JavaScript routes (NodeNext resolution allows importing relative .js files)
// @ts-ignore
import authRouter from './routes/auth.js';
// @ts-ignore
import customerRouter from './routes/customers.js';

const app = express();
const port = process.env.PORT || 4000;


app.use(cors());
app.use(express.json());
app.use(tenantMiddleware);

// Set up Swagger UI documentation
setupSwagger(app);

// Mount Modular API Routes
app.use('/api/marketing', marketingRouter);
app.use('/api/hr', hrRouter);
app.use('/api', hrRouter);
app.use('/api/auth', authRouter);
app.use('/api/customers', customerRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', message: 'One CRM TypeScript backend is running' });
});

// Mount global error handling middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[One CRM] Backend server listening on http://localhost:${port}`);
  console.log(`[One CRM] Swagger UI available at http://localhost:${port}/api-docs`);
});
