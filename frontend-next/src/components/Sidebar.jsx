


"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import MenuItem from "./MenuItem";
import { navMenu } from "../lib/menu";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissions } from "@/lib/auth/PermissionsContext";
import { MODULE_PERMISSION_MAP } from "@/lib/auth/rbac";
import { isAgencyPartnerRole } from "@/features/agency-crm/agentPortal";
import { SIDEBAR_COLLAPSED, SIDEBAR_OPEN } from "@/lib/layout-shell";
import { SidebarBrandHeader } from "@/components/AppBrand";
import { MODULE_CRIMSON } from "@/lib/module-themes";

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
  if (subLabel === "Overview") return "Overview";
  if (subLabel === "Student Management") return "Student Management";
  if (subLabel === "Student Information Hub") return "Student Management";
  if (subLabel === "Student Alliance") return "Student Management";
  if (subLabel === "Student Information Hub") return "Student Management";
  if (subLabel === "Application Tracking") return "Applications";
  if (subLabel === "Application Tracking System") return "Applications";
  if (subLabel === "Opportunity Tracking") return "Lead Management";
  if (subLabel === "Campaign Mission") return "Campaigns";
  if (subLabel === "Revenue Intelligence") return "Marketing Analytics";
  if (subLabel === "Knowledge Library") return "Resource Library";
  if (subLabel === "Manage Knowledge") return "Manage Resources";
  if (subLabel === "Upload Knowledge") return "Manage Resources";
  if (subLabel === "Students & Referrals") return "Agency Leads";
  if (subLabel === "My Students") return "Agency Leads";

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
    const accessKey = item.accessKey || item.label;

    if (accessKey === "Marketing" && sub.label === "Dashboard") {
      return Object.values(access[accessKey] || {}).some(
        (actions) => Array.isArray(actions) && actions.length > 0
      );
    }

    if (optName === "Roles") {
      const hasRoles = access[accessKey]?.["Roles"]?.length > 0;
      const hasPerms = access[accessKey]?.["Permissions"]?.length > 0;
      return hasRoles || hasPerms;
    }

    return access[accessKey]?.[optName]?.length > 0;
  }) || [];

const Sidebar = ({ sidebarOpen, onToggleSidebar }) => {
  const location = usePathname() || "";
  const router = useRouter();

  const { user } = useAuth();
  const { can } = usePermissions();

  const [openSections, setOpenSections] = useState({});
  const [flyoutMenu, setFlyoutMenu] = useState(null);
  const flyoutCloseTimer = useRef(null);

  const filteredNavMenu = useMemo(() => {
    if (!user) return [];

    const isAgent = isAgencyPartnerRole(user.role);

    const moduleVisible = (item) => {
      const accessKey = item.accessKey || item.label;
      const required = MODULE_PERMISSION_MAP[accessKey];
      if (!required) return true;

      const configuredOptions = user.moduleAccess?.[accessKey];
      const hasExplicitModuleAccess =
        configuredOptions &&
        Object.values(configuredOptions).some(
          (actions) => Array.isArray(actions) && actions.length > 0
        );
      if (hasExplicitModuleAccess) return true;

      return can(required);
    };

    const audienceAllows = (sub) => {
      const audience = sub.audience || "all";
      if (audience === "all") return true;
      if (audience === "admin") return !isAgent;
      if (audience === "agent") return isAgent;
      return true;
    };

    const subVisible = (sub) => {
      if (!audienceAllows(sub)) return false;
      if (sub.permission) return can(sub.permission);
      return true;
    };

    const withAgentLabels = (item) => {
      if (!isAgent) return item;
      return {
        ...item,
        displayLabel: item.agentDisplayLabel || item.displayLabel || item.label,
        path: item.accessKey === "Agency CRM" ? "/agency-crm/agency-leads" : item.path,
        subItems: item.subItems?.map((sub) => ({
          ...sub,
          label: sub.agentLabel || sub.label,
        })),
      };
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
        .filter((item) => !item.subItems || item.subItems.length > 0)
        .map(withAgentLabels);
    }

    const access = user.moduleAccess;

    return navMenu
      .filter(moduleVisible)
      .map((item) => {
        if (!item.subItems) return withAgentLabels(item);

        let moduleAccessSubItems = filterSubItemsByModuleAccess(item, access)
          .filter(audienceAllows);

        // Knowledge Hub / HR are permission-driven for staff. Existing users may
        // predate moduleAccess entries, so merge any permitted sidebar links.
        // Keep navMenu order (e.g. My HR between Employee Directory and Recruitment).
        if (item.accessKey === "Resources" || item.accessKey === "HR") {
          const allowedPaths = new Set([
            ...moduleAccessSubItems.map((sub) => sub.path),
            ...item.subItems.filter(subVisible).map((sub) => sub.path),
          ]);
          moduleAccessSubItems = item.subItems.filter((sub) =>
            allowedPaths.has(sub.path)
          );
        }

        if (item.label === "Connector") {
          moduleAccessSubItems = item.subItems.filter(subVisible);
        }

        if (moduleAccessSubItems.length === 0) return null;

        return withAgentLabels({
          ...item,
          subItems: moduleAccessSubItems,
        });
      })
      .filter(Boolean);
  }, [user, can]);

  const sectionKeys = useMemo(
    () => filteredNavMenu.map((item) => item.label),
    [filteredNavMenu]
  );

  useEffect(() => {
    const activeSection = filteredNavMenu.find((item) =>
      location.startsWith(item.path)
    )?.label;

    if (activeSection) {
      const frame = requestAnimationFrame(() => {
        setOpenSections(
          sectionKeys.reduce((acc, key) => {
            acc[key] = key === activeSection;
            return acc;
          }, {})
        );
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [location, filteredNavMenu, sectionKeys]);

  useEffect(() => {
    if (sidebarOpen) {
      const frame = requestAnimationFrame(() => setFlyoutMenu(null));
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
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
      path: item.path,
      subItems: item.subItems,
      navTheme: item.navTheme,
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
        className="app-sidebar-with-waves fixed inset-y-0 left-0 z-30 flex h-screen flex-col overflow-hidden bg-white text-neutral-800 transition-[width] duration-200 ease-out"
        style={{ width: sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_COLLAPSED }}
      >
        <div className="app-sidebar-wave-blobs" aria-hidden="true">
          <svg viewBox="0 0 240 320" preserveAspectRatio="none">
            <path
              className="app-wave-blob-primary"
              d="M0 132C43 89 85 160 128 116C171 72 197 104 240 58V320H0V132Z"
            />
            <path
              className="app-wave-blob-secondary"
              d="M0 196C48 148 92 226 145 174C190 130 216 165 240 142V320H0V196Z"
            />
          </svg>
        </div>
        <SidebarBrandHeader sidebarOpen={sidebarOpen} onToggleSidebar={onToggleSidebar} />

        <nav
          className={`flex-1 overflow-y-auto sidebar-scrollbar py-3 ${
            sidebarOpen ? "px-3" : "px-2"
          }`}
        >
          <div className="space-y-1">
          {filteredNavMenu.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const sectionActive = isSectionActive(item);
            const isCrimson = item.navTheme === "crimson";
            const leafActive = location === item.path || location.startsWith(`${item.path}/`);

            const navIdle = isCrimson
              ? "text-slate-600 hover:bg-[var(--module-crimson-soft)] hover:text-[var(--module-crimson)]"
              : "text-[#1c1c1c] hover:bg-brand-soft hover:text-brand";
            const navActive = isCrimson
              ? "bg-[var(--module-crimson)] text-white shadow-sm"
              : "app-nav-item-active bg-brand text-white";
            const iconIdle = isCrimson
              ? "text-slate-400 group-hover:text-[var(--module-crimson)]"
              : "text-slate-400 group-hover:text-brand";

            return (
              <div key={item.label} className="space-y-1">
                {hasSubItems ? (
                  <>
                    <button
                      type="button"
                      title={!sidebarOpen ? (item.displayLabel || item.label) : ""}
                      className={`
                        app-nav-item group flex w-full items-center rounded-xl text-[13px] font-medium
                        ${sidebarOpen
                          ? "justify-between gap-3 px-3 py-2.5"
                          : "justify-center p-2.5"
                        }
                        ${sectionActive ? navActive : navIdle}
                      `}
                      style={
                        sectionActive && isCrimson
                          ? { backgroundColor: MODULE_CRIMSON }
                          : undefined
                      }
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
                      <span className="flex min-w-0 items-center gap-3">
                        <item.icon
                          className={`h-[17px] w-[17px] shrink-0 ${
                            sectionActive ? "text-white" : iconIdle
                          }`}
                          strokeWidth={1.75}
                        />
                        {sidebarOpen && <span className="truncate">{item.displayLabel || item.label}</span>}
                      </span>

                      {sidebarOpen && (
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            sectionActive ? "text-white/70" : "text-neutral-400"
                          } ${openSections[item.label]
                            ? "rotate-180"
                            : "rotate-0"
                            }`}
                        />
                      )}
                    </button>

                    {sidebarOpen && (
                      <div
                        className={`${openSections[item.label] ? "block" : "hidden"
                          } space-y-1 pb-1 pt-1`}
                      >
                        {item.subItems.map((sub) => (
                          <MenuItem
                            key={sub.path}
                            icon={sub.icon}
                            label={sub.label}
                            path={sub.path}
                            nested
                            exact={sub.path === item.path}
                            charcoal={!isCrimson}
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
                      app-nav-item group flex w-full items-center rounded-xl text-[13px] font-medium
                      ${sidebarOpen
                        ? "gap-3 px-3 py-2.5"
                        : "justify-center p-2.5"
                      }
                      ${leafActive ? navActive : navIdle}
                    `}
                    style={
                      leafActive && isCrimson
                        ? { backgroundColor: MODULE_CRIMSON }
                        : undefined
                    }
                    onClick={() => {
                      router.push(item.path);
                    }}
                  >
                    <item.icon
                      className={`h-[17px] w-[17px] shrink-0 ${
                        leafActive ? "text-white" : iconIdle
                      }`}
                      strokeWidth={1.75}
                    />
                    {sidebarOpen && <span className="truncate">{item.displayLabel || item.label}</span>}
                  </button>
                )}
              </div>
            );
          })}
          </div>
        </nav>

        {sidebarOpen ? (
          <div className="relative z-[1] flex-none border-t border-neutral-100/80 px-3 py-3">
            <p className="text-[10px] font-semibold leading-snug text-neutral-500">
              © AUNTech (V 3.3.1)
            </p>
            <p className="mt-0.5 text-[10px] font-medium leading-snug text-neutral-400">
              Optimized services &amp; performance enhancements.
            </p>
          </div>
        ) : null}
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
          <p className={`px-3 py-2 text-xs font-semibold ${
            flyoutMenu.navTheme === "crimson" ? "text-neutral-400" : "text-[#1c1c1c]"
          }`}>
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
                  flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition
                  ${location === sub.path ||
                    (sub.path !== flyoutMenu.path && location.startsWith(`${sub.path}/`))
                    ? "bg-brand text-white"
                    : flyoutMenu.navTheme === "crimson"
                      ? "text-slate-600 hover:bg-[var(--module-crimson-soft)] hover:text-[var(--module-crimson)]"
                      : "text-[#1c1c1c] hover:bg-brand-soft hover:text-brand"
                  }
                `}
              >
                {sub.icon && (
                  <sub.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
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