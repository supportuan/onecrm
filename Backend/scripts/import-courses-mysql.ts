/**
 * Import courses from ApplyUniNow MySQL course_lists → PostgreSQL Course table.
 * Requires universities imported with externalId (re-run crm:import-universities first).
 *
 * Usage:
 *   npx tsx scripts/import-courses-mysql.ts
 *   IMPORT_BATCH_SIZE=2000 IMPORT_MAX_BATCHES=50 npx tsx scripts/import-courses-mysql.ts  (sample)
 */
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const BATCH = Number(process.env.IMPORT_BATCH_SIZE || 2000);
const MAX_BATCHES = Number(process.env.IMPORT_MAX_BATCHES || 0); // 0 = all
const TABLE = process.env.APPLY_UNI_COURSE_TABLE || 'course_lists';

async function connectMysql() {
  return mysql.createConnection({
    host: process.env.APPLY_UNI_MYSQL_HOST || 'localhost',
    port: Number(process.env.APPLY_UNI_MYSQL_PORT || 3307),
    user: process.env.APPLY_UNI_MYSQL_USER,
    password: process.env.APPLY_UNI_MYSQL_PASSWORD || '',
    database: process.env.APPLY_UNI_MYSQL_DATABASE || 'applyuninow_new',
  });
}

async function main() {
  const prisma = new PrismaClient();
  const conn = await connectMysql();

  const uniMap = new Map(
    (await prisma.university.findMany({ where: { externalId: { not: null }, deletedAt: null }, select: { id: true, externalId: true } }))
      .map((u) => [u.externalId!, u.id])
  );
  console.log(`Universities with externalId: ${uniMap.size}`);
  if (uniMap.size === 0) {
    console.error('Run npm run crm:import-universities first to link externalId on universities.');
    process.exit(1);
  }

  const [countRow] = await conn.query<any[]>(
    `SELECT COUNT(*) as c FROM \`${TABLE}\` WHERE deleted_at IS NULL AND university_id IS NOT NULL`
  );
  const total = Number(countRow[0]?.c || 0);
  console.log(`MySQL courses to import (${TABLE}): ${total}`);

  let offset = 0;
  let imported = 0;
  let skipped = 0;
  let batchNum = 0;

  while (offset < total) {
    if (MAX_BATCHES > 0 && batchNum >= MAX_BATCHES) break;

    const [rows] = await conn.query<any[]>(
      `SELECT id, COURSE_NAME, INTAKES, APPLICATION_FEE, TUITION_FEE, DURATION, IELTS, TOEFL,
              COURSE_LEVEL, university_id
       FROM \`${TABLE}\`
       WHERE deleted_at IS NULL AND university_id IS NOT NULL
       ORDER BY id
       LIMIT ? OFFSET ?`,
      [BATCH, offset]
    );

    if (!rows.length) break;

    const payload = [];
    for (const r of rows) {
      const universityId = uniMap.get(r.university_id);
      if (!universityId) {
        skipped += 1;
        continue;
      }
      payload.push({
        externalId: r.id,
        name: String(r.COURSE_NAME || '').trim(),
        universityId,
        level: r.COURSE_LEVEL || null,
        intakes: r.INTAKES || null,
        applicationFee: r.APPLICATION_FEE || null,
        tuitionFee: r.TUITION_FEE || null,
        duration: r.DURATION || null,
        ielts: r.IELTS || null,
        toefl: r.TOEFL || null,
      });
    }

    const valid = payload.filter((item) => item.name);
    if (valid.length) {
      const result = await prisma.course.createMany({ data: valid, skipDuplicates: true });
      imported += result.count;
    }

    offset += rows.length;
    batchNum += 1;
    console.log(`Batch ${batchNum}: processed ${offset}/${total}, imported ${imported}, skipped ${skipped}`);
  }

  await conn.end();
  const pgTotal = await prisma.course.count({ where: { deletedAt: null } });
  console.log(`✅ Courses in PostgreSQL: ${pgTotal}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Import failed:', e.message);
  process.exit(1);
});
