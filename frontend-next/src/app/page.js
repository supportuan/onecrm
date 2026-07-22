"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { getDefaultHrRoute } from "@/features/hr/routing";
import { RefreshCw } from "lucide-react";

function HomeRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading) return;

    const ref = searchParams.get("ref");
    if (!isAuthenticated) {
      // Preserve agency referral codes instead of dropping them on /login.
      if (ref) {
        router.replace(`/register?ref=${encodeURIComponent(ref)}`);
      } else {
        router.push("/login");
      }
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
      router.push("/agency-crm/agency-leads");
    } else if (role === "STUDENT") {
      router.push("/applicant/applications");
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, loading, user, router, searchParams]);

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-neutral-50 text-brand font-sans select-none">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-brand/60" />
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen flex flex-col justify-center items-center bg-neutral-50 text-brand font-sans select-none">
          <RefreshCw className="h-8 w-8 animate-spin text-brand/60" />
        </div>
      }
    >
      <HomeRedirect />
    </Suspense>
  );
}
