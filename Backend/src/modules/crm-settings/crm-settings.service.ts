import { prisma } from '../../prisma.js';
import { Prisma } from '@prisma/client';
import { buildIndustryCaseSql, STUDY_INDUSTRY_RULES } from './study-industry-rules.js';
import { CATALOG_COUNTRY_ALIASES, resolveCatalogCountryId } from './catalog-country.js';

const notDeleted = { deletedAt: null };

/** In-memory cache — country industry scan is expensive on first hit (~150k courses). */
const industryByCountryCache = new Map<number, { at: number; data: Awaited<ReturnType<typeof computeIndustriesForCountry>> }>();
const INDUSTRY_CACHE_MS = 15 * 60 * 1000;

const computeIndustriesForCountry = async (countryId: number) => {
  const catalogCountryId = resolveCatalogCountryId(countryId) ?? countryId;

  const all = await prisma.studyIndustry.findMany({
    where: notDeleted,
    orderBy: { name: 'asc' },
    include: {
      subIndustries: { where: notDeleted, orderBy: { name: 'asc' } },
      studyAreas: { where: notDeleted, orderBy: { name: 'asc' } },
    },
  });
  const byName = new Map(all.map((i) => [i.name, i]));

  // One CASE scan is faster and uses a single DB connection vs 35 parallel regex counts.
  const caseSql = buildIndustryCaseSql();
  const rows = await prisma.$queryRaw<Array<{ bucket: string; cnt: bigint }>>(Prisma.sql`
    SELECT bucket, COUNT(*)::bigint AS cnt
    FROM (
      SELECT CASE
        ${Prisma.raw(caseSql)}
        ELSE NULL
      END AS bucket
      FROM "Course" c
      INNER JOIN "University" u ON c."universityId" = u.id
      WHERE u."countryId" = ${catalogCountryId}
        AND c."deletedAt" IS NULL
        AND u."deletedAt" IS NULL
    ) x
    WHERE bucket IS NOT NULL
    GROUP BY bucket
    ORDER BY cnt DESC
  `);

  const countMap = new Map(rows.map((r) => [r.bucket, Number(r.cnt)]));

  return STUDY_INDUSTRY_RULES.filter((r) => countMap.has(r.name))
    .map((r) => {
      const courseCount = countMap.get(r.name) ?? 0;
      const db = byName.get(r.name);
      if (db) return { ...db, courseCount };
      return {
        id: null,
        name: r.name,
        subIndustries: [],
        studyAreas: [],
        courseCount,
      };
    })
    .sort((a, b) => (b.courseCount ?? 0) - (a.courseCount ?? 0));
};

const normalizeCountryName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

export const listCountries = async () => {
  const rows = await prisma.country.findMany({ where: notDeleted, orderBy: { name: 'asc' } });

  const countRows = await prisma.$queryRaw<Array<{ countryId: number; courses: number }>>`
    SELECT u."countryId" AS "countryId", COUNT(c.id)::int AS courses
    FROM "University" u
    LEFT JOIN "Course" c ON c."universityId" = u.id AND c."deletedAt" IS NULL
    WHERE u."deletedAt" IS NULL
    GROUP BY u."countryId"
  `;
  const courseCountById = new Map(countRows.map((r) => [r.countryId, r.courses]));

  const hideIds = new Set<number>();
  for (const [from, to] of Object.entries(CATALOG_COUNTRY_ALIASES)) {
    const fromId = Number(from);
    if ((courseCountById.get(fromId) ?? 0) === 0 && (courseCountById.get(to) ?? 0) > 0) {
      hideIds.add(fromId);
    }
  }

  const byKey = new Map<string, (typeof rows)[0] & { courseCount: number; catalogCountryId: number }>();
  for (const row of rows) {
    if (hideIds.has(row.id)) continue;
    const key = row.name.trim().toLowerCase();
    const enriched = {
      ...row,
      name: normalizeCountryName(row.name),
      courseCount: courseCountById.get(row.id) ?? 0,
      catalogCountryId: resolveCatalogCountryId(row.id) ?? row.id,
    };
    const existing = byKey.get(key);
    if (!existing || enriched.courseCount > existing.courseCount) {
      byKey.set(key, enriched);
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

export const listIndustries = async (opts: { countryId?: number } = {}) => {
  if (!opts.countryId) {
    return prisma.studyIndustry.findMany({
      where: notDeleted,
      orderBy: { name: 'asc' },
      include: {
        subIndustries: { where: notDeleted, orderBy: { name: 'asc' } },
        studyAreas: { where: notDeleted, orderBy: { name: 'asc' } },
      },
    });
  }

  const catalogCountryId = resolveCatalogCountryId(opts.countryId) ?? opts.countryId;
  const cached = industryByCountryCache.get(catalogCountryId);
  if (cached && Date.now() - cached.at < INDUSTRY_CACHE_MS) return cached.data;

  const data = await computeIndustriesForCountry(catalogCountryId);
  industryByCountryCache.set(catalogCountryId, { at: Date.now(), data });
  return data;
};

/** Program levels (sub-industries) available for an industry in a given country's catalog. */
export const listIndustrySubFields = async (countryId: number, industryId: number) => {
  const industry = await prisma.studyIndustry.findFirst({
    where: { id: industryId, deletedAt: null },
  });
  if (!industry) return [];

  const rule = STUDY_INDUSTRY_RULES.find((r) => r.name === industry.name);
  if (!rule) return [];

  const catalogCountryId = resolveCatalogCountryId(countryId) ?? countryId;

  const [rows, subIndustries] = await Promise.all([
    prisma.$queryRaw<Array<{ level: string; cnt: bigint }>>`
      SELECT TRIM(c.level) AS level, COUNT(*)::bigint AS cnt
      FROM "Course" c
      INNER JOIN "University" u ON c."universityId" = u.id
      WHERE u."countryId" = ${catalogCountryId}
        AND c."deletedAt" IS NULL
        AND u."deletedAt" IS NULL
        AND c.level IS NOT NULL
        AND TRIM(c.level) <> ''
        AND c.name ~* ${rule.pattern}
      GROUP BY TRIM(c.level)
      ORDER BY cnt DESC
    `,
    prisma.studySubIndustry.findMany({
      where: { industryId, deletedAt: null },
      orderBy: { name: 'asc' },
    }),
  ]);

  const subByName = new Map(subIndustries.map((s) => [s.name.trim().toLowerCase(), s]));

  return rows.map((r) => {
    const level = r.level.trim();
    const sub = subByName.get(level.toLowerCase());
    return {
      id: sub?.id ?? null,
      name: level,
      industryId,
      courseCount: Number(r.cnt),
    };
  });
};

/** Ensure all catalog industry buckets exist in StudyIndustry (run after deploy / seed). */
export const ensureStudyIndustryCatalog = async () => {
  for (const { name } of STUDY_INDUSTRY_RULES) {
    await prisma.studyIndustry.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  return listIndustries();
};

/** Pre-warm industry cache for high-traffic countries (runs in background). */
export const warmIndustryCache = async (countryIds: number[] = [23, 2, 1, 5]) => {
  for (const id of countryIds) {
    try {
      await listIndustries({ countryId: id });
      console.log(`[crm] warmed industry cache for country ${id}`);
    } catch (err) {
      console.warn(`[crm] industry cache warm failed for country ${id}`, err);
    }
  }
};

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
  const limit = Math.min(5000, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { ...notDeleted };
  if (opts.countryId) {
    where.countryId = resolveCatalogCountryId(opts.countryId) ?? opts.countryId;
  }
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

/** Find an existing course under a university (case-insensitive) or create it. */
export const findOrCreateCourse = async (data: {
  universityId: number;
  name: string;
  level?: string | null;
  duration?: string | null;
}) => {
  const name = data.name.trim();
  if (!name) throw Object.assign(new Error('Course name is required'), { status: 400 });
  if (!data.universityId) throw Object.assign(new Error('universityId is required'), { status: 400 });

  const university = await prisma.university.findFirst({
    where: { id: data.universityId, ...notDeleted },
    select: { id: true },
  });
  if (!university) throw Object.assign(new Error('University not found'), { status: 404 });

  const existing = await prisma.course.findFirst({
    where: {
      universityId: data.universityId,
      deletedAt: null,
      name: { equals: name, mode: 'insensitive' },
    },
  });
  if (existing) return { course: existing, created: false };

  const course = await prisma.course.create({
    data: {
      name,
      universityId: data.universityId,
      level: data.level || null,
      duration: data.duration || null,
    },
  });
  return { course, created: true };
};

export const listCourses = async (opts: {
  universityId?: number;
  page?: number;
  limit?: number;
  search?: string;
} = {}) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(5000, Math.max(1, opts.limit ?? 50));
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
  const limit = Math.min(5000, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const universityFilter: Record<string, unknown> = { ...notDeleted };
  if (opts.countryId) {
    universityFilter.countryId = resolveCatalogCountryId(opts.countryId) ?? opts.countryId;
  }
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
