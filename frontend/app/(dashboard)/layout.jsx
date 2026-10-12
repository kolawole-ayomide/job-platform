"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSavedJobsStore } from "@/store/useSavedJobsStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardGlobalHeader } from "@/components/layout/DashboardGlobalHeader";

export default function DashboardGroupLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, hydrate } = useAuthStore();
  const fetchSaved = useSavedJobsStore((s) => s.fetchSaved);

 

  useEffect(() => {
    if (status === "idle") hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    // Populate saved-job state once, app-wide, as soon as the user is known -
    // otherwise JobCard's bookmark icon shows "unsaved" everywhere until the
    // user happens to visit /jobs/saved first.
     
  if (status === "authenticated") fetchSaved();
}, [status, fetchSaved]);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    // Backend gates most features behind onboarding via `onboardingComplete`
    // on the User doc - bounce anyone who hasn't finished it yet, except the
    // Get Started checklist page itself.
    if (!user.onboardingComplete && pathname !== "/get-started") {
      router.replace("/onboarding/welcome");
    }
  }, [status, user, pathname, router]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50">
        <Loader2 className="size-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    // proxy.js already redirects server-side; this covers the
    // client-side navigation case (e.g. cookie expired mid-session).
    router.replace("/signin");
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-ink-50">
      <DashboardGlobalHeader />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
