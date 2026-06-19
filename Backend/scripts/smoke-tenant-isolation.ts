// Cross-tenant isolation smoke test for Phase 4 HR scoping.
//
// Strategy:
//   1. Create two test tenants via raw prisma (no ALS context → bypassed).
//   2. Create one HrEmployee per tenant via raw prisma.
//   3. Use runWithTenant() to simulate a request from each tenant and run
//      a normal prisma query. Assert:
//        - tenant A sees only A's employee
//        - tenant B sees only B's employee
//        - cross-tenant updateMany returns 0
//   4. Clean up test rows.
//
// Usage: npx tsx scripts/smoke-tenant-isolation.ts
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { prisma as scopedPrisma } from '../src/prisma.js';
import { runWithTenant } from '../src/middleware/tenant-context.js';

const raw = new PrismaClient();

const SUFFIX = `smoke-${Date.now()}`;

async function main() {
  console.log('[smoke] creating two test tenants...');
  const tA = await raw.tenant.create({ data: { name: `Smoke A ${SUFFIX}`, slug: `a-${SUFFIX}` } });
  const tB = await raw.tenant.create({ data: { name: `Smoke B ${SUFFIX}`, slug: `b-${SUFFIX}` } });

  console.log(`[smoke] tenants: A=${tA.id} B=${tB.id}`);

  const empA = await raw.hrEmployee.create({
    data: {
      tenantId: tA.id,
      name: 'Alice (A)',
      employeeCode: `EMP-A-${SUFFIX}`,
      email: `alice-${SUFFIX}@a.test`,
    },
  });
  const empB = await raw.hrEmployee.create({
    data: {
      tenantId: tB.id,
      name: 'Bob (B)',
      employeeCode: `EMP-B-${SUFFIX}`,
      email: `bob-${SUFFIX}@b.test`,
    },
  });
  console.log(`[smoke] employees: A=${empA.id} B=${empB.id}`);

  const seenByA = await runWithTenant({ tenantId: tA.id, bypass: false }, () =>
    scopedPrisma.hrEmployee.findMany({ select: { id: true, name: true, tenantId: true } }),
  );
  const seenByB = await runWithTenant({ tenantId: tB.id, bypass: false }, () =>
    scopedPrisma.hrEmployee.findMany({ select: { id: true, name: true, tenantId: true } }),
  );

  console.log('[smoke] A sees:', seenByA.map((e) => e.name));
  console.log('[smoke] B sees:', seenByB.map((e) => e.name));

  // Assertions.
  const aLeaksB = seenByA.some((e) => e.id === empB.id);
  const bLeaksA = seenByB.some((e) => e.id === empA.id);
  const aSeesA = seenByA.some((e) => e.id === empA.id);
  const bSeesB = seenByB.some((e) => e.id === empB.id);

  // Cross-tenant write attempt: as tenant A, try to update B's employee.
  const crossWrite = await runWithTenant({ tenantId: tA.id, bypass: false }, () =>
    scopedPrisma.hrEmployee.updateMany({
      where: { id: empB.id },
      data: { name: 'HACKED' },
    }),
  );

  // SUPER_ADMIN bypass: should see both.
  const seenByBypass = await runWithTenant({ tenantId: null, bypass: true }, () =>
    scopedPrisma.hrEmployee.findMany({
      where: { id: { in: [empA.id, empB.id] } },
      select: { id: true, name: true, tenantId: true },
    }),
  );

  // Cleanup.
  await raw.hrEmployee.deleteMany({ where: { id: { in: [empA.id, empB.id] } } });
  await raw.tenant.deleteMany({ where: { id: { in: [tA.id, tB.id] } } });

  // Report.
  const fails: string[] = [];
  if (aLeaksB) fails.push('LEAK: tenant A saw tenant B employee');
  if (bLeaksA) fails.push('LEAK: tenant B saw tenant A employee');
  if (!aSeesA) fails.push('MISS: tenant A did not see own employee');
  if (!bSeesB) fails.push('MISS: tenant B did not see own employee');
  if (crossWrite.count !== 0) fails.push(`LEAK: cross-tenant updateMany affected ${crossWrite.count} rows`);
  if (seenByBypass.length !== 2) fails.push(`BYPASS: super-admin bypass saw ${seenByBypass.length} of 2 employees`);

  if (fails.length) {
    console.error('[smoke] FAIL');
    fails.forEach((f) => console.error(' -', f));
    process.exit(1);
  }
  console.log('[smoke] PASS — tenant isolation holds, SUPER_ADMIN bypass works.');
}

main()
  .catch((err) => {
    console.error('[smoke] error', err);
    process.exit(1);
  })
  .finally(() => {
    raw.$disconnect();
  });
