/**
 * Import countries + universities from ApplyUniNow MySQL into One CRM PostgreSQL.
 *
 * Usage:
 *   APPLY_UNI_MYSQL_URL="mysql://user:pass@localhost:3307/dbname" npx tsx scripts/import-universities-mysql.ts
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { normalizeCountryName } from './dedupe-countries.js';
import { connectApplyUniMysql } from './lib/applyuni-mysql.js';

dotenv.config();

async function main() {
  const prisma = new PrismaClient();
  const { conn, close } = await connectApplyUniMysql();

  const [countryCols] = await conn.query<any[]>('DESCRIBE countries');
  const countryColNames = new Set(countryCols.map((c: { Field: string }) => c.Field));
  const countryDeleted = countryColNames.has('deleted_at') ? 'WHERE deleted_at IS NULL' : '';

  const [countries] = await conn.query<any[]>(
    `SELECT id, name, symbol, currency FROM countries ${countryDeleted} ORDER BY name`
  );
  console.log(`Found ${countries.length} countries in MySQL`);

  const countryIdMap = new Map<number, number>();

  for (const c of countries) {
    const normalizedName = normalizeCountryName(c.name);
    const existing = await prisma.country.findFirst({
      where: { name: { equals: normalizedName, mode: 'insensitive' }, deletedAt: null },
    });

    const row = existing
      ? await prisma.country.update({
          where: { id: existing.id },
          data: {
            name: normalizedName,
            symbol: c.symbol || existing.symbol,
            currency: c.currency || existing.currency,
            deletedAt: null,
          },
        })
      : await prisma.country.create({
          data: {
            name: normalizedName,
            symbol: c.symbol || null,
            currency: c.currency || null,
          },
        });

    countryIdMap.set(c.id, row.id);
  }

  const [uniCols] = await conn.query<any[]>('DESCRIBE universities');
  const uniColNames = new Set(uniCols.map((c: { Field: string }) => c.Field));
  const uniDeleted = uniColNames.has('deleted_at') ? 'WHERE deleted_at IS NULL' : '';
  const logoCol = uniColNames.has('logo') ? 'logo' : 'NULL AS logo';
  const locationCol = uniColNames.has('location') ? 'location' : 'NULL AS location';
  const cityCol = uniColNames.has('city') ? 'city' : 'NULL AS city';

  const [universities] = await conn.query<any[]>(
    `SELECT id, name, country_id, ${cityCol}, ${locationCol}, ${logoCol}
     FROM universities
     ${uniDeleted}
     ORDER BY id`
  );
  console.log(`Found ${universities.length} universities in MySQL`);

  // Two-phase strategy so one bad row never aborts the whole import:
  //   1. Try the happy path (find-by-externalId update, or upsert by
  //      countryId+name).
  //   2. On Prisma P2002 (unique constraint), apply a small set of merge
  //      rules — e.g. another PG row already owns the (countryId, name) we
  //      want to rename into. We never lose data; we either keep current name
  //      or rebind the externalId to the colliding row.
  let imported = 0;
  let renamesSkipped = 0;
  let externalIdMerged = 0;
  let unmappedCountry = 0;
  let otherFailures = 0;
  const conflictExamples: string[] = [];

  for (const u of universities) {
    const countryId = countryIdMap.get(u.country_id);
    if (!countryId) {
      unmappedCountry += 1;
      continue;
    }

    const writeData = {
      name: u.name,
      countryId,
      city: u.city || null,
      location: u.location || null,
      logo: u.logo || null,
      deletedAt: null,
    };

    try {
      const byExternal = await prisma.university.findUnique({ where: { externalId: u.id } });

      if (byExternal) {
        // Existing PG row maps to this externalId. Rename only if no other
        // PG row already owns the target (countryId, name).
        if (byExternal.name !== u.name || byExternal.countryId !== countryId) {
          const collision = await prisma.university.findFirst({
            where: { countryId, name: u.name, NOT: { id: byExternal.id } },
            select: { id: true },
          });
          if (collision) {
            renamesSkipped += 1;
            if (conflictExamples.length < 5) {
              conflictExamples.push(
                `keep PG#${byExternal.id} name="${byExternal.name}" (would clash with PG#${collision.id} "${u.name}")`,
              );
            }
            // Keep the existing name + country; refresh peripheral fields only.
            await prisma.university.update({
              where: { id: byExternal.id },
              data: {
                city: u.city || byExternal.city,
                location: u.location || byExternal.location,
                logo: u.logo || byExternal.logo,
                deletedAt: null,
              },
            });
          } else {
            await prisma.university.update({ where: { id: byExternal.id }, data: writeData });
          }
        } else {
          await prisma.university.update({ where: { id: byExternal.id }, data: writeData });
        }
        imported += 1;
        continue;
      }

      // No PG row owns this externalId yet. Try upsert on (countryId, name);
      // on the update branch, only set externalId if no other PG row already
      // claims it.
      const byKey = await prisma.university.findUnique({
        where: { countryId_name: { countryId, name: u.name } },
      });
      if (byKey) {
        const externalTaken = byKey.externalId != null && byKey.externalId !== u.id;
        if (externalTaken) {
          // Another import already bound a different externalId to this name.
          // Keep the older binding and just refresh peripheral fields. Skip
          // remapping this externalId — the MySQL row is effectively a dup.
          externalIdMerged += 1;
          if (conflictExamples.length < 5) {
            conflictExamples.push(
              `merge ext ${u.id} into PG#${byKey.id} (already bound to ext ${byKey.externalId})`,
            );
          }
          await prisma.university.update({
            where: { id: byKey.id },
            data: {
              city: u.city || byKey.city,
              location: u.location || byKey.location,
              logo: u.logo || byKey.logo,
              deletedAt: null,
            },
          });
        } else {
          await prisma.university.update({
            where: { id: byKey.id },
            data: { ...writeData, externalId: u.id },
          });
        }
        imported += 1;
      } else {
        await prisma.university.create({ data: { externalId: u.id, ...writeData } });
        imported += 1;
      }
    } catch (err: any) {
      otherFailures += 1;
      if (conflictExamples.length < 5) {
        conflictExamples.push(`row ext ${u.id} "${u.name}" → ${err?.code || ''} ${err?.message?.split('\n')[0] || err}`);
      }
    }
  }

  await close();
  const total = await prisma.university.count({ where: { deletedAt: null } });
  console.log(`✅ Imported/updated ${imported} universities (${total} total in PostgreSQL)`);
  if (renamesSkipped) console.log(`   ${renamesSkipped} rename(s) skipped due to name collision`);
  if (externalIdMerged) console.log(`   ${externalIdMerged} externalId(s) merged into an existing row`);
  if (unmappedCountry) console.log(`   ${unmappedCountry} skipped: unknown country`);
  if (otherFailures) console.log(`   ${otherFailures} unrecognised failure(s)`);
  if (conflictExamples.length) {
    console.log('   Sample issues:');
    conflictExamples.forEach((m) => console.log(`     - ${m}`));
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Import failed:', err?.message || err);

  if (err?.code === 'ECONNREFUSED') {
    console.error(
      'MySQL is not reachable. Start the ApplyUniNow MySQL server/container or update ' +
        'APPLY_UNI_MYSQL_HOST/APPLY_UNI_MYSQL_PORT in .env.',
    );
  } else if (!process.env.APPLY_UNI_MYSQL_USER && !process.env.APPLY_UNI_MYSQL_URL) {
    console.error('Set APPLY_UNI_MYSQL_URL=mysql://user:pass@localhost:3307/your_db');
  }

  process.exit(1);
});
