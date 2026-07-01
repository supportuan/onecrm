/**
 * Bring every tenant's GLOBAL_ADMIN RolePermission row up to the full catalog
 * so the live permission map (GET /api/rbac/permissions) reflects full access.
 * Usage: npx tsx scripts/sync-global-admin-perms.ts
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS } from '../src/modules/rbac/rbac.constants.js';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, slug: true } });
  for (const t of tenants) {
    await prisma.rolePermission.upsert({
      where: { tenantId_role: { tenantId: t.id, role: 'GLOBAL_ADMIN' } },
      update: { permissions: ALL_PERMISSIONS },
      create: { tenantId: t.id, role: 'GLOBAL_ADMIN', permissions: ALL_PERMISSIONS },
    });
    console.log(`tenant ${t.id} (${t.slug}): GLOBAL_ADMIN -> ${ALL_PERMISSIONS.length} permissions`);
  }
  console.log('Done. Restart not required; rbac cache reloads per tenant on next change, but a backend restart guarantees a fresh map.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
