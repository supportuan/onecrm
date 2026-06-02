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
//       className={`fixed inset-y-0 left-0 z-30 w-[288px] min-w-[288px] max-w-[288px] flex-none transform flex-col border-r border-slate-200 bg-white text-slate-800 transition-transform duration-300 h-screen flex ${
//         sidebarOpen ? 'translate-x-0' : '-translate-x-full'
//       } lg:translate-x-0`}
//     >
//       {/* Brand Header */}
//       <div className="flex-none p-5 pb-3">
//         <div className="flex items-center gap-3 border-b border-slate-150 pb-4">
//           <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
//             <Command className="h-5 w-5" />
//           </div>
//           <div>
//             <p className="text-base font-bold text-slate-900">ONECRM</p>
//             <p className="text-xs font-medium text-slate-400">SSO integrated portal</p>
//           </div>
//         </div>
//       </div>

//       {/* Premium Workspace Switcher */}
//       <div className="px-5 py-2 flex-none relative">
//         <button
//           onClick={() => setSwitcherOpen(!switcherOpen)}
//           className="flex w-full items-center justify-between rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 px-3.5 py-2.5 transition text-left"
//         >
//           <div className="flex items-center gap-2.5">
//             <span className={`h-2 w-2 rounded-full animate-pulse ${activeWorkspace === 'hr' ? 'bg-indigo-600' : 'bg-violet-600'}`} />
//             <div>
//               <p className="text-xs font-semibold text-slate-500">Active workspace</p>
//               <p className="text-sm font-semibold text-slate-805 mt-0.5">
//                 {activeWorkspace === 'hr' ? 'HR Operations' : 'Marketing Suite'}
//               </p>
//             </div>
//           </div>
//           <ChevronDown className={`h-4 w-4 text-slate-450 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
//         </button>

//         {switcherOpen && (
//           <div className="absolute left-5 right-5 mt-2 z-50 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
//             <button
//               onClick={() => handleWorkspaceSwitch('hr')}
//               className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
//                 activeWorkspace === 'hr'
//                   ? 'bg-indigo-50 text-indigo-700 font-bold'
//                   : 'text-slate-600 hover:bg-slate-50'
//               }`}
//             >
//               <span className="h-2 w-2 rounded-full bg-indigo-600" />
//               <span>HR Operations</span>
//             </button>
//             <button
//               onClick={() => handleWorkspaceSwitch('marketing')}
//               className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
//                 activeWorkspace === 'marketing'
//                   ? 'bg-violet-50 text-violet-700 font-bold'
//                   : 'text-slate-600 hover:bg-slate-50'
//               }`}
//             >
//               <span className="h-2 w-2 rounded-full bg-violet-600" />
//               <span>Marketing Suite</span>
//             </button>
//             <div className="border-t border-slate-150 my-1" />
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
//               className={`flex w-full justify-between gap-3 rounded-2xl px-4 py-3 text-xs font-semibold transition ${
//                 isSectionActive(item)
//                   ? 'bg-indigo-50 text-indigo-700 border border-indigo-150 font-bold'
//                   : 'text-slate-600 hover:bg-slate-50'
//               }`}
//               onClick={() => toggleSection(item.label, item.path)}
//             >
//               <span className="flex gap-3 font-semibold text-slate-800 items-center">
//                 <item.icon className="h-4 w-4 text-slate-500" />
//                 {item.label}
//               </span>
//               <ChevronDown className={`h-4 w-4 text-slate-450 transition-transform ${openSections[item.label] ? 'rotate-180' : 'rotate-0'}`} />
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
//       <div className="flex-none p-5 border-t border-slate-150 bg-slate-50">
//         <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200">
//           <div className="flex items-center gap-2">
//             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
//             <span className="text-xs font-semibold text-emerald-600">SSO secured</span>
//           </div>
//           <button
//             onClick={() => {
//               try { authLogout(); } catch (e) {}
//               try { workspaceLogout(); } catch (e) {}
//             }}
//             className="p-1.5 text-slate-400 hover:text-red-655 hover:bg-red-50 rounded-lg transition"
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
import { navMenu } from "../lib/menu";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWorkspace } from '../lib/workspaceContext';


const Sidebar = ({ sidebarOpen, onClose }) => {
  const location = usePathname() || "";
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeWorkspace, loginToWorkspace, logout: workspaceLogout } = useWorkspace();
  const { logout: authLogout } = useAuth();

  const filteredNavMenu = useMemo(() => {
    if (!user) return [];

    const role = user.role;

    if (role === "SUPER_ADMIN") {
      return navMenu;
    }

    if (role === "ADMIN") {
      return navMenu.filter((item) =>
        ["Marketing", "Student CRM", "Agency CRM", "HR", "Admin & Settings"].includes(
          item.label
        )
      );
    }

    if (role === "HR") {
      return navMenu.filter((item) => item.label === "HR");
    }

    if (role === "COUNSELLOR") {
      return navMenu.filter((item) =>
        ["Marketing", "Student CRM"].includes(item.label)
      );
    }

    if (role === "AGENT") {
      return navMenu.filter((item) =>
        ["Agency CRM", "Student CRM"].includes(item.label)
      );
    }

    if (role === "STUDENT") {
      return navMenu.filter((item) => item.label === "Student CRM");
    }

    return [];
  }, [user]);

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
    localStorage.clear();  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-[288px] min-w-[288px] max-w-[288px] flex-none transform flex-col border-r border-slate-200 bg-white text-slate-800 transition-transform duration-300 h-screen flex ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      <div className="flex-none p-5 pb-3">
        <div className="flex items-center gap-3 border-b border-slate-150 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
            <Command className="h-5 w-5" />
          </div>

          <div>
            <p className="text-base font-bold text-slate-900">ONECRM</p>
            <p className="text-xs font-medium text-slate-400">
              Role Based Access Portal
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-2 flex-none">
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5">
          <p className="text-xs font-semibold text-slate-500">Logged in as</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">
            {user?.role || "User"}
          </p>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {user?.fullName || user?.email}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scrollbar px-5 py-3 space-y-1">
        {filteredNavMenu.map((item) => (
          <div key={item.label} className="space-y-1">
            <button
              type="button"
              className={`flex w-full justify-between gap-3 rounded-2xl px-4 py-3 text-xs font-semibold transition ${
                isSectionActive(item)
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-150 font-bold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => toggleSection(item.label, item.path)}
            >
              <span className="flex gap-3 font-semibold text-slate-800 items-center">
                <item.icon className="h-4 w-4 text-slate-500" />
                {item.label}
              </span>

              <ChevronDown
                className={`h-4 w-4 text-slate-450 transition-transform ${
                  openSections[item.label] ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            <div
              className={`${
                openSections[item.label] ? "block" : "hidden"
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

      <div className="flex-none p-5 border-t border-slate-150 bg-slate-50">
        <button
           onClick={() => {
              handleLogout();
              try { authLogout(); } catch (e) {}
              try { workspaceLogout(); } catch (e) {}
            }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white p-3 border border-slate-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;