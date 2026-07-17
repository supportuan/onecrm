import { prisma } from '../../prisma.js';
import { UserRole, AgencyPartnerStatus } from '@prisma/client';
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
      "Onboarding",
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
    // Students use the applicant portal only — no staff CRM sidebar access.
  } else if (role === "AGENT" || role === "AGENCY_FREELANCER") {
    // Portal-scoped VIEW only — no Agency Management / MANAGE_AGENCY_CRM.
    // Fine-grained partner actions use AgencyPartner.capabilities.
    const portalOptions = [
      "Dashboard",
      "Agency Leads",
      "University Directory",
      "Onboarding",
      "Communications",
      "Co-branding Tools",
      "Commission Management",
    ];
    portalOptions.forEach((optionName) => {
      access["Agency CRM"] = access["Agency CRM"] || {};
      access["Agency CRM"][optionName] = ["VIEW"];
    });
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
          <div style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
              <tr>
                <td align="center">

                  <table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,.08);">

                    <!-- Header -->
                    <tr>
                      <td style="background:#0f172a;padding:30px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:30px;font-weight:700;">
                          Welcome to OneCRM
                        </h1>
                        <p style="margin-top:10px;color:#E0E7FF;font-size:15px;">
                          Smart CRM Platform for Education & Business Management
                        </p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px;">

                        <p style="font-size:17px;color:#334155;margin:0 0 20px;">
                          Hello <strong>${data.fullName}</strong>,
                        </p>

                        <p style="font-size:15px;line-height:28px;color:#475569;margin-bottom:25px;">
                          Congratulations! Your <strong>OneCRM</strong> account has been successfully created.
                          You have been assigned the role of
                          <strong style="color:#4F46E5;">${displayRole}</strong>.
                        </p>

                        <!-- Login Credentials -->
                        <table width="100%" cellpadding="0" cellspacing="0"
                          style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;margin:25px 0;">
                          <tr>
                            <td style="padding:25px;">

                              <h3 style="margin:0 0 18px;color:#1E293B;font-size:18px;">
                                🔐 Login Credentials
                              </h3>

                              <table width="100%" cellpadding="8">
                                <tr>
                                  <td width="170" style="font-weight:600;color:#64748B;">
                                    Email
                                  </td>
                                  <td style="color:#1E293B;">
                                    ${data.email}
                                  </td>
                                </tr>

                                <tr>
                                  <td style="font-weight:600;color:#64748B;">
                                    Temporary Password
                                  </td>
                                  <td style="color:#DC2626;font-weight:700;font-size:16px;">
                                    ${temporaryPassword}
                                  </td>
                                </tr>

                                <tr>
                                  <td style="font-weight:600;color:#64748B;">
                                    Role
                                  </td>
                                  <td style="color:#4F46E5;font-weight:600;">
                                    ${displayRole}
                                  </td>
                                </tr>
                              </table>

                            </td>
                          </tr>
                        </table>

                        <!-- Login Button -->
                        <div style="text-align:center;margin:35px 0;">
                          <a href="https://your-domain.com/login"
                            style="background:#4F46E5;
                                  color:#ffffff;
                                  text-decoration:none;
                                  padding:14px 35px;
                                  border-radius:10px;
                                  display:inline-block;
                                  font-size:15px;
                                  font-weight:600;">
                            Login to OneCRM
                          </a>
                        </div>

                        <!-- Security Notice -->
                        <div style="background:#FEFCE8;border-left:5px solid #EAB308;padding:18px;border-radius:8px;margin-top:25px;">
                          <strong style="color:#92400E;">Security Reminder</strong>

                          <p style="margin-top:10px;font-size:14px;color:#57534E;line-height:24px;">
                            This password is temporary. For your security, you will be asked
                            to create a new password immediately after your first login.
                            Please do not share your login credentials with anyone.
                          </p>
                        </div>

                        <p style="margin-top:35px;font-size:15px;color:#475569;line-height:26px;">
                          If you experience any issues accessing your account,
                          please contact your system administrator or our support team.
                        </p>

                        <p style="margin-top:30px;font-size:15px;color:#334155;">
                          Best Regards,<br>
                          <strong>OneCRM Team</strong>
                        </p>

                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#F8FAFC;padding:25px;text-align:center;border-top:1px solid #E2E8F0;">

                        <p style="margin:0;font-size:13px;color:#64748B;">
                          © ${new Date().getFullYear()} OneCRM. All Rights Reserved.
                        </p>

                        <p style="margin-top:8px;font-size:12px;color:#94A3B8;">
                          This is an automated email. Please do not reply to this message.
                        </p>

                      </td>
                    </tr>

                  </table>

                </td>
              </tr>
            </table>
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
  updatedById?: number

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

    if (updated.role === UserRole.AGENT || updated.role === UserRole.AGENCY_FREELANCER) {
      const { provisionPartnerFromAgentUser, setPartnerStatus } = await import(
        '../agency-crm/agency-partner.lifecycle.js'
      );
      const partner = await provisionPartnerFromAgentUser(id);
      if (partner && partner.status === AgencyPartnerStatus.PENDING) {
        await setPartnerStatus(partner.id, AgencyPartnerStatus.ACTIVE, updatedById);
      }
    }
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