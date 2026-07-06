'use client';

import { LogOut, Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import NotificationBell from './NotificationBell';

const getPageTitle = (pathname) => {
    if (pathname === '/marketing/lead-management') return 'Lead Management';
    if (pathname?.startsWith('/marketing/campaigns')) return 'Campaigns';
    if (pathname?.startsWith('/marketing/automation')) return 'Automation';
    if (pathname?.startsWith('/marketing/landing-pages-forms')) return 'Landing Pages';
    if (pathname?.startsWith('/marketing/marketing-analytics')) return 'Analytics';
    if (pathname === '/admin-settings/users') return 'Users';
    if (pathname === '/admin-settings/roles-permissions') return 'Roles';
    if (pathname?.startsWith('/marketing')) return 'Marketing';
    if (pathname?.startsWith('/notifications')) return 'Notifications';
    if (pathname?.startsWith('/hr/me')) return 'My Details';
    if (pathname?.startsWith('/hr/employee-directory')) return 'Employees';
    if (pathname?.startsWith('/hr/recruitment-tracker')) return 'Recruitment';
    if (pathname?.startsWith('/hr/attendance')) return 'Attendance';
    if (pathname?.startsWith('/hr/leave-management')) return 'Leave';
    if (pathname?.startsWith('/hr/performance-reviews')) return 'Performance';
    if (pathname?.startsWith('/hr/payroll')) return 'Payroll';
    if (pathname?.startsWith('/hr')) return 'HR';
    if (pathname?.startsWith('/student-crm/student-management')) return 'Students';
    if (pathname?.startsWith('/student-crm/applications')) return 'Applications';
    if (pathname?.startsWith('/agency-crm/agency-management')) return 'Agencies';
    if (pathname?.startsWith('/agency-crm/agency-leads')) return 'Leads';
    if (pathname?.startsWith('/agency-crm/co-branding-tools')) return 'Co-branding';
    if (pathname?.startsWith('/agency-crm/commission-management')) return 'Commission';
    if (pathname?.startsWith('/agency-crm')) return 'Agency';
    if (pathname?.startsWith('/allied-services')) return 'Allied Services';
    return 'Dashboard';
};

const TopNavbar = ({ onToggleSidebar }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const title = getPageTitle(pathname);

    const handleLogout = () => {
        logout?.();
        router.push('/login');
        localStorage.clear();
    };

    const initials = user?.fullName
        ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    return (
<<<<<<< Updated upstream
        <header className="ui-shell-header justify-between gap-6">
            <div className="flex min-w-0 items-center gap-4">
=======
        <header className="flex items-center justify-between bg-white px-4 sm:px-6 lg:px-8 gap-4 py-4 sm:px-6 lg:px-8">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-6">
>>>>>>> Stashed changes
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="ui-btn-ghost !p-2 text-[var(--ui-text-muted)]"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </button>
<<<<<<< Updated upstream
                <h1 className="ui-text-h1 truncate">{title}</h1>
=======

                <Image
                    src="/images/applyUniNow.png"
                    alt="ONECRM Logo"
                    width={64}
                    height={64}
                    className="h-12 w-12 shrink-0 object-contain"
                />

                <div className="hidden flex-col border-slate-200 pr-5 sm:flex">
                    <p className="text-lg font-bold leading-tight text-slate-900">
                        ONECRM
                    </p>
                    {/* <p className="text-xs text-slate-500">
                        Role based access   
                    </p> */}
                </div>

                <div className="flex min-w-0 flex-col">
                    <p className="text-xs font-semibold text-slate-400">{breadcrumb}</p>
                    <h1 className="truncate text-[24px] font-bold leading-tight text-slate-900">
                        {title}
                    </h1>
                    {description && (
                        <p className="truncate text-xs font-medium text-slate-500">
                            {description}
                        </p>
                    )}
                </div>
>>>>>>> Stashed changes
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <NotificationBell />

                {user && (
                    <div
                        className="hidden sm:flex h-7 w-7 items-center justify-center rounded-full border border-[var(--ui-border)] text-[10px] font-medium text-[var(--ui-text-secondary)]"
                        title={user.fullName}
                    >
                        {initials}
                    </div>
                )}

                <button
                    type="button"
                    className="ui-btn-ghost !p-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                    onClick={handleLogout}
                    title="Log out"
                >
                    <LogOut className="h-[16px] w-[16px]" strokeWidth={1.5} />
                </button>
            </div>
        </header>
    );
};

export default TopNavbar;
