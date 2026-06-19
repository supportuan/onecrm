// One-off bootstrap for the very first super-admin. Idempotent.
// Usage (from Backend/):
//   $env:SUPERADMIN_EMAIL = 'root@onecrm.local'
//   $env:SUPERADMIN_PASSWORD = 'change-me-now'
//   $env:SUPERADMIN_NAME = 'Root Admin'
//   npx tsx scripts/bootstrap-super-admin.ts
//
// After running, log in as that user and onboard tenants via /super-admin.
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL?.trim();
  const password = process.env.SUPERADMIN_PASSWORD;
  const fullName = process.env.SUPERADMIN_NAME?.trim() || 'Super Admin';

  if (!email || !password) {
    console.error('Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD env vars first.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== UserRole.SUPER_ADMIN || existing.tenantId !== null) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: UserRole.SUPER_ADMIN, tenantId: null, isActive: true, isApproved: true },
      });
      console.log(`Promoted existing user ${email} to SUPER_ADMIN (tenantId=null).`);
    } else {
      console.log(`User ${email} is already a SUPER_ADMIN. Nothing to do.`);
    }
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      tenantId: null,
      fullName,
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isApproved: true,
    },
  });
  console.log(`Created SUPER_ADMIN: id=${user.id} email=${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
