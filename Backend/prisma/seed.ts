
import dotenv from 'dotenv';
import {
  PrismaClient,
  UserRole,
  LeadStatus,
  LeadRating,
  HrAccessRole,
  HrAttendanceStatus,
  HrRegularizationStatus,
  HrPayslipStatus,
  HrOnboardingCategory,
  HrOnboardingItemStatus,
  HrOnboardingChecklistStatus,
  HrOfferLetterStatus,
  HrInterviewType,
  HrInterviewStatus,
  HrJobType,
  HrJobStatus,
  HrCandidateStatus,
  HrKpiFrequency,
  HrReviewStatus,
} from '@prisma/client';
import { hashPassword, comparePasswords } from '../src/utils/password.js';

dotenv.config();

const prisma = new PrismaClient();

async function ensureUser(
  email: string,
  fullName: string,
  role: UserRole,
  defaultPassword: string,
  phone: string
) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const passwordHash = await hashPassword(defaultPassword);
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        role,
        isActive: true,
        isApproved: true,
      },
    });
    console.log(`✅ ${role} created: ${email}`);
    return user;
  }

  const hasCorrectPassword = await comparePasswords(defaultPassword, existing.passwordHash);
  if (!hasCorrectPassword) {
    const passwordHash = await hashPassword(defaultPassword);
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
    console.log(`✅ ${role} password reset: ${email}`);
  } else {
    console.log(`ℹ️ ${role} already exists: ${email}`);
  }

  return existing;
}

async function main() {
  console.log('Running seed...');

  await prisma.$queryRaw`SELECT 1`;
  console.log('Database connection successful.');

  const defaultPassword = 'Welcome@123';

  const superAdmin = await ensureUser(
    'superadmin@onecrm.com',
    'Super Admin',
    UserRole.SUPER_ADMIN,
    defaultPassword,
    '+910000000000'
  );

  const counsellor = await ensureUser(
    'counsellor@onecrm.com',
    'Priya Sharma',
    UserRole.COUNSELLOR,
    defaultPassword,
    '+919876543210'
  );

  const leadSources = [
    { name: 'Website Form', sourceType: 'Organic', description: 'Leads from website contact forms' },
    { name: 'Google Ads', sourceType: 'Paid Advertising', description: 'Leads from Google Ads campaigns' },
    { name: 'Meta Ads', sourceType: 'Paid Advertising', description: 'Leads from Facebook and Instagram ads' },
    { name: 'Referral', sourceType: 'Referral', description: 'Student and partner referrals' },
    { name: 'Education Fair', sourceType: 'Event', description: 'Leads captured at education fairs' },
  ];

  const sourceRecords = [];
  for (const source of leadSources) {
    const existingSource = await prisma.leadSource.findFirst({
      where: { name: source.name },
    });
    const record = existingSource
      ? await prisma.leadSource.update({
          where: { id: existingSource.id },
          data: source,
        })
      : await prisma.leadSource.create({ data: source });
    sourceRecords.push(record);
  }
  console.log(`✅ Lead sources ready (${sourceRecords.length})`);

  const sourceByName = Object.fromEntries(sourceRecords.map((s) => [s.name, s.id]));

  const sampleLeads = [
    {
      fullName: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      phone: '+919811223344',
      country: 'India',
      preferredCountry: 'Canada',
      preferredCourse: 'MBA',
      sourceId: sourceByName['Google Ads'],
      status: LeadStatus.NEW,
      rating: LeadRating.HOT,
      remark: 'Interested in fall intake',
      assignedCounsellorId: counsellor.id,
      assignedById: superAdmin.id,
    },
    {
      fullName: 'Ananya Patel',
      email: 'ananya.patel@example.com',
      phone: '+919900112233',
      country: 'India',
      preferredCountry: 'UK',
      preferredCourse: 'MSc Data Science',
      sourceId: sourceByName['Website Form'],
      status: LeadStatus.CONTACTED,
      rating: LeadRating.WARM,
      remark: 'Follow up next week',
      assignedCounsellorId: counsellor.id,
      assignedById: superAdmin.id,
    },
    {
      fullName: 'Karthik Reddy',
      email: 'karthik.reddy@example.com',
      phone: '+919888776655',
      country: 'India',
      preferredCountry: 'Australia',
      preferredCourse: 'Bachelors IT',
      sourceId: sourceByName['Meta Ads'],
      status: LeadStatus.QUALIFIED,
      rating: LeadRating.WARM,
      remark: 'Budget confirmed',
    },
    {
      fullName: 'Sneha Iyer',
      email: 'sneha.iyer@example.com',
      phone: '+919777665544',
      country: 'India',
      preferredCountry: 'Germany',
      preferredCourse: 'Masters Engineering',
      sourceId: sourceByName['Referral'],
      status: LeadStatus.PROPOSED,
      rating: LeadRating.HOT,
      remark: 'Documents pending',
      assignedCounsellorId: counsellor.id,
      assignedById: superAdmin.id,
    },
    {
      fullName: 'Arjun Singh',
      email: 'arjun.singh@example.com',
      phone: '+919666554433',
      country: 'India',
      preferredCountry: 'USA',
      preferredCourse: 'MS Computer Science',
      sourceId: sourceByName['Education Fair'],
      status: LeadStatus.NEW,
      rating: LeadRating.COLD,
      remark: 'Needs scholarship guidance',
    },
  ];

  let createdLeads = 0;
  for (const lead of sampleLeads) {
    const existingLead = await prisma.lead.findFirst({
      where: { email: lead.email, deletedAt: null },
    });
    if (!existingLead) {
      await prisma.lead.create({ data: lead });
      createdLeads += 1;
    }
  }
  console.log(`✅ Sample leads ready (${createdLeads} new, ${sampleLeads.length} total checked)`);

  const hrUser = await ensureUser(
    'hr@onecrm.com',
    'HR Manager',
    UserRole.HR,
    defaultPassword,
    '+919000000001'
  );

  await seedHrData(hrUser.id, defaultPassword);
  console.log(`Default password for seeded users: ${defaultPassword}`);
}

async function seedHrData(hrUserId: number, defaultPassword: string) {
  console.log('Seeding HR module data...');

  const employeeSpecs = [
    {
      name: 'Raju Kalla',
      employeeCode: 'E001',
      email: 'raju.kalla@onecrm.com',
      accessRole: HrAccessRole.EMPLOYEE,
      department: 'Engineering',
      designation: 'Senior Developer',
      biometricId: 'E001',
      location: 'Chicago Office',
    },
    {
      name: 'Jane Admin',
      employeeCode: 'E002',
      email: 'jane.admin@onecrm.com',
      accessRole: HrAccessRole.SUPER_ADMIN,
      department: 'Operations',
      designation: 'Operations Lead',
      biometricId: 'E002',
      location: 'Chicago Office',
    },
    {
      name: 'Alice Smith',
      employeeCode: 'E003',
      email: 'alice.smith@onecrm.com',
      accessRole: HrAccessRole.HR_MANAGER,
      department: 'Human Resources',
      designation: 'HR Manager',
      biometricId: 'E003',
      location: 'New York Office',
    },
    {
      name: 'Bob Johnson',
      employeeCode: 'E004',
      email: 'bob.johnson@onecrm.com',
      accessRole: HrAccessRole.HR_MANAGER,
      department: 'Finance',
      designation: 'Payroll Admin',
      biometricId: 'E004',
      location: 'New York Office',
    },
  ];

  const employees = [];
  for (const spec of employeeSpecs) {
    const emp = await prisma.hrEmployee.upsert({
      where: { email: spec.email },
      create: spec,
      update: spec,
    });
    employees.push(emp);
  }

  await prisma.hrEmployee.update({
    where: { id: employees[2].id },
    data: { userId: hrUserId },
  });

  console.log(`✅ HR employees ready (${employees.length})`);

  await prisma.hrAttendanceSetting.upsert({
    where: { id: 1 },
    create: { id: 1, attendanceMode: 'biometric', enableIpValidation: true },
    update: { attendanceMode: 'biometric', enableIpValidation: true },
  });

  const deviceSpecs = [
    {
      deviceId: '192.168.1.50',
      deviceName: 'Main Lobby Fingerprint',
      deviceIp: '192.168.1.50',
      status: 'online' as const,
    },
    {
      deviceId: '192.168.1.51',
      deviceName: 'Server Room Face Recognition',
      deviceIp: '192.168.1.51',
      status: 'online' as const,
    },
  ];

  const devices = [];
  for (const spec of deviceSpecs) {
    const existing = await prisma.hrAttendanceDevice.findFirst({
      where: { deviceIp: spec.deviceIp },
    });
    const device = existing
      ? await prisma.hrAttendanceDevice.update({ where: { id: existing.id }, data: spec })
      : await prisma.hrAttendanceDevice.create({ data: { ...spec, settings: {} } });
    devices.push(device);
  }

  const networkSpecs = [
    { ipAddressOrRange: '192.168.1.0/24', label: 'Office Wi-Fi Range', isActive: true },
    { ipAddressOrRange: '10.0.0.0/16', label: 'Corporate VPN', isActive: true },
  ];

  for (const spec of networkSpecs) {
    const existing = await prisma.hrNetworkWhitelist.findFirst({
      where: { ipAddressOrRange: spec.ipAddressOrRange },
    });
    if (!existing) {
      await prisma.hrNetworkWhitelist.create({ data: spec });
    }
  }

  const attendanceSpecs = [
    {
      employeeId: employees[0].id,
      date: '2026-05-20',
      checkIn: new Date('2026-05-20T09:00:00.000Z'),
      checkOut: new Date('2026-05-20T18:00:00.000Z'),
      status: HrAttendanceStatus.PRESENT,
      deviceRef: String(devices[0].id),
      deviceDbId: devices[0].id,
    },
    {
      employeeId: employees[0].id,
      date: '2026-05-21',
      checkIn: new Date('2026-05-21T09:15:00.000Z'),
      checkOut: new Date('2026-05-21T18:00:00.000Z'),
      status: HrAttendanceStatus.LATE,
      deviceRef: String(devices[0].id),
      deviceDbId: devices[0].id,
    },
    {
      employeeId: employees[1].id,
      date: '2026-05-20',
      checkIn: new Date('2026-05-20T08:45:00.000Z'),
      checkOut: new Date('2026-05-20T17:30:00.000Z'),
      status: HrAttendanceStatus.PRESENT,
      deviceRef: String(devices[0].id),
      deviceDbId: devices[0].id,
    },
    {
      employeeId: employees[2].id,
      date: '2026-05-20',
      checkIn: new Date('2026-05-20T09:05:00.000Z'),
      checkOut: new Date('2026-05-20T18:10:00.000Z'),
      status: HrAttendanceStatus.LATE,
      deviceRef: String(devices[1].id),
      deviceDbId: devices[1].id,
    },
  ];

  for (const spec of attendanceSpecs) {
    const existing = await prisma.hrAttendanceRecord.findFirst({
      where: { employeeId: spec.employeeId, date: spec.date },
    });
    if (!existing) {
      await prisma.hrAttendanceRecord.create({ data: spec });
    }
  }

  const existingReg = await prisma.hrRegularization.findFirst({
    where: { employeeId: employees[0].id, date: '2026-05-18' },
  });
  if (!existingReg) {
    await prisma.hrRegularization.create({
      data: {
        employeeId: employees[0].id,
        name: employees[0].name,
        date: '2026-05-18',
        type: 'check-in',
        time: '09:00',
        reason: 'Office scanner was disconnected',
        status: HrRegularizationStatus.PENDING,
      },
    });
  }

  const leavePlan = await prisma.hrLeavePlan.upsert({
    where: { id: 1 },
    create: {
      name: 'Standard FTE Leave Plan',
      description: 'Applicable for all full-time regular employees.',
    },
    update: {
      name: 'Standard FTE Leave Plan',
      description: 'Applicable for all full-time regular employees.',
    },
  });

  const leaveTypeSpecs = [
    { name: 'Casual Leave', code: 'CL' },
    { name: 'Medical Leave', code: 'ML' },
    { name: 'Earned Leave', code: 'EL' },
  ];

  const leaveTypes = [];
  for (const spec of leaveTypeSpecs) {
    const lt = await prisma.hrLeaveType.upsert({
      where: { code: spec.code },
      create: spec,
      update: spec,
    });
    leaveTypes.push(lt);
  }

  const leaveDefSpecs = [
    { planId: leavePlan.id, leaveTypeId: leaveTypes[0].id, name: 'Casual Leave', annualQuota: 12, carryForward: false },
    { planId: leavePlan.id, leaveTypeId: leaveTypes[1].id, name: 'Medical Leave', annualQuota: 10, carryForward: true },
  ];

  for (const spec of leaveDefSpecs) {
    await prisma.hrLeaveDefinition.upsert({
      where: { planId_leaveTypeId: { planId: spec.planId, leaveTypeId: spec.leaveTypeId } },
      create: spec,
      update: { name: spec.name, annualQuota: spec.annualQuota, carryForward: spec.carryForward },
    });
  }

  for (const emp of employees.slice(0, 3)) {
    await prisma.hrLeavePlanAssignment.upsert({
      where: { planId_employeeId: { planId: leavePlan.id, employeeId: emp.id } },
      create: { planId: leavePlan.id, employeeId: emp.id },
      update: {},
    });
  }

  const holidaySpecs = [
    { name: 'New Year Day', date: '2026-01-01', isRestricted: false },
    { name: 'Independence Day', date: '2026-08-15', isRestricted: false },
    { name: 'Thanksgiving Holiday', date: '2026-11-26', isRestricted: false },
    { name: 'Christmas Day', date: '2026-12-25', isRestricted: false },
  ];

  for (const spec of holidaySpecs) {
    const existing = await prisma.hrHoliday.findFirst({ where: { date: spec.date } });
    if (!existing) {
      await prisma.hrHoliday.create({ data: spec });
    }
  }

  const salarySpecs = [
    { employeeId: employees[0].id, basicSalary: 4500, allowances: 800, deductions: 300 },
    { employeeId: employees[1].id, basicSalary: 6500, allowances: 1200, deductions: 400 },
    { employeeId: employees[2].id, basicSalary: 5200, allowances: 900, deductions: 350 },
    { employeeId: employees[3].id, basicSalary: 4800, allowances: 850, deductions: 320 },
  ];

  for (const spec of salarySpecs) {
    await prisma.hrSalaryStructure.upsert({
      where: { employeeId: spec.employeeId },
      create: spec,
      update: {
        basicSalary: spec.basicSalary,
        allowances: spec.allowances,
        deductions: spec.deductions,
      },
    });
  }

  const payslipSpecs = [
    {
      employeeId: employees[0].id,
      name: employees[0].name,
      month: 4,
      year: 2026,
      basicSalary: 4500,
      allowances: 800,
      deductions: 300,
      netSalary: 5000,
      status: HrPayslipStatus.PAID,
    },
    {
      employeeId: employees[1].id,
      name: employees[1].name,
      month: 4,
      year: 2026,
      basicSalary: 6500,
      allowances: 1200,
      deductions: 400,
      netSalary: 7300,
      status: HrPayslipStatus.PAID,
    },
  ];

  for (const spec of payslipSpecs) {
    await prisma.hrPayslip.upsert({
      where: {
        employeeId_month_year: {
          employeeId: spec.employeeId,
          month: spec.month,
          year: spec.year,
        },
      },
      create: spec,
      update: spec,
    });
  }

  const payrollDeductionSpecs = [
    {
      employeeId: employees[0].id,
      month: 5,
      year: 2026,
      leaveDays: 2,
      leaveDeduction: 300,
      taxAmount: 450,
      otherDeductions: 50,
      totalDeductions: 800,
    },
    {
      employeeId: employees[1].id,
      month: 5,
      year: 2026,
      leaveDays: 0,
      leaveDeduction: 0,
      taxAmount: 1200,
      otherDeductions: 0,
      totalDeductions: 1200,
    },
  ];

  for (const spec of payrollDeductionSpecs) {
    await prisma.hrPayrollDeduction.upsert({
      where: {
        employeeId_month_year: {
          employeeId: spec.employeeId,
          month: spec.month,
          year: spec.year,
        },
      },
      create: spec,
      update: spec,
    });
  }

  const existingOnboarding = await prisma.hrOnboardingChecklist.findFirst({
    where: { employeeId: employees[0].id },
  });
  if (!existingOnboarding) {
    await prisma.hrOnboardingChecklist.create({
      data: {
        employeeId: employees[0].id,
        employeeName: employees[0].name,
        startDate: '2026-06-01',
        status: HrOnboardingChecklistStatus.IN_PROGRESS,
        items: {
          create: [
            { category: HrOnboardingCategory.DOCUMENTS, title: 'Offer Letter Signed', status: HrOnboardingItemStatus.COMPLETED, completedAt: new Date('2026-06-01T10:00:00Z'), completedBy: 'HR Manager' },
            { category: HrOnboardingCategory.DOCUMENTS, title: 'ID Proof Submitted', status: HrOnboardingItemStatus.COMPLETED, completedAt: new Date('2026-06-01T10:30:00Z'), completedBy: 'HR Manager' },
            { category: HrOnboardingCategory.DOCUMENTS, title: 'Bank Details Form', status: HrOnboardingItemStatus.PENDING },
            { category: HrOnboardingCategory.ACCESS, title: 'Email Account Created', status: HrOnboardingItemStatus.COMPLETED, completedAt: new Date('2026-06-02T09:00:00Z'), completedBy: 'IT Admin' },
            { category: HrOnboardingCategory.ACCESS, title: 'HRMS Access Granted', status: HrOnboardingItemStatus.PENDING },
            { category: HrOnboardingCategory.TRAINING, title: 'Orientation Session', status: HrOnboardingItemStatus.PENDING },
            { category: HrOnboardingCategory.TRAINING, title: 'Compliance Training', status: HrOnboardingItemStatus.PENDING },
          ],
        },
      },
    });
  }

  const jobSpecs = [
    {
      title: 'Senior Developer',
      department: 'Engineering',
      location: 'Chicago Office',
      type: HrJobType.FULL_TIME,
      description: 'Build scalable web applications using React and Node.js.',
      requirements: '5+ years experience, React, Node.js, PostgreSQL',
      salaryRange: '18,00,000 - 24,00,000',
      status: HrJobStatus.OPEN,
      hiringManager: 'Alice Smith',
      postedAt: '2026-05-15',
      closingDate: '2026-06-30',
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote',
      type: HrJobType.FULL_TIME,
      description: 'Lead product strategy and roadmap for our CRM platform.',
      requirements: '4+ years PM experience, B2B SaaS background',
      salaryRange: '22,00,000 - 28,00,000',
      status: HrJobStatus.OPEN,
      hiringManager: 'Jane Admin',
      postedAt: '2026-05-20',
      closingDate: '2026-06-25',
    },
  ];

  const jobs = [];
  for (const spec of jobSpecs) {
    const existing = await prisma.hrJobPosting.findFirst({ where: { title: spec.title } });
    const job = existing
      ? await prisma.hrJobPosting.update({ where: { id: existing.id }, data: spec })
      : await prisma.hrJobPosting.create({ data: spec });
    jobs.push(job);
  }

  const candidateSpecs = [
    { jobId: jobs[0].id, name: 'David Lee', email: 'david.lee@email.com', phone: '+1-555-0101', currentStage: 'offer_generation', status: HrCandidateStatus.ACTIVE, appliedAt: '2026-05-25' },
    { jobId: jobs[1].id, name: 'Sara Chen', email: 'sara.chen@email.com', phone: '+1-555-0102', currentStage: 'onboarding', status: HrCandidateStatus.ACTIVE, appliedAt: '2026-05-22' },
    { jobId: jobs[0].id, name: 'Mike Brown', email: 'mike.brown@email.com', phone: '+1-555-0103', currentStage: 'screening', status: HrCandidateStatus.ACTIVE, appliedAt: '2026-05-28' },
  ];

  const candidates = [];
  for (const spec of candidateSpecs) {
    const existing = await prisma.hrCandidate.findFirst({ where: { email: spec.email } });
    const cand = existing
      ? await prisma.hrCandidate.update({ where: { id: existing.id }, data: spec })
      : await prisma.hrCandidate.create({ data: spec });
    candidates.push(cand);
  }

  const offerSpecs = [
    {
      candidateId: candidates[0].id,
      candidateName: 'David Lee',
      candidateEmail: 'david.lee@email.com',
      jobTitle: 'Senior Developer',
      department: 'Engineering',
      offeredSalary: 1800000,
      joiningDate: '2026-07-01',
      expiryDate: '2026-06-20',
      status: HrOfferLetterStatus.SENT,
      policyTemplate: 'standard',
    },
    {
      candidateId: candidates[1].id,
      candidateName: 'Sara Chen',
      candidateEmail: 'sara.chen@email.com',
      jobTitle: 'Product Manager',
      department: 'Product',
      offeredSalary: 2200000,
      joiningDate: '2026-07-15',
      expiryDate: '2026-06-25',
      status: HrOfferLetterStatus.ACCEPTED,
      policyTemplate: 'senior',
    },
  ];

  for (const spec of offerSpecs) {
    const existing = await prisma.hrOfferLetter.findFirst({
      where: { candidateId: spec.candidateId },
    });
    if (!existing) {
      await prisma.hrOfferLetter.create({ data: spec });
    }
  }

  const interviewSpecs = [
    {
      candidateId: candidates[0].id,
      candidateName: 'David Lee',
      jobTitle: 'Senior Developer',
      round: 'Technical Round',
      type: HrInterviewType.VIRTUAL,
      scheduledAt: new Date('2026-06-10T10:00:00Z'),
      duration: 60,
      interviewers: ['Alice Smith', 'Raju Kalla'],
      meetingLink: 'https://meet.example.com/abc123',
      status: HrInterviewStatus.SCHEDULED,
    },
    {
      candidateId: candidates[1].id,
      candidateName: 'Sara Chen',
      jobTitle: 'Product Manager',
      round: 'HR Round',
      type: HrInterviewType.IN_PERSON,
      scheduledAt: new Date('2026-06-08T14:00:00Z'),
      duration: 45,
      interviewers: ['Jane Admin'],
      status: HrInterviewStatus.COMPLETED,
      feedback: {
        rating: 5,
        technicalScore: 90,
        communicationScore: 95,
        recommendation: 'STRONG_HIRE',
        notes: 'Excellent candidate',
        submittedBy: 'Jane Admin',
        submittedAt: new Date().toISOString(),
      },
    },
  ];

  for (const spec of interviewSpecs) {
    const existing = await prisma.hrInterview.findFirst({
      where: { candidateId: spec.candidateId, round: spec.round },
    });
    if (!existing) {
      await prisma.hrInterview.create({ data: spec });
    }
  }

  const processingMetricSpecs = [
    { period: '2026-05', totalApplications: 45, processedApplications: 42, accurateApplications: 39, avgTurnaroundDays: 3.2, reviewsCompleted: 38, pendingReviews: 7 },
    { period: '2026-04', totalApplications: 38, processedApplications: 36, accurateApplications: 34, avgTurnaroundDays: 3.8, reviewsCompleted: 34, pendingReviews: 4 },
  ];

  for (const spec of processingMetricSpecs) {
    await prisma.hrProcessingMetric.upsert({
      where: { period: spec.period },
      create: spec,
      update: spec,
    });
  }

  const kpiDefSpecs = [
    { role: 'HR', name: 'Time to Fill', description: 'Average days to fill an open position', target: 30, unit: 'days', frequency: HrKpiFrequency.MONTHLY, isActive: true },
    { role: 'HR', name: 'Offer Acceptance Rate', description: 'Percentage of offers accepted', target: 80, unit: '%', frequency: HrKpiFrequency.MONTHLY, isActive: true },
    { role: 'COUNSELLOR', name: 'Lead Conversion Rate', description: 'Percentage of leads converted to students', target: 40, unit: '%', frequency: HrKpiFrequency.MONTHLY, isActive: true },
    { role: 'COUNSELLOR', name: 'Revenue Generated', description: 'Total revenue from student enrolments', target: 500000, unit: 'INR', frequency: HrKpiFrequency.MONTHLY, isActive: true },
    { role: 'MARKETING', name: 'Leads Generated', description: 'Total number of leads generated', target: 200, unit: 'count', frequency: HrKpiFrequency.MONTHLY, isActive: true },
    { role: 'MARKETING', name: 'Cost Per Lead', description: 'Average cost to acquire one lead', target: 500, unit: 'INR', frequency: HrKpiFrequency.MONTHLY, isActive: true },
  ];

  const kpiDefs = [];
  for (const spec of kpiDefSpecs) {
    const existing = await prisma.hrKpiDefinition.findFirst({
      where: { role: spec.role, name: spec.name },
    });
    const def = existing
      ? await prisma.hrKpiDefinition.update({ where: { id: existing.id }, data: spec })
      : await prisma.hrKpiDefinition.create({ data: spec });
    kpiDefs.push(def);
  }

  const kpiMetricSpecs = [
    { kpiId: kpiDefs[0].id, userRole: 'HR', period: '2026-05', actualValue: 28, targetValue: 30 },
    { kpiId: kpiDefs[1].id, userRole: 'HR', period: '2026-05', actualValue: 85, targetValue: 80 },
    { kpiId: kpiDefs[4].id, userRole: 'MARKETING', period: '2026-05', actualValue: 178, targetValue: 200 },
    { kpiId: kpiDefs[5].id, userRole: 'MARKETING', period: '2026-05', actualValue: 545, targetValue: 500 },
  ];

  for (const spec of kpiMetricSpecs) {
    const existing = await prisma.hrKpiMetric.findFirst({
      where: { kpiId: spec.kpiId, period: spec.period, userId: null },
    });
    if (!existing) {
      await prisma.hrKpiMetric.create({ data: spec });
    }
  }

  const marketingPerfSpecs = [
    { period: '2026-05', leadsGenerated: 178, costPerLead: 545, totalBudget: 97010, channel: 'Google Ads', conversions: 42 },
    { period: '2026-05', leadsGenerated: 92, costPerLead: 320, totalBudget: 29440, channel: 'Meta Ads', conversions: 31 },
    { period: '2026-04', leadsGenerated: 155, costPerLead: 590, totalBudget: 91450, channel: 'Google Ads', conversions: 38 },
  ];

  for (const spec of marketingPerfSpecs) {
    const existing = await prisma.hrMarketingPerformance.findFirst({
      where: { period: spec.period, channel: spec.channel },
    });
    if (!existing) {
      await prisma.hrMarketingPerformance.create({ data: spec });
    }
  }

  const counsellorPerfSpecs = [
    { counsellorId: 'u_1', counsellorName: 'Raju Kalla', period: '2026-05', leadsHandled: 45, conversions: 18, revenue: 720000, conversionRate: 40 },
    { counsellorId: 'u_2', counsellorName: 'Jane Admin', period: '2026-05', leadsHandled: 38, conversions: 20, revenue: 850000, conversionRate: 52.6 },
    { counsellorId: 'u_3', counsellorName: 'Alice Smith', period: '2026-05', leadsHandled: 52, conversions: 17, revenue: 680000, conversionRate: 32.7 },
  ];

  for (const spec of counsellorPerfSpecs) {
    await prisma.hrCounsellorPerformance.upsert({
      where: { counsellorId_period: { counsellorId: spec.counsellorId, period: spec.period } },
      create: spec,
      update: spec,
    });
  }

  const reviewSpecs = [
    { employeeId: employees[0].id, name: 'Raju Kalla', employeeCode: 'E001', department: 'Engineering', cycle: 'FY26 H1 Review', manager: 'Jane Admin', rating: 4.5, status: HrReviewStatus.COMPLETED, reviewDate: '2026-05-10' },
    { employeeId: employees[2].id, name: 'Alice Smith', employeeCode: 'E003', department: 'Human Resources', cycle: 'FY26 H1 Review', manager: 'Jane Admin', rating: 4.8, status: HrReviewStatus.COMPLETED, reviewDate: '2026-05-14' },
    { employeeId: employees[3].id, name: 'Bob Johnson', employeeCode: 'E004', department: 'Finance', cycle: 'FY26 H1 Review', manager: 'Alice Smith', rating: 0, status: HrReviewStatus.MANAGER_REVIEW, reviewDate: '2026-05-22' },
  ];

  for (const spec of reviewSpecs) {
    const existing = await prisma.hrPerformanceReview.findFirst({
      where: { employeeCode: spec.employeeCode, cycle: spec.cycle },
    });
    if (!existing) {
      await prisma.hrPerformanceReview.create({ data: spec });
    }
  }

  console.log('✅ HR module data seeded');
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });