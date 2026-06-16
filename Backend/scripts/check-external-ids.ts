import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const withExt = await p.university.count({ where: { externalId: { not: null } } });
  const total = await p.university.count({ where: { deletedAt: null } });
  const courses = await p.course.count();
  console.log({ universities: total, withExternalId: withExt, courses });
}
main().finally(() => p.$disconnect());
