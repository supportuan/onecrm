/**
 * Add the two new hires straight into HrEmployee, idempotently.
 *   - Nishtha   — Executive
 *   - Sambhavi  — Data Analytics
 *
 * Idempotent: re-running updates the existing rows in place, never duplicates.
 * Login accounts are NOT created — add those via the user/roles flow when
 * their access scope is decided.
 *
 *   npx tsx scripts/add-new-employees.ts
 */
import dotenv from 'dotenv';
import { PrismaClient, HrAccessRole } from '@prisma/client';
import { getDefaultTenantId } from '../src/utils/tenant-default.js';

dotenv.config();

const prisma = new PrismaClient();

interface Hire {
  name: string;
  email: string;
  designation: string;
  department: string;
  employeeCode: string;
}

const HIRES: Hire[] = [
  {
    name: 'Nishtha',
    email: 'nishtha@applyuninow.com',
    designation: 'Executive',
    department: 'Executive Office',
    employeeCode: 'EMP-NISHTHA',
  },
  {
    name: 'Sambhavi',
    email: 'sambhavi@applyuninow.com',
    designation: 'Data Analyst',
    department: 'Data Analytics',
    employeeCode: 'EMP-SAMBHAVI',
  },
];

async function upsertEmployee(tenantId: number, h: Hire) {
  const existing = await prisma.hrEmployee.findFirst({
    where: { email: { equals: h.email, mode: 'insensitive' } },
  });

  if (existing) {
    const updated = await prisma.hrEmployee.update({
      where: { id: existing.id },
      data: {
        tenantId,
        name: h.name,
        designation: h.designation,
        department: h.department,
        accessRole: HrAccessRole.EMPLOYEE,
      },
    });
    return { action: 'updated' as const, row: updated };
  }

  const created = await prisma.hrEmployee.create({
    data: {
      tenantId,
      name: h.name,
      email: h.email,
      phone: '',
      employeeCode: h.employeeCode,
      designation: h.designation,
      department: h.department,
      accessRole: HrAccessRole.EMPLOYEE,
    },
  });
  return { action: 'created' as const, row: created };
}

async function main() {
  const tenantId = await getDefaultTenantId();
  console.log(`Tenant: ${tenantId}\n`);

  for (const h of HIRES) {
    const { action, row } = await upsertEmployee(tenantId, h);
    console.log(`${action === 'created' ? '✅ Created' : '🔄 Updated'}  #${row.id}  ${row.employeeCode}  ${row.name} <${row.email}>  (${row.designation} · ${row.department})`);
  }
}

main()
  .catch((e) => {
    console.error('Failed:', e?.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
