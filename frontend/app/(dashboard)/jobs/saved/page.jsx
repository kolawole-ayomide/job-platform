"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { JobCard } from "@/components/jobs/JobCard";
import { useSavedJobsStore } from "@/store/useSavedJobsStore";

// Real, server-persisted saved jobs now (backend: SavedJob model +
// GET /jobs/saved/me) - no more per-job refetching by id, and no more
// "this device only" caveat since the store fetches straight from the API.
export default function SavedJobsPage() {
  const { jobs, status, fetchSaved } = useSavedJobsStore();

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  return (
    <>
      <DashboardTopbar crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Saved Jobs" }]} />

      <main className="flex-1 px-6 py-6">
        <h1 className="mb-4 text-xl font-semibold text-ink-900">Saved Jobs</h1>

        {status !== "loaded" ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-12 text-center text-sm text-ink-400">
            You haven&apos;t saved any jobs yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
