import { prisma } from '../../prisma.js';
import { UserRole } from '@prisma/client';
import { hashPassword } from '../../utils/password.js';
import { sendWelcomeCredentialsEmailAsync, sendStudentWelcomeCredentialsEmailAsync } from '../../lib/welcome-email.js';
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
import { getLoginUrl, getStudentLoginUrl } from '../../utils/frontend-url.js';

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
      // "Automation",
      // "Landing Pages & Forms",
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
      "Dashboard",
      "Agency Management",
      "Agency Leads",
      "University Directory",
      "Communications",
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
  {
    module: "Resources",
    options: ["Resource Library", "Manage Resources"],
  },
  {
    module: "Training",
    options: ["My Training", "Manage Training"],
  },
  {
    module: "Student Portal",
    options: ["Applications", "Profile", "Payments", "Resources"],
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
    giveModuleActions("Resources", ["VIEW"]);
    giveModuleActions("Training", ["VIEW", "EDIT"]);
  } else if (role === "STUDENT") {
    giveModuleActions("Student Portal", ["VIEW"]);
    giveModuleActions("Resources", ["VIEW"]);
    access["Training"] = access["Training"] || {};
    access["Training"]["My Training"] = ["VIEW"];
  } else if (role === "AGENT" || role === "AGENCY_FREELANCER") {
    // Portal-scoped VIEW only — no Agency Management / MANAGE_AGENCY_CRM.
    // Fine-grained partner actions use AgencyPartner.capabilities.
    const portalOptions = [
      "Dashboard",
      "Agency Leads",
      "University Directory",
      "Communications",
      "Co-branding Tools",
      "Commission Management",
    ];
    portalOptions.forEach((optionName) => {
      access["Agency CRM"] = access["Agency CRM"] || {};
      access["Agency CRM"][optionName] = ["VIEW"];
    });
    access["Resources"] = access["Resources"] || {};
    access["Resources"]["Resource Library"] = ["VIEW"];
    access["Training"] = access["Training"] || {};
    access["Training"]["My Training"] = ["VIEW"];
  } else if (role === "COUNSELLOR") {
    giveModuleActions("Marketing", ["VIEW"]);
    giveModuleActions("Student CRM", ["VIEW"]);
    giveModuleActions("Resources", ["VIEW"]);
    access["Training"] = access["Training"] || {};
    access["Training"]["My Training"] = ["VIEW"];
  } else if (role === "MARKETING_MANAGER") {
    giveModuleActions("Marketing", ["VIEW", "EDIT"]);
    giveModuleActions("Resources", ["VIEW"]);
    access["Training"] = access["Training"] || {};
    access["Training"]["My Training"] = ["VIEW"];
  } else if (role === "TELECALLER") {
    giveModuleActions("Marketing", ["VIEW"]);
    giveModuleActions("Student CRM", ["VIEW"]);
    giveModuleActions("Resources", ["VIEW"]);
    access["Training"] = access["Training"] || {};
    access["Training"]["My Training"] = ["VIEW"];
  } else if (role === "GLOBAL_ADMIN" || role === "SUPER_ADMIN") {
    giveModuleActions("Marketing", ["VIEW", "EDIT"]);
    giveModuleActions("Student CRM", ["VIEW", "EDIT"]);
    giveModuleActions("Agency CRM", ["VIEW", "EDIT"]);
    giveModuleActions("Resources", ["VIEW", "EDIT"]);
    giveModuleActions("Training", ["VIEW", "EDIT"]);
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

// Returns all users for this isolated install.
export const getUsers = async (role?: UserRole) => {
  return prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getUserById = async (id: number) => {
  return prisma.user.findFirst({
    where: {
      id,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      roleLabel: true,
      permissionRole: true,
      isActive: true,
      isApproved: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      moduleAccess: true,
    },
  });
};


export const createUser = async (data: {
  fullName: string;
  email: string;
  phone?: string | null;
  password?: string;
  role?: UserRole;
  roleName?: string;
  agencyDetails?: any;
  moduleAccess?: any;
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
      } else if (isStaffRole) {
        const existingEmp = await tx.hrEmployee.findUnique({
          where: { email: normalizedEmail },
        });
        if (existingEmp) {
          await tx.hrEmployee.update({
            where: { id: existingEmp.id },
            data: { userId: user.id, name: user.fullName, phone: user.phone },
          });
        } else {
          const employeeCode = `EMP-U${user.id}`;
          const accessRole = userRoleToHrAccessRole(systemRole);
          await tx.hrEmployee.create({
            data: {
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

    if (permissionRole) {
      const perms = moduleAccessToPermissions(moduleAccess);
      await updateRolePermissions(
        permissionRole,
        perms.length ? perms : moduleAccessToPermissions(getDefaultModuleAccessByRole(systemRole))
      );
    }

    if (systemRole === UserRole.STUDENT) {
      sendStudentWelcomeCredentialsEmailAsync({
        to: normalizedEmail,
        fullName: data.fullName,
        email: data.email,
        temporaryPassword,
        loginUrl: getStudentLoginUrl(),
      });
    } else {
      sendWelcomeCredentialsEmailAsync({
        to: normalizedEmail,
        fullName: data.fullName,
        email: data.email,
        temporaryPassword,
        displayRole,
        loginUrl: getLoginUrl(),
      });
    }

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
  updatedById?: number

) => {
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
  } else if (data.role) {
    // Assigning a system enum role clears any previous custom permission key.
    patch.roleLabel = null;
    patch.permissionRole = null;
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
          deletedAt: null,
        },
        data: {
          assignedCounsellorId: data.counsellorId,
          assignedById: updatedById ?? null,
        },
      });
    }

    return user;
  });

  if (updated.permissionRole && data.moduleAccess) {
    const perms = moduleAccessToPermissions(data.moduleAccess);
    if (perms.length) {
      await updateRolePermissions(updated.permissionRole, perms);
    }
  }

  if (existing && data.isApproved === true && !existing.isApproved) {
    await safeNotify({
      recipientId: id,
      templateKey: 'welcome.user',
      vars: { name: updated.fullName, role: updated.roleLabel || updated.role },
    });

    // Approving login lets the agent complete docs/agreement — do NOT auto-activate.
    // Activation (referral sharing) stays on Agency Management → Activate partner.
    if (updated.role === UserRole.AGENT || updated.role === UserRole.AGENCY_FREELANCER) {
      const { provisionPartnerFromAgentUser } = await import(
        '../agency-crm/agency-partner.lifecycle.js'
      );
      await provisionPartnerFromAgentUser(id);
    }
  }

  return updated;
};

export const deactivateUser = async (id: number) => {
  return prisma.user.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};

export const getCounsellors = async () => {
  return prisma.user.findMany({
    where: {
      role: UserRole.COUNSELLOR,
      isActive: true,
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