
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Command, LogOut, Menu, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import MenuItem from "./MenuItem";
import { AppBrand, AppLogo } from "./AppBrand";
import { navMenu } from "../lib/menu";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissions } from "@/lib/auth/PermissionsContext";
import { MODULE_PERMISSION_MAP, MODULE_KEY_MAP } from "@/lib/auth/rbac";
import {
  SIDEBAR_OPEN,
  SIDEBAR_COLLAPSED,
} from "@/lib/layout-shell";

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
    Object.values(options || {}).some(
      (actions) => Array.isArray(actions) && actions.length > 0
    )
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

const Sidebar = ({ sidebarOpen, onClose, onToggleSidebar }) => {
  const location = usePathname() || "";
  const router = useRouter();

  const { user } = useAuth();
  const { can, permissionMap } = usePermissions();

  const [openSections, setOpenSections] = useState({});
  const [flyoutMenu, setFlyoutMenu] = useState(null);
  const flyoutCloseTimer = useRef(null);

  const filteredNavMenu = useMemo(() => {
    if (!user) return [];
    if (user.role === "STUDENT") return [];
    if (user.role === "SUPER_ADMIN") return [];

    const enabledModules = Array.isArray(user.enabledModules)
      ? new Set(user.enabledModules)
      : new Set();

    const tenantAllows = (item) => {
      const moduleKey = MODULE_KEY_MAP[item.label];
      if (!moduleKey) return true;
      return enabledModules.has(moduleKey);
    };

    const moduleVisible = (item) => {
      if (!tenantAllows(item)) return false;

      const required = MODULE_PERMISSION_MAP[item.label];
      if (!required) return true;

      return can(required);
    };

    const subVisible = (sub) => {
      if (sub.permission) return can(sub.permission);
      return true;
    };

    if (!hasConfiguredModuleAccess(user.moduleAccess)) {
      return navMenu
        .filter(moduleVisible)
        .map((item) => ({
          ...item,
          subItems: item.subItems
            ? item.subItems.filter(subVisible)
            : undefined,
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

  useEffect(() => {
    if (sidebarOpen) {
      setFlyoutMenu(null);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    return () => {
      if (flyoutCloseTimer.current) {
        clearTimeout(flyoutCloseTimer.current);
      }
    };
  }, []);

  const isSectionActive = (item) =>
    location === item.path ||
    item.subItems?.some((sub) => location.startsWith(sub.path));

  const toggleSection = (label) => {
    setOpenSections((prev) => {
      const isOpen = prev[label];

      return sectionKeys.reduce((acc, key) => {
        acc[key] = key === label ? !isOpen : false;
        return acc;
      }, {});
    });
  };

  const openFlyout = (item, e) => {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current);
    }

    const rect = e.currentTarget.getBoundingClientRect();

    setFlyoutMenu({
      label: item.label,
      subItems: item.subItems,
      top: Math.max(8, rect.top - 8),
    });
  };

  const closeFlyoutWithDelay = () => {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current);
    }

    flyoutCloseTimer.current = setTimeout(() => {
      setFlyoutMenu(null);
    }, 150);
  };

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-30 flex h-screen flex-col overflow-hidden border-r border-neutral-200/70 bg-white text-neutral-800 transition-[width] duration-200 ease-out"
        style={{
          width: sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_COLLAPSED,
        }}
      >

        <div className="flex-none p-5 pb-3">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900">
                <Command className="h-4 w-4" />
              </div>


              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">
                    ONECRM
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    Role based access
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* <button
          type="button"
          onClick={onToggleSidebar}
          className=" inline-flex pl-8 h-15 w-15 shrink-0 items-center rounded-xl text-slate-700 cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {sidebarOpen && (
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
        )} */}

        <div className="flex items-center justify-between gap-2  px-4 py-2">
          {/* User Info */}
          {sidebarOpen && (
            <div className="ml-4 flex-1">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-5 py-1">
                <p className="text-xs text-neutral-500">Logged in as</p>
                <p className="text-sm font-medium text-neutral-900">
                  {user?.role || "User"}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user?.fullName || user?.email}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-12 w-12 items-center ml-1.5 justify-center rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>

        <div
          className={`
            flex-1 overflow-y-auto sidebar-scrollbar py-3 space-y-1
            ${sidebarOpen ? "px-3" : "px-2"}
          `}
        >
          {filteredNavMenu.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.label} className="space-y-1">

                {hasSubItems ? (
                  <>
                    <button
                      type="button"
                      title={!sidebarOpen ? (item.displayLabel || item.label) : ""}
                      className={`
                        flex w-full items-center rounded-xl text-[13px] font-medium transition
                        ${sidebarOpen
                          ? "justify-between gap-3 px-3 py-2.5"
                          : "justify-center p-2.5"
                        }
                        ${isSectionActive(item)
                          ? "bg-brand-soft text-brand"
                          : "text-slate-600 hover:bg-brand-soft/60"
                        }
                      `}
                      onMouseEnter={(e) => {
                        if (!sidebarOpen) {
                          openFlyout(item, e);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!sidebarOpen) {
                          closeFlyoutWithDelay();
                        }
                      }}
                      // onClick={() => {
                      //   if (!sidebarOpen) return;

                      //   if (item.label === "Marketing" && item.path) {
                      //     router.push(item.path);
                      //   }

                      //   toggleSection(item.label);
                      // }}

                      onClick={() => {
                        if (!sidebarOpen) {
                          if (item.path) {
                            router.push(item.path);
                            setFlyoutMenu(null);
                          }
                          return;
                        }

                        if (item.path) {
                          router.push(item.path);
                        }

                        toggleSection(item.label);
                      }}
                    >
                      <span className="flex items-center gap-3 text-neutral-800">
                        <item.icon className="h-4 w-4 shrink-0 text-neutral-500" />
                        {sidebarOpen && <span>{item.displayLabel || item.label}</span>}
                      </span>

                      {sidebarOpen && (
                        <ChevronDown
                          className={`h-4 w-4 text-neutral-400 transition-transform ${openSections[item.label]
                            ? "rotate-180"
                            : "rotate-0"
                            }`}
                        />
                      )}
                    </button>

                    {sidebarOpen && (
                      <div
                        className={`${openSections[item.label] ? "block" : "hidden"
                          } space-y-1 pt-2`}
                      >
                        {item.subItems.map((sub) => (
                          <MenuItem
                            key={sub.path}
                            icon={sub.icon}
                            label={sub.label}
                            path={sub.path}
                            nested
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    title={!sidebarOpen ? (item.displayLabel || item.label) : ""}
                    className={`
                      flex w-full items-center rounded-xl text-[13px] font-medium transition
                      ${sidebarOpen
                        ? "gap-3 px-3 py-2.5"
                        : "justify-center p-2.5"
                      }
                      ${location === item.path
                        ? "bg-brand-soft text-brand"
                        : "text-slate-600 hover:bg-brand-soft/60"
                      }
                    `}
                    onClick={() => {
                      router.push(item.path);
                    }}
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-neutral-500" />
                    {sidebarOpen && <span>{item.displayLabel || item.label}</span>}
                  </button>
                )}
              </div>
            );
          })}
        </div>


        {/* <div className="flex-none w-full border-t border-neutral-200 bg-neutral-10 px-4 py-4">
          <div className="mx-auto flex max-w-[220px] flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold text-neutral-700">
              Created by AUN Tech Consulting
            </p>

            <p className="mt-1 text-[11px] text-neutral-500">
              Version 3.3.1
            </p>

            <p className="text-[10px] leading-4 text-neutral-400">
              Optimised Services & Performance Enhancements
            </p>
          </div>
        </div> */}

        {sidebarOpen &&
          <div className="flex-none w-full border-t border-neutral-200 bg-neutral-10 px-4 py-4">
            <div className="mx-auto flex max-w-[220px] flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold text-neutral-700">
                Created by AUN Tech Consulting
              </p>

              <p className="mt-1 text-[11px] text-neutral-500">
                Version 3.3.1
              </p>

              <p className="text-[10px] leading-4 text-neutral-400">
                Optimised Services & Performance Enhancements
              </p>
            </div>
          </div>

        }

        <div className="flex-none p-5 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={() => {
              handleLogout();

              try {
                authLogout();
              } catch (e) { }

              try {
                workspaceLogout();
              } catch (e) { }
            }}
            title={!sidebarOpen ? "Logout" : ""}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white p-3 border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {flyoutMenu && !sidebarOpen && (
        <div
          className="fixed z-50 min-w-[240px] rounded-xl border border-neutral-200 bg-white p-2 shadow-xl "
          style={{
            left: `${SIDEBAR_COLLAPSED + 8}px`,
            top: `${flyoutMenu.top}px`,
          }}
          onMouseEnter={() => {
            if (flyoutCloseTimer.current) {
              clearTimeout(flyoutCloseTimer.current);
            }
          }}
          onMouseLeave={() => {
            setFlyoutMenu(null);
          }}
        >
          <p className="px-3 py-2 text-xs font-semibold text-neutral-400">
            {flyoutMenu.label}
          </p>

          <div className="space-y-1">
            {flyoutMenu.subItems.map((sub) => (
              <button
                key={sub.path}
                type="button"
                onClick={() => {
                  router.push(sub.path);
                  setFlyoutMenu(null);
                }}
                className={` cursor-pointer
                  flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition
                  ${location.startsWith(sub.path)
                    ? "bg-brand-soft text-brand"
                    : "text-slate-600 hover:bg-brand-soft/60"
                  }
                `}
              >
                {sub.icon && (
                  <sub.icon className="h-4 w-4 shrink-0 text-neutral-500" />
                )}
                <span>{sub.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;