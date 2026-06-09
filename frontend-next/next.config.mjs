/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
  async redirects() {
    return [
      { source: "/hr/job-postings", destination: "/hr/recruitment-tracker?tab=pipeline", permanent: true },
      { source: "/hr/interview-scheduling", destination: "/hr/recruitment-tracker?tab=interviews", permanent: true },
      { source: "/hr/offer-letters", destination: "/hr/recruitment-tracker?tab=offers", permanent: true },
      { source: "/hr/onboarding-checklist", destination: "/hr/recruitment-tracker?tab=onboarding", permanent: true },
      { source: "/hr/kpi-dashboard", destination: "/hr/performance-reviews?tab=kpi", permanent: true },
      { source: "/hr/payroll-inputs", destination: "/hr/payroll?tab=run", permanent: true },
      { source: "/hr/payroll-deductions", destination: "/hr/payroll?tab=deductions", permanent: true },
      { source: "/student-crm", destination: "/student-crm/applications", permanent: true },
      { source: "/admin-settings", destination: "/admin-settings/users", permanent: true },
      { source: "/users", destination: "/admin-settings/users", permanent: true },
    ];
  },
};

export default nextConfig;
