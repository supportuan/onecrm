import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const tenants = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, slug, status, "createdAt" FROM "Tenant"`
    );
    console.log('Tenant rows:', tenants);
  } catch (e: any) {
    console.log('Tenant table query failed:', e.message);
  }

  try {
    const users = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, email, role, "tenantId" FROM "User" ORDER BY id LIMIT 10`
    );
    console.log('Sample users:', users);
    const counts = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int AS total,
              COUNT("tenantId")::int AS with_tenant,
              SUM(CASE WHEN "tenantId" IS NULL THEN 1 ELSE 0 END)::int AS null_tenant
       FROM "User"`
    );
    console.log('User counts:', counts);
  } catch (e: any) {
    console.log('User query failed:', e.message);
  }

  try {
    const rp = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, role, "tenantId" FROM "RolePermission" ORDER BY id`
    );
    console.log('RolePermission rows:', rp);
  } catch (e: any) {
    console.log('RolePermission query failed:', e.message);
  }

  await prisma.$disconnect();
}

main();
