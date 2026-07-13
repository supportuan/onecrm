/**
 * Soft-delete fake/demo leads (seed + meta-lead.local + temp emails).
 * Usage: npx tsx scripts/purge-fake-leads.ts
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const FAKE_EMAIL_SUFFIXES = ['@example.com', '@meta-lead.local', '@yopmail.com'];

async function main() {
  const now = new Date();

  const before = await prisma.lead.count({ where: { deletedAt: null } });

  const fake = await prisma.lead.updateMany({
    where: {
      deletedAt: null,
      OR: FAKE_EMAIL_SUFFIXES.map((suffix) => ({
        email: { endsWith: suffix },
      })),
    },
    data: { deletedAt: now },
  });

  // If nearly all remaining are also demo, soft-delete the rest too when user
  // indicated ~222 fake leads and remaining gmail test accounts.
  const remaining = await prisma.lead.findMany({
    where: { deletedAt: null },
    select: { id: true, email: true, fullName: true },
  });

  let extra = 0;
  if (remaining.length && remaining.length <= 20) {
    // Small leftover set — treat as leftover demo/test leads as well
    const extraResult = await prisma.lead.updateMany({
      where: { id: { in: remaining.map((l) => l.id) } },
      data: { deletedAt: now },
    });
    extra = extraResult.count;
  }

  const after = await prisma.lead.count({ where: { deletedAt: null } });
  const deleted = await prisma.lead.count({ where: { deletedAt: { not: null } } });

  console.log({
    before,
    softDeletedFakeDomains: fake.count,
    softDeletedLeftoverDemo: extra,
    activeLeadsNow: after,
    softDeletedTotal: deleted,
    leftoverBeforeExtra: remaining.map((l) => l.email),
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
