import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
async function main() {
  const linked = await p.student.count({ where: { userId: { not: null } } });
  const total = await p.student.count();
  const apps = await p.application.count();
  const unis = await p.university.count();
  const sample = await p.student.findFirst({
    where: { email: 'rahul.verma@example.com' },
    include: { user: { select: { id: true, email: true, role: true } }, applications: true },
  });
  console.log({ studentsWithLogin: linked, totalStudents: total, applications: apps, universities: unis, sample });
}
main().finally(() => p.$disconnect());
