"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Command, LogOut } from "lucide-react";
import MenuItem from "./MenuItem";
import { navMenu } from "../lib/menu";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWorkspace } from "../lib/workspaceContext";
import { usePermissions } from "@/lib/auth/PermissionsContext";
import { MODULE_PERMISSION_MAP, MODULE_KEY_MAP } from "@/lib/auth/rbac";

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

const Sidebar = ({ sidebarOpen, onClose }) => {
  const location = usePathname() || "";
  const router = useRouter();

  const { user, logout } = useAuth();
  const { logout: workspaceLogout } = useWorkspace();
  const { logout: authLogout } = useAuth();
  const { can, permissionMap } = usePermissions();

  const [openSections, setOpenSections] = useState({});
  const [flyoutMenu, setFlyoutMenu] = useState(null);
  const flyoutCloseTimer = useRef(null);

  const filteredNavMenu = useMemo(() => {
    if (!user) return [];
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

  const handleLogout = () => {
    logout?.();
    router.push("/login");
    localStorage.clear();
  };

  return (
    <>
      <aside
        className="
          fixed inset-y-0 left-0 z-30 flex h-screen flex-col
          border-r border-neutral-200 bg-white text-neutral-800
          transition-[width] duration-300 ease-in-out
        "
        style={{
          width: sidebarOpen ? "288px" : "80px",
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
        )}

        <div
          className={`
            flex-1 overflow-y-auto sidebar-scrollbar py-3 space-y-1
            ${sidebarOpen ? "px-5" : "px-3"}
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
                      title={!sidebarOpen ? item.label : ""}
                      className={`
                        flex w-full items-center rounded-lg py-2.5 text-xs font-medium transition
                        ${sidebarOpen
                          ? "justify-between gap-3 px-3"
                          : "justify-center px-2"
                        }
                        ${isSectionActive(item)
                          ? "bg-neutral-100 text-neutral-900"
                          : "text-neutral-600 hover:bg-neutral-50"
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
                        {sidebarOpen && <span>{item.label}</span>}
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
                    title={!sidebarOpen ? item.label : ""}
                    className={`
                      flex w-full items-center rounded-lg py-2.5 text-xs font-medium transition
                      ${sidebarOpen
                        ? "gap-3 px-3"
                        : "justify-center px-2"
                      }
                      ${location === item.path
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-50"
                      }
                    `}
                    onClick={() => {
                      router.push(item.path);
                    }}
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-neutral-500" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                )}
              </div>
            );
          })}
        </div>

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
          className="fixed z-50 min-w-[240px] rounded-xl border border-neutral-200 bg-white p-2 shadow-xl"
          style={{
            left: "88px",
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
                className={`
                  flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition
                  ${location.startsWith(sub.path)
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50"
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