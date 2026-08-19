import { prisma } from '../prisma.js';
import { resolveFileRef } from '../lib/file-storage.js';

const SOLO_NAME = 'ApplyUniNow';

export const ensureOrgSettings = async () => {
  return prisma.orgSettings.upsert({
    where: { id: 1 },
    create: { id: 1, name: SOLO_NAME },
    update: {},
  });
};

export const resolveOrgBranding = async () => {
  const org = await ensureOrgSettings();
  return {
    tenantName: org.name || SOLO_NAME,
    tenantLogoUrl: (await resolveFileRef(org.logoUrl)) || null,
  };
};
