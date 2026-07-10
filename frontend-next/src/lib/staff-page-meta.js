export function getStaffPageMeta(pathname = '') {
  let breadcrumb = '';
  let title = 'Welcome back!';
  let description = "Here's what's happening today.";

  if (pathname === '/marketing/lead-management') {
    title = 'Lead Management';
    description = 'Manage and track all your leads in one place';
  } else if (pathname.startsWith('/marketing/campaigns')) {
    title = 'Campaigns';
    description = 'Create and monitor marketing campaigns';
  } else if (pathname.startsWith('/marketing/automation')) {
    title = 'Automation';
    description = 'Automate your marketing workflows';
  } else if (pathname.startsWith('/marketing/landing-pages-forms')) {
    title = 'Landing Pages & Forms';
    description = 'Create and manage your landing pages and forms';
  } else if (pathname.startsWith('/marketing/marketing-analytics')) {
    title = 'Marketing Analytics';
    description = 'Analyze your marketing performance';
  } else if (pathname === '/admin-settings/users') {
    title = 'User Management';
    description = 'Create, manage and assign permissions to users.';
  } else if (pathname === '/admin-settings/roles-permissions') {
    title = 'Roles & Permissions';
    description = 'Create and manage roles and permissions.';
  } else if (pathname.startsWith('/marketing')) {
    title = 'Marketing Dashboard';
    description = 'Manage your marketing activities';
  } else if (pathname.startsWith('/notifications')) {
    title = 'Notifications';
    description = 'Manage your notifications';
  } else if (pathname.startsWith('/hr/me')) {
    title = 'My Details';
    description = 'Manage your HR activities';
  } else if (pathname.startsWith('/hr/employee-directory')) {
    title = 'Employee Directory';
    description = 'Manage your HR activities';
  } else if (pathname.startsWith('/hr/recruitment-tracker')) {
    title = 'Recruitment Tracker';
    description = 'Track your recruitment process';
  } else if (pathname.startsWith('/hr/attendance')) {
    title = 'Attendance';
    description = 'Manage your attendance';
  } else if (pathname.startsWith('/hr/leave-management')) {
    title = 'Leave Management';
    description = 'Manage your leave management';
  } else if (pathname.startsWith('/hr/performance-reviews')) {
    title = 'Performance Reviews';
    description = 'Manage your performance reviews';
  } else if (pathname.startsWith('/hr/payroll')) {
    title = 'Payroll';
    description = 'Manage your payroll';
  } else if (pathname.startsWith('/hr')) {
    title = 'Overview';
    description = 'Manage your HR activities';
  } else if (pathname.startsWith('/student-crm/student-management')) {
    title = 'Student Management';
    description = 'Manage your student CRM activities';
  } else if (pathname.startsWith('/student-crm/applications')) {
    title = 'Student Applications';
    description = 'Manage your applications';
  } else if (pathname.startsWith('/student-crm/visa-management')) {
    title = 'Visa Management';
    description = 'Manage student visa workflows';
  } else if (pathname.startsWith('/student-crm/settings')) {
    title = 'Student CRM Settings';
    description = 'Configure student CRM settings';
  } else if (pathname.startsWith('/student-crm')) {
    title = 'Student CRM';
    description = 'Manage your student CRM activities';
  } else if (pathname.startsWith('/agency-crm/agency-management')) {
    title = 'Agency Management';
    description = 'Manage your agency CRM activities';
  } else if (pathname.startsWith('/agency-crm/agency-leads')) {
    title = 'Agency Leads';
    description = 'Manage your agency CRM activities';
  } else if (pathname.startsWith('/agency-crm/co-branding-tools')) {
    title = 'Co-branding Tools';
    description = 'Manage your co-branding tools';
  } else if (pathname.startsWith('/agency-crm/commission-management')) {
    title = 'Commission Management';
    description = 'Manage your commission management';
  } else if (pathname.startsWith('/agency-crm')) {
    title = 'Dashboard';
    description = 'Manage your agency CRM activities';
  } else if (pathname.startsWith('/allied-services')) {
    title = 'Allied Services';
    description = 'Manage your Allied Services';
  }

  return { breadcrumb, title, description };
}
