"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
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
    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      router.push("/marketing");
    } else if (role === "HR") {
      router.push("/hr/employee-directory");
    } else if (role === "COUNSELLOR") {
      router.push("/marketing");
    } else if (role === "AGENT") {
      router.push("/agency-crm/agency-management");
    } else if (role === "STUDENT") {
      router.push("/student-crm/student-management");
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, loading, user, router]);

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100 font-sans select-none">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-semibold animate-pulse">
          Redirecting to workspace...
        </p>
      </div>
    </div>
  );
}
