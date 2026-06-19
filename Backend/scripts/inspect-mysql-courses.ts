import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const connect = (database: string) =>
  mysql.createConnection({
    host: process.env.APPLY_UNI_MYSQL_HOST || 'localhost',
    port: Number(process.env.APPLY_UNI_MYSQL_PORT || 3307),
    user: process.env.APPLY_UNI_MYSQL_USER,
    password: process.env.APPLY_UNI_MYSQL_PASSWORD || '',
    database,
  });

async function main() {
  for (const db of ['applyuninow', 'applyuninow_new']) {
    const conn = await connect(db);
    try {
      const [uni] = await conn.query<any[]>('SELECT COUNT(*) as c FROM universities');
      const [courses] = await conn.query<any[]>(
        "SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = ? AND table_name = 'course_lists'",
        [db]
      );
      let courseCount = 0;
      if (Number(courses[0]?.c)) {
        const [c] = await conn.query<any[]>('SELECT COUNT(*) as c FROM course_lists WHERE deleted_at IS NULL');
        courseCount = Number(c[0]?.c);
      }
      console.log(`${db}: universities=${uni[0]?.c}, course_lists=${courseCount}`);
    } catch (e: any) {
      console.log(`${db}: error - ${e.message}`);
    } finally {
      await conn.end();
    }
  }

  const conn = await connect('applyuninow_new');
  const [cols] = await conn.query<any[]>('DESCRIBE course_lists');
  console.log('\ncourse_lists columns:', cols.map((c: { Field: string }) => c.Field).join(', '));
  await conn.end();
}

main().catch(console.error);
