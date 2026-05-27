const fs = require('fs');
const path = require('path');

const pagesOldPath = path.join(__dirname, 'src', 'pages-old');
const appPath = path.join(__dirname, 'src', 'app');

function createRoute(routePath, importPath, componentName) {
    const dir = path.join(appPath, routePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const pageContent = `'use client';\nimport ${componentName} from '@/pages-old/${importPath.replace(/\\/g, '/')}';\n\nexport default function Page() {\n  return <${componentName} />;\n}\n`;
    fs.writeFileSync(path.join(dir, 'page.jsx'), pageContent);
}

// Manually mapping based on App.jsx routes
const routes = [
    { path: 'dashboard/overview', importPath: 'DashboardOverview', component: 'DashboardOverview' },
    { path: 'dashboard/student-funnel', importPath: 'StudentFunnel', component: 'StudentFunnel' },
    { path: 'dashboard/agency-funnel', importPath: 'AgencyFunnel', component: 'AgencyFunnel' },
    { path: 'dashboard/tasks-reminders', importPath: 'TasksReminders', component: 'TasksReminders' },
    { path: 'dashboard/intake-trends', importPath: 'IntakeTrends', component: 'IntakeTrends' },
    { path: 'marketing', importPath: 'Marketing', component: 'Marketing' },
    { path: 'marketing/lead-management', importPath: 'marketing/LeadManagement', component: 'LeadManagement' },
    { path: 'marketing/campaigns', importPath: 'marketing/Campaigns', component: 'Campaigns' },
    { path: 'marketing/automation', importPath: 'marketing/Automation', component: 'Automation' },
    { path: 'marketing/landing-pages-forms', importPath: 'marketing/LandingPagesForms', component: 'LandingPagesForms' },
    { path: 'marketing/marketing-analytics', importPath: 'marketing/MarketingAnalytics', component: 'MarketingAnalytics' },
    { path: 'student-crm', importPath: 'StudentCRM', component: 'StudentCRM' },
    { path: 'student-crm/student-management', importPath: 'student-crm/StudentManagement', component: 'StudentManagement' },
    { path: 'student-crm/applications', importPath: 'student-crm/Applications', component: 'Applications' },
    { path: 'student-crm/visa-management', importPath: 'student-crm/VisaManagement', component: 'VisaManagement' },
    { path: 'student-crm/counselling', importPath: 'student-crm/Counselling', component: 'Counselling' },
    { path: 'agent-crm', importPath: 'agent-crm/AgentDashboard', component: 'AgentDashboard' },
    { path: 'agent-crm/profile', importPath: 'agent-crm/AgentProfile', component: 'AgentProfile' },
    { path: 'agent-crm/students', importPath: 'agent-crm/AgentStudents', component: 'AgentStudents' },
    { path: 'agent-crm/university-poc', importPath: 'agent-crm/AgentUniversityPoc', component: 'AgentUniversityPoc' },
    { path: 'agent-crm/payments', importPath: 'agent-crm/AgentPayments', component: 'AgentPayments' },
    { path: 'agent-crm/onboarding', importPath: 'agent-crm/AgentOnboarding', component: 'AgentOnboarding' },
    { path: 'operations', importPath: 'Operations', component: 'Operations' },
    { path: 'operations/task-management', importPath: 'operations/TaskManagement', component: 'TaskManagement' },
    { path: 'operations/document-management', importPath: 'operations/DocumentManagement', component: 'DocumentManagement' },
    { path: 'operations/communication-center', importPath: 'operations/CommunicationCenter', component: 'CommunicationCenter' },
    { path: 'operations/calendar', importPath: 'operations/Calendar', component: 'Calendar' },
    { path: 'operations/notes', importPath: 'operations/Notes', component: 'Notes' },
    { path: 'hr', importPath: 'HR', component: 'HR' },
    { path: 'hr/employee-directory', importPath: 'hr/EmployeeDirectory', component: 'EmployeeDirectory' },
    { path: 'hr/attendance', importPath: 'hr/Attendance', component: 'Attendance' },
    { path: 'hr/leave-management', importPath: 'hr/LeaveManagement', component: 'LeaveManagement' },
    { path: 'hr/payroll-inputs', importPath: 'hr/PayrollInputs', component: 'PayrollInputs' },
    { path: 'hr/performance-reviews', importPath: 'hr/PerformanceReviews', component: 'PerformanceReviews' },
    { path: 'hr/recruitment-tracker', importPath: 'hr/RecruitmentTracker', component: 'RecruitmentTracker' },
    { path: 'admin-settings', importPath: 'AdminSettings', component: 'AdminSettings' },
    { path: 'admin-settings/users', importPath: 'admin-settings/Users', component: 'Users' },
    { path: 'admin-settings/roles-permissions', importPath: 'admin-settings/RolesPermissions', component: 'RolesPermissions' },
    { path: 'admin-settings/system-settings', importPath: 'admin-settings/SystemSettings', component: 'SystemSettings' },
    { path: 'admin-settings/content-management', importPath: 'admin-settings/ContentManagement', component: 'ContentManagement' },
    { path: 'admin-settings/branding', importPath: 'admin-settings/Branding', component: 'Branding' },
];

routes.forEach(route => {
    createRoute(route.path, route.importPath, route.component);
});

console.log('Successfully created Next.js routes.');
