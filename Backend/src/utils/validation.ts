
import { prisma } from '../prisma.js';

export const normalizeValue = (
  value?: string | null
): string | null => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const normalizeEmail = (
  value?: string | null
): string | null => {
  const email = value?.trim().toLowerCase();
  return email && email.length > 0 ? email : null;
};

export const normalizePhone = (
  value?: string | null
): string | null => {
  const phone = value?.replace(/\D/g, '');
  return phone && phone.length > 0 ? phone : null;
};

// export const validateDuplicateLead = async (
//   email?: string | null,
//   phone?: string | null,
//   excludeLeadId?: number
// ) => {
//   const cleanEmail = normalizeEmail(email);
//   const cleanPhone = normalizePhone(phone);

//   if (!cleanEmail && !cleanPhone) {
//     return;
//   }

//   const baseWhere = {
//     deletedAt: null,
//     ...(excludeLeadId
//       ? {
//         id: {
//           not: excludeLeadId,
//         },
//       }
//       : {}),
//   };

//   const [emailDuplicate, phoneDuplicate] = await Promise.all([
//     cleanEmail
//       ? prisma.lead.findFirst({
//         where: {
//           ...baseWhere,
//           email: {
//             equals: cleanEmail,
//             mode: 'insensitive',
//           },
//         },
//         select: {
//           id: true,
//         },
//       })
//       : null,

//     cleanPhone
//       ? prisma.lead.findFirst({
//         where: {
//           ...baseWhere,
//           phone: cleanPhone,
//         },
//         select: {
//           id: true,
//         },
//       })
//       : null,
//   ]);

//   if (emailDuplicate && phoneDuplicate) {
//     throw new Error(
//       'Lead with this email and phone number already exists'
//     );
//   }

//   if (emailDuplicate) {
//     throw new Error(
//       'Lead with this email already exists'
//     );
//   }

//   if (phoneDuplicate) {
//     throw new Error(
//       'Lead with this phone number already exists'
//     );
//   }
// };

export const validateDuplicateLead = async (
  email?: string | null,
  phone?: string | null,
  excludeLeadId?: number
) => {
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);

  const conditions: any[] = [];

  if (cleanEmail) {
    conditions.push({
      email: {
        equals: cleanEmail,
        mode: 'insensitive',
      },
    });
  }

  if (cleanPhone) {
    conditions.push({
      phone: cleanPhone,
    });
  }

  if (!conditions.length) {
    return;
  }

  const duplicate = await prisma.lead.findFirst({
    where: {
      deletedAt: null,

      OR: conditions,

      ...(excludeLeadId
        ? {
          id: {
            not: excludeLeadId,
          },
        }
        : {}),
    },

    select: {
      id: true,
      email: true,
      phone: true,
    },
  });

  if (!duplicate) {
    return;
  }

  const duplicateEmail =
    cleanEmail &&
    normalizeEmail(duplicate.email) === cleanEmail;

  const duplicatePhone =
    cleanPhone &&
    normalizePhone(duplicate.phone) === cleanPhone;

  if (duplicateEmail && duplicatePhone) {
    throw new Error(
      'Lead with this email and phone number already exists'
    );
  }

  if (duplicateEmail) {
    throw new Error(
      'Lead with this email already exists'
    );
  }

  if (duplicatePhone) {
    throw new Error(
      'Lead with this phone number already exists'
    );
  }

  throw new Error('Duplicate lead found');
};

export const validateDuplicateUser = async (
  email?: string | null,
  phone?: string | null,
  excludeUserId?: number
) => {
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);

  if (!cleanEmail && !cleanPhone) {
    return;
  }

  const baseWhere = excludeUserId
    ? {
      id: {
        not: excludeUserId,
      },
    }
    : {};

  const [emailDuplicate, phoneDuplicate] = await Promise.all([
    cleanEmail
      ? prisma.user.findFirst({
        where: {
          ...baseWhere,
          email: {
            equals: cleanEmail,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
        },
      })
      : null,

    cleanPhone
      ? prisma.user.findFirst({
        where: {
          ...baseWhere,
          phone: cleanPhone,
        },
        select: {
          id: true,
        },
      })
      : null,
  ]);

  if (emailDuplicate && phoneDuplicate) {
    throw new Error(
      'User with this email and phone number already exists'
    );
  }

  if (emailDuplicate) {
    throw new Error(
      'User with this email already exists'
    );
  }

  if (phoneDuplicate) {
    throw new Error(
      'User with this phone number already exists'
    );
  }
};