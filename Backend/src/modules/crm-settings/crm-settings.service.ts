import { prisma } from '../../prisma.js';

const notDeleted = { deletedAt: null };

const normalizeCountryName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

export const listCountries = async () => {
  const rows = await prisma.country.findMany({ where: notDeleted, orderBy: { name: 'asc' } });
  const byKey = new Map<string, (typeof rows)[0]>();
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    const existing = byKey.get(key);
    if (!existing || row.id < existing.id) {
      byKey.set(key, { ...row, name: normalizeCountryName(row.name) });
    }
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
};

export const createCountry = (data: { name: string; symbol?: string; currency?: string }) =>
  prisma.country.create({ data });

export const updateCountry = (id: number, data: Partial<{ name: string; symbol: string; currency: string }>) =>
  prisma.country.update({ where: { id }, data });

export const deleteCountry = (id: number) =>
  prisma.country.update({ where: { id }, data: { deletedAt: new Date() } });

export const listIndustries = () =>
  prisma.studyIndustry.findMany({
    where: notDeleted,
    orderBy: { name: 'asc' },
    include: {
      subIndustries: { where: notDeleted, orderBy: { name: 'asc' } },
      studyAreas: { where: notDeleted, orderBy: { name: 'asc' } },
    },
  });

export const createIndustry = (name: string) => prisma.studyIndustry.create({ data: { name } });

export const createSubIndustry = (industryId: number, name: string) =>
  prisma.studySubIndustry.create({ data: { industryId, name } });

export const createStudyArea = (data: { name: string; industryId: number; subIndustryId?: number }) =>
  prisma.studyArea.create({ data });

export const listUniversities = async (opts: {
  countryId?: number;
  page?: number;
  limit?: number;
  search?: string;
} = {}) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { ...notDeleted };
  if (opts.countryId) where.countryId = opts.countryId;
  if (opts.search?.trim()) {
    where.name = { contains: opts.search.trim(), mode: 'insensitive' };
  }

  const [rows, total] = await Promise.all([
    prisma.university.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: {
        country: { select: { id: true, name: true } },
        _count: { select: { courses: { where: notDeleted } } },
      },
    }),
    prisma.university.count({ where }),
  ]);

  const items = rows.map(({ _count, ...u }) => ({
    ...u,
    courseCount: _count.courses,
  }));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    from: total === 0 ? 0 : skip + 1,
    to: Math.min(skip + limit, total),
  };
};

export const createUniversity = (data: {
  name: string;
  countryId: number;
  city?: string;
  location?: string;
  logo?: string;
}) => prisma.university.create({ data });

export const updateUniversity = (
  id: number,
  data: Partial<{ name: string; countryId: number; city: string; location: string; logo: string }>
) => prisma.university.update({ where: { id }, data });

export const deleteUniversity = (id: number) =>
  prisma.university.update({ where: { id }, data: { deletedAt: new Date() } });

export const listCourses = async (opts: {
  universityId?: number;
  page?: number;
  limit?: number;
  search?: string;
} = {}) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { ...notDeleted };
  if (opts.universityId) where.universityId = opts.universityId;
  if (opts.search?.trim()) {
    where.name = { contains: opts.search.trim(), mode: 'insensitive' };
  }

  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: {
        university: { select: { id: true, name: true, country: { select: { id: true, name: true } } } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    from: total === 0 ? 0 : skip + 1,
    to: Math.min(skip + limit, total),
  };
};

/** Stats for catalog header */
export const getCatalogStats = async () => {
  const [universities, courses, universitiesWithCourses, mappedUniversities] = await Promise.all([
    prisma.university.count({ where: notDeleted }),
    prisma.course.count({ where: notDeleted }),
    prisma.university.count({
      where: { ...notDeleted, courses: { some: { deletedAt: null } } },
    }),
    prisma.university.count({ where: { ...notDeleted, externalId: { not: null } } }),
  ]);
  return { universities, courses, universitiesWithCourses, mappedUniversities };
};

/**
 * Unified university + course catalog — one row per course with university/country joined.
 */
export const listCatalog = async (opts: {
  countryId?: number;
  universityId?: number;
  page?: number;
  limit?: number;
  search?: string;
} = {}) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const universityFilter: Record<string, unknown> = { ...notDeleted };
  if (opts.countryId) universityFilter.countryId = opts.countryId;
  if (opts.universityId) universityFilter.id = opts.universityId;

  const where: Record<string, unknown> = {
    ...notDeleted,
    university: universityFilter,
  };

  if (opts.search?.trim()) {
    const q = opts.search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { university: { ...universityFilter, name: { contains: q, mode: 'insensitive' } } },
    ];
    delete where.university;
  }

  const [rows, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: [{ university: { name: 'asc' } }, { name: 'asc' }],
      skip,
      take: limit,
      include: {
        university: {
          select: {
            id: true,
            externalId: true,
            name: true,
            city: true,
            country: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  const items = rows.map((c) => ({
    courseId: c.id,
    courseExternalId: c.externalId,
    courseName: c.name,
    level: c.level,
    duration: c.duration,
    intakes: c.intakes,
    tuitionFee: c.tuitionFee,
    applicationFee: c.applicationFee,
    ielts: c.ielts,
    toefl: c.toefl,
    universityId: c.university.id,
    universityExternalId: c.university.externalId,
    universityName: c.university.name,
    universityCity: c.university.city,
    countryId: c.university.country.id,
    countryName: c.university.country.name,
  }));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    from: total === 0 ? 0 : skip + 1,
    to: Math.min(skip + limit, total),
  };
};

/** Dropdown bundle for application forms (universities loaded per-country via listUniversities) */
export const getFormOptions = async () => {
  const [countries, industries] = await Promise.all([listCountries(), listIndustries()]);
  return { countries, industries };
};
