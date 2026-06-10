// 'use client';
// import { HelpCircle, Bell, Search, Settings } from 'lucide-react';
// import { usePathname } from 'next/navigation';

// const TopNavbar = ({ onToggleSidebar }) => {
//     const pathname = usePathname();

//     let breadcrumb = "Dashboard";
//     let title = "Welcome back!";
//     let description = "Here's what's happening today.";

//     if (pathname === '/marketing/lead-management') {
//         breadcrumb = "Marketing/Lead Management";
//         title = "Lead Management";
//         description = "Manage and track all your leads in one place";
//     } else if (pathname && pathname.startsWith('/marketing/campaigns')) {
//         breadcrumb = "Marketing/Campaigns";
//         title = "Campaigns";
//         description = "Create and monitor marketing campaigns";
//     } else if (pathname && pathname.startsWith('/marketing/automation')) {
//         breadcrumb = "Marketing/automation";
//         title = "Automation";
//         description = "Automate your marketing workflows";
//     }
//     else if (pathname && pathname.startsWith('/marketing/landing-pages-forms')) {
//         breadcrumb = "Marketing/Landing Pages & Forms";
//         title = "Landing Pages & Forms";
//         description = "Create and manage your landing pages and forms";
//     }
//     else if (pathname && pathname.startsWith('/marketing/marketing-analytics')) {
//         breadcrumb = "Marketing/Marketing Analytics";
//         title = "Marketing Analytics";
//         description = "Analyze your marketing performance";
//     }
//     else if (pathname && pathname.startsWith('/marketing')) {
//         breadcrumb = "Marketing";
//         title = "Dashboard";
//         description = "Manage your marketing activities";
//     }

//     return (
//         <div className="flex flex-col gap-4 border-b-[3px] border-[#0084ff] bg-white px-4 py-3 sm:px-6 lg:px-8">
//             <div className="flex items-center justify-between gap-4">
//                 <div className="flex items-center gap-3">
//                     <button
//                         type="button"
//                         className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 lg:hidden"
//                         onClick={onToggleSidebar}
//                     >
//                         <span className="sr-only">Open sidebar</span>
//                         <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
//                             <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
//                         </svg>
//                     </button>
//                     <div className="flex flex-col">
//                         <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">{breadcrumb}</p>
//                         <h1 className="text-[24px] font-bold text-slate-900 leading-tight mt-0.5">{title}</h1>
//                         {description && <p className="text-xs font-semibold text-slate-400 mt-0.5">{description}</p>}
//                     </div>
//                 </div>

//                 {/* Right Action Icons & Search */}
//                 <div className="flex items-center gap-5">
//                     <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
//                         <Search className="h-4 w-4 text-slate-400" />
//                         <input
//                             type="search"
//                             placeholder="Search anything..."
//                             className="w-48 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 font-medium"
//                         />
//                     </div>

//                     <button className="text-slate-400 hover:text-slate-600 transition">
//                         <HelpCircle className="h-5 w-5 stroke-[1.5]" />
//                     </button>

//                     <button className="relative text-slate-400 hover:text-slate-600 transition">
//                         <Bell className="h-5 w-5 stroke-[1.5]" />
//                         <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-bold text-slate-950 ring-1 ring-white">5</span>
//                     </button>

//                     <button className="text-slate-400 hover:text-slate-600 transition">
//                         <Settings className="h-5 w-5 stroke-[1.5]" />
//                     </button>

//                     <div className="h-9 w-9 rounded-full bg-slate-300 shadow-sm flex-none"></div>
//                 </div>
//             </div>

//             {/* Mobile Search */}
//             <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 sm:hidden">
//                 <Search className="h-4 w-4 text-slate-400" />
//                 <input
//                     type="search"
//                     placeholder="Search anything..."
//                     className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 font-medium"
//                 />
//             </div>
//         </div>
//     );
// };

// export default TopNavbar;

'use client';
import { HelpCircle, Bell, Search, Settings, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';


const TopNavbar = ({ onToggleSidebar }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();

    let breadcrumb = "Dashboard";
    let title = "Welcome back!";
    let description = "Here's what's happening today.";

    if (pathname === '/marketing/lead-management') {
        breadcrumb = "Marketing/Lead Management";
        title = "Lead Management";
        description = "Manage and track all your leads in one place";
    } else if (pathname && pathname.startsWith('/marketing/campaigns')) {
        breadcrumb = "Marketing/Campaigns";
        title = "Campaigns";
        description = "Create and monitor marketing campaigns";
    } else if (pathname && pathname.startsWith('/marketing/automation')) {
        breadcrumb = "Marketing/automation";
        title = "Automation";
        description = "Automate your marketing workflows";
    }
    else if (pathname && pathname.startsWith('/marketing/landing-pages-forms')) {
        breadcrumb = "Marketing/Landing Pages & Forms";
        title = "Landing Pages & Forms";
        description = "Create and manage your landing pages and forms";
    }
    else if (pathname && pathname.startsWith('/marketing/marketing-analytics')) {
        breadcrumb = "Marketing/Marketing Analytics";
        title = "Marketing Analytics";
        description = "Analyze your marketing performance";
    }
    else if (pathname === "/admin-settings/users") {
        breadcrumb = "Admin & Settings / User Management";
        title = "User Management";
        description = "Create, manage and assign permissions to users.";
    }
    else if (pathname === "/admin-settings/roles-permissions") {
        breadcrumb = "Admin & Settings / Roles & Permissions";
        title = "Roles & Permissions";
        description = "Create and manage roles and permissions.";
    }
    else if (pathname && pathname.startsWith('/marketing')) {
        breadcrumb = "Marketing";
        title = "Dashboard";
        description = "Manage your marketing activities";
    }
    else if (pathname && pathname.startsWith('/notifications')) {
        breadcrumb = "Notifications";
        title = "Notifications";
        description = "Manage your notifications";
    }
    // else if (pathname && pathname.startsWith('/hr')) {
    //     breadcrumb = "HR";
    //     title = "Over View";
    //     description = "Manage your HR activities";
    // }
    else if (pathname && pathname.startsWith('/hr/me')) {
        breadcrumb = "HR/My Details";
        title = "My Details";
        description = "Manage your HR activities";
    }
    else if (pathname && pathname.startsWith('/hr/employee-directory')) {
        breadcrumb = "HR/Employee Directory";
        title = "Employee Directory";
        description = "Manage your HR activities";
    }
    else if (pathname && pathname.startsWith('/hr/recruitment-tracker')) {
        breadcrumb = "HR/Recruitment Tracker";
        title = "Recruitment Tracker";
        description = "Track your recruitment process";
    }
    else if (pathname && pathname.startsWith('/hr/attendance')) {
        breadcrumb = "HR/Attendance";
        title = "Attendance";
        description = "Manage your attendance";
    }
    else if (pathname && pathname.startsWith('/hr/leave-management')) {
        breadcrumb = "HR/Leave Management";
        title = "Leave Management";
        description = "Manage your leave management";
    }
    else if (pathname && pathname.startsWith('/hr/performance-reviews')) {
        breadcrumb = "HR/Performance Reviews";
        title = "Performance Reviews";
        description = "Manage your performance reviews";
    }
    else if (pathname && pathname.startsWith('/hr/payroll')) {
        breadcrumb = "HR/Payroll";
        title = "Payroll";
        description = "Manage your payroll";
    }
    else if (pathname && pathname.startsWith('/hr')) {
        breadcrumb = "HR";
        title = "Overview";
        description = "Manage your HR activities";
    }
    else if (pathname && pathname.startsWith('/student-crm/student-management')) {
        breadcrumb = "Student CRM/Student Management";
        title = "Student Management";
        description = "Manage your student CRM activities";
    }
    else if (pathname && pathname.startsWith('/student-crm/applications')) {
        breadcrumb = "Student CRM";
        title = "Student Applications";
        description = "Manage your Applications";
    }
    else if (pathname && pathname.startsWith('/agency-crm/agency-management')) {
        breadcrumb = "Agency CRM/Agency Management";
        title = "Agency Management";
        description = "Manage your agency CRM activities";
    }
    else if (pathname && pathname.startsWith('/agency-crm/agency-leads')) {
        breadcrumb = "Agency CRM/Agency Leads";
        title = "Agency Leads";
        description = "Manage your agency CRM activities";
    }
    else if (pathname && pathname.startsWith('/agency-crm/co-branding-tools')) {
        breadcrumb = "Agency CRM/Co-branding Tools";
        title = "Co-branding Tools";
        description = "Manage your co-branding tools";
    }
    else if (pathname && pathname.startsWith('/agency-crm/commission-management')) {
        breadcrumb = "Agency CRM/Commission Management";
        title = "Commission Management";
        description = "Manage your commission management";
    }
    else if (pathname && pathname.startsWith('/agency-crm')) {
        breadcrumb = "Agency CRM";
        title = "Dashboard";
        description = "Manage your agency CRM activities";
    }
    




    return (
        <div className="flex flex-col gap-4 border-b-[3px] border-[#0084ff] bg-white px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 lg:hidden"
                        onClick={onToggleSidebar}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <div className="flex flex-col">
                        <p className="text-xs font-semibold text-slate-400">{breadcrumb}</p>
                        <h1 className="text-[24px] font-bold text-slate-900 leading-tight mt-0.5">{title}</h1>
                        {description && <p className="text-xs font-medium text-slate-450 mt-0.5">{description}</p>}
                    </div>
                </div>

                {/* Right Action Icons & Search */}
                <div className="flex items-center gap-5">
                    {/* <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search anything..."
              className="w-48 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 font-medium"
            />
          </div> */}

                    {/* <button className="text-slate-400 hover:text-slate-600 transition">
            <HelpCircle className="h-5 w-5 stroke-[1.5]" />
          </button> */}

                    <button className="relative text-slate-400 hover:text-slate-600 transition" onClick={() => router.push("/notifications")}>
                        <Bell className="h-5 w-5 stroke-[1.5]" />
                        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-bold text-slate-950 ring-1 ring-white">5</span>
                    </button>

                    {/* <button className="text-slate-400 hover:text-slate-600 transition">
            <Settings className="h-5 w-5 stroke-[1.5]" />
          </button> */}

                    <div className="flex items-center gap-3">
                        {user && (
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="text-sm text-slate-700 font-semibold">{user.fullName}</div>
                            </div>
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-red-655 hover:bg-red-50 rounded-lg transition" onClick={logout} title="Log out">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Search */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 sm:hidden">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                    type="search"
                    placeholder="Search anything..."
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 font-medium"
                />
            </div>
        </div>
    );
};

export default TopNavbar;
