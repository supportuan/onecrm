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
  GraduationCap,
  Globe,
  Image,
  Key,
  LayoutDashboard,
  Layers,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Percent,
  Receipt,
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
  Handshake,
  UserPlus,
} from "lucide-react";

export const dashboardMenu = {
  title: "Dashboard",
  icon: LayoutDashboard,
  subItems: [
    {
      label: "Overview",
      path: "/dashboard/overview",
      icon: FileText,
    },
    {
      label: "Student Funnel",
      path: "/dashboard/student-funnel",
      icon: TrendingUp,
    },
    {
      label: "Agency Funnel",
      path: "/dashboard/agency-funnel",
      icon: Users,
    },
    {
      label: "Tasks & Reminders",
      path: "/dashboard/tasks-reminders",
      icon: ClipboardList,
    },
    {
      label: "Intake Trends",
      path: "/dashboard/intake-trends",
      icon: BarChart2,
    },
  ],
};

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
      { label: "Automation", path: "/marketing/automation", icon: Zap },
      {
        label: "Landing Pages & Forms",
        path: "/marketing/landing-pages-forms",
        icon: FileText,
      },
      {
        label: "Marketing Analytics",
        path: "/marketing/marketing-analytics",
        icon: BarChart2,
      },
    ],
  },
  {
    label: "HR",
    path: "/hr",
    icon: ShieldCheck,
    subItems: [
      {
        label: "Employee Directory",
        path: "/hr/employee-directory",
        icon: Users,
      },
      {
        label: "HR Groups",
        path: "/hr/groups",
        icon: Layers,
      },
      {
        label: "Business Goals",
        path: "/hr/business-goals",
        icon: Target,
      },
      {
        label: "Attendance",
        path: "/hr/attendance",
        icon: Clock,
      },
      {
        label: "Leave Management",
        path: "/hr/leave-management",
        icon: CalendarCheck,
      },
      { label: "Payroll Inputs", path: "/hr/payroll-inputs", icon: DollarSign },
      {
        label: "Performance Reviews",
        path: "/hr/performance-reviews",
        icon: Star,
      },
      {
        label: "Recruitment Tracker",
        path: "/hr/recruitment-tracker",
        icon: Search,
      },
    ],
  },
  {
    label: "Student CRM",
    path: "/student-crm",
    icon: GraduationCap,
    subItems: [
      { label: "Overview", path: "/student-crm", icon: LayoutDashboard },
      { label: "Student Management", path: "/student-crm/student-managment", icon: Users },
      { label: "Counselling", path: "/student-crm/counselling", icon: MessageCircle },
      { label: "Applications", path: "/student-crm/applications", icon: FileText },
      { label: "Visa Management", path: "/student-crm/visa-management", icon: Globe },
    ],
  },
  {
    label: "Agent CRM",
    path: "/agent-crm",
    icon: Handshake,
    subItems: [
      { label: "Dashboard", path: "/agent-crm", icon: LayoutDashboard },
      { label: "My Profile", path: "/agent-crm/profile", icon: Users },
      { label: "Students", path: "/agent-crm/students", icon: GraduationCap },
      { label: "University POC", path: "/agent-crm/university-poc", icon: MessageSquare },
      { label: "Tuition Payments", path: "/agent-crm/payments", icon: CreditCard },
      { label: "Onboarding", path: "/agent-crm/onboarding", icon: UserPlus },
    ],
  },
  {
    label: "Operations",
    path: "/operations",
    icon: Briefcase,
    subItems: [
      {
        label: "Document Management",
        path: "/operations/document-management",
        icon: Folder,
      }
    ]
  },
  {
    label: "Admin & Settings",
    path: "/admin-settings",
    icon: SlidersHorizontal,
    subItems: [
      { label: "Users", path: "/admin-settings/users", icon: Users },
      {
        label: "Roles & Permissions",
        path: "/admin-settings/roles-permissions",
        icon: Key,
      },
      {
        label: "System Settings",
        path: "/admin-settings/system-settings",
        icon: Settings,
      },
      {
        label: "Content Management",
        path: "/admin-settings/content-management",
        icon: FileText,
      },
      { label: "Branding", path: "/admin-settings/branding", icon: Image },
    ],
  },
];

