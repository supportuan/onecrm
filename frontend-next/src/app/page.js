"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { getDefaultHrRoute } from "@/features/hr/routing";
import { RefreshCw } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const role = user?.role;
    if (role === "SUPER_ADMIN") {
      router.push("/super-admin");
    } else if (role === "GLOBAL_ADMIN") {
      router.push("/marketing");
    } else if (role === "HR") {
      router.push(getDefaultHrRoute(role) || "/hr");
    } else if (role === "COUNSELLOR" || role === "TELECALLER" || role === "MARKETING_MANAGER") {
      router.push("/marketing");
    } else if (role === "AGENT" || role === "AGENCY_FREELANCER") {
      router.push("/agency-crm/agency-management");
    } else if (role === "STUDENT") {
      router.push("/applicant/profile/view");
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, loading, user, router]);

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-neutral-50 text-neutral-900 font-sans select-none">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center h-12 w-12 rounded-lg border border-neutral-200 bg-white text-neutral-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <p className="text-neutral-500 text-sm animate-pulse">
          Redirecting...
        </p>
      </div>
    </div>
  );
}
