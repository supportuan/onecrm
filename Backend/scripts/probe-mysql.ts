import mysql from 'mysql2/promise';

const urls = [
  'mysql://root:root@localhost:3307',
  'mysql://root:@localhost:3307',
  'mysql://root:password@localhost:3307',
  'mysql://apply:apply@localhost:3307',
];

async function tryConnect(url: string) {
  try {
    const conn = await mysql.createConnection(url);
    const [dbs] = await conn.query('SHOW DATABASES');
    console.log('OK', url, dbs);
    await conn.end();
    return true;
  } catch (e: any) {
    console.log('FAIL', url, e.message);
    return false;
  }
}

async function main() {
  for (const u of urls) {
    if (await tryConnect(u)) break;
  }
}

main();
