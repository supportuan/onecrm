import { listCatalog, getCatalogStats } from '../src/modules/crm-settings/crm-settings.service.js';

async function main() {
  const stats = await getCatalogStats();
  console.log('Stats:', stats);
  const page = await listCatalog({ page: 1, limit: 3 });
  console.log('Sample rows:', JSON.stringify(page.items, null, 2));
  console.log('Total courses:', page.total);
}

main().catch(console.error);
