import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const org = await prisma.orgSettings.findUnique({ where: { id: 1 } });
    console.log('OrgSettings:', org);
  } catch (e: any) {
    console.log('OrgSettings query failed:', e.message);
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
      orderBy: { id: 'asc' },
      take: 10,
    });
    console.log('Sample users:', users);
    const counts = await prisma.user.count();
    console.log('User count:', counts);
  } catch (e: any) {
    console.log('User query failed:', e.message);
  }

  try {
    const rp = await prisma.rolePermission.findMany({
      select: { id: true, role: true },
      orderBy: { id: 'asc' },
    });
    console.log('RolePermission rows:', rp);
  } catch (e: any) {
    console.log('RolePermission query failed:', e.message);
  }

  await prisma.$disconnect();
}

main();
