/**
 * Create an agency partner login (AGENT role + AgencyPartner row).
 *
 *   npx tsx scripts/provision-agency-login.ts "Ganesh Consultancy"
 *   npx tsx scripts/provision-agency-login.ts "Ganesh Consultancy" ganesh.consultancy@applyuninow.com
 */
import dotenv from 'dotenv';
import { AgencyPartnerStatus } from '@prisma/client';
import { createPartner } from '../src/modules/agency-crm/agency-crm.service.js';
import { approvePartnerLogin } from '../src/modules/agency-crm/agency-partner.lifecycle.js';
import { sendWelcomeCredentialsEmail } from '../src/lib/welcome-email.js';
import { getAgentLoginUrl } from '../src/utils/frontend-url.js';

dotenv.config();

const agencyName = (process.argv[2] || 'Ganesh Consultancy').trim();
const emailArg = (process.argv[3] || '').trim().toLowerCase();

const slugEmail = agencyName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '.')
  .replace(/^\.+|\.+$/g, '');

const email = emailArg || `${slugEmail}@applyuninow.com`;
const password = process.env.DEFAULT_AGENT_PASSWORD || 'Welcome@123';
const contactPerson = agencyName;

async function main() {
  const partner = await createPartner({
    fullName: contactPerson,
    email,
    password,
    agencyName,
    agencyCode: agencyName.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 24),
    contactPerson,
    country: 'India',
    status: AgencyPartnerStatus.PENDING,
  });

  await approvePartnerLogin(partner.id);

  await sendWelcomeCredentialsEmail({
    to: email,
    fullName: contactPerson,
    email,
    temporaryPassword: password,
    displayRole: 'Agency Partner',
    loginUrl: getAgentLoginUrl(),
    statusNote:
      'Your portal login is approved. Complete onboarding in the Agency CRM to activate referral sharing.',
  });

  console.log('Agency login created (approved for /agent-login; activate in Agency CRM after onboarding)');
  console.log(`  Agency:   ${partner.agencyName}`);
  console.log(`  Code:     ${partner.agencyCode}`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Login:    /agent-login`);
  console.log(`  Partner:  #${partner.id}`);
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
