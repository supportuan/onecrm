// 'use client';

// import Image from 'next/image';
// import { Bell, LogOut, Menu } from 'lucide-react';
// import { usePathname, useRouter } from 'next/navigation';
// import { useAuth } from '@/lib/auth/AuthContext';

// const TopNavbar = ({ onToggleSidebar }) => {
//     const router = useRouter();
//     const pathname = usePathname();
//     const { user, logout } = useAuth();

//     let breadcrumb = '';
//     let title = 'Welcome back!';
//     let description = "Here's what's happening today.";

//     if (pathname === '/marketing/lead-management') {
//         title = 'Lead Management';
//         description = 'Manage and track all your leads in one place';
//     } else if (pathname && pathname.startsWith('/marketing/campaigns')) {
//         title = 'Campaigns';
//         description = 'Create and monitor marketing campaigns';
//     } else if (pathname && pathname.startsWith('/marketing/automation')) {
//         title = 'Automation';
//         description = 'Automate your marketing workflows';
//     } else if (pathname && pathname.startsWith('/marketing/landing-pages-forms')) {
//         title = 'Landing Pages & Forms';
//         description = 'Create and manage your landing pages and forms';
//     } else if (pathname && pathname.startsWith('/marketing/marketing-analytics')) {
//         title = 'Marketing Analytics';
//         description = 'Analyze your marketing performance';
//     } else if (pathname === '/admin-settings/users') {
//         title = 'User Management';
//         description = 'Create, manage and assign permissions to users.';
//     } else if (pathname === '/admin-settings/roles-permissions') {
//         title = 'Roles & Permissions';
//         description = 'Create and manage roles and permissions.';
//     } else if (pathname && pathname.startsWith('/marketing')) {
//         title = 'Marketing Dashboard';
//         description = 'Manage your marketing activities';
//     } else if (pathname && pathname.startsWith('/notifications')) {
//         title = 'Notifications';
//         description = 'Manage your notifications';
//     } else if (pathname && pathname.startsWith('/hr/me')) {
//         title = 'My Details';
//         description = 'Manage your HR activities';
//     } else if (pathname && pathname.startsWith('/hr/employee-directory')) {
//         title = 'Employee Directory';
//         description = 'Manage your HR activities';
//     } else if (pathname && pathname.startsWith('/hr/recruitment-tracker')) {
//         title = 'Recruitment Tracker';
//         description = 'Track your recruitment process';
//     } else if (pathname && pathname.startsWith('/hr/attendance')) {
//         title = 'Attendance';
//         description = 'Manage your attendance';
//     } else if (pathname && pathname.startsWith('/hr/leave-management')) {
//         title = 'Leave Management';
//         description = 'Manage your leave management';
//     } else if (pathname && pathname.startsWith('/hr/performance-reviews')) {
//         title = 'Performance Reviews';
//         description = 'Manage your performance reviews';
//     } else if (pathname && pathname.startsWith('/hr/payroll')) {
//         title = 'Payroll';
//         description = 'Manage your payroll';
//     } else if (pathname && pathname.startsWith('/hr')) {
//         title = 'Overview';
//         description = 'Manage your HR activities';
//     } else if (pathname && pathname.startsWith('/student-crm/student-management')) {
//         title = 'Student Management';
//         description = 'Manage your student CRM activities';
//     } else if (pathname && pathname.startsWith('/student-crm/student-applications')) {
//         title = 'Student Applications';
//         description = 'Manage your Applications';
//     } else if (pathname && pathname.startsWith('/agency-crm/agency-management')) {
//         title = 'Agency Management';
//         description = 'Manage your agency CRM activities';
//     } else if (pathname && pathname.startsWith('/agency-crm/agency-leads')) {
//         title = 'Agency Leads';
//         description = 'Manage your agency CRM activities';
//     } else if (pathname && pathname.startsWith('/agency-crm/co-branding-tools')) {
//         title = 'Co-branding Tools';
//         description = 'Manage your co-branding tools';
//     } else if (pathname && pathname.startsWith('/agency-crm/commission-management')) {
//         title = 'Commission Management';
//         description = 'Manage your commission management';
//     } else if (pathname && pathname.startsWith('/agency-crm')) {
//         title = 'Dashboard';
//         description = 'Manage your agency CRM activities';
//     } else if (pathname && pathname.startsWith('/allied-services')) {
//         title = 'Allied Services';
//         description = 'Manage your Allied Services';
//     }

//     return (
//         <header className="flex items-center justify-between bg-white px-4 sm:px-6 lg:px-8 gap-4 py-4 sm:px-6 lg:px-8">
//             {/* Left */}
//             <div className="flex min-w-0 items-center gap-6">
//                 <button
//                     type="button"
//                     onClick={onToggleSidebar}
//                     className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
//                     aria-label="Toggle sidebar"
//                 >
//                     <Menu className="h-5 w-5" />
//                 </button>

//                 <Image
//                     src="/images/applyUniNow.png"
//                     alt="ONECRM Logo"
//                     width={42}
//                     height={42}
//                     className="h-10 w-10 shrink-0 object-contain"
//                 />

//                 <div className="hidden flex-col border-slate-200 pr-5 sm:flex">
//                     <p className="text-sm font-bold leading-tight text-slate-900">
//                         ONECRM
//                     </p>
//                     {/* <p className="text-xs text-slate-500">
//                         Role based access   
//                     </p> */}
//                 </div>

//                 <div className="flex min-w-0 flex-col">
//                     <p className="text-xs font-semibold text-slate-400">{breadcrumb}</p>
//                     <h1 className="truncate text-[24px] font-bold leading-tight text-slate-900">
//                         {title}
//                     </h1>
//                     {description && (
//                         <p className="truncate text-xs font-medium text-slate-500">
//                             {description}
//                         </p>
//                     )}
//                 </div>
//             </div>

//             {/* Right */}
//             <div className="flex shrink-0 items-center gap-5">
//                 <button
//                     type="button"
//                     className="relative text-slate-400 transition hover:text-slate-600 cursor-pointer"
//                     onClick={() => router.push('/notifications')}
//                 >
//                     <Bell className="h-5 w-5 stroke-[1.5]" />
//                     <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-bold text-slate-950 ring-1 ring-white">
//                         5
//                     </span>
//                 </button>

//                 <div className="flex items-center gap-3">
//                     {user && (
//                         <div className="hidden items-center gap-2 sm:flex">
//                             <div className="text-sm font-semibold text-slate-700">
//                                 {user.fullName}
//                             </div>
//                         </div>
//                     )}

//                     <button
//                         type="button"
//                         className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
//                         onClick={logout}
//                         title="Log out"
//                     >
//                         <LogOut className="h-4 w-4 cursor-pointer" />
//                     </button>
//                 </div>
//             </div>
//         </header>
//     );
// };

// export default TopNavbar;


'use client';

import Image from 'next/image';
import { Bell, LogOut, Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

const TopNavbar = ({ onToggleSidebar }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();

    let breadcrumb = '';
    let title = 'Welcome back!';
    let description = "Here's what's happening today.";

    if (pathname === '/marketing/lead-management') {
        title = 'Lead Management';
        description = 'Manage and track all your leads in one place';
    } else if (pathname && pathname.startsWith('/marketing/campaigns')) {
        title = 'Campaigns';
        description = 'Create and monitor marketing campaigns';
    } else if (pathname && pathname.startsWith('/marketing/automation')) {
        title = 'Automation';
        description = 'Automate your marketing workflows';
    } else if (pathname && pathname.startsWith('/marketing/landing-pages-forms')) {
        title = 'Landing Pages & Forms';
        description = 'Create and manage your landing pages and forms';
    } else if (pathname && pathname.startsWith('/marketing/marketing-analytics')) {
        title = 'Marketing Analytics';
        description = 'Analyze your marketing performance';
    } else if (pathname === '/admin-settings/users') {
        title = 'User Management';
        description = 'Create, manage and assign permissions to users.';
    } else if (pathname === '/admin-settings/roles-permissions') {
        title = 'Roles & Permissions';
        description = 'Create and manage roles and permissions.';
    } else if (pathname && pathname.startsWith('/marketing')) {
        title = 'Marketing Dashboard';
        description = 'Manage your marketing activities';
    } else if (pathname && pathname.startsWith('/notifications')) {
        title = 'Notifications';
        description = 'Manage your notifications';
    } else if (pathname && pathname.startsWith('/hr/me')) {
        title = 'My Details';
        description = 'Manage your HR activities';
    } else if (pathname && pathname.startsWith('/hr/employee-directory')) {
        title = 'Employee Directory';
        description = 'Manage your HR activities';
    } else if (pathname && pathname.startsWith('/hr/recruitment-tracker')) {
        title = 'Recruitment Tracker';
        description = 'Track your recruitment process';
    } else if (pathname && pathname.startsWith('/hr/attendance')) {
        title = 'Attendance';
        description = 'Manage your attendance';
    } else if (pathname && pathname.startsWith('/hr/leave-management')) {
        title = 'Leave Management';
        description = 'Manage your leave management';
    } else if (pathname && pathname.startsWith('/hr/performance-reviews')) {
        title = 'Performance Reviews';
        description = 'Manage your performance reviews';
    } else if (pathname && pathname.startsWith('/hr/payroll')) {
        title = 'Payroll';
        description = 'Manage your payroll';
    } else if (pathname && pathname.startsWith('/hr')) {
        title = 'Overview';
        description = 'Manage your HR activities';
    } else if (pathname && pathname.startsWith('/student-crm/student-management')) {
        title = 'Student Management';
        description = 'Manage your student CRM activities';
    } else if (pathname && pathname.startsWith('/student-crm/student-applications')) {
        title = 'Student Applications';
        description = 'Manage your Applications';
    } else if (pathname && pathname.startsWith('/agency-crm/agency-management')) {
        title = 'Agency Management';
        description = 'Manage your agency CRM activities';
    } else if (pathname && pathname.startsWith('/agency-crm/agency-leads')) {
        title = 'Agency Leads';
        description = 'Manage your agency CRM activities';
    } else if (pathname && pathname.startsWith('/agency-crm/co-branding-tools')) {
        title = 'Co-branding Tools';
        description = 'Manage your co-branding tools';
    } else if (pathname && pathname.startsWith('/agency-crm/commission-management')) {
        title = 'Commission Management';
        description = 'Manage your commission management';
    } else if (pathname && pathname.startsWith('/agency-crm')) {
        title = 'Dashboard';
        description = 'Manage your agency CRM activities';
    } else if (pathname && pathname.startsWith('/allied-services')) {
        title = 'Allied Services';
        description = 'Manage your Allied Services';
    }

    return (
        <header className="flex items-center justify-between bg-white px-4 sm:px-6 lg:px-8 gap-4 py-4 sm:px-6 lg:px-8">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-6">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <Image
                    src="/images/applyUniNow.png"
                    alt="ONECRM Logo"
                    width={58}
                    height={58}
                    className="h-12 w-15 shrink-0 object-contain"
                />

                <div className="hidden flex-col border-slate-200 pr-14 sm:flex">
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
            </div>

            {/* Right */}
            <div className="flex shrink-0 items-center gap-5">
                <button
                    type="button"
                    className="relative text-slate-400 transition hover:text-slate-600 cursor-pointer"
                    onClick={() => router.push('/notifications')}
                >
                    <Bell className="h-5 w-5 stroke-[1.5]" />
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-bold text-slate-950 ring-1 ring-white">
                        5
                    </span>
                </button>

                <div className="flex items-center gap-3">
                    {user && (
                        <div className="hidden items-center gap-2 sm:flex">
                            <div className="text-sm font-semibold text-slate-700">
                                {user.fullName}
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        onClick={logout}
                        title="Log out"
                    >
                        <LogOut className="h-4 w-4 cursor-pointer" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;