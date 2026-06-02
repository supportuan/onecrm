
import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword, comparePasswords } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Running seed...');

  await prisma.$queryRaw`SELECT 1`;
  console.log('Database connection successful.');

  const email = 'superadmin@onecrm.com';
  const defaultPassword = 'Welcome@123';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const passwordHash = await hashPassword(defaultPassword);
    await prisma.user.create({
      data: {
        fullName: 'Super Admin',
        email,
        phone: '+910000000000',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });
    console.log('✅ Super Admin created successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${defaultPassword}`);
  } else {
    const hasCorrectPassword = await comparePasswords(defaultPassword, existing.passwordHash);
    if (!hasCorrectPassword) {
      const passwordHash = await hashPassword(defaultPassword);
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash },
      });
      console.log('✅ Super Admin password reset to default because stored password did not match.');
      console.log(`Email: ${email}`);
      console.log(`Password: ${defaultPassword}`);
    } else {
      console.log('ℹ️ Super Admin already exists and password is correct');
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });