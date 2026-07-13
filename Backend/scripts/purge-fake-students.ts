/**
 * Soft-delete fake/demo students (converted from fake leads) and remove their applications.
 * Keeps real Gmail / org emails.
 *
 * Usage: npx tsx scripts/purge-fake-students.ts
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const FAKE_SUFFIXES = [
  '@example.com',
  '@meta-lead.local',
  '@yopmail.com',
  '@ymail.com',
];

async function main() {
  const now = new Date();

  const fakeStudents = await prisma.student.findMany({
    where: {
      deletedAt: null,
      OR: FAKE_SUFFIXES.map((suffix) => ({
        email: { endsWith: suffix, mode: 'insensitive' },
      })),
    },
    select: { id: true, email: true, userId: true },
  });

  const ids = fakeStudents.map((s) => s.id);
  const userIds = fakeStudents.map((s) => s.userId).filter(Boolean) as number[];

  console.log(`Found ${ids.length} fake students to purge`);

  if (!ids.length) {
    console.log('Nothing to do');
    return;
  }

  // Application has no deletedAt — hard-delete related demo apps + dependents
  const apps = await prisma.application.findMany({
    where: { studentId: { in: ids } },
    select: { id: true },
  });
  const appIds = apps.map((a) => a.id);

  if (appIds.length) {
    await prisma.applicationStageEvent.deleteMany({ where: { applicationId: { in: appIds } } });
    await prisma.applicationDocument.deleteMany({ where: { applicationId: { in: appIds } } });
    await prisma.applicationFee.deleteMany({ where: { applicationId: { in: appIds } } });
    await prisma.applicationPayment.deleteMany({ where: { applicationId: { in: appIds } } });
    await prisma.offerLetter.deleteMany({ where: { applicationId: { in: appIds } } }).catch(() => {});
    await prisma.visaTracking.deleteMany({ where: { applicationId: { in: appIds } } }).catch(() => {});
    await prisma.agencyReferral.deleteMany({ where: { applicationId: { in: appIds } } }).catch(() => {});
    await prisma.agencyCommission.deleteMany({ where: { applicationId: { in: appIds } } }).catch(() => {});
    const deletedApps = await prisma.application.deleteMany({ where: { id: { in: appIds } } });
    console.log(`Deleted applications: ${deletedApps.count}`);
  }

  await prisma.studentChecklist.deleteMany({ where: { studentId: { in: ids } } });
  await prisma.studentUniversity.deleteMany({ where: { studentId: { in: ids } } });
  await prisma.feedback.deleteMany({ where: { studentId: { in: ids } } }).catch(() => {});
  await prisma.chat.deleteMany({ where: { studentId: { in: ids } } }).catch(() => {});

  const softStudents = await prisma.student.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: now },
  });
  console.log(`Soft-deleted students: ${softStudents.count}`);

  if (userIds.length) {
    // User has no deletedAt — deactivate linked student portal logins
    const softUsers = await prisma.user.updateMany({
      where: { id: { in: userIds }, role: 'STUDENT' },
      data: { isActive: false },
    });
    console.log(`Deactivated student users: ${softUsers.count}`);
  }

  const remaining = {
    students: await prisma.student.count({ where: { deletedAt: null } }),
    applications: await prisma.application.count(),
    remainingEmails: (
      await prisma.student.findMany({
        where: { deletedAt: null },
        select: { email: true, fullName: true },
        orderBy: { id: 'asc' },
      })
    ).map((s) => `${s.fullName} <${s.email}>`),
  };
  console.log(remaining);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
