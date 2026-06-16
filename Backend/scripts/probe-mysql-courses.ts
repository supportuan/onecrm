import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.APPLY_UNI_MYSQL_HOST || 'localhost',
    port: Number(process.env.APPLY_UNI_MYSQL_PORT || 3307),
    user: process.env.APPLY_UNI_MYSQL_USER,
    password: process.env.APPLY_UNI_MYSQL_PASSWORD || '',
    database: process.env.APPLY_UNI_MYSQL_DATABASE || 'applyuninow_new',
  });

  const [tables] = await conn.query<any[]>(
    `SHOW TABLES LIKE '%course%'`
  );
  console.log('Course-related tables:', tables);

  const [allTables] = await conn.query<any[]>('SHOW TABLES');
  const names = allTables.map((t) => Object.values(t)[0] as string);
  const related = names.filter(
    (n) =>
      /course|program|degree|study_area|industry/i.test(n)
  );
  console.log('Related tables:', related);

  for (const table of related.slice(0, 15)) {
    const [cols] = await conn.query<any[]>(`DESCRIBE \`${table}\``);
    const [cnt] = await conn.query<any[]>(`SELECT COUNT(*) as c FROM \`${table}\``);
    console.log(`\n${table} (${cnt[0]?.c} rows):`, cols.map((c: { Field: string }) => c.Field).join(', '));
    const [sample] = await conn.query<any[]>(`SELECT * FROM \`${table}\` LIMIT 2`);
    console.log('sample:', sample);
  }

  await conn.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
