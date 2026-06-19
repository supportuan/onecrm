import dotenv from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';
import { getTenantContext } from './middleware/tenant-context.js';

dotenv.config();

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// HR models that carry a direct `tenantId` column (Phase 4). Queries against
// these models are automatically scoped to the current request's tenantId via
// AsyncLocalStorage. Models NOT in this list are unaffected.
//
// Note: child tables (HrAttendanceRecord, HrLeaveRequest, HrPayslip, etc.) are
// not in this list — they inherit isolation through their FK chain to one of
// the root models below.
const TENANT_SCOPED_MODELS = new Set<string>([
  'HrEmployee',
  'HrAttendanceDevice',
  'HrNetworkWhitelist',
  'HrLeavePlan',
  'HrLeaveType',
  'HrHoliday',
  'HrJobPosting',
  'HrKpiDefinition',
  'HrProcessingMetric',
  'HrMarketingPerformance',
  'HrCounsellorPerformance',
  'HrPerformanceReview',
]);

const READ_OPS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
]);

const MUTATION_OPS_WITH_WHERE = new Set([
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'upsert',
]);

const CREATE_OPS = new Set(['create', 'createMany']);

const mergeWhere = (existing: any, tenantId: number) => {
  if (!existing) return { tenantId };
  return { AND: [existing, { tenantId }] };
};

/**
 * Prisma extension: per-request tenant scoping for HR root models.
 * - SUPER_ADMIN requests bypass auto-injection (they may need cross-tenant reads).
 * - Requests with no tenant context (scripts, bootstrap) also bypass — callers
 *   are responsible for their own scoping there.
 * - All other requests get a `tenantId = <current>` filter (and `data.tenantId`
 *   set on creates) so a forgotten `where` clause cannot leak across tenants.
 */
export const prisma = basePrisma.$extends({
  name: 'tenant-scope',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: any) {
        if (!model || !TENANT_SCOPED_MODELS.has(model)) return query(args);

        const ctx = getTenantContext();
        if (!ctx || ctx.bypass || ctx.tenantId == null) return query(args);

        const tenantId = ctx.tenantId;

        if (READ_OPS.has(operation) || MUTATION_OPS_WITH_WHERE.has(operation)) {
          args = args || {};
          args.where = mergeWhere(args.where, tenantId);
        }

        if (operation === 'create') {
          args = args || {};
          args.data = { ...(args.data || {}), tenantId };
        }
        if (operation === 'createMany') {
          args = args || {};
          const data = Array.isArray(args.data) ? args.data : [args.data];
          args.data = data.map((d: any) => ({ ...d, tenantId }));
        }
        if (operation === 'upsert') {
          args.create = { ...(args.create || {}), tenantId };
        }

        return query(args);
      },
    },
  },
}) as unknown as PrismaClient;

export type { Prisma };
