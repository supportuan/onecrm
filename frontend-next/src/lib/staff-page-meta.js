export function getStaffPageMeta(pathname = '') {
  let breadcrumb = '';
  let title = 'Welcome back!';
  let description = "Here's what's happening today.";

  if (pathname === '/marketing/lead-management') {
    title = 'Opportunity Tracking';
    description = 'Organizing and control over incoming prospects';
  } else if (pathname.startsWith('/marketing/campaigns')) {
    title = 'Campaign Mission';
    description = 'Highlighting visibility and brand pressure';
  } else if (pathname.startsWith('/marketing/automation')) {
    title = 'Automation';
    description = 'Automate your marketing workflows';
  } else if (pathname.startsWith('/marketing/landing-pages-forms')) {
    title = 'Landing Pages & Forms';
    description = 'Create and manage your landing pages and forms';
  } else if (pathname.startsWith('/marketing/marketing-analytics')) {
    title = 'Revenue Intelligence';
    description = 'Connecting Marketing data to financial Outcomes';
  } else if (pathname === '/admin-settings/users') {
    title = 'User Management';
    description = 'Create, manage and assign permissions to users.';
  } else if (pathname === '/admin-settings/roles-permissions') {
    title = 'Roles & Permissions';
    description = 'Manage role responsibilities, member assignments, and access permissions.';
  } else if (pathname.startsWith('/marketing')) {
    title = 'Performance Console';
    description = 'Clean, focused insight into lead movement, sources, and actions that need attention.';
  } else if (pathname.startsWith('/notifications')) {
    title = 'Notifications';
    description = 'Manage your notifications';
  } else if (pathname.startsWith('/profile')) {
    title = 'Profile';
    description = 'Your account details and profile photo';
  } else if (pathname.startsWith('/hr/me')) {
    title = 'My HR';
    description = 'Attendance, leave, and payslips in one place.';
  } else if (pathname.startsWith('/hr/employee-directory')) {
    title = 'Employee Directory';
    description = 'Maintain employee profiles, update access roles, and bulk-import personnel from a spreadsheet.';
  } else if (pathname.startsWith('/hr/recruitment-tracker')) {
    title = 'Recruitment';
    description = 'Hire end-to-end — postings, pipeline, interviews, offers, and onboarding.';
  } else if (pathname.startsWith('/hr/attendance')) {
    title = 'Attendance';
    description = 'Clock in, review history, and manage team attendance.';
  } else if (pathname.startsWith('/hr/leave-management')) {
    title = 'Leave';
    description = 'Requests, approvals, policies, and holiday calendars.';
  } else if (pathname.startsWith('/hr/performance-reviews')) {
    title = 'Performance';
    description = 'Counsellor reviews from live CRM data — leads, conversions, enrollments, and revenue.';
  } else if (pathname.startsWith('/hr/payroll')) {
    title = 'Payroll';
    description = 'Salary structures, payroll execution, payslips, and deductions.';
  } else if (pathname.startsWith('/hr')) {
    title = 'Human Resource';
    description = 'Employee directory, recruitment, attendance, leave, performance, and payroll.';
  } else if (pathname.startsWith('/student-crm/student-management')) {
    title = 'Student Information Hub';
    description = '';
  } else if (pathname.startsWith('/student-crm/applications')) {
    title = 'Application Tracking System';
    description = '';
  } else if (pathname.startsWith('/student-crm/visa-management')) {
    title = 'Visa Management';
    description = '';
  } else if (pathname.startsWith('/student-crm/settings')) {
    title = 'CRM Settings';
    description = '';
  } else if (pathname.startsWith('/student-crm')) {
    title = 'Student Hub';
    description = '';
  } else if (pathname.startsWith('/agency-crm/agency-management')) {
    title = 'Agency Management';
    description = '';
  } else if (pathname.startsWith('/agency-crm/agency-leads')) {
    title = 'Students & Referrals';
    description = '';
  } else if (pathname.startsWith('/agency-crm/universities')) {
    title = 'University Directory';
    description = '';
  } else if (pathname.startsWith('/agency-crm/onboarding')) {
    title = 'Onboarding';
    description = '';
  } else if (pathname.startsWith('/agency-crm/communications')) {
    title = 'Communications';
    description = '';
  } else if (pathname.startsWith('/agency-crm/co-branding-tools')) {
    title = 'Co-branding Tools';
    description = '';
  } else if (pathname.startsWith('/agency-crm/commission-management')) {
    title = 'Payout Console';
    description = 'Verify earnings, queue batches, and track paid volume.';
  } else if (pathname.startsWith('/agency-crm/students')) {
    title = 'Student';
    description = '';
  } else if (pathname.startsWith('/agency-crm')) {
    title = 'Agent Hub';
    description = '';
  } else if (pathname.startsWith('/resources/manage')) {
    title = 'Manage Knowledge';
    description = 'Upload files and track acknowledgements.';
  } else if (pathname.startsWith('/resources')) {
    title = 'Knowledge Hub';
    description = 'Curated knowledge for in-house teams, academics, and agents.';
  } else if (pathname.startsWith('/allied-services')) {
    title = 'Allied Services';
    description = '';
  } else if (pathname.startsWith('/operations')) {
    title = 'Operations';
    description = '';
  } else if (pathname.startsWith('/finance')) {
    title = 'Finance';
    description = '';
  } else if (pathname.startsWith('/inventory-management')) {
    title = 'Inventory Management';
    description = '';
  } else if (pathname.startsWith('/project-management')) {
    title = 'Project Management';
    description = '';
  } else if (pathname.startsWith('/chatbot-events')) {
    title = 'Chatbot & Events';
    description = '';
  } else if (pathname.startsWith('/blogs-news')) {
    title = 'Blogs & News';
    description = '';
  } else if (pathname.startsWith('/ai-insights')) {
    title = 'AI Insights';
    description = '';
  } else if (pathname.startsWith('/archive')) {
    title = 'Archive';
    description = 'View deactivated and deleted user accounts.';
  }

  return { breadcrumb, title, description };
}
