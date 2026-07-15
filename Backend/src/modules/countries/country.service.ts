import { prisma } from '../../prisma.js';
export const getAvailableCountries = async () => {
  return prisma.country.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      symbol: true,
      currency: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
};