import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const countries = await p.country.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    include: { _count: { select: { universities: true, students: true } } },
  });
  console.log('Total active countries:', countries.length);

  const byKey = new Map<string, typeof countries>();
  for (const c of countries) {
    const key = c.name.trim().toLowerCase();
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(c);
  }

  const dups = [...byKey.entries()].filter(([, list]) => list.length > 1);
  console.log('Duplicate name groups:', dups.length);
  for (const [key, list] of dups) {
    console.log(`\n"${key}":`, list.map((c) => ({ id: c.id, name: c.name, unis: c._count.universities, students: c._count.students })));
  }
}

main().finally(() => p.$disconnect());
