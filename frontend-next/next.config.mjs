import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:4000";

const nextConfig = {
  // Emit a self-contained server bundle so the runtime image needs no source.
  output: "standalone",
  // Pin tracing to this app so standalone output is flat (server.js at root),
  // instead of nesting under the monorepo root's lockfile location.
  outputFileTracingRoot: __dirname,
  // Skip lint/type errors blocking a production build; CI/dev already cover these.
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
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
