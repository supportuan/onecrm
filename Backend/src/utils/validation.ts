import { prisma } from "../prisma.js";

export const normalizeValue = (
  value?: string | null
): string | null => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const validateDuplicateLead = async (
  email?: string | null,
  phone?: string | null,
  excludeLeadId?: number
) => {
  const cleanEmail = normalizeValue(email);
  const cleanPhone = normalizeValue(phone);

  const conditions: any[] = [];

  if (cleanEmail) {
    conditions.push({ email: cleanEmail });
  }

  if (cleanPhone) {
    conditions.push({ phone: cleanPhone });
  }

  if (!conditions.length) return;

  const duplicate = await prisma.lead.findFirst({
    where: {
      deletedAt: null,
      OR: conditions,
      ...(excludeLeadId
        ? { id: { not: excludeLeadId } }
        : {}),
    },
  });

  if (!duplicate) return;

  if (cleanEmail && duplicate.email === cleanEmail) {
    throw new Error(
      "Lead with this email already exists"
    );
  }

  if (cleanPhone && duplicate.phone === cleanPhone) {
    throw new Error(
      "Lead with this phone number already exists"
    );
  }

  throw new Error("Duplicate lead found");
};

export const validateDuplicateUser = async (
  email?: string | null,
  phone?: string | null,
  excludeUserId?: number
) => {
  const cleanEmail = normalizeValue(email);
  const cleanPhone = normalizeValue(phone);

  const conditions: any[] = [];

  if (cleanEmail) {
    conditions.push({ email: cleanEmail });
  }

  if (cleanPhone) {
    conditions.push({ phone: cleanPhone });
  }

  if (!conditions.length) return;

  const duplicate = await prisma.user.findFirst({
    where: {
      OR: conditions,
      ...(excludeUserId
        ? { id: { not: excludeUserId } }
        : {}),
    },
  });

  if (!duplicate) return;

  if (cleanEmail && duplicate.email === cleanEmail) {
    throw new Error(
      "User with this email already exists"
    );
  }

  if (cleanPhone && duplicate.phone === cleanPhone) {
    throw new Error(
      "User with this phone number already exists"
    );
  }

  throw new Error("Duplicate user found");
};