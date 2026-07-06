"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
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
        className="fixed inset-y-0 left-0 z-30 flex h-screen flex-col border-r border-[var(--ui-border)] bg-white transition-[width] duration-200 ease-out"
        style={{
          width: sidebarOpen ? "var(--ui-sidebar-open)" : "var(--ui-sidebar-collapsed)",
        }}
      >
        <div className="flex h-[var(--ui-header-height)] flex-none items-center border-b border-[var(--ui-border)] px-4">
          {sidebarOpen ? (
            <p className="text-[13px] font-medium tracking-[-0.01em] text-[var(--ui-text)]">OneCRM</p>
          ) : (
            <p className="mx-auto text-[13px] font-medium text-[var(--ui-text)]">O</p>
          )}
        </div>

        <div
          className={`flex-1 overflow-y-auto sidebar-scrollbar py-4 space-y-0.5 ${
            sidebarOpen ? "px-3" : "px-2"
          }`}
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
                        flex w-full items-center rounded-[var(--ui-radius)] py-2 text-[13px] transition
                        ${sidebarOpen ? "justify-between gap-2 px-3" : "justify-center px-0"}
                        ${isSectionActive(item)
                          ? "font-medium text-[var(--ui-text)] bg-[var(--ui-bg-page)]"
                          : "text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
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
                      <span className="flex items-center gap-2.5">
                        <item.icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
                        {sidebarOpen && <span>{item.label}</span>}
                      </span>

                      {sidebarOpen && (
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-[var(--ui-text-muted)] transition-transform ${
                            openSections[item.label] ? "rotate-180" : ""
                          }`}
                          strokeWidth={1.5}
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
                      flex w-full items-center rounded-[var(--ui-radius)] py-2 text-[13px] transition
                      ${sidebarOpen ? "gap-2.5 px-3" : "justify-center px-0"}
                      ${location === item.path
                        ? "font-medium text-[var(--ui-text)] bg-[var(--ui-bg-page)]"
                        : "text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                      }
                    `}
                    onClick={() => {
                      router.push(item.path);
                    }}
                  >
                    <item.icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-none border-t border-[var(--ui-border)] p-3">
          <button
            onClick={() => {
              handleLogout();
              try { authLogout(); } catch (e) { }
              try { workspaceLogout(); } catch (e) { }
            }}
            title={!sidebarOpen ? "Logout" : ""}
            className={`flex w-full items-center text-[13px] text-[var(--ui-text-muted)] transition hover:text-[var(--ui-text)] ${
              sidebarOpen ? "gap-2.5 px-3 py-2" : "justify-center py-2"
            }`}
          >
            <LogOut className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {flyoutMenu && !sidebarOpen && (
        <div
          className="fixed z-50 min-w-[200px] rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-white py-2"
          style={{
            left: "calc(var(--ui-sidebar-collapsed) + 8px)",
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
          <p className="px-3 pb-1 ui-text-caption">
            {flyoutMenu.label}
          </p>

          <div className="space-y-0.5 px-1">
            {flyoutMenu.subItems.map((sub) => (
              <button
                key={sub.path}
                type="button"
                onClick={() => {
                  router.push(sub.path);
                  setFlyoutMenu(null);
                }}
                className={`
                  flex w-full items-center gap-2.5 rounded-[var(--ui-radius)] px-3 py-2 text-[13px] transition
                  ${location.startsWith(sub.path)
                    ? "font-medium text-[var(--ui-text)]"
                    : "text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                  }
                `}
              >
                {sub.icon && (
                  <sub.icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
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