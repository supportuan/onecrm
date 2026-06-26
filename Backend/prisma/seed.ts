
import dotenv from 'dotenv';
import {
  PrismaClient,
  UserRole,
  LeadStatus,
  LeadRating,
  HrOfferLetterStatus,
  HrInterviewType,
  HrInterviewStatus,
  HrJobType,
  HrJobStatus,
  HrCandidateStatus,
  HrKpiFrequency,
  ApplicationStage,
  DocumentStatus,
} from '@prisma/client';
import { hashPassword, comparePasswords } from '../src/utils/password.js';
import { getDefaultTenantId } from '../src/utils/tenant-default.js';

dotenv.config();

const prisma = new PrismaClient();

async function ensureUser(
  email: string,
  fullName: string,
  role: UserRole,
  defaultPassword: string,
  phone: string,
  opts: {
    tenantId?: number | null;
    roleLabel?: string | null;
    permissionRole?: string | null;
    moduleAccess?: Record<string, Record<string, string[]>> | null;
  } = {}
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
        tenantId: opts.tenantId ?? null,
        roleLabel: opts.roleLabel ?? null,
        permissionRole: opts.permissionRole ?? null,
        moduleAccess: opts.moduleAccess ?? null,
        isActive: true,
        isApproved: true,
      },
    });
    console.log(`✅ ${role} created: ${email}`);
    return user;
  }

  const hasCorrectPassword = await comparePasswords(defaultPassword, existing.passwordHash);
  const patch: Record<string, unknown> = {
    fullName,
    phone,
    role,
    tenantId: opts.tenantId ?? existing.tenantId,
    roleLabel: opts.roleLabel ?? existing.roleLabel,
    permissionRole: opts.permissionRole ?? existing.permissionRole,
    moduleAccess: opts.moduleAccess ?? existing.moduleAccess,
  };
  if (!hasCorrectPassword) {
    patch.passwordHash = await hashPassword(defaultPassword);
    console.log(`✅ ${role} password reset: ${email}`);
  } else {
    console.log(`ℹ️ ${role} already exists: ${email}`);
  }

  return prisma.user.update({
    where: { id: existing.id },
    data: patch,
  });
}

async function main() {
  console.log('Running seed...');

  await prisma.$queryRaw`SELECT 1`;
  console.log('Database connection successful.');

  const defaultPassword = 'Welcome@123';
  const tenantId = await getDefaultTenantId();

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
    '+919876543210',
    { tenantId }
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
    '+919000000001',
    {
      tenantId,
      roleLabel: 'HR Manager',
      permissionRole: 'HR',
    }
  );

  await seedHrData(tenantId);
  const crmSettings = await seedCrmSettings();
  await seedStudentCrmData(counsellor.id, crmSettings);
  console.log(`Default password for seeded users: ${defaultPassword}`);
}

async function seedCrmSettings() {
  console.log('Seeding CRM settings (countries, industries, universities, checklists)...');

  const countrySpecs = [
    { name: 'Canada', symbol: 'CA', currency: 'CAD' },
    { name: 'United Kingdom', symbol: 'UK', currency: 'GBP' },
    { name: 'United States', symbol: 'US', currency: 'USD' },
    { name: 'Germany', symbol: 'DE', currency: 'EUR' },
    { name: 'Australia', symbol: 'AU', currency: 'AUD' },
  ];

  const countries: Record<string, { id: number }> = {};
  for (const c of countrySpecs) {
    const row = await prisma.country.upsert({
      where: { name: c.name },
      create: c,
      update: c,
    });
    countries[c.name] = row;
  }

  const industry = await prisma.studyIndustry.upsert({
    where: { name: 'Business & Management' },
    create: { name: 'Business & Management' },
    update: {},
  });

  const subIndustry = await prisma.studySubIndustry.upsert({
    where: { industryId_name: { industryId: industry.id, name: 'MBA' } },
    create: { industryId: industry.id, name: 'MBA' },
    update: {},
  });

  const studyArea = await prisma.studyArea.upsert({
    where: { industryId_name: { industryId: industry.id, name: 'Finance' } },
    create: { industryId: industry.id, subIndustryId: subIndustry.id, name: 'Finance' },
    update: { subIndustryId: subIndustry.id },
  });

  const csIndustry = await prisma.studyIndustry.upsert({
    where: { name: 'Computer Science' },
    create: { name: 'Computer Science' },
    update: {},
  });

  const csArea = await prisma.studyArea.upsert({
    where: { industryId_name: { industryId: csIndustry.id, name: 'Data Science' } },
    create: { industryId: csIndustry.id, name: 'Data Science' },
    update: {},
  });

  const universitySpecs = [
    { name: 'University of Toronto', country: 'Canada', city: 'Toronto' },
    { name: 'London Business School', country: 'United Kingdom', city: 'London' },
    { name: 'Imperial College London', country: 'United Kingdom', city: 'London' },
    { name: 'Carnegie Mellon University', country: 'United States', city: 'Pittsburgh' },
    { name: 'TU Munich', country: 'Germany', city: 'Munich' },
    { name: 'University of British Columbia', country: 'Canada', city: 'Vancouver' },
    { name: 'University of Melbourne', country: 'Australia', city: 'Melbourne' },
  ];

  const universities: Record<string, { id: number }> = {};
  for (const u of universitySpecs) {
    const countryId = countries[u.country].id;
    const row = await prisma.university.upsert({
      where: { countryId_name: { countryId, name: u.name } },
      create: { name: u.name, countryId, city: u.city },
      update: { city: u.city },
    });
    universities[u.name] = row;
  }

  const checklistSpecs = [
    { name: 'Passport copy', stage: 'GATHERING_CHECKLIST' as const, required: true },
    { name: 'Academic transcripts', stage: 'GATHERING_CHECKLIST' as const, required: true },
    { name: 'Statement of purpose', stage: 'GATHERING_CHECKLIST' as const, required: true },
    { name: 'IELTS / TOEFL score', stage: 'GATHERING_CHECKLIST' as const, required: true },
    { name: 'Bank statement', stage: 'FINANCIAL_EVIDENCE' as const, required: true },
    { name: 'University application form', stage: 'UNIVERSITY_APPLICATION' as const, required: true },
    { name: 'Visa application', stage: 'VISA_APPLICATION' as const, required: true },
  ];

  const checkLists = [];
  for (const spec of checklistSpecs) {
    let item = await prisma.checkList.findFirst({ where: { name: spec.name, stage: spec.stage } });
    if (!item) {
      item = await prisma.checkList.create({ data: spec });
    }
    checkLists.push(item);
    for (const country of Object.values(countries)) {
      await prisma.countryChecklist.upsert({
        where: { countryId_checkListId: { countryId: country.id, checkListId: item.id } },
        create: { countryId: country.id, checkListId: item.id },
        update: {},
      });
    }
  }

  console.log(`✅ CRM settings ready (${Object.keys(countries).length} countries, ${Object.keys(universities).length} universities)`);
  return { countries, industry, subIndustry, studyArea, csIndustry, csArea, universities, checkLists };
}

async function seedStudentCrmData(
  counsellorId: number,
  crm: Awaited<ReturnType<typeof seedCrmSettings>>
) {
  console.log('Seeding Student CRM data...');

  const studentSpecs = [
    {
      leadEmail: 'rahul.verma@example.com',
      firstName: 'Rahul',
      lastName: 'Verma',
      fullName: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      phone: '+919811223344',
      dob: new Date('1998-03-15'),
      nationality: 'India',
      preferredCountry: 'Canada',
      countryId: crm.countries['Canada'].id,
      industryId: crm.industry.id,
      subIndustryId: crm.subIndustry.id,
      studyAreaId: crm.studyArea.id,
      level: 'PG',
      intakeMonth: 'September',
      intakeYear: '2026',
      studyMode: 'On-campus',
      studyDuration: '2 years',
      studyBudget: '40000 CAD',
      ieltsScore: 7.5,
      greScore: 315,
      educationDetails: [
        { type: 'UG', label: 'B.Com', passing_year: '2020', grade: '8.2 CGPA', medium: 'English' },
      ],
      asstExamSections: [
        { type: 'IELTS', label: 'IELTS Academic', overall_score: '7.5', reading: '8', writing: '7', speaking: '7', listening: '7.5' },
      ],
      academicHistory: [
        { degree: 'B.Com', institution: 'Delhi University', year: '2020', grade: '8.2 CGPA' },
        { degree: 'MBA prep', institution: 'Career Launcher', year: '2024', grade: 'Completed' },
      ],
      applications: [
        {
          country: 'Canada',
          university: 'University of Toronto',
          course: 'MBA',
          intake: 'Fall 2026',
          stage: ApplicationStage.UNDER_REVIEW,
          deadline: new Date('2026-08-15'),
        },
        {
          country: 'UK',
          university: 'London Business School',
          course: 'MBA',
          intake: 'Sep 2026',
          stage: ApplicationStage.DOCUMENTS_PENDING,
          deadline: new Date('2026-07-01'),
        },
      ],
    },
    {
      leadEmail: 'ananya.patel@example.com',
      firstName: 'Ananya',
      lastName: 'Patel',
      fullName: 'Ananya Patel',
      email: 'ananya.patel@example.com',
      phone: '+919900112233',
      dob: new Date('1999-07-22'),
      nationality: 'India',
      preferredCountry: 'UK',
      countryId: crm.countries['United Kingdom'].id,
      industryId: crm.csIndustry.id,
      studyAreaId: crm.csArea.id,
      level: 'PG',
      intakeMonth: 'September',
      intakeYear: '2026',
      studyMode: 'On-campus',
      ieltsScore: 8.0,
      toeflScore: 108,
      educationDetails: [
        { type: 'UG', label: 'B.Tech CSE', passing_year: '2021', grade: '9.1 CGPA', medium: 'English' },
      ],
      asstExamSections: [
        { type: 'IELTS', label: 'IELTS Academic', overall_score: '8.0' },
      ],
      academicHistory: [
        { degree: 'B.Tech CSE', institution: 'IIT Bombay', year: '2021', grade: '9.1 CGPA' },
      ],
      applications: [
        {
          country: 'UK',
          university: 'Imperial College London',
          course: 'MSc Data Science',
          intake: 'Sep 2026',
          stage: ApplicationStage.OFFER_RECEIVED,
          deadline: new Date('2026-06-30'),
        },
        {
          country: 'USA',
          university: 'Carnegie Mellon University',
          course: 'MS Machine Learning',
          intake: 'Aug 2026',
          stage: ApplicationStage.SUBMITTED,
          deadline: new Date('2026-05-15'),
        },
      ],
    },
    {
      leadEmail: 'sneha.iyer@example.com',
      firstName: 'Sneha',
      lastName: 'Iyer',
      fullName: 'Sneha Iyer',
      email: 'sneha.iyer@example.com',
      phone: '+919777665544',
      dob: new Date('1997-11-08'),
      nationality: 'India',
      preferredCountry: 'Germany',
      countryId: crm.countries['Germany'].id,
      industryId: crm.industry.id,
      level: 'PG',
      intakeMonth: 'October',
      intakeYear: '2026',
      ieltsScore: 7.0,
      gmatScore: 680,
      educationDetails: [
        { type: 'UG', label: 'B.E. Mechanical', passing_year: '2019', grade: '8.5 CGPA' },
        { type: 'PG', label: 'M.Tech', passing_year: '2021', grade: '8.8 CGPA' },
      ],
      academicHistory: [
        { degree: 'B.E. Mechanical', institution: 'Anna University', year: '2019', grade: '8.5 CGPA' },
        { degree: 'M.Tech', institution: 'BITS Pilani', year: '2021', grade: '8.8 CGPA' },
      ],
      applications: [
        {
          country: 'Germany',
          university: 'TU Munich',
          course: 'Masters Engineering',
          intake: 'Winter 2026',
          stage: ApplicationStage.VISA_PROCESS,
          deadline: new Date('2026-04-01'),
        },
        {
          country: 'Canada',
          university: 'University of British Columbia',
          course: 'MEng Mechanical',
          intake: 'Jan 2027',
          stage: ApplicationStage.ENROLLED,
          deadline: new Date('2025-12-01'),
        },
        {
          country: 'Australia',
          university: 'University of Melbourne',
          course: 'Master of Engineering',
          intake: 'Feb 2027',
          stage: ApplicationStage.DRAFT,
          deadline: new Date('2026-09-01'),
        },
      ],
    },
  ];

  let year = new Date().getFullYear();
  let appSeq = await prisma.application.count({ where: { applicationCode: { startsWith: `APP-${year}-` } } });

  for (const spec of studentSpecs) {
    const lead = await prisma.lead.findFirst({
      where: { email: spec.leadEmail, deletedAt: null },
    });

    let student = await prisma.student.findUnique({ where: { email: spec.email } });
    if (!student) {
      student = await prisma.student.create({
        data: {
          firstName: spec.firstName,
          lastName: spec.lastName,
          fullName: spec.fullName,
          email: spec.email,
          phone: spec.phone,
          dob: spec.dob,
          nationality: spec.nationality,
          preferredCountry: spec.preferredCountry,
          countryId: spec.countryId ?? null,
          industryId: spec.industryId ?? null,
          subIndustryId: spec.subIndustryId ?? null,
          studyAreaId: spec.studyAreaId ?? null,
          level: spec.level ?? null,
          intakeMonth: spec.intakeMonth ?? null,
          intakeYear: spec.intakeYear ?? null,
          studyMode: spec.studyMode ?? null,
          studyDuration: spec.studyDuration ?? null,
          studyBudget: spec.studyBudget ?? null,
          educationDetails: spec.educationDetails ?? undefined,
          asstExamSections: spec.asstExamSections ?? undefined,
          academicHistory: spec.academicHistory,
          ieltsScore: spec.ieltsScore,
          toeflScore: spec.toeflScore ?? null,
          greScore: spec.greScore ?? null,
          gmatScore: spec.gmatScore ?? null,
          contactId: counsellorId,
          source: 'lead_conversion',
          sourceLeadId: lead?.id ?? null,
        },
      });

      if (spec.countryId) {
        for (const cl of crm.checkLists) {
          await prisma.studentChecklist.upsert({
            where: { studentId_checkListId: { studentId: student.id, checkListId: cl.id } },
            create: { studentId: student.id, checkListId: cl.id, completed: cl.name === 'Passport copy' },
            update: {},
          });
        }
        const total = crm.checkLists.length;
        const completed = await prisma.studentChecklist.count({
          where: { studentId: student.id, completed: true },
        });
        await prisma.student.update({
          where: { id: student.id },
          data: {
            totalCheckList: total,
            completedCheckList: completed,
            stageTotalTask: total,
            stageCompletedTask: completed,
          },
        });
      }
    }

    if (lead) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: LeadStatus.CONVERTED },
      });
    }

    for (const appSpec of spec.applications) {
      const exists = await prisma.application.findFirst({
        where: { studentId: student.id, university: appSpec.university, course: appSpec.course },
      });
      if (exists) continue;

      appSeq += 1;
      const code = `APP-${year}-${String(appSeq).padStart(4, '0')}`;
      const app = await prisma.application.create({
        data: {
          applicationCode: code,
          studentId: student.id,
          country: appSpec.country,
          university: appSpec.university,
          course: appSpec.course,
          intake: appSpec.intake,
          stage: appSpec.stage,
          assignedToId: counsellorId,
          deadline: appSpec.deadline,
        },
      });

      await prisma.applicationStageEvent.create({
        data: {
          applicationId: app.id,
          fromStage: null,
          toStage: ApplicationStage.DRAFT,
          notes: 'Application created from seed',
        },
      });

      if (appSpec.stage !== ApplicationStage.DRAFT) {
        await prisma.applicationStageEvent.create({
          data: {
            applicationId: app.id,
            fromStage: ApplicationStage.DRAFT,
            toStage: appSpec.stage,
            notes: 'Seeded workflow position',
          },
        });
      }

      await prisma.applicationDocument.createMany({
        data: [
          { applicationId: app.id, name: 'Passport copy', required: true, status: DocumentStatus.UPLOADED },
          { applicationId: app.id, name: 'Academic transcripts', required: true, status: DocumentStatus.PENDING },
          { applicationId: app.id, name: 'Statement of purpose', required: true, status: DocumentStatus.PENDING },
        ],
      });
    }
  }

  const studentCount = await prisma.student.count();
  const appCount = await prisma.application.count();
  console.log(`✅ Student CRM ready (${studentCount} students, ${appCount} applications)`);
}

async function seedHrData(tenantId: number) {
  console.log('Seeding HR module data (tenant-level config only — no demo employees)...');

  await prisma.hrAttendanceSetting.upsert({
    where: { tenantId },
    create: { tenantId, attendanceMode: 'biometric', enableIpValidation: true },
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

  console.log('✅ HR module data seeded');

  // Agency CRM demo partners
  const agencyUser = await ensureUser(
    'agency@onecrm.demo',
    'Global Edu Partners',
    UserRole.AGENCY_FREELANCER,
    defaultPassword,
    '+44 7700 900111'
  );

  const agencyPartner = await prisma.agencyPartner.upsert({
    where: { userId: agencyUser.id },
    create: {
      userId: agencyUser.id,
      agencyName: 'Global Edu Partners',
      agencyCode: 'GEP-UK',
      contactPerson: 'Global Edu Partners',
      email: agencyUser.email,
      phone: agencyUser.phone,
      city: 'London',
      country: 'United Kingdom',
      commissionRate: 12.5,
      status: 'ACTIVE',
      branding: {
        tagline: 'Your pathway to world-class education',
        primaryColor: '#1e40af',
        logoUrl: '',
        websiteUrl: 'https://applyuninow.com',
      },
    },
    update: {},
  });

  await prisma.user.update({
    where: { id: agencyUser.id },
    data: {
      agencyDetails: {
        agencyName: agencyPartner.agencyName,
        agencyCode: agencyPartner.agencyCode,
        agencyCity: agencyPartner.city,
        agencyCountry: agencyPartner.country,
      },
    },
  });

  const sampleStudents = await prisma.student.findMany({
    where: { deletedAt: null },
    take: 3,
    orderBy: { id: 'asc' },
    include: { applications: { take: 1, orderBy: { id: 'asc' } } },
  });

  for (const student of sampleStudents) {
    await prisma.student.update({
      where: { id: student.id },
      data: { source: agencyPartner.agencyCode },
    });

    const existingReferral = await prisma.agencyReferral.findFirst({
      where: { agencyPartnerId: agencyPartner.id, studentId: student.id },
    });
    if (!existingReferral) {
      await prisma.agencyReferral.create({
        data: {
          agencyPartnerId: agencyPartner.id,
          studentId: student.id,
          applicationId: student.applications[0]?.id ?? null,
          referralCode: agencyPartner.agencyCode,
          status: student.isEnrolled ? 'ENROLLED' : 'ACTIVE',
        },
      });
    }

    if (student.isEnrolled && student.applications[0]) {
      const existingCommission = await prisma.agencyCommission.findFirst({
        where: { agencyPartnerId: agencyPartner.id, applicationId: student.applications[0].id },
      });
      if (!existingCommission) {
        await prisma.agencyCommission.create({
          data: {
            agencyPartnerId: agencyPartner.id,
            studentId: student.id,
            applicationId: student.applications[0].id,
            amount: 450,
            currency: 'GBP',
            status: 'APPROVED',
            period: '2026-Q2',
            description: 'Enrollment commission',
          },
        });
      }
    }
  }

  console.log('✅ Agency CRM demo data seeded');
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });