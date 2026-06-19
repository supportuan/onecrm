/**
 * Re-applies tenant migrations when they were recorded in _prisma_migrations
 * but the SQL never actually ran (schema drift).
 *
 * Safe to run multiple times — skips steps that already exist.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../prisma/migrations');

const MIGRATIONS = [
  '20260616120000_tenant_foundation',
  '20260616130000_tenant_modules',
  '20260616140000_hr_tenant_scope',
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

const hasColumn = async (table: string, column: string) => {
  const res = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'onecrm' AND table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return res.rowCount > 0;
};

const hasTable = async (table: string) => {
  const res = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'onecrm' AND table_name = $1`,
    [table]
  );
  return res.rowCount > 0;
};

const main = async () => {
  await client.connect();
  console.log('Checking tenant schema...');

  if (await hasTable('Tenant') && (await hasColumn('User', 'tenantId'))) {
    console.log('Tenant schema already present — nothing to do.');
    return;
  }

  console.log('Applying tenant migrations manually...');

  for (const name of MIGRATIONS) {
    const sqlPath = path.join(migrationsDir, name, 'migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`→ ${name}`);
    await client.query(sql);
  }

  const ok = (await hasTable('Tenant')) && (await hasColumn('User', 'tenantId'));
  if (!ok) throw new Error('Tenant migration did not apply correctly');
  console.log('✅ Tenant schema repaired.');
};

main()
  .catch((e) => {
    console.error('❌ Repair failed:', e.message);
    process.exit(1);
  })
  .finally(() => client.end());
