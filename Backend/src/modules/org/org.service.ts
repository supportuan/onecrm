import fs from 'fs';
import { prisma } from '../../prisma.js';
import {
  deleteStoredFile,
  isS3Ref,
  localPathFromUploadsRelative,
  resolveFileRef,
  safeUploadFilename,
  storeUploadedFile,
  uploadsRelativeFromLocalUrl,
} from '../../lib/file-storage.js';
import { getOrgName } from '../../utils/org-identity.js';
import { ensureOrgSettings, resolveOrgBranding } from '../../utils/org-settings.js';
import { normalizeAlliedServices } from './allied-services.js';

const clip = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export const getPublicAppearance = async () => {
  const branding = await resolveOrgBranding();
  return branding;
};

export const getAdminAppearance = async () => {
  const org = await ensureOrgSettings();
  const branding = await resolveOrgBranding();
  const allied = normalizeAlliedServices(org.alliedServices);
  return {
    ...branding,
    alliedHeading: allied.heading,
    alliedServices: allied.items,
    hasCustomLogo: Boolean(org.logoUrl),
    hasLoginBackground: Boolean(org.loginBackgroundUrl),
  };
};

export const updateAppearance = async (body: Record<string, unknown>) => {
  const org = await ensureOrgSettings();
  const data: {
    name?: string;
    tagline?: string | null;
    loginHeadline?: string | null;
    alliedServices?: ReturnType<typeof normalizeAlliedServices>;
  } = {};

  if (body.name !== undefined) {
    data.name = clip(body.name, 80) || getOrgName();
  }
  if (body.tagline !== undefined) {
    const tagline = clip(body.tagline, 120);
    data.tagline = tagline || null;
  }
  if (body.loginHeadline !== undefined) {
    const headline = clip(body.loginHeadline, 120);
    data.loginHeadline = headline || null;
  }
  if (body.alliedServices !== undefined || body.alliedHeading !== undefined) {
    data.alliedServices = normalizeAlliedServices({
      heading: body.alliedHeading ?? (org.alliedServices as { heading?: string } | null)?.heading,
      items: Array.isArray(body.alliedServices)
        ? body.alliedServices
        : (org.alliedServices as { items?: unknown } | null)?.items,
    });
  }

  if (Object.keys(data).length === 0) {
    return getAdminAppearance();
  }

  await prisma.orgSettings.update({
    where: { id: org.id },
    data,
  });

  return getAdminAppearance();
};

export const saveLoginBackground = async (file: { buffer: Buffer; originalname: string; mimetype: string }) => {
  const org = await ensureOrgSettings();
  const storedName = safeUploadFilename(file.originalname.endsWith('.mp4') ? file.originalname : `${file.originalname}.mp4`);
  const relativePath = `uploads/org/${storedName}`;
  const stored = await storeUploadedFile({
    relativePath,
    buffer: file.buffer,
    contentType: file.mimetype || 'video/mp4',
    skipOptimize: true,
  });

  if (org.loginBackgroundUrl && org.loginBackgroundUrl !== stored.ref) {
    try {
      await deleteStoredFile(org.loginBackgroundUrl);
    } catch {
      /* previous file can stay if delete is denied */
    }
  }

  await prisma.orgSettings.update({
    where: { id: org.id },
    data: { loginBackgroundUrl: stored.ref },
  });

  return getAdminAppearance();
};

export const clearLoginBackground = async () => {
  const org = await ensureOrgSettings();
  if (org.loginBackgroundUrl) {
    try {
      await deleteStoredFile(org.loginBackgroundUrl);
    } catch {
      /* ignore missing file */
    }
  }
  await prisma.orgSettings.update({
    where: { id: org.id },
    data: { loginBackgroundUrl: null },
  });
  return getAdminAppearance();
};

const resolveStoredMedia = async (ref: string | null | undefined) => {
  if (!ref) return null;

  if (isS3Ref(ref)) {
    const url = await resolveFileRef(ref);
    return { kind: 'redirect' as const, url: url || null };
  }

  const relative = uploadsRelativeFromLocalUrl(ref);
  if (!relative) return null;
  const abs = localPathFromUploadsRelative(relative);
  if (!fs.existsSync(abs)) return null;
  return { kind: 'file' as const, path: abs };
};

export const resolveLoginBackgroundFile = async () => {
  const org = await ensureOrgSettings();
  return resolveStoredMedia(org.loginBackgroundUrl);
};

export const saveLogo = async (file: { buffer: Buffer; originalname: string; mimetype: string }) => {
  const org = await ensureOrgSettings();
  const storedName = safeUploadFilename(file.originalname);
  const relativePath = `uploads/org/${storedName}`;
  const stored = await storeUploadedFile({
    relativePath,
    buffer: file.buffer,
    contentType: file.mimetype || 'image/png',
    optimizeOptions: { maxDimension: 1024, preferJpeg: false },
  });

  if (org.logoUrl && org.logoUrl !== stored.ref) {
    try {
      await deleteStoredFile(org.logoUrl);
    } catch {
      /* previous file can stay if delete is denied */
    }
  }

  await prisma.orgSettings.update({
    where: { id: org.id },
    data: { logoUrl: stored.ref },
  });

  return getAdminAppearance();
};

export const clearLogo = async () => {
  const org = await ensureOrgSettings();
  if (org.logoUrl) {
    try {
      await deleteStoredFile(org.logoUrl);
    } catch {
      /* ignore missing file */
    }
  }
  await prisma.orgSettings.update({
    where: { id: org.id },
    data: { logoUrl: null },
  });
  return getAdminAppearance();
};

export const resolveLogoFile = async () => {
  const org = await ensureOrgSettings();
  return resolveStoredMedia(org.logoUrl);
};
