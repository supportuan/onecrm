import { prisma } from '../../prisma.js';
import { UserRole } from '@prisma/client';
import { hashPassword } from '../../utils/password.js';
import { sendCampaignEmail } from '../marketing/services/email.service.js';
import { safeNotify } from '../notifications/recipients.js';
import { updateRolePermissions } from '../rbac/rbac.service.js';
import {
  employeeSelfServiceModuleAccess,
  employeeSelfServicePermissions,
  inferSystemRole,
  moduleAccessToPermissions,
  slugifyRoleName,
} from '../../utils/role-permissions.js';
import { hrAccessRoleDefaults, userRoleToHrAccessRole } from '../hr/hr-access-role.js';

const allowedRoles = [
  UserRole.GLOBAL_ADMIN,
  UserRole.COUNSELLOR,
  UserRole.STUDENT,
  UserRole.HR,
  UserRole.AGENT,
];


const MODULE_ACCESS_OPTIONS = [
  {
    module: "Marketing",
    options: [
      "Lead Management",
      "Campaigns",
      "Automation",
      "Landing Pages & Forms",
      "Marketing Analytics",
    ],
  },
  {
    module: "Student CRM",
    options: [
      "Student Management",
      "Applications",
      "Visa Management",
      "Counselling",
    ],
  },
  {
    module: "Agency CRM",
    options: [
      "Agency Management",
      "Agency Leads",
      "Co-branding Tools",
      "Commission Management",
    ],
  },
  {
    module: "HR",
    options: [
      "Employee Directory",
      "Attendance",
      "Leave Management",
      "Payroll Inputs",
      "Performance Reviews",
      "Recruitment Tracker",
    ],
  },
  {
    module: "Admin & Settings",
    options: ["User Management", "Roles", "Permissions", "Settings"],
  },
];

export const createEmptyModuleAccess = () => {
  const access: Record<string, Record<string, string[]>> = {};
  MODULE_ACCESS_OPTIONS.forEach((item) => {
    access[item.module] = {};
    item.options.forEach((option) => {
      access[item.module][option] = [];
    });
  });
  return access;
};

export const getDefaultModuleAccessByRole = (role: string) => {
  const access = createEmptyModuleAccess();

  const giveModuleActions = (moduleName: string, actions = ["VIEW", "EDIT"]) => {
    const moduleData = MODULE_ACCESS_OPTIONS.find(
      (item) => item.module === moduleName
    );

    moduleData?.options.forEach((optionName) => {
      access[moduleName] = access[moduleName] || {};
      access[moduleName][optionName] = actions;
    });
  };

  if (role === "HR") {
    giveModuleActions("HR", ["VIEW", "EDIT"]);
  } else if (role === "STUDENT") {
    giveModuleActions("Student CRM", ["VIEW", "EDIT"]);
  } else if (role === "AGENT") {
    giveModuleActions("Agency CRM", ["VIEW", "EDIT"]);
  } else if (role === "COUNSELLOR") {
    giveModuleActions("Marketing", ["VIEW"]);
    giveModuleActions("Student CRM", ["VIEW"]);
  } else if (role === "GLOBAL_ADMIN") {
    giveModuleActions("Marketing", ["VIEW", "EDIT"]);
    giveModuleActions("Student CRM", ["VIEW", "EDIT"]);
    giveModuleActions("Agency CRM", ["VIEW", "EDIT"]);
    giveModuleActions("Admin & Settings", ["VIEW", "EDIT"]);
  } else if (role === "SUPER_ADMIN") {
    giveModuleActions("Marketing", ["VIEW", "EDIT"]);
    giveModuleActions("Student CRM", ["VIEW", "EDIT"]);
    giveModuleActions("Agency CRM", ["VIEW", "EDIT"]);
    giveModuleActions("HR", ["VIEW", "EDIT"]);
    giveModuleActions("Admin & Settings", ["VIEW", "EDIT"]);
  }

  // Filter empty options to store a clean object like getCleanModuleAccess in frontend
  const clean: Record<string, Record<string, string[]>> = {};
  Object.entries(access).forEach(([moduleName, options]) => {
    Object.entries(options).forEach(([optionName, actions]) => {
      if (actions && actions.length > 0) {
        if (!clean[moduleName]) clean[moduleName] = {};
        clean[moduleName][optionName] = actions;
      }
    });
  });

  return clean;
};

// tenantId === null means "no scoping" (SUPER_ADMIN). A numeric tenantId
// restricts the result to that tenant only.
export const getUsers = async (role?: UserRole, tenantId: number | null = null) => {
  return prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(tenantId != null ? { tenantId } : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getUserById = async (id: number, tenantId: number | null = null) => {
  return prisma.user.findFirst({
    where: {
      id,
      ...(tenantId != null ? { tenantId } : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      roleLabel: true,
      permissionRole: true,
      tenantId: true,
      isActive: true,
      isApproved: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      moduleAccess: true,
    },
  });
};

// export const createUser = async (data: {
//   fullName: string;
//   email: string;
//   phone?: string;
//   password: string;
//   role: UserRole;
//   agencyDetails?: any;
//   moduleAccess?: any;
// }) => {
//   if (!allowedRoles.includes(data.role)) {
//     throw new Error('Invalid role selected');
//   }

//   const passwordHash = await hashPassword(data.password);
//   const isApproved = data.role !== UserRole.AGENT;
//   const moduleAccess = data.moduleAccess || getDefaultModuleAccessByRole(data.role);

//   const user = await prisma.user.create({
//     data: {
//       fullName: data.fullName,
//       email: data.email,
//       phone: data.phone || null,
//       passwordHash,
//       role: data.role,
//       isActive: true,
//       isApproved,
//       agencyDetails: data.agencyDetails || null,
//       moduleAccess: moduleAccess || null,
//     },
//   });

//   // Dispatch Welcome Email asynchronously so it does not block the response
//   sendCampaignEmail({
//     to: data.email,
//     subject: 'Welcome to OneCRM - Your Account Details',
//     html: `
//       <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
//         <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to OneCRM!</h2>
//         <p style="color: #334155; font-size: 16px;">Hello <strong>${data.fullName}</strong>,</p>
//         <p style="color: #334155; font-size: 14px;">Your account has been created successfully with the role of <strong>${data.role}</strong>.</p>
//         <p style="color: #334155; font-size: 14px;">Here are your temporary login credentials:</p>
//         <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
//           <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>Username (Email):</strong> ${data.email}</p>
//           <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>Temporary Password:</strong> ${data.password}</p>
//         </div>
//         <p style="color: #64748b; font-size: 13px;">Please note that you will be prompted to change this temporary password upon your first login for security reasons.</p>
//         <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
//         <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated email, please do not reply directly.</p>
//       </div>
//     `,
//   }).catch((err) => {
//     console.error('[Welcome Email Error] Failed to send email to:', data.email, err);
//   });

//   return user;
// };

// export const createUser = async (data: {
//   fullName: string;
//   email: string;
//   phone?: string | null;
//   password?: string;
//   role: UserRole;
//   agencyDetails?: any;
//   moduleAccess?: any;
// }) => {
//   if (!allowedRoles.includes(data.role)) {
//     throw new Error('Invalid role selected');
//   }

//   const temporaryPassword =
//     data.password || Math.random().toString(36).slice(-8) + 'A@1';

//   const passwordHash = await hashPassword(temporaryPassword);
//   const isApproved = data.role !== UserRole.AGENT;
//   const moduleAccess = data.moduleAccess || getDefaultModuleAccessByRole(data.role);

//   const result = await prisma.$transaction(async (tx) => {
//     const user = await tx.user.create({
//       data: {
//         fullName: data.fullName,
//         email: data.email,
//         phone: data.phone || null,
//         passwordHash,
//         role: data.role,
//         isActive: true,
//         isApproved,
//         agencyDetails: data.agencyDetails || null,
//         moduleAccess: moduleAccess || null,
//       },
//     });

//     if (data.role === UserRole.STUDENT) {
//       await tx.lead.create({
//         data: {
//           fullName: user.fullName,
//           email: user.email,
//           phone: user.phone,
//           studentUserId: user.id,
//           isStudentLoginCreated: true,
//           status: 'NEW',
//           rating: 'WARM',
//         },
//       });
//     }

//     return user;
//   });

// //   sendCampaignEmail({
// //     to: data.email,
// //     subject: 'Welcome to OneCRM - Your Account Details',
// //     html: `
// //       <p>Hello <b>${data.fullName}</b>,</p>
// //       <p>Your account has been created successfully.</p>
// //       <p><b>Email:</b> ${data.email}</p>
// //       <p><b>Temporary Password:</b> ${temporaryPassword}</p>
// //     `,
// //   }).catch((err) => {
// //     console.error('[Welcome Email Error] Failed to send email to:', data.email, err);
// //   });

// //   if (isApproved) {
// //     await safeNotify({
// //       recipientId: user.id,
// //       templateKey: 'welcome.user',
// //       vars: { name: user.fullName, role: user.role },
// //     });
// //   }

// //   return user;
// // };
//   sendCampaignEmail({
//     to: data.email,
//     subject: 'Welcome to OneCRM - Your Account Details',
//     html: `
//       <p>Hello <b>${data.fullName}</b>,</p>
//       <p>Your account has been created successfully.</p>
//       <p><b>Email:</b> ${data.email}</p>
//       <p><b>Temporary Password:</b> ${temporaryPassword}</p>
//     `,
//   }).catch((err) => {
//     console.error('[Welcome Email Error] Failed to send email to:', data.email, err);
//   });

//   if (isApproved) {
//     await safeNotify({
//       recipientId: result.id,
//       templateKey: 'welcome.user',
//       vars: {
//         name: result.fullName,
//         role: result.role,
//       },
//     });
//   }

//   return result;
// };

export const createUser = async (data: {
  fullName: string;
  email: string;
  phone?: string | null;
  password?: string;
  role?: UserRole;
  roleName?: string;
  agencyDetails?: any;
  moduleAccess?: any;
  tenantId?: number | null;
  linkHrEmployeeId?: number;
}) => {
  try {
    const trimmedRoleName = data.roleName?.trim();
    const systemRole = trimmedRoleName ? inferSystemRole(trimmedRoleName) : data.role;

    if (!systemRole || !(allowedRoles as UserRole[]).includes(systemRole)) {
      throw new Error('Invalid role selected');
    }

    const normalizedEmail = data.email.trim().toLowerCase();

    const existingEmail = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingEmail) {
      throw new Error('User with this email already exists');
    }

    if (data.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: data.phone,
        },
      });

      if (existingPhone) {
        throw new Error('User with this mobile number already exists');
      }
    }

    const temporaryPassword =
      data.password || Math.random().toString(36).slice(-8) + 'A@1';

    const passwordHash = await hashPassword(temporaryPassword);
    const isApproved = systemRole !== UserRole.AGENT;
    const moduleAccess =
      data.moduleAccess || getDefaultModuleAccessByRole(systemRole);
    const roleLabel = trimmedRoleName ?? null;
    const permissionRole = trimmedRoleName ? slugifyRoleName(trimmedRoleName) : null;
    const displayRole = roleLabel || systemRole;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: data.tenantId ?? null,
          fullName: data.fullName,
          email: normalizedEmail,
          phone: data.phone || null,
          passwordHash,
          role: systemRole,
          roleLabel,
          permissionRole,
          isActive: true,
          isApproved,
          agencyDetails: data.agencyDetails || null,
          moduleAccess: moduleAccess || null,
        },
      });

      if (systemRole === UserRole.STUDENT) {
        await tx.lead.create({
          data: {
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            studentUserId: user.id,
            isStudentLoginCreated: true,
            status: 'NEW',
            rating: 'WARM',
          },
        });
      }

      const isStaffRole =
        systemRole === UserRole.GLOBAL_ADMIN ||
        systemRole === UserRole.HR ||
        systemRole === UserRole.COUNSELLOR ||
        systemRole === UserRole.MARKETING_MANAGER ||
        systemRole === UserRole.TELECALLER;

      if (data.linkHrEmployeeId) {
        await tx.hrEmployee.update({
          where: { id: data.linkHrEmployeeId },
          data: { userId: user.id },
        });
      } else if (isStaffRole && data.tenantId != null) {
        const existingEmp = await tx.hrEmployee.findUnique({
          where: { email: normalizedEmail },
        });
        if (existingEmp) {
          await tx.hrEmployee.update({
            where: { id: existingEmp.id },
            data: { userId: user.id, name: user.fullName, phone: user.phone },
          });
        } else {
          const employeeCode = `EMP-T${data.tenantId}-U${user.id}`;
          const accessRole = userRoleToHrAccessRole(systemRole);
          await tx.hrEmployee.create({
            data: {
              tenantId: data.tenantId,
              userId: user.id,
              name: user.fullName,
              email: normalizedEmail,
              employeeCode,
              phone: user.phone,
              accessRole,
              ...hrAccessRoleDefaults(accessRole),
            },
          });
        }
      }

      return user;
    });

    if (permissionRole && data.tenantId != null) {
      const perms = moduleAccessToPermissions(moduleAccess);
      await updateRolePermissions(
        data.tenantId,
        permissionRole,
        perms.length ? perms : moduleAccessToPermissions(getDefaultModuleAccessByRole(systemRole))
      );
    }

    sendCampaignEmail({
      to: normalizedEmail,
      subject: 'Welcome to OneCRM - Your Account Details',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to OneCRM!</h2>
            <p style="color: #334155; font-size: 16px;">Hello <strong>${data.fullName}</strong>,</p>
            <p style="color: #334155; font-size: 14px;">Your account has been created successfully with the role of <strong>${displayRole}</strong>.</p>
            <p style="color: #334155; font-size: 14px;">Here are your temporary login credentials:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>Username (Email):</strong> ${data.email}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          </div>
            <p style="color: #64748b; font-size: 13px;">Please note that you will be prompted to change this temporary password upon your first login for security reasons.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated email, please do not reply directly.</p>
        </div>

      `,
    }).catch((err) => {
      console.error(
        '[Welcome Email Error] Failed to send email to:',
        normalizedEmail,
        err
      );
    });

    if (isApproved) {
      await safeNotify({
        recipientId: result.id,
        templateKey: 'welcome.user',
        vars: {
          name: result.fullName,
          role: displayRole,
        },
      });
    }

    return result;
  } catch (error: any) {
    // if (error?.code === 'P2002') {
    //   throw new Error('User with this email already exists');
    // }
    if (error?.code === 'P2002') {
      const target = error?.meta?.target || [];

      if (target.includes('email')) {
        throw new Error('User with this email already exists');
      }

      if (target.includes('phone')) {
        throw new Error('User with this mobile number already exists');
      }

      throw new Error('Duplicate record already exists');
    }

    if (error?.message) {
      throw new Error(error.message);
    }

    throw new Error('Failed to create user');
  }
};

// export const updateUser = async (
//   id: number,
//   data: {
//     fullName?: string;
//     email?: string;
//     phone?: string | null;
//     role?: UserRole;
//     isActive?: boolean;
//     isApproved?: boolean;
//     counsellorId?: number | null;
//     moduleAccess?: any;
//   }
// ) => {
//   const existing = data.isApproved !== undefined
//     ? await prisma.user.findUnique({ where: { id } })
//     : null;

//   const updated = await prisma.user.update({
//     where: { id },
//     data,
//   });



//   if (existing && data.isApproved === true && !existing.isApproved) {
//     await safeNotify({
//       recipientId: id,
//       templateKey: 'welcome.user',
//       vars: { name: updated.fullName, role: updated.role },
//     });
//   }

//   return updated;
// };

export const updateUser = async (
  id: number,
  data: {
    fullName?: string;
    email?: string;
    phone?: string | null;
    role?: UserRole;
    roleName?: string;
    isActive?: boolean;
    isApproved?: boolean;
    counsellorId?: number | null;
    moduleAccess?: any;
  },
  tenantId: number | null = null,
) => {
  if (tenantId != null) {
    const existing = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('User not found');
  }

  const existing = data.isApproved !== undefined
    ? await prisma.user.findUnique({ where: { id } })
    : null;

  const trimmedRoleName = data.roleName?.trim();
  const patch: Record<string, unknown> = { ...data };
  delete patch.roleName;

  if (trimmedRoleName) {
    patch.role = inferSystemRole(trimmedRoleName);
    patch.roleLabel = trimmedRoleName;
    patch.permissionRole = slugifyRoleName(trimmedRoleName);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: patch,
    });

    if (data.counsellorId !== undefined && user.role === UserRole.STUDENT) {
      await tx.lead.updateMany({
        where: {
          studentUserId: id,
        },
        data: {
          assignedCounsellorId: data.counsellorId,
        },
      });
    }

    return user;
  });

  if (updated.permissionRole && updated.tenantId != null && data.moduleAccess) {
    const perms = moduleAccessToPermissions(data.moduleAccess);
    if (perms.length) {
      await updateRolePermissions(updated.tenantId, updated.permissionRole, perms);
    }
  }

  if (existing && data.isApproved === true && !existing.isApproved) {
    await safeNotify({
      recipientId: id,
      templateKey: 'welcome.user',
      vars: { name: updated.fullName, role: updated.roleLabel || updated.role },
    });
  }

  return updated;
};

export const deactivateUser = async (id: number, tenantId: number | null = null) => {
  if (tenantId != null) {
    const existing = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('User not found');
  }
  return prisma.user.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};

export const getCounsellors = async (tenantId: number | null = null) => {
  return prisma.user.findMany({
    where: {
      role: UserRole.COUNSELLOR,
      isActive: true,
      ...(tenantId != null ? { tenantId } : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
    orderBy: {
      fullName: 'asc',
    },
  });
};