import { prisma } from '../src/prisma.js';

const main = async () => {
  const [universities, courses, countries] = await Promise.all([
    prisma.university.count(),
    prisma.course.count(),
    prisma.country.count(),
  ]);
  console.log({ universities, courses, countries });
};

main()
  .catch((e) => {
    console.error('DB error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
