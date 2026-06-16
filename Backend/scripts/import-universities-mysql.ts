/**
 * Import countries + universities from ApplyUniNow MySQL into One CRM PostgreSQL.
 *
 * Usage:
 *   APPLY_UNI_MYSQL_URL="mysql://user:pass@localhost:3307/dbname" npx tsx scripts/import-universities-mysql.ts
 */
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';
import { normalizeCountryName } from './dedupe-countries.js';

dotenv.config();

async function connectMysql() {
  if (process.env.APPLY_UNI_MYSQL_USER) {
    const config = {
      host: process.env.APPLY_UNI_MYSQL_HOST || 'localhost',
      port: Number(process.env.APPLY_UNI_MYSQL_PORT || 3307),
      user: process.env.APPLY_UNI_MYSQL_USER,
      password: process.env.APPLY_UNI_MYSQL_PASSWORD || '',
      database: process.env.APPLY_UNI_MYSQL_DATABASE || 'apply_uni_now',
    };
    console.log(`Connecting to MySQL: ${config.user}@${config.host}:${config.port}/${config.database}`);
    return mysql.createConnection(config);
  }

  const mysqlUrl = process.env.APPLY_UNI_MYSQL_URL || 'mysql://root:@localhost:3307/apply_uni_now';
  console.log('Connecting to MySQL:', mysqlUrl.replace(/:[^:@]+@/, ':***@'));
  return mysql.createConnection(mysqlUrl);
}

async function main() {
  const prisma = new PrismaClient();
  const conn = await connectMysql();

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

  let imported = 0;
  for (const u of universities) {
    const countryId = countryIdMap.get(u.country_id);
    if (!countryId) continue;

    const byExternal = await prisma.university.findUnique({ where: { externalId: u.id } });
    if (byExternal) {
      await prisma.university.update({
        where: { id: byExternal.id },
        data: {
          name: u.name,
          countryId,
          city: u.city || null,
          location: u.location || null,
          logo: u.logo || null,
          deletedAt: null,
        },
      });
    } else {
      await prisma.university.upsert({
        where: { countryId_name: { countryId, name: u.name } },
        create: {
          externalId: u.id,
          name: u.name,
          countryId,
          city: u.city || null,
          location: u.location || null,
          logo: u.logo || null,
        },
        update: {
          externalId: u.id,
          city: u.city || null,
          location: u.location || null,
          logo: u.logo || null,
          deletedAt: null,
        },
      });
    }
    imported += 1;
  }

  await conn.end();
  const total = await prisma.university.count({ where: { deletedAt: null } });
  console.log(`✅ Imported/updated ${imported} universities (${total} total in PostgreSQL)`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  console.error('Set APPLY_UNI_MYSQL_URL=mysql://user:pass@localhost:3307/your_db');
  process.exit(1);
});
