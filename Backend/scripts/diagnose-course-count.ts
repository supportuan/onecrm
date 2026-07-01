// Prints what's actually in the Course table so we can tell why
// CRM settings shows 134,302 when 340,000 are expected.
//
//   npx tsx scripts/diagnose-course-count.ts
//
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [total, live, softDeleted, withExternalId, withoutUniversity] = await Promise.all([
    prisma.course.count(),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.course.count({ where: { deletedAt: { not: null } } }),
    prisma.course.count({ where: { deletedAt: null, externalId: { not: null } } }),
    prisma.course.count({
      where: { deletedAt: null, university: { deletedAt: { not: null } } },
    }),
  ]);

  console.log('--- Course table ---');
  console.log('Total rows (any state).................', total.toLocaleString());
  console.log('Live (deletedAt = null)................', live.toLocaleString());
  console.log('Soft-deleted (deletedAt set)...........', softDeleted.toLocaleString());
  console.log('Live & mapped to ApplyUniNow (extId)...', withExternalId.toLocaleString());
  console.log('Live but university is soft-deleted....', withoutUniversity.toLocaleString());

  const uniTotal = await prisma.university.count();
  const uniLive = await prisma.university.count({ where: { deletedAt: null } });
  console.log('\n--- University table ---');
  console.log('Total..................................', uniTotal.toLocaleString());
  console.log('Live...................................', uniLive.toLocaleString());

  // Show the 10 universities holding the most live courses — useful for
  // spotting a partial import or a dedupe that wiped many courses.
  const topUnis = await prisma.course.groupBy({
    by: ['universityId'],
    where: { deletedAt: null },
    _count: { _all: true },
    orderBy: { _count: { universityId: 'desc' } },
    take: 10,
  });
  console.log('\nTop 10 universities by live course count:');
  for (const row of topUnis) {
    const uni = await prisma.university.findUnique({
      where: { id: row.universityId },
      select: { name: true, externalId: true },
    });
    console.log(
      `  ${String(row._count._all).padStart(7)}  ${uni?.name ?? '(missing)'}  ${uni?.externalId ? `[ext ${uni.externalId}]` : ''}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
