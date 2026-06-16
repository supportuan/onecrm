import { PrismaClient } from '@prisma/client';
import { launchCampaign } from '../src/modules/marketing/services/campaignLaunch.service.js';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Campaign Launch verification...");

  // Find a draft campaign
  let campaign = await prisma.campaign.findFirst({
    where: { status: 'DRAFT', deletedAt: null },
    include: { leads: true }
  });

  if (!campaign) {
    console.log("No DRAFT campaign found, creating one...");
    campaign = await prisma.campaign.create({
      data: {
        name: 'Test Launch Campaign',
        type: 'SOCIAL_MEDIA',
        status: 'DRAFT',
        description: 'Test Campaign Description'
      },
      include: { leads: true }
    });
  }

  // Check if it has leads, if not add a lead
  if (campaign.leads.length === 0) {
    console.log("Adding a lead to the campaign...");
    const lead = await prisma.lead.findFirst({ where: { deletedAt: null } });
    if (lead) {
      await prisma.campaignLead.create({
        data: {
          campaignId: campaign.id,
          leadId: lead.id,
          status: 'PENDING'
        }
      });
    } else {
      console.log("No leads exist in the database, creating a test lead first...");
      const newLead = await prisma.lead.create({
        data: {
          fullName: 'Verification Test Lead',
          email: 'testlead@example.com',
          phone: '+919999999999'
        }
      });
      await prisma.campaignLead.create({
        data: {
          campaignId: campaign.id,
          leadId: newLead.id,
          status: 'PENDING'
        }
      });
    }
  }

  console.log(`Launching campaign ID: ${campaign.id}`);
  const result = await launchCampaign(campaign.id);
  console.log("Launch result:", result);

  // Verify DB state
  const updatedCampaign = await prisma.campaign.findUnique({
    where: { id: campaign.id }
  });
  console.log("Updated Campaign Status:", updatedCampaign?.status);

  const logs = await prisma.campaignLaunchLog.findMany({
    where: { campaignId: campaign.id }
  });
  console.log(`Logs found for Campaign: ${logs.length}`);
  if (logs.length > 0) {
    const latestLog = logs[logs.length - 1];
    console.log("Latest Log Status:", latestLog.status);
    console.log("Latest Log Details:", JSON.stringify(latestLog.details, null, 2));

    if (updatedCampaign?.status === 'ACTIVE' && latestLog.status === 'SUCCESS') {
      console.log("🎉 Verification PASSED successfully!");
    } else {
      console.error("❌ Verification FAILED!");
    }
  } else {
    console.error("❌ No logs created in database!");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error running verification:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
