/**
 * Seed program-level sub-industries for every study industry bucket.
 * Run: npx tsx scripts/seed-sub-industries.ts
 */
import { PrismaClient } from '@prisma/client';

const PROGRAM_LEVELS = [
  'UG',
  'PG',
  'PhD',
  'Foundation',
  'PG Diploma / Certificate',
  'UG + PG (Accelerated Degree)',
  'Pathway Programs',
  'Online Program / Distance Learning',
  'English Language Program',
];

const prisma = new PrismaClient();

async function main() {
  const industries = await prisma.studyIndustry.findMany({ where: { deletedAt: null } });
  let created = 0;
  for (const industry of industries) {
    for (const name of PROGRAM_LEVELS) {
      await prisma.studySubIndustry.upsert({
        where: { industryId_name: { industryId: industry.id, name } },
        create: { industryId: industry.id, name },
        update: {},
      });
      created += 1;
    }
  }
  const total = await prisma.studySubIndustry.count({ where: { deletedAt: null } });
  console.log(`✅ Upserted ${created} sub-industry rows. StudySubIndustry total: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
