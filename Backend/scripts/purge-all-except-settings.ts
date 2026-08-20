/**
 * Wipe all operational CRM data. Keeps org settings, catalog, workflow templates,
 * document checklists, and RBAC permission rows. Keeps only one admin user.
 *
 * Usage:
 *   npx tsx scripts/purge-all-except-settings.ts --dry-run
 *   PURGE_CONFIRM=yes npx tsx scripts/purge-all-except-settings.ts --confirm
 */
import dotenv from 'dotenv';
import { PrismaClient, UserRole } from '@prisma/client';
import { ensureDefaultTenantSeeded } from '../src/modules/rbac/rbac.service.js';

dotenv.config();

const prisma = new PrismaClient();

const KEEPER_EMAIL = 'sandeep@applyuninow.com';
const DRY_RUN = process.argv.includes('--dry-run');
const CONFIRM =
  process.argv.includes('--confirm') ||
  process.env.PURGE_CONFIRM === 'yes' ||
  process.env.PURGE_CONFIRM === '1';

type CountFn = () => Promise<{ count: number }>;
type ModelCountFn = () => Promise<number>;

async function countOf(label: string, fn: CountFn): Promise<number> {
  try {
    const r = await fn();
    console.log(`  ${label}: ${r.count}`);
    return r.count;
  } catch {
    console.log(`  ${label}: (skipped)`);
    return 0;
  }
}

async function countRows(label: string, fn: ModelCountFn): Promise<number> {
  try {
    const n = await fn();
    console.log(`  ${label}: ${n}`);
    return n;
  } catch {
    console.log(`  ${label}: (skipped)`);
    return 0;
  }
}

async function deleteAll(label: string, countFn: ModelCountFn, deleteFn: CountFn): Promise<number> {
  if (DRY_RUN) return countRows(label, countFn);
  try {
    const r = await deleteFn();
    console.log(`  deleted ${label}: ${r.count}`);
    return r.count;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`  ${label}: FAILED — ${msg}`);
    return 0;
  }
}

async function wipe(
  label: string,
  model: { count: () => Promise<number>; deleteMany: () => Promise<{ count: number }> },
): Promise<number> {
  return deleteAll(label, () => model.count(), () => model.deleteMany());
}

async function purgeOperationalData(): Promise<void> {
  console.log('\n--- Applications & workflow runtime ---');
  await wipe('ApplicationWorkflowFieldValue', prisma.applicationWorkflowFieldValue);
  await wipe('ApplicationWorkflowChecklistValue', prisma.applicationWorkflowChecklistValue);
  await wipe('ApplicationComment', prisma.applicationComment);
  await wipe('ApplicationTask', prisma.applicationTask);
  await wipe('ApplicationStageEvent', prisma.applicationStageEvent);
  await wipe('ApplicationDocument', prisma.applicationDocument);
  await wipe('ApplicationFee', prisma.applicationFee);
  await wipe('ApplicationPayment', prisma.applicationPayment);
  await wipe('OfferLetter', prisma.offerLetter);
  await wipe('VisaDocument', prisma.visaDocument);
  await wipe('VisaTracking', prisma.visaTracking);
  await wipe('Application', prisma.application);

  console.log('\n--- Students ---');
  await wipe('StudentChecklist', prisma.studentChecklist);
  await wipe('StudentUniversity', prisma.studentUniversity);
  await wipe('StudentStudyPlan', prisma.studentStudyPlan);
  await wipe('Chat', prisma.chat);
  await wipe('Feedback', prisma.feedback);
  await wipe('Student', prisma.student);

  console.log('\n--- Agency CRM ---');
  await wipe('AgencyAnnouncementRead', prisma.agencyAnnouncementRead);
  await wipe('AgencyAnnouncement', prisma.agencyAnnouncement);
  await wipe('AgencyAgreementAcceptance', prisma.agencyAgreementAcceptance);
  await wipe('CommissionPayoutLine', prisma.commissionPayoutLine);
  await wipe('CommissionPayout', prisma.commissionPayout);
  await wipe('AgencyCommission', prisma.agencyCommission);
  await wipe('AgencyReferral', prisma.agencyReferral);
  await wipe('AgencyActivity', prisma.agencyActivity);
  await wipe('AgencyPartnerDocument', prisma.agencyPartnerDocument);
  await wipe('AgencyCommissionRule', prisma.agencyCommissionRule);
  await wipe('AgencyPartner', prisma.agencyPartner);

  console.log('\n--- Marketing & leads ---');
  await wipe('CampaignLaunchLog', prisma.campaignLaunchLog);
  await wipe('AutomationExecution', prisma.automationExecution);
  await wipe('CampaignLead', prisma.campaignLead);
  await wipe('LeadActivity', prisma.leadActivity);
  await wipe('Lead', prisma.lead);
  await wipe('LeadSource', prisma.leadSource);
  await wipe('MarketingAutomation', prisma.marketingAutomation);
  await wipe('LandingPageVisit', prisma.landingPageVisit);
  await wipe('LandingPage', prisma.landingPage);
  await wipe('MarketingForm', prisma.marketingForm);
  await wipe('MarketingMetric', prisma.marketingMetric);
  await wipe('MarketingPerformance', prisma.marketingPerformance);
  await wipe('MarketingChannelAnalytics', prisma.marketingChannelAnalytics);
  await wipe('AgencyFunnelAnalytics', prisma.agencyFunnelAnalytics);
  await wipe('AnalyticsLog', prisma.analyticsLog);
  await wipe('IntakeTrend', prisma.intakeTrend);
  await wipe('StudentFunnelStage', prisma.studentFunnelStage);
  await wipe('AgencyFunnelStage', prisma.agencyFunnelStage);
  await wipe('Campaign', prisma.campaign);

  console.log('\n--- HR ---');
  await wipe('HrCandidateStageEvent', prisma.hrCandidateStageEvent);
  await wipe('HrInterview', prisma.hrInterview);
  await wipe('HrOfferLetter', prisma.hrOfferLetter);
  await wipe('HrCandidate', prisma.hrCandidate);
  await wipe('HrJobPosting', prisma.hrJobPosting);
  await wipe('HrOnboardingItem', prisma.hrOnboardingItem);
  await wipe('HrOnboardingChecklist', prisma.hrOnboardingChecklist);
  await wipe('HrOnboardingTemplateItem', prisma.hrOnboardingTemplateItem);
  await wipe('HrOnboardingTemplate', prisma.hrOnboardingTemplate);
  await wipe('HrOfferLetterTemplate', prisma.hrOfferLetterTemplate);
  await wipe('HrPayslip', prisma.hrPayslip);
  await wipe('HrPayrollDeduction', prisma.hrPayrollDeduction);
  await wipe('HrSalaryStructure', prisma.hrSalaryStructure);
  await wipe('HrLeaveRequest', prisma.hrLeaveRequest);
  await wipe('HrLeavePlanAssignment', prisma.hrLeavePlanAssignment);
  await wipe('HrRegularization', prisma.hrRegularization);
  await wipe('HrAttendanceRecord', prisma.hrAttendanceRecord);
  await wipe('HrEmployeeDocument', prisma.hrEmployeeDocument);
  await wipe('HrPerformanceReview', prisma.hrPerformanceReview);
  await wipe('HrMarketingPerformance', prisma.hrMarketingPerformance);
  await wipe('HrCounsellorPerformance', prisma.hrCounsellorPerformance);
  await wipe('HrKpiMetric', prisma.hrKpiMetric);
  await wipe('HrProcessingMetric', prisma.hrProcessingMetric);
  await wipe('HrKpiDefinition', prisma.hrKpiDefinition);
  await wipe('HrEmployee', prisma.hrEmployee);
  await wipe('HrHoliday', prisma.hrHoliday);
  await wipe('HrLeaveDefinition', prisma.hrLeaveDefinition);
  await wipe('HrLeaveType', prisma.hrLeaveType);
  await wipe('HrLeavePlan', prisma.hrLeavePlan);
  await wipe('HrAttendanceDevice', prisma.hrAttendanceDevice);
  await wipe('HrNetworkWhitelist', prisma.hrNetworkWhitelist);
  await wipe('HrAttendanceSetting', prisma.hrAttendanceSetting);

  console.log('\n--- Resources & misc ---');
  await wipe('ResourceAcknowledgement', prisma.resourceAcknowledgement);
  await wipe('Resource', prisma.resource);
  await wipe('Faq', prisma.faq);
  await wipe('AdditionalService', prisma.additionalService);

  console.log('\n--- Auth tokens & notifications ---');
  await wipe('Notification', prisma.notification);
  await wipe('RefreshToken', prisma.refreshToken);
  await wipe('PasswordResetToken', prisma.passwordResetToken);
}

async function main(): Promise<void> {
  console.log('=== Purge all data except CRM settings & templates ===');
  console.log(`Keeper: ${KEEPER_EMAIL}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (counts only)' : CONFIRM ? 'LIVE DELETE' : 'preview — pass --confirm'}`);

  if (!DRY_RUN && !CONFIRM) {
    console.error('\nRefusing to run without --confirm or PURGE_CONFIRM=yes');
    process.exit(1);
  }

  const keeper = await prisma.user.findFirst({
    where: { email: { equals: KEEPER_EMAIL, mode: 'insensitive' } },
  });
  if (!keeper) {
    throw new Error(`Keeper user not found: ${KEEPER_EMAIL}. Create the account first.`);
  }

  const superAdmins = await prisma.user.findMany({
    where: { role: UserRole.SUPER_ADMIN },
    select: { id: true, email: true },
  });
  const allUsers = await prisma.user.count();
  console.log('\n--- RBAC ---');
  console.log(`  Tenant model removed — GLOBAL_ADMIN is the primary admin role.`);
  console.log(`  SUPER_ADMIN users: ${superAdmins.length}`);
  for (const u of superAdmins) {
    console.log(`    - ${u.email} (#${u.id})`);
  }
  console.log(`  Total users before purge: ${allUsers}`);

  console.log('\n--- Preserved (not deleted) ---');
  console.log('  OrgSettings, Country/University/Course catalog');
  console.log('  ApplicationWorkflowTemplate (+ stages/fields/checklists)');
  console.log('  DocumentChecklistTemplate, VisaDocumentChecklistTemplate');
  console.log('  CheckList, CountryChecklist');
  console.log('  RolePermission, Permission');

  await purgeOperationalData();

  if (!DRY_RUN) {
    console.log('\n--- Users ---');
    const removed = await prisma.user.deleteMany({
      where: { id: { not: keeper.id } },
    });
    console.log(`  deleted other users: ${removed.count}`);

    await prisma.user.update({
      where: { id: keeper.id },
      data: {
        role: UserRole.GLOBAL_ADMIN,
        counsellorId: null,
        agencyDetails: null,
        moduleAccess: null,
        isActive: true,
        isApproved: true,
      },
    });
    console.log(`  keeper ${KEEPER_EMAIL} → GLOBAL_ADMIN`);

    await ensureDefaultTenantSeeded();
    console.log('  RBAC defaults & org settings verified');
  }

  console.log('\n--- Remaining counts ---');
  await countRows('User', () => prisma.user.count());
  await countRows('Student', () => prisma.student.count());
  await countRows('Application', () => prisma.application.count());
  await countRows('Lead', () => prisma.lead.count());
  await countRows('AgencyPartner', () => prisma.agencyPartner.count());
  await countRows('HrEmployee', () => prisma.hrEmployee.count());
  await countRows('ApplicationWorkflowTemplate', () => prisma.applicationWorkflowTemplate.count());
  await countRows('University', () => prisma.university.count());
  await countRows('Country', () => prisma.country.count());

  console.log(DRY_RUN ? '\nDry run complete — no data changed.' : '\nPurge complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
