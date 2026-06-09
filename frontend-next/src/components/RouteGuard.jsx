'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ShieldX } from 'lucide-react';

/**
 * Maps URL path prefixes to their module and option names in the permission system.
 * This is the ONLY place path-to-permission mapping lives on the frontend.
 */
const ROUTE_PERMISSION_MAP = [
  // Marketing
  { path: '/marketing/lead-management', module: 'Marketing', option: 'Lead Management' },
  { path: '/marketing/campaigns', module: 'Marketing', option: 'Campaigns' },
  { path: '/marketing/automation', module: 'Marketing', option: 'Automation' },
  { path: '/marketing/landing-pages-forms', module: 'Marketing', option: 'Landing Pages & Forms' },
  { path: '/marketing/marketing-analytics', module: 'Marketing', option: 'Marketing Analytics' },
  { path: '/marketing', module: 'Marketing', option: null }, // any marketing sub-option

  // Student CRM
  { path: '/student-crm/student-management', module: 'Student CRM', option: 'Student Management' },
  { path: '/student-crm/applications', module: 'Student CRM', option: 'Applications' },
  { path: '/student-crm/visa-management', module: 'Student CRM', option: 'Visa Management' },
  { path: '/student-crm/counselling', module: 'Student CRM', option: 'Counselling' },
  { path: '/student-crm', module: 'Student CRM', option: null },

  // Agency CRM
  { path: '/agency-crm/agency-management', module: 'Agency CRM', option: 'Agency Management' },
  { path: '/agency-crm/agency-leads', module: 'Agency CRM', option: 'Agency Leads' },
  { path: '/agency-crm/co-branding-tools', module: 'Agency CRM', option: 'Co-branding Tools' },
  { path: '/agency-crm/commission-management', module: 'Agency CRM', option: 'Commission Management' },
  { path: '/agency-crm', module: 'Agency CRM', option: null },

  // HR
  { path: '/hr/employee-directory', module: 'HR', option: 'Employee Directory' },
  { path: '/hr/attendance', module: 'HR', option: 'Attendance' },
  { path: '/hr/leave-management', module: 'HR', option: 'Leave Management' },
  { path: '/hr/payroll-inputs', module: 'HR', option: 'Payroll Inputs' },
  { path: '/hr/performance-reviews', module: 'HR', option: 'Performance Reviews' },
  { path: '/hr/recruitment-tracker', module: 'HR', option: 'Recruitment Tracker' },
  { path: '/hr', module: 'HR', option: null },

  // Admin & Settings
  { path: '/admin-settings/users', module: 'Admin & Settings', option: 'User Management' },
  { path: '/admin-settings/roles-permissions', module: 'Admin & Settings', option: 'Roles' },
  { path: '/admin-settings/system-settings', module: 'Admin & Settings', option: 'Settings' },
  { path: '/admin-settings/content-management', module: 'Admin & Settings', option: 'Settings' },
  { path: '/admin-settings/branding', module: 'Admin & Settings', option: 'Settings' },
  { path: '/admin-settings', module: 'Admin & Settings', option: null },
];

/**
 * Checks if the user has access to the current route based on moduleAccess.
 */
function hasRouteAccess(pathname, user) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;

  const access = user.moduleAccess;
  if (!access || Object.keys(access).length === 0) return true; // fallback: don't block if no permissions stored yet

  // Find the matching route rule (most specific first since array is ordered specific→general)
  const rule = ROUTE_PERMISSION_MAP.find((r) => pathname.startsWith(r.path));
  if (!rule) return true; // no rule means route is not permission-protected

  const moduleData = access[rule.module];
  if (!moduleData) return false; // module not in user's access → blocked

  if (rule.option === null) {
    // Module-level check: at least one option must have any action
    return Object.values(moduleData).some(
      (actions) => Array.isArray(actions) && actions.length > 0
    );
  }

  // Specific option check
  const actions = moduleData[rule.option];
  return Array.isArray(actions) && actions.length > 0;
}

const AccessDenied = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
        <ShieldX className="h-10 w-10 text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
      <p className="text-sm text-slate-500 mb-6">
        You don&apos;t have permission to access this page. Please contact your administrator to request access.
      </p>
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
      >
        Go Back
      </button>
    </div>
  </div>
);

const RouteGuard = ({ children }) => {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const allowed = useMemo(() => {
    if (loading || !user) return true; // still loading, don't block
    return hasRouteAccess(pathname, user);
  }, [pathname, user, loading]);

  if (!allowed) return <AccessDenied />;

  return <>{children}</>;
};

export default RouteGuard;
