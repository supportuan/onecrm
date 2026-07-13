/**
 * Soft-delete imported (externalId) + seed demo universities/courses.
 *
 * WARNING: This removes the real MySQL-imported catalog from active views.
 * Prefer scripts/purge-fake-leads.ts if you only need to clear demo leads.
 * To undo this script, run: npx tsx scripts/restore-imported-catalog.ts
 *
 * Usage: npx tsx scripts/purge-seeded-catalog.ts
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const SEED_UNIVERSITY_NAMES = [
  'University of Toronto',
  'London Business School',
  'Imperial College London',
  'Carnegie Mellon University',
  'TU Munich',
  'University of British Columbia',
  'University of Melbourne',
];

async function main() {
  const now = new Date();

  const importedUnis = await prisma.university.updateMany({
    where: { deletedAt: null, externalId: { not: null } },
    data: { deletedAt: now },
  });

  const importedCourses = await prisma.course.updateMany({
    where: { deletedAt: null, externalId: { not: null } },
    data: { deletedAt: now },
  });

  const seedUnis = await prisma.university.findMany({
    where: {
      deletedAt: null,
      name: { in: SEED_UNIVERSITY_NAMES },
    },
    select: { id: true, name: true },
  });
  const seedUniIds = seedUnis.map((u) => u.id);

  const seedCourses = seedUniIds.length
    ? await prisma.course.updateMany({
        where: { deletedAt: null, universityId: { in: seedUniIds } },
        data: { deletedAt: now },
      })
    : { count: 0 };

  const seedUnisDeleted = seedUniIds.length
    ? await prisma.university.updateMany({
        where: { id: { in: seedUniIds }, deletedAt: null },
        data: { deletedAt: now },
      })
    : { count: 0 };

  // Soft-delete any remaining courses still linked to already-deleted universities
  const orphanCourses = await prisma.course.updateMany({
    where: {
      deletedAt: null,
      university: { deletedAt: { not: null } },
    },
    data: { deletedAt: now },
  });

  const remaining = {
    universities: await prisma.university.count({ where: { deletedAt: null } }),
    courses: await prisma.course.count({ where: { deletedAt: null } }),
    manualUniversities: await prisma.university.count({
      where: { deletedAt: null, externalId: null },
    }),
    manualCourses: await prisma.course.count({
      where: { deletedAt: null, externalId: null },
    }),
  };

  console.log('Purged seeded/imported catalog:');
  console.log(`  imported universities soft-deleted: ${importedUnis.count}`);
  console.log(`  imported courses soft-deleted: ${importedCourses.count}`);
  console.log(`  seed universities soft-deleted: ${seedUnisDeleted.count}`);
  console.log(`  seed uni courses soft-deleted: ${seedCourses.count}`);
  console.log(`  orphan courses soft-deleted: ${orphanCourses.count}`);
  console.log('Remaining active:', remaining);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
