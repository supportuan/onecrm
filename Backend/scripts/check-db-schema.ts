import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

const main = async () => {
  await client.connect();
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'onecrm' AND table_name = 'User'
    ORDER BY ordinal_position
  `);
  console.log('User columns:', cols.rows.map((r) => r.column_name).join(', '));

  const tenant = await client.query(`
    SELECT table_schema, table_name FROM information_schema.tables
    WHERE table_name IN ('Tenant', 'TenantModule')
    ORDER BY table_schema, table_name
  `);
  console.log('Tenant tables:', tenant.rows);

  const crmTables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'onecrm' AND table_name IN ('Country', 'University', 'Course', 'AgencyPartner')
    ORDER BY table_name
  `);
  console.log('CRM tables:', crmTables.rows.map((r) => r.table_name));
};

main()
  .catch((e) => console.error(e))
  .finally(() => client.end());
