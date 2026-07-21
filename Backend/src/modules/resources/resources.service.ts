import { Prisma, ResourceCategory, UserRole } from '@prisma/client';
import { prisma } from '../../prisma.js';
import {
  deleteStoredFile,
  resolveFileRef,
  resolveFileRefsDeep,
  safeUploadFilename,
  storeUploadedFile,
} from '../../lib/file-storage.js';
import { normalizeTargetRoles, roleMatchesAudience } from './resources.audience.js';

const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'resource';

const uniqueSlug = async (name: string) => {
  const base = slugify(name);
  let slug = base;
  let i = 0;
  while (true) {
    const existing = await prisma.resource.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
};

const normalizeCountries = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );
};

const getActorCountries = async (userId: number): Promise<string[]> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: {
        select: {
          preferredCountry: true,
          country: { select: { name: true } },
        },
      },
      agencyPartner: { select: { country: true } },
    },
  });
  return normalizeCountries([
    user?.studentProfile?.preferredCountry,
    user?.studentProfile?.country?.name,
    user?.agencyPartner?.country,
  ]);
};

const categoryAllows = (
  category: ResourceCategory,
  targetCountries: unknown,
  role: UserRole,
  actorCountries: string[],
) => {
  if (category === ResourceCategory.INHOUSE) return true;
  if (category === ResourceCategory.AGENTS) {
    return role === UserRole.AGENT || role === UserRole.AGENCY_FREELANCER;
  }
  const allowed = new Set(normalizeCountries(targetCountries).map((country) => country.toLowerCase()));
  return allowed.size > 0 && actorCountries.some((country) => allowed.has(country.toLowerCase()));
};

const isAcknowledged = (
  resource: { requiresAcknowledgement: boolean; updatedAt: Date },
  ack: { acknowledgedAt: Date } | null | undefined,
) => {
  if (!resource.requiresAcknowledgement) return true;
  if (!ack) return false;
  return ack.acknowledgedAt >= resource.updatedAt;
};

const mapResourceRow = async (
  resource: {
    id: number;
    name: string;
    description: string | null;
    url: string | null;
    slug: string;
    requiresAcknowledgement: boolean;
    targetRoles: unknown;
    category: ResourceCategory;
    targetCountries: unknown;
    fileName: string | null;
    mimeType: string | null;
    fileSize: number | null;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    uploadedBy?: { id: number; fullName: string } | null;
    acknowledgements?: { acknowledgedAt: Date }[];
  },
  userId?: number,
) => {
  const ack = resource.acknowledgements?.[0] ?? null;
  const acknowledged = isAcknowledged(resource, ack);
  return resolveFileRefsDeep({
    id: resource.id,
    name: resource.name,
    description: resource.description,
    url: resource.url,
    slug: resource.slug,
    requiresAcknowledgement: resource.requiresAcknowledgement,
    targetRoles: normalizeTargetRoles(resource.targetRoles),
    category: resource.category,
    targetCountries: normalizeCountries(resource.targetCountries),
    fileName: resource.fileName,
    mimeType: resource.mimeType,
    fileSize: resource.fileSize,
    isPublished: resource.isPublished,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    uploadedBy: resource.uploadedBy ?? null,
    acknowledgedAt: ack?.acknowledgedAt ?? null,
    acknowledged,
    pendingAcknowledgement: resource.requiresAcknowledgement && !acknowledged,
    userId,
  });
};

export const listResourcesForUser = async (params: {
  userId: number;
  role: UserRole;
  tenantId: number | null;
}) => {
  const rows = await prisma.resource.findMany({
    where: {
      deletedAt: null,
      isFolder: false,
      isPublished: true,
      ...(params.tenantId != null ? { tenantId: params.tenantId } : {}),
    },
    include: {
      uploadedBy: { select: { id: true, fullName: true } },
      acknowledgements: {
        where: { userId: params.userId },
        select: { acknowledgedAt: true },
      },
    },
    orderBy: [{ requiresAcknowledgement: 'desc' }, { updatedAt: 'desc' }],
  });

  const actorCountries = await getActorCountries(params.userId);
  const visible = rows.filter(
    (row) =>
      categoryAllows(row.category, row.targetCountries, params.role, actorCountries) &&
      roleMatchesAudience(params.role, row.targetRoles),
  );
  return Promise.all(visible.map((row) => mapResourceRow(row, params.userId)));
};

export const listPendingAcknowledgements = async (params: {
  userId: number;
  role: UserRole;
  tenantId: number | null;
}) => {
  const rows = await listResourcesForUser(params);
  return rows.filter((row) => row.pendingAcknowledgement);
};

export const countPendingAcknowledgements = async (params: {
  userId: number;
  role: UserRole;
  tenantId: number | null;
}) => {
  const pending = await listPendingAcknowledgements(params);
  return pending.length;
};

export const acknowledgeResource = async (params: {
  resourceId: number;
  userId: number;
  role: UserRole;
  tenantId: number | null;
}) => {
  const resource = await prisma.resource.findFirst({
    where: {
      id: params.resourceId,
      deletedAt: null,
      isPublished: true,
      ...(params.tenantId != null ? { tenantId: params.tenantId } : {}),
    },
    include: {
      uploadedBy: { select: { id: true, fullName: true } },
    },
  });
  if (!resource) throw new Error('resource not found');
  const actorCountries = await getActorCountries(params.userId);
  if (
    !categoryAllows(resource.category, resource.targetCountries, params.role, actorCountries) ||
    !roleMatchesAudience(params.role, resource.targetRoles)
  ) {
    throw new Error('resource not available for your role');
  }
  if (!resource.requiresAcknowledgement) {
    throw new Error('this resource does not require acknowledgement');
  }

  await prisma.resourceAcknowledgement.upsert({
    where: {
      resourceId_userId: { resourceId: params.resourceId, userId: params.userId },
    },
    update: { acknowledgedAt: new Date() },
    create: { resourceId: params.resourceId, userId: params.userId },
  });

  const refreshed = await prisma.resource.findUnique({
    where: { id: params.resourceId },
    include: {
      uploadedBy: { select: { id: true, fullName: true } },
      acknowledgements: {
        where: { userId: params.userId },
        select: { acknowledgedAt: true },
      },
    },
  });
  if (!refreshed) throw new Error('resource not found');
  return mapResourceRow(refreshed, params.userId);
};

export const listResourcesAdmin = async (tenantId: number | null) => {
  const rows = await prisma.resource.findMany({
    where: {
      deletedAt: null,
      isFolder: false,
      ...(tenantId != null ? { tenantId } : {}),
    },
    include: {
      uploadedBy: { select: { id: true, fullName: true } },
      _count: { select: { acknowledgements: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return Promise.all(
    rows.map(async (row) => {
      const mapped = await mapResourceRow(row);
      return {
        ...mapped,
        acknowledgementCount: row._count.acknowledgements,
      };
    }),
  );
};

export const createResource = async (params: {
  tenantId: number | null;
  uploadedById: number;
  file: Express.Multer.File;
  name: string;
  description?: string | null;
  requiresAcknowledgement?: boolean;
  targetRoles?: unknown;
  category?: ResourceCategory;
  targetCountries?: unknown;
  isPublished?: boolean;
}) => {
  const slug = await uniqueSlug(params.name);
  const storedName = safeUploadFilename(params.file.originalname);
  const tenantPart = params.tenantId ?? 'global';
  const relativePath = `uploads/resources/${tenantPart}/${storedName}`;
  const { ref: fileUrl } = await storeUploadedFile({
    relativePath,
    buffer: params.file.buffer,
    contentType: params.file.mimetype,
  });

  const created = await prisma.resource.create({
    data: {
      tenantId: params.tenantId,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      slug,
      url: fileUrl,
      fileName: params.file.originalname,
      mimeType: params.file.mimetype,
      fileSize: params.file.size,
      uploadedById: params.uploadedById,
      requiresAcknowledgement: Boolean(params.requiresAcknowledgement),
      category: params.category ?? ResourceCategory.INHOUSE,
      targetCountries:
        (params.category === ResourceCategory.ACADEMICS
          ? normalizeCountries(params.targetCountries)
          : []) as Prisma.InputJsonValue,
      targetRoles:
        (params.category === ResourceCategory.AGENTS ? ['AGENT'] : ['ALL']) as Prisma.InputJsonValue,
      isPublished: params.isPublished !== false,
      isFolder: false,
    },
    include: {
      uploadedBy: { select: { id: true, fullName: true } },
    },
  });

  return mapResourceRow(created);
};

export const updateResource = async (
  id: number,
  tenantId: number | null,
  data: {
    name?: string;
    description?: string | null;
    requiresAcknowledgement?: boolean;
    targetRoles?: unknown;
    category?: ResourceCategory;
    targetCountries?: unknown;
    isPublished?: boolean;
    file?: Express.Multer.File;
  },
) => {
  const existing = await prisma.resource.findFirst({
    where: { id, deletedAt: null, ...(tenantId != null ? { tenantId } : {}) },
  });
  if (!existing) throw new Error('resource not found');

  let url = existing.url;
  let fileName = existing.fileName;
  let mimeType = existing.mimeType;
  let fileSize = existing.fileSize;

  if (data.file) {
    if (existing.url) {
      try {
        await deleteStoredFile(existing.url);
      } catch {
        /* ignore */
      }
    }
    const storedName = safeUploadFilename(data.file.originalname);
    const tenantPart = tenantId ?? 'global';
    const relativePath = `uploads/resources/${tenantPart}/${storedName}`;
    const stored = await storeUploadedFile({
      relativePath,
      buffer: data.file.buffer,
      contentType: data.file.mimetype,
    });
    url = stored.ref;
    fileName = data.file.originalname;
    mimeType = data.file.mimetype;
    fileSize = data.file.size;
  }

  const updated = await prisma.resource.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.requiresAcknowledgement !== undefined
        ? { requiresAcknowledgement: data.requiresAcknowledgement }
        : {}),
      ...(data.category !== undefined
        ? {
            category: data.category,
            ...(data.category !== ResourceCategory.ACADEMICS
              ? { targetCountries: [] as Prisma.InputJsonValue }
              : {}),
          }
        : {}),
      ...(data.targetCountries !== undefined
        ? {
            targetCountries:
              ((data.category ?? existing.category) === ResourceCategory.ACADEMICS
                ? normalizeCountries(data.targetCountries)
                : []) as Prisma.InputJsonValue,
          }
        : {}),
      ...(data.category !== undefined
        ? {
            targetRoles:
              (data.category === ResourceCategory.AGENTS ? ['AGENT'] : ['ALL']) as Prisma.InputJsonValue,
          }
        : data.targetRoles !== undefined
          ? { targetRoles: normalizeTargetRoles(data.targetRoles) as Prisma.InputJsonValue }
          : {}),
      ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
      ...(data.file
        ? {
            url,
            fileName,
            mimeType,
            fileSize,
          }
        : {}),
    },
    include: {
      uploadedBy: { select: { id: true, fullName: true } },
    },
  });

  return mapResourceRow(updated);
};

export const deleteResource = async (id: number, tenantId: number | null) => {
  const existing = await prisma.resource.findFirst({
    where: { id, deletedAt: null, ...(tenantId != null ? { tenantId } : {}) },
  });
  if (!existing) throw new Error('resource not found');

  await prisma.resource.update({
    where: { id },
    data: { deletedAt: new Date(), isPublished: false },
  });

  if (existing.url) {
    try {
      await deleteStoredFile(existing.url);
    } catch {
      /* ignore */
    }
  }

  return { id };
};

export const listResourceAcknowledgements = async (id: number, tenantId: number | null) => {
  const resource = await prisma.resource.findFirst({
    where: { id, deletedAt: null, ...(tenantId != null ? { tenantId } : {}) },
    select: { id: true, name: true },
  });
  if (!resource) throw new Error('resource not found');

  const rows = await prisma.resourceAcknowledgement.findMany({
    where: { resourceId: id },
    include: {
      user: { select: { id: true, fullName: true, email: true, role: true } },
    },
    orderBy: { acknowledgedAt: 'desc' },
  });

  return rows.map((row) => ({
    id: row.id,
    acknowledgedAt: row.acknowledgedAt,
    user: row.user,
  }));
};

export const resolveResourceFileUrl = async (ref: string | null | undefined) => resolveFileRef(ref);
