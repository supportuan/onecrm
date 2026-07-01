/**
 * Hire Ashish (Counsellor) via recruitment pipeline + provision CRM login.
 * Usage: npx tsx scripts/hire-ashish.ts
 */
import dotenv from 'dotenv';
import { PrismaClient, UserRole, HrJobStatus, HrJobType, HrCandidateStatus } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';
import { getDefaultTenantId } from '../src/utils/tenant-default.js';
import {
  addCandidate,
  createJobPosting,
  createOfferLetter,
  acceptOfferLetter,
} from '../src/modules/hr/hr.prisma.service.js';

dotenv.config();

const EMAIL = 'ashish@applyuninow.com';
const NAME = 'Ashish';
const DESIGNATION = 'Counsellor';
const DEPARTMENT = 'Student Services';
const DEFAULT_PASSWORD = process.env.DEFAULT_STUDENT_PASSWORD || 'Welcome@123';

const prisma = new PrismaClient();

async function ensureCounsellorUser(tenantId: number, employeeId: number) {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    await prisma.hrEmployee.update({
      where: { id: employeeId },
      data: {
        userId: existing.id,
        designation: DESIGNATION,
        department: DEPARTMENT,
        name: NAME,
        firstName: NAME,
        lastName: '',
      },
    });
    console.log(`Linked existing user ${EMAIL} to employee #${employeeId}`);
    return existing;
  }

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  const user = await prisma.user.create({
    data: {
      fullName: NAME,
      email: EMAIL,
      phone: '+910000000001',
      passwordHash,
      role: UserRole.COUNSELLOR,
      tenantId,
      isActive: true,
      isApproved: true,
    },
  });
  await prisma.hrEmployee.update({
    where: { id: employeeId },
    data: {
      userId: user.id,
      designation: DESIGNATION,
      department: DEPARTMENT,
      name: NAME,
      firstName: NAME,
    },
  });
  console.log(`Created counsellor login: ${EMAIL}`);
  return user;
}

async function main() {
  const tenantId = await getDefaultTenantId();
  console.log(`Tenant id: ${tenantId}`);

  const existingEmp = await prisma.hrEmployee.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' } },
  });
  if (existingEmp) {
    await ensureCounsellorUser(tenantId, existingEmp.id);
    console.log(`Ashish already employed (id ${existingEmp.id}, code ${existingEmp.employeeCode}).`);
    return;
  }

  let job = await prisma.hrJobPosting.findFirst({
    where: { title: 'Counsellor' },
  });
  if (!job) {
    const created = await createJobPosting({
      title: 'Counsellor',
      department: DEPARTMENT,
      location: 'HQ Office',
      type: HrJobType.FULL_TIME,
      description: 'Student counselling and admissions support.',
      requirements: 'Experience in study-abroad counselling.',
      salaryRange: '12,00,000 - 18,00,000',
      status: HrJobStatus.OPEN,
      hiringManager: 'HR Manager',
      postedAt: new Date().toISOString().split('T')[0],
      closingDate: null,
    });
    job = await prisma.hrJobPosting.findUnique({ where: { id: Number(created.id) } });
    console.log(`Created job posting: Counsellor (id ${job?.id})`);
  }

  if (!job) throw new Error('Job posting missing');

  let candidate = await prisma.hrCandidate.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' } },
  });
  if (!candidate) {
    const added = await addCandidate({
      jobId: String(job.id),
      name: NAME,
      email: EMAIL,
      phone: '+910000000001',
      currentStage: 'offer_generation',
      status: HrCandidateStatus.ACTIVE,
    });
    candidate = await prisma.hrCandidate.findUnique({ where: { id: Number(added.id) } });
    console.log(`Added candidate Ashish (id ${candidate?.id})`);
  }

  if (!candidate) throw new Error('Candidate missing');

  let offer = await prisma.hrOfferLetter.findFirst({
    where: { candidateEmail: { equals: EMAIL, mode: 'insensitive' } },
    orderBy: { id: 'desc' },
  });
  if (!offer || offer.status === 'REJECTED') {
    const created = await createOfferLetter({
      candidateId: String(candidate.id),
      candidateName: NAME,
      candidateEmail: EMAIL,
      jobTitle: DESIGNATION,
      department: DEPARTMENT,
      offeredSalary: 1500000,
      joiningDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'SENT',
      policyTemplate: 'standard',
    });
    offer = await prisma.hrOfferLetter.findUnique({ where: { id: Number(created.id) } });
    console.log(`Created offer letter (id ${offer?.id})`);
  }

  if (!offer) throw new Error('Offer letter missing');

  if (offer.status !== 'ACCEPTED') {
    const result = await acceptOfferLetter(String(offer.id), { tenantId });
    console.log(`Offer accepted — employee id ${result.employeeId}, onboarding checklist ${result.checklistId}`);
    await ensureCounsellorUser(tenantId, Number(result.employeeId));
  } else if (offer.employeeId) {
    await ensureCounsellorUser(tenantId, offer.employeeId);
    console.log(`Offer was already accepted for employee #${offer.employeeId}`);
  }

  const emp = await prisma.hrEmployee.findFirst({ where: { email: EMAIL } });
  console.log('\n--- Ashish hired ---');
  console.log(JSON.stringify({
    name: emp?.name,
    email: emp?.email,
    employeeCode: emp?.employeeCode,
    designation: emp?.designation,
    department: emp?.department,
    employmentStatus: emp?.employmentStatus,
    loginEmail: EMAIL,
    tempPassword: DEFAULT_PASSWORD,
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
