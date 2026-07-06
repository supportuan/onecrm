/**
 * Upsert study-industry buckets used for country-filtered dropdowns.
 * Run: npx tsx scripts/seed-study-industries.ts
 */
import { PrismaClient } from '@prisma/client';
import { STUDY_INDUSTRY_RULES } from '../src/modules/crm-settings/study-industry-rules.js';

const prisma = new PrismaClient();

async function main() {
  let created = 0;
  for (const { name } of STUDY_INDUSTRY_RULES) {
    await prisma.studyIndustry.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    created += 1;
  }
  const total = await prisma.studyIndustry.count({ where: { deletedAt: null } });
  console.log(`✅ Upserted ${created} industry buckets. StudyIndustry total: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
