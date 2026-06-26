/**
 * Wire login accounts for the two new employees previously created via
 * scripts/add-new-employees.ts:
 *
 *   - Nishtha    — Executive       → GLOBAL_ADMIN (full tenant access)
 *   - Sambhavi   — Data Analytics  → GLOBAL_ADMIN base + DATA_ANALYST custom
 *                                    permission role (read-only across modules
 *                                    + reports access; can be widened in Admin
 *                                    Settings → Roles & Permissions later).
 *
 * Idempotent: re-running updates passwords + role bindings without dupes.
 *
 *   npx tsx scripts/wire-new-employees.ts
 */
import dotenv from 'dotenv';
import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';
import { getDefaultTenantId } from '../src/utils/tenant-default.js';

dotenv.config();

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.DEFAULT_STUDENT_PASSWORD || 'Welcome@123';

// Read-only across every module, plus reports + own-payslip. Granular HR write
// perms left out — analyst can look but not mutate. Easy to widen via UI later.
const DATA_ANALYST_PERMISSIONS = [
  'VIEW_MARKETING',
  'VIEW_STUDENT_CRM',
  'VIEW_AGENCY_CRM',
  'VIEW_HR',
  'VIEW_ADMIN',
  'VIEW_ALL_EMPLOYEES',
  'VIEW_TEAM',
  'VIEW_ATTENDANCE',
  'VIEW_LEAVE',
  'VIEW_OWN_PAYSLIP',
  'VIEW_REPORTS',
];

interface Wire {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  permissionRole?: string;
  permissions?: string[];
  roleLabel?: string;
}

const PEOPLE: Wire[] = [
  {
    name: 'Nishtha',
    email: 'nishtha@applyuninow.com',
    phone: '+910000000010',
    role: UserRole.GLOBAL_ADMIN,
    roleLabel: 'Executive',
  },
  {
    name: 'Sambhavi',
    email: 'sambhavi@applyuninow.com',
    phone: '+910000000011',
    role: UserRole.GLOBAL_ADMIN,
    roleLabel: 'Data Analyst',
    permissionRole: 'DATA_ANALYST',
    permissions: DATA_ANALYST_PERMISSIONS,
  },
];

async function ensureCustomRole(tenantId: number, role: string, permissions: string[]) {
  await prisma.rolePermission.upsert({
    where: { tenantId_role: { tenantId, role } },
    create: { tenantId, role, permissions },
    update: { permissions },
  });
}

async function wirePerson(tenantId: number, p: Wire) {
  if (p.permissionRole && p.permissions) {
    await ensureCustomRole(tenantId, p.permissionRole, p.permissions);
  }

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  // Find existing employee row so we can link userId.
  const emp = await prisma.hrEmployee.findFirst({
    where: { email: { equals: p.email, mode: 'insensitive' } },
  });
  if (!emp) {
    throw new Error(
      `No HrEmployee row for ${p.email}. Run scripts/add-new-employees.ts first.`,
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email: p.email } });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          fullName: p.name,
          phone: p.phone || existingUser.phone,
          tenantId,
          role: p.role,
          roleLabel: p.roleLabel ?? null,
          permissionRole: p.permissionRole ?? null,
          isActive: true,
          isApproved: true,
          // refresh password to a known default so it can be handed over once.
          passwordHash,
          mustChangePassword: true,
        },
      })
    : await prisma.user.create({
        data: {
          fullName: p.name,
          email: p.email,
          phone: p.phone,
          passwordHash,
          role: p.role,
          roleLabel: p.roleLabel ?? null,
          permissionRole: p.permissionRole ?? null,
          tenantId,
          isActive: true,
          isApproved: true,
          mustChangePassword: true,
        },
      });

  await prisma.hrEmployee.update({
    where: { id: emp.id },
    data: { userId: user.id },
  });

  return { user, emp, action: existingUser ? 'updated' : 'created' as const };
}

async function main() {
  const tenantId = await getDefaultTenantId();
  console.log(`Tenant: ${tenantId}\n`);

  for (const p of PEOPLE) {
    const { user, emp, action } = await wirePerson(tenantId, p);
    console.log(
      `${action === 'created' ? '✅ Login created' : '🔄 Login refreshed'}  ` +
        `${p.email}  →  role=${p.role}` +
        (p.permissionRole ? `  permissionRole=${p.permissionRole}` : '') +
        `  (user#${user.id}, employee#${emp.id})`,
    );
  }

  console.log(`\nHandover password (one-time, forces change on first login): ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('Failed:', e?.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
