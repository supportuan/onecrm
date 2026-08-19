/**
 * Bring the GLOBAL_ADMIN RolePermission row up to the full catalog
 * so the live permission map (GET /api/rbac/permissions) reflects full access.
 * Usage: npx tsx scripts/sync-global-admin-perms.ts
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS } from '../src/modules/rbac/rbac.constants.js';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  await prisma.rolePermission.upsert({
    where: { role: 'GLOBAL_ADMIN' },
    update: { permissions: ALL_PERMISSIONS },
    create: { role: 'GLOBAL_ADMIN', permissions: ALL_PERMISSIONS },
  });
  console.log(`GLOBAL_ADMIN -> ${ALL_PERMISSIONS.length} permissions`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
