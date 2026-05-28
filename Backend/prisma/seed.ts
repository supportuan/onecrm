// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('Seed disabled.');

//   // Only verify DB connection
//   await prisma.$queryRaw`SELECT 1`;

//   console.log('Database connection successful.');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });


import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running seed...');

  // Verify DB connection
  await prisma.$queryRaw`SELECT 1`;

  console.log('Database connection successful.');

  // Super Admin details
  const email = 'superadmin@onecrm.com';

  // Check if already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        fullName: 'Super Admin',
        email,
        phone: '+910000000000',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });

    console.log('✅ Super Admin created successfully');
  } else {
    console.log('ℹ️ Super Admin already exists');
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