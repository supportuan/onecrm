import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
async function main() {
  const leads = await p.lead.findMany({
    where: { deletedAt: null },
    include: { assignedCounsellor: { select: { id: true, fullName: true } } },
  });
  console.log('Leads:', JSON.stringify(leads, null, 2));
  const students = await p.student.findMany({ include: { user: { select: { id: true, email: true } } } });
  console.log('Students:', JSON.stringify(students, null, 2));
  const unis = await p.university.count();
  console.log('University count in PG:', unis);
}
main().finally(() => p.$disconnect());
