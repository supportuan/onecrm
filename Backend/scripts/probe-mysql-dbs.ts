import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.APPLY_UNI_MYSQL_HOST || 'localhost',
    port: Number(process.env.APPLY_UNI_MYSQL_PORT || 3307),
    user: process.env.APPLY_UNI_MYSQL_USER,
    password: process.env.APPLY_UNI_MYSQL_PASSWORD || '',
  });
  const [dbs] = await conn.query<any[]>('SHOW DATABASES');
  console.log('Databases:', dbs.map((d) => d.Database));

  for (const row of dbs) {
    const db = row.Database as string;
    if (db === 'information_schema' || db === 'performance_schema' || db === 'mysql' || db === 'sys') continue;
    try {
      const [tables] = await conn.query<any[]>(`SHOW TABLES FROM \`${db}\``);
      const names = tables.map((t) => Object.values(t)[0]);
      if (names.includes('universities') || names.includes('countries')) {
        console.log(`\n✅ ${db} has:`, names.filter((n) => ['universities', 'countries'].includes(String(n))));
        const [cnt] = await conn.query<any[]>(`SELECT COUNT(*) as c FROM \`${db}\`.universities`);
        console.log(`   universities count:`, cnt[0]?.c);
      }
    } catch {
      /* skip */
    }
  }
  await conn.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
