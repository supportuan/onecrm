// import {
//   BarChart2,
//   BarChart3,
//   Bell,
//   Briefcase,
//   Calendar,
//   CalendarCheck,
//   CheckSquare,
//   ClipboardList,
//   Cpu,
//   CreditCard,
//   DollarSign,
//   File,
//   FileText,
//   Folder,
//   GraduationCap,
//   Globe,
//   Image,
//   Key,
//   LayoutDashboard,
//   Layers,
//   Megaphone,
//   MessageCircle,
//   MessageSquare,
//   Percent,
//   Receipt,
//   RotateCcw,
//   Search,
//   Settings,
//   ShieldCheck,
//   SlidersHorizontal,
//   Sparkles,
//   Star,
//   Target,
//   TrendingDown,
//   TrendingUp,
//   Users,
//   Wallet,
//   Zap,
//   Clock,
// } from "lucide-react";

// export const dashboardMenu = {
//   title: "Dashboard",
//   icon: LayoutDashboard,
//   subItems: [
//     {
//       label: "Overview",
//       path: "/dashboard/overview",
//       icon: FileText,
//     },
//     {
//       label: "Student Funnel",
//       path: "/dashboard/student-funnel",
//       icon: TrendingUp,
//     },
//     {
//       label: "Agency Funnel",
//       path: "/dashboard/agency-funnel",
//       icon: Users,
//     },
//     {
//       label: "Tasks & Reminders",
//       path: "/dashboard/tasks-reminders",
//       icon: ClipboardList,
//     },
//     {
//       label: "Intake Trends",
//       path: "/dashboard/intake-trends",
//       icon: BarChart2,
//     },
//   ],
// };

// export const navMenu = [
//   {
//     label: "Marketing",
//     path: "/marketing",
//     icon: Sparkles,
//     subItems: [
//       {
//         label: "Lead Management",
//         path: "/marketing/lead-management",
//         icon: Target,
//       },
//       { label: "Campaigns", path: "/marketing/campaigns", icon: Megaphone },
//       { label: "Automation", path: "/marketing/automation", icon: Zap },
//       {
//         label: "Landing Pages & Forms",
//         path: "/marketing/landing-pages-forms",
//         icon: FileText,
//       },
//       {
//         label: "Marketing Analytics",
//         path: "/marketing/marketing-analytics",
//         icon: BarChart2,
//       },
//     ],
//   },
//   {
//     label: "HR",
//     path: "/hr",
//     icon: ShieldCheck,
//     subItems: [
//       {
//         label: "Employee Directory",
//         path: "/hr/employee-directory",
//         icon: Users,
//       },
//       {
//         label: "Attendance",
//         path: "/hr/attendance",
//         icon: Clock,
//       },
//       {
//         label: "Leave Management",
//         path: "/hr/leave-management",
//         icon: CalendarCheck,
//       },
//       { label: "Payroll Inputs", path: "/hr/payroll-inputs", icon: DollarSign },
//       {
//         label: "Performance Reviews",
//         path: "/hr/performance-reviews",
//         icon: Star,
//       },
//       {
//         label: "Recruitment Tracker",
//         path: "/hr/recruitment-tracker",
//         icon: Search,
//       },
//     ],
//   },
//   {
//     label: "Admin & Settings",
//     path: "/admin-settings",
//     icon: SlidersHorizontal,
//     subItems: [
//       { label: "Users", path: "/admin-settings/users", icon: Users },
//       {
//         label: "Roles & Permissions",
//         path: "/admin-settings/roles-permissions",
//         icon: Key,
//       },
//       {
//         label: "System Settings",
//         path: "/admin-settings/system-settings",
//         icon: Settings,
//       },
//       {
//         label: "Content Management",
//         path: "/admin-settings/content-management",
//         icon: FileText,
//       },
//       { label: "Branding", path: "/admin-settings/branding", icon: Image },
//     ],
//   },
// ];

import {
  BarChart2,
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  CalendarCheck,
  CheckSquare,
  ClipboardList,
  Cpu,
  CreditCard,
  DollarSign,
  File,
  FileText,
  Folder,
  GraduationCap,BriefcaseBusiness,
  Globe,
  Image,
  Key,
  LayoutDashboard,
  Layers,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Percent,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  Clock,
} from "lucide-react";



export const navMenu = [
  
  {
    label: "Marketing",
    path: "/marketing",
    icon: Sparkles,
    subItems: [
      {
        label: "Lead Management",
        path: "/marketing/lead-management",
        icon: Target,
      },
      { label: "Campaigns", path: "/marketing/campaigns", icon: Megaphone },
      // { label: "Automation", path: "/marketing/automation", icon: Zap },
      // {
      //   label: "Landing Pages & Forms",
      //   path: "/marketing/landing-pages-forms",
      //   icon: FileText,
      // },
      // {
      //   label: "Marketing Analytics",
      //   path: "/marketing/marketing-analytics",
      //   icon: BarChart2,
      // },
    ],
  },
  {
    label: "Student CRM",
    path: "/student-crm/applications",
    icon: Users,
    subItems: [
      {
        label: "Student Management",
        path: "/student-crm/student-management",
        icon: GraduationCap,
      },
      {
        label: "Applications",
        path: "/student-crm/applications",
        icon: ClipboardList,
      },
    ],
  },

  {
    label: "HR",
    path: "/hr",
    icon: ShieldCheck,
    subItems: [
      { label: "Overview", path: "/hr", icon: LayoutDashboard, permission: ["MANAGE_EMPLOYEES", "VIEW_ALL_EMPLOYEES"] },
      { label: "My HR", path: "/hr/me", icon: Clock, permission: ["VIEW_HR"] },
      { label: "Employee Directory", path: "/hr/employee-directory", icon: Users, permission: ["VIEW_ALL_EMPLOYEES", "MANAGE_EMPLOYEES"] },
      { label: "Recruitment", path: "/hr/recruitment-tracker", icon: Search, permission: ["MANAGE_EMPLOYEES"] },
      { label: "Attendance", path: "/hr/attendance", icon: Clock, permission: ["VIEW_ATTENDANCE", "MANAGE_ATTENDANCE"] },
      { label: "Leave", path: "/hr/leave-management", icon: CalendarCheck, permission: ["VIEW_LEAVE", "MANAGE_LEAVE"] },
      { label: "Performance", path: "/hr/performance-reviews", icon: Star, permission: ["VIEW_REPORTS", "MANAGE_EMPLOYEES"] },
      { label: "Payroll", path: "/hr/payroll", icon: DollarSign, permission: ["MANAGE_PAYROLL", "VIEW_OWN_PAYSLIP"] },
    ],
  },
  {
    label: "Admin & Settings",
    path: "/admin-settings",
    icon: SlidersHorizontal,
    subItems: [
      { label: "Users", path: "/admin-settings/users", icon: Users, permission: ["MANAGE_EMPLOYEES", "MANAGE_ADMINS"] },
      {
        label: "Roles & Permissions",
        path: "/admin-settings/roles-permissions",
        icon: Key,
        permission: ["VIEW_ADMIN", "MANAGE_ADMINS"],
      },
    ],
  },
  {
    label: "Allied Services",
    path: "/allied-services",
    icon: BriefcaseBusiness,
  },

];
