import pg from 'pg';

const { Client } = pg;

const client = new Client({
  user: 'atc_user',
  host: 'localhost',
  database: 'atcdev',
  password: 'atcdev_password@0668',
  port: 5432,
});

async function run() {
  console.log('Attempting to connect to the PostgreSQL database "atcdev"...');
  try {
    await client.connect();
    console.log('Successfully connected to the database!');
    
    const res = await client.query('SELECT NOW()');
    console.log('Current time from DB:', res.rows[0].now);
  } catch (err: any) {
    console.error('Connection failed:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
