// 'use client';
// import { useEffect, useMemo, useState } from 'react';
// import { usePathname as useLocation, useRouter } from 'next/navigation';
// import { ChevronDown, Command, LogOut, RefreshCw, Briefcase, Sparkles, SlidersHorizontal } from 'lucide-react';
// import MenuItem from './MenuItem';
// import { navMenu } from '../lib/menu';
// import { useWorkspace } from '../lib/workspaceContext';
// import { useAuth } from '@/lib/auth/AuthContext';

// const Sidebar = ({ sidebarOpen, onClose }) => {
//   const location = useLocation() || '';
//   const router = useRouter();
//   const { activeWorkspace, loginToWorkspace, logout: workspaceLogout } = useWorkspace();
//   const { logout: authLogout } = useAuth();
//   const [switcherOpen, setSwitcherOpen] = useState(false);

//   const { user } = useAuth();

//   // Filter navigation menu to keep only items allowed by active workspace AND user role
//   const filteredNavMenu = useMemo(() => {
//     if (!user) return [];

//     return navMenu.filter((item) => {
//       // workspace-level filter
//       let workspaceAllowed = false;
//       if (activeWorkspace === 'hr') workspaceAllowed = item.label === 'HR' || item.label === 'Admin & Settings';
//       else if (activeWorkspace === 'marketing') workspaceAllowed = item.label === 'Marketing' || item.label === 'Admin & Settings';
//       else workspaceAllowed = false;

//       // role-level filter
//       const role = user.role;
//       if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
//         return workspaceAllowed;
//       }

//       if (role === 'HR') {
//         return workspaceAllowed && (item.label === 'HR' || item.label === 'Admin & Settings');
//       }

//       if (role === 'COUNSELLOR') {
//         return workspaceAllowed && (item.label === 'Marketing' || item.title === 'Dashboard');
//       }

//       if (role === 'STUDENT') {
//         // students see only limited dashboard views
//         return workspaceAllowed && item.title === 'Dashboard';
//       }

//       return false;
//     });
//   }, [activeWorkspace, user]);

//   const initialOpen = useMemo(() => {
//     return filteredNavMenu.reduce((acc, item) => {
//       acc[item.label] = location.startsWith(item.path);
//       return acc;
//     }, {});
//   }, [filteredNavMenu, location]);

//   const sectionKeys = useMemo(() => filteredNavMenu.map((item) => item.label), [filteredNavMenu]);
//   const [openSections, setOpenSections] = useState(initialOpen);

//   useEffect(() => {
//     const activeNavSection = filteredNavMenu.find((item) => location.startsWith(item.path))?.label;
//     if (activeNavSection) {
//       setOpenSections(
//         sectionKeys.reduce((acc, current) => {
//           acc[current] = current === activeNavSection;
//           return acc;
//         }, {})
//       );
//     }
//   }, [location, filteredNavMenu, sectionKeys]);

//   const isSectionActive = (item) =>
//     location === item.path || item.subItems?.some((sub) => location.startsWith(sub.path));

//   const toggleSection = (label, path) => {
//     setOpenSections((prev) => {
//       const isOpen = prev[label];
//       const willOpen = !isOpen;
//       return sectionKeys.reduce((acc, key) => {
//         acc[key] = key === label ? willOpen : false;
//         return acc;
//       }, {});
//     });
//     if (path) {
//       setTimeout(() => {
//         router.push(path);
//       }, 0);
//     }
//   };

//   const handleWorkspaceSwitch = async (workspace) => {
//     setSwitcherOpen(false);
//     if (workspace !== activeWorkspace) {
//       await loginToWorkspace(workspace);
//     }
//   };

//   return (
//     <aside
//       className={`fixed inset-y-0 left-0 z-30 w-[288px] min-w-[288px] max-w-[288px] flex-none transform flex-col border-r border-neutral-200 bg-white text-neutral-800 transition-transform duration-300 h-screen flex ${
//         sidebarOpen ? 'translate-x-0' : '-translate-x-full'
//       } lg:translate-x-0`}
//     >
//       {/* Brand Header */}
//       <div className="flex-none p-5 pb-3">
//         <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
//           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white shadow-md ">
//             <Command className="h-5 w-5" />
//           </div>
//           <div>
//             <p className="text-base font-bold text-neutral-900">ONECRM</p>
//             <p className="text-xs font-medium text-neutral-500">SSO integrated portal</p>
//           </div>
//         </div>
//       </div>

//       {/* Premium Workspace Switcher */}
//       <div className="px-5 py-2 flex-none relative">
//         <button
//           onClick={() => setSwitcherOpen(!switcherOpen)}
//           className="flex w-full items-center justify-between rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-slate-100 hover:border-slate-300 px-3.5 py-2.5 transition text-left"
//         >
//           <div className="flex items-center gap-2.5">
//             <span className={`h-2 w-2 rounded-full animate-pulse ${activeWorkspace === 'hr' ? 'bg-neutral-900' : 'bg-neutral-700'}`} />
//             <div>
//               <p className="text-xs font-semibold text-neutral-500">Active workspace</p>
//               <p className="text-sm font-semibold text-slate-805 mt-0.5">
//                 {activeWorkspace === 'hr' ? 'HR Operations' : 'Marketing Suite'}
//               </p>
//             </div>
//           </div>
//           <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
//         </button>

//         {switcherOpen && (
//           <div className="absolute left-5 right-5 mt-2 z-50 rounded-xl bg-white border border-neutral-200 shadow-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
//             <button
//               onClick={() => handleWorkspaceSwitch('hr')}
//               className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
//                 activeWorkspace === 'hr'
//                   ? 'bg-neutral-100 text-neutral-900 font-bold'
//                   : 'text-neutral-600 hover:bg-neutral-50'
//               }`}
//             >
//               <span className="h-2 w-2 rounded-full bg-neutral-900" />
//               <span>HR Operations</span>
//             </button>
//             <button
//               onClick={() => handleWorkspaceSwitch('marketing')}
//               className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
//                 activeWorkspace === 'marketing'
//                   ? 'bg-neutral-100 text-neutral-700 font-bold'
//                   : 'text-neutral-600 hover:bg-neutral-50'
//               }`}
//             >
//               <span className="h-2 w-2 rounded-full bg-neutral-700" />
//               <span>Marketing Suite</span>
//             </button>
//             <div className="border-t border-neutral-200 my-1" />
//             <button
//               onClick={() => {
//                 try { authLogout(); } catch (e) {}
//                 try { workspaceLogout(); } catch (e) {}
//               }}
//               className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-655 hover:bg-red-50 transition"
//             >
//               <LogOut className="h-3.5 w-3.5" />
//               <span>SSO Disconnect</span>
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Main Menus */}
//       <div className="flex-1 overflow-y-auto sidebar-scrollbar px-5 py-3 space-y-1">
//         {filteredNavMenu.map((item) => (
//           <div key={item.label} className="space-y-1">
//             <button
//               type="button"
//               className={`flex w-full justify-between gap-3 rounded-lg px-4 py-3 text-xs font-semibold transition ${
//                 isSectionActive(item)
//                   ? 'bg-neutral-100 text-neutral-900 border border-neutral-200 font-bold'
//                   : 'text-neutral-600 hover:bg-neutral-50'
//               }`}
//               onClick={() => toggleSection(item.label, item.path)}
//             >
//               <span className="flex gap-3 font-semibold text-neutral-800 items-center">
//                 <item.icon className="h-4 w-4 text-neutral-500" />
//                 {item.label}
//               </span>
//               <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${openSections[item.label] ? 'rotate-180' : 'rotate-0'}`} />
//             </button>

//             <div className={`${openSections[item.label] ? 'block' : 'hidden'} space-y-1 pt-2`}>
//               {item.subItems?.map((sub) => (
//                 <MenuItem key={sub.path} icon={sub.icon} label={sub.label} path={sub.path} onClick={onClose} nested />
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Footer SSO info */}
//       <div className="flex-none p-5 border-t border-neutral-200 bg-neutral-50">
//         <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-neutral-200">
//           <div className="flex items-center gap-2">
//             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
//             <span className="text-xs font-semibold text-emerald-600">SSO secured</span>
//           </div>
//           <button
//             onClick={() => {
//               try { authLogout(); } catch (e) {}
//               try { workspaceLogout(); } catch (e) {}
//             }}
//             className="p-1.5 text-neutral-500 hover:text-red-655 hover:bg-red-50 rounded-lg transition"
//             title="Log Out of SSO"
//           >
//             <LogOut className="h-4 w-4" />
//           </button>
//         </div>
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;


"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Command, LogOut } from "lucide-react";
import MenuItem from "./MenuItem";
import NotificationBell from "./NotificationBell";
import { navMenu } from "../lib/menu";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWorkspace } from '../lib/workspaceContext';
import { usePermissions } from "@/lib/auth/PermissionsContext";
import { MODULE_PERMISSION_MAP } from "@/lib/auth/rbac";


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

const createEmptyModuleAccess = () => {
  const access = {};
  MODULE_ACCESS_OPTIONS.forEach((item) => {
    access[item.module] = {};
    item.options.forEach((option) => {
      access[item.module][option] = [];
    });
  });
  return access;
};

const setOptionActions = (access, moduleName, optionName, actions) => ({
  ...access,
  [moduleName]: {
    ...(access[moduleName] || {}),
    [optionName]: actions,
  },
});

const getDefaultModuleAccessByRole = (role) => {
  let access = createEmptyModuleAccess();

  const giveModuleActions = (moduleName, actions = ["VIEW", "EDIT"]) => {
    const moduleData = MODULE_ACCESS_OPTIONS.find(
      (item) => item.module === moduleName
    );

    moduleData?.options.forEach((optionName) => {
      access = setOptionActions(access, moduleName, optionName, actions);
    });
  };

  if (role === "HR") {
    giveModuleActions("HR", ["VIEW", "EDIT"]);
  }

  if (role === "STUDENT") {
    giveModuleActions("Student CRM", ["VIEW", "EDIT"]);
  }

  if (role === "AGENT") {
    giveModuleActions("Agency CRM", ["VIEW", "EDIT"]);
  }

  if (role === "COUNSELLOR") {
    giveModuleActions("Marketing", ["VIEW"]);
    giveModuleActions("Student CRM", ["VIEW"]);
  }

  if (role === "ADMIN") {
    giveModuleActions("Marketing", ["VIEW", "EDIT"]);
    giveModuleActions("Student CRM", ["VIEW", "EDIT"]);
    giveModuleActions("Agency CRM", ["VIEW", "EDIT"]);
    giveModuleActions("Admin & Settings", ["VIEW", "EDIT"]);
  }

  if (role === "SUPER_ADMIN") {
    giveModuleActions("Marketing", ["VIEW", "EDIT"]);
    giveModuleActions("Student CRM", ["VIEW", "EDIT"]);
    giveModuleActions("Agency CRM", ["VIEW", "EDIT"]);
    giveModuleActions("HR", ["VIEW", "EDIT"]);
    giveModuleActions("Admin & Settings", ["VIEW", "EDIT"]);
  }

  return access;
};

const getPermissionOptionName = (subLabel) => {
  if (subLabel === "Users") return "User Management";
  if (subLabel === "Roles & Permissions") return "Roles";
  if (subLabel === "System Settings") return "Settings";
  if (subLabel === "Content Management") return "Settings";
  if (subLabel === "Branding") return "Settings";
  if (subLabel === "Recruitment") return "Recruitment Tracker";
  if (subLabel === "Leave") return "Leave Management";
  if (subLabel === "Performance") return "Performance Reviews";
  if (subLabel === "Payroll") return "Payroll Inputs";
  if (subLabel === "Overview") return "Employee Directory";
  if (subLabel === "Student Management") return "Student Management";
  return subLabel;
};

const hasConfiguredModuleAccess = (moduleAccess) => {
  if (!moduleAccess || typeof moduleAccess !== "object") return false;
  return Object.values(moduleAccess).some((options) =>
    Object.values(options || {}).some((actions) => Array.isArray(actions) && actions.length > 0)
  );
};

const filterSubItemsByModuleAccess = (item, access) =>
  item.subItems?.filter((sub) => {
    const optName = getPermissionOptionName(sub.label);
    if (optName === "Roles") {
      const hasRoles = access[item.label]?.["Roles"]?.length > 0;
      const hasPerms = access[item.label]?.["Permissions"]?.length > 0;
      return hasRoles || hasPerms;
    }
    return access[item.label]?.[optName]?.length > 0;
  }) || [];

const Sidebar = ({ sidebarOpen, onClose }) => {
  const location = usePathname() || "";
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeWorkspace, loginToWorkspace, logout: workspaceLogout } = useWorkspace();
  const { logout: authLogout } = useAuth();
  const { can, permissionMap } = usePermissions();

  // Navigation is filtered by the live, DB-backed permission map. Editing a
  // role in Admin Settings > Roles & Permissions updates what appears here.
  const filteredNavMenu = useMemo(() => {
    if (!user) return [];

    // A module is visible if the user has any permission mapped to it.
    // Items with no mapping (e.g. Dashboard) are visible to all authenticated users.
    const moduleVisible = (item) => {
      const required = MODULE_PERMISSION_MAP[item.label];
      if (!required) return true;
      return can(required);
    };

    // A sub-item may declare its own `permission`; otherwise inherits the module.
    const subVisible = (sub) => {
      if (sub.permission) return can(sub.permission);
      return true;
    };

    const role = user.role;

    // Super admin and RBAC-only users: sidebar follows permission map (can()).
    if (role === "SUPER_ADMIN" || !hasConfiguredModuleAccess(user.moduleAccess)) {
      return navMenu
        .filter(moduleVisible)
        .map((item) => ({
          ...item,
          subItems: item.subItems ? item.subItems.filter(subVisible) : undefined,
        }))
        .filter((item) => !item.subItems || item.subItems.length > 0);
    }

    const access = user.moduleAccess;

    return navMenu
      .filter(moduleVisible)
      .map((item) => {
        if (!item.subItems) return item;

        const moduleAccessSubItems = filterSubItemsByModuleAccess(item, access);
        if (moduleAccessSubItems.length === 0) return null;

        return {
          ...item,
          subItems: moduleAccessSubItems,
        };
      })
      .filter(Boolean);
  }, [user, can, permissionMap]);

  const sectionKeys = useMemo(
    () => filteredNavMenu.map((item) => item.label),
    [filteredNavMenu]
  );

  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    const activeSection = filteredNavMenu.find((item) =>
      location.startsWith(item.path)
    )?.label;

    if (activeSection) {
      setOpenSections(
        sectionKeys.reduce((acc, key) => {
          acc[key] = key === activeSection;
          return acc;
        }, {})
      );
    }
  }, [location, filteredNavMenu, sectionKeys]);

  const isSectionActive = (item) =>
    location === item.path ||
    item.subItems?.some((sub) => location.startsWith(sub.path));

  const toggleSection = (label, path) => {
    setOpenSections((prev) => {
      const isOpen = prev[label];

      return sectionKeys.reduce((acc, key) => {
        acc[key] = key === label ? !isOpen : false;
        return acc;
      }, {});
    });

    if (path) {
      router.push(path);
    }
  };

  const handleLogout = () => {
    logout?.();
    router.push("/login");
    localStorage.clear();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-[288px] min-w-[288px] max-w-[288px] flex-none transform flex-col border-r border-neutral-200 bg-white text-neutral-800 transition-transform duration-300 h-screen flex ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
    >
      <div className="flex-none p-5 pb-3">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900">
              <Command className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">ONECRM</p>
              <p className="text-xs text-neutral-500 truncate">Role based access</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-2 flex-none">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <p className="text-xs text-neutral-500">Logged in as</p>
          <p className="text-sm font-medium text-neutral-900 mt-0.5">
            {user?.role || "User"}
          </p>
          <p className="text-xs text-neutral-500 mt-1 truncate">
            {user?.fullName || user?.email}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scrollbar px-5 py-3 space-y-1">
        {filteredNavMenu.map((item) => (
          <div key={item.label} className="space-y-1">
            <button
              type="button"
              className={`flex w-full justify-between gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${isSectionActive(item)
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-50"
                }`}
              onClick={() => toggleSection(item.label, item.path)}
            >
              <span className="flex gap-3 text-neutral-800 items-center">
                <item.icon className="h-4 w-4 text-neutral-500" />
                {item.label}
              </span>

              <ChevronDown
                className={`h-4 w-4 text-neutral-400 transition-transform ${openSections[item.label] ? "rotate-180" : "rotate-0"
                  }`}
              />
            </button>

            <div
              className={`${openSections[item.label] ? "block" : "hidden"
                } space-y-1 pt-2`}
            >
              {item.subItems?.map((sub) => (
                <MenuItem
                  key={sub.path}
                  icon={sub.icon}
                  label={sub.label}
                  path={sub.path}
                  onClick={onClose}
                  nested
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-none p-5 border-t border-neutral-200 bg-neutral-50">
        <button
          onClick={() => {
            handleLogout();
            try { authLogout(); } catch (e) { }
            try { workspaceLogout(); } catch (e) { }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white p-3 border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;