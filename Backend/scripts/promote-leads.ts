/**
 * Promote all marketing leads → student login + student profile + application.
 * Uses universities already in PostgreSQL (run import-universities-mysql.ts first).
 *
 * Usage: npx tsx scripts/promote-leads.ts
 * Optional: DEFAULT_STUDENT_PASSWORD=Welcome@123
 */
import dotenv from 'dotenv';
import { promoteAllLeads } from '../src/modules/student-crm/student-crm.service.js';

dotenv.config();

async function main() {
  const password = process.env.DEFAULT_STUDENT_PASSWORD || 'Welcome@123';
  console.log('Promoting leads with default password for new accounts...');
  const results = await promoteAllLeads(password);
  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);

  console.log(`\n✅ Success: ${ok.length}`);
  for (const r of ok) {
    console.log(`  Lead #${r.leadId} ${r.email}${r.tempPassword ? ` → password: ${r.tempPassword}` : ' (already linked)'}`);
  }
  if (fail.length) {
    console.log(`\n❌ Failed: ${fail.length}`);
    for (const r of fail) {
      console.log(`  Lead #${r.leadId} ${r.email}: ${r.error}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
