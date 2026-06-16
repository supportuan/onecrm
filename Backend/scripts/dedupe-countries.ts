/**
 * Merge duplicate countries (e.g. "Canada" vs "CANADA") and re-link FKs.
 * Usage: npx tsx scripts/dedupe-countries.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const normalizeCountryName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

async function main() {
  const countries = await prisma.country.findMany({
    where: { deletedAt: null },
    include: {
      _count: { select: { universities: true, students: true, faqs: true, countryChecklists: true } },
    },
  });

  const groups = new Map<string, typeof countries>();
  for (const c of countries) {
    const key = c.name.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  let merged = 0;

  for (const [, list] of groups) {
    if (list.length < 2) {
      const only = list[0];
      const normalized = normalizeCountryName(only.name);
      if (only.name !== normalized) {
        await prisma.country.update({ where: { id: only.id }, data: { name: normalized } });
      }
      continue;
    }

    const canonicalName = normalizeCountryName(list[0].name);
    const titleCaseMember = list.find((c) => c.name === canonicalName);
    const canonical =
      titleCaseMember ||
      [...list].sort(
        (a, b) =>
          b._count.universities - a._count.universities ||
          b._count.students - a._count.students ||
          a.id - b.id
      )[0];
    const duplicates = list.filter((c) => c.id !== canonical.id);

    for (const dup of duplicates) {
      const dupUniversities = await prisma.university.findMany({
        where: { countryId: dup.id, deletedAt: null },
      });

      for (const uni of dupUniversities) {
        const clash = await prisma.university.findFirst({
          where: {
            countryId: canonical.id,
            name: uni.name,
            deletedAt: null,
            NOT: { id: uni.id },
          },
        });
        if (clash) {
          await prisma.university.update({
            where: { id: uni.id },
            data: { deletedAt: new Date() },
          });
        } else {
          await prisma.university.update({
            where: { id: uni.id },
            data: { countryId: canonical.id },
          });
        }
      }

      await prisma.student.updateMany({
        where: { countryId: dup.id },
        data: { countryId: canonical.id },
      });

      await prisma.faq.updateMany({
        where: { countryId: dup.id },
        data: { countryId: canonical.id },
      });

      const dupLinks = await prisma.countryChecklist.findMany({ where: { countryId: dup.id } });
      for (const link of dupLinks) {
        const exists = await prisma.countryChecklist.findUnique({
          where: { countryId_checkListId: { countryId: canonical.id, checkListId: link.checkListId } },
        });
        if (exists) {
          await prisma.countryChecklist.delete({ where: { id: link.id } });
        } else {
          await prisma.countryChecklist.update({
            where: { id: link.id },
            data: { countryId: canonical.id },
          });
        }
      }

      await prisma.country.update({
        where: { id: dup.id },
        data: { deletedAt: new Date() },
      });
      merged += 1;
      console.log(`Merged "${dup.name}" (id ${dup.id}) → "${canonical.name}" (id ${canonical.id})`);
    }

    if (canonical.name !== canonicalName) {
      await prisma.country.update({
        where: { id: canonical.id },
        data: { name: canonicalName },
      });
    }
  }

  const total = await prisma.country.count({ where: { deletedAt: null } });
  console.log(`✅ Done. Merged ${merged} duplicate(s). Active countries: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
