/**
 * Create or reset CRM login for an existing HrEmployee row.
 *
 *   npx tsx scripts/provision-employee-login.ts sandeep@applyuninow.com
 *   npx tsx scripts/provision-employee-login.ts sandeep@applyuninow.com GLOBAL_ADMIN
 */
import dotenv from 'dotenv';
import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';
import { getDefaultTenantId } from '../src/utils/tenant-default.js';

dotenv.config();

const prisma = new PrismaClient();

const EMAIL = (process.argv[2] || '').trim().toLowerCase();
const ROLE_ARG = (process.argv[3] || 'GLOBAL_ADMIN').trim().toUpperCase();
const PASSWORD = process.env.DEFAULT_STUDENT_PASSWORD || 'Welcome@123';

const ALLOWED: UserRole[] = [
  UserRole.GLOBAL_ADMIN,
  UserRole.HR,
  UserRole.COUNSELLOR,
  UserRole.MARKETING_MANAGER,
  UserRole.TELECALLER,
];

async function main() {
  if (!EMAIL) {
    throw new Error('Usage: npx tsx scripts/provision-employee-login.ts <email> [role]');
  }
  const role = ALLOWED.includes(ROLE_ARG as UserRole) ? (ROLE_ARG as UserRole) : UserRole.GLOBAL_ADMIN;

  const emp = await prisma.hrEmployee.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' } },
  });
  if (!emp) throw new Error(`No HrEmployee found for ${EMAIL}`);

  const tenantId = emp.tenantId ?? (await getDefaultTenantId());
  const passwordHash = await hashPassword(PASSWORD);
  const name = emp.name?.trim() || emp.firstName || EMAIL.split('@')[0];

  let user = await prisma.user.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' } },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true,
        isApproved: true,
        mustChangePassword: true,
        role,
        tenantId,
        fullName: name,
        phone: emp.phone,
      },
    });
    console.log(`Updated login for ${user.email} (user #${user.id})`);
  } else {
    user = await prisma.user.create({
      data: {
        fullName: name,
        email: EMAIL,
        phone: emp.phone,
        passwordHash,
        role,
        roleLabel: emp.designation?.trim() || 'Staff',
        tenantId,
        isActive: true,
        isApproved: true,
        mustChangePassword: true,
      },
    });
    console.log(`Created login for ${user.email} (user #${user.id})`);
  }

  await prisma.hrEmployee.update({
    where: { id: emp.id },
    data: { userId: user.id, name },
  });

  console.log(`Linked HrEmployee #${emp.id} (${emp.employeeCode}) → User #${user.id}`);
  console.log(`Role: ${role}`);
  console.log(`Temporary password: ${PASSWORD} (must change on first login)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
