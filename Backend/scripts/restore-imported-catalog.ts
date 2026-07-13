/**
 * Restore soft-deleted imported universities/courses (externalId set).
 * Usage: npx tsx scripts/restore-imported-catalog.ts
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const unis = await prisma.university.updateMany({
    where: { deletedAt: { not: null }, externalId: { not: null } },
    data: { deletedAt: null },
  });

  const courses = await prisma.course.updateMany({
    where: { deletedAt: { not: null }, externalId: { not: null } },
    data: { deletedAt: null },
  });

  // Also restore any seed demo universities soft-deleted earlier (no externalId)
  const seedUnis = await prisma.university.updateMany({
    where: {
      deletedAt: { not: null },
      externalId: null,
      name: {
        in: [
          'University of Toronto',
          'London Business School',
          'Imperial College London',
          'Carnegie Mellon University',
          'TU Munich',
          'University of British Columbia',
          'University of Melbourne',
        ],
      },
    },
    data: { deletedAt: null },
  });

  const remaining = {
    universities: await prisma.university.count({ where: { deletedAt: null } }),
    courses: await prisma.course.count({ where: { deletedAt: null } }),
    importedUniversities: await prisma.university.count({
      where: { deletedAt: null, externalId: { not: null } },
    }),
    importedCourses: await prisma.course.count({
      where: { deletedAt: null, externalId: { not: null } },
    }),
  };

  console.log('Restored:');
  console.log(`  imported universities: ${unis.count}`);
  console.log(`  imported courses: ${courses.count}`);
  console.log(`  seed universities: ${seedUnis.count}`);
  console.log('Active now:', remaining);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
